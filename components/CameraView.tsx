import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Hls from 'hls.js'

interface CameraViewProps {
  cameraId: string
  title: string
  mainStream: string
  subStream: string
  onRecordingComplete: (recording: any) => void
  rotation?: number
}

export default function CameraView({ 
  cameraId, 
  title, 
  mainStream, 
  subStream,
  onRecordingComplete,
  rotation = 0
}: CameraViewProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [streamQuality, setStreamQuality] = useState<'main' | 'sub'>('sub')
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Auto start stream on mount
    initializeStream()
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [cameraId, streamQuality])

  const initializeStream = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const streamUrl = `/api/stream/${cameraId}?quality=${streamQuality}`
      
      if (videoRef.current) {
        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy()
          }
          
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          })
          
          hls.loadSource(streamUrl)
          hls.attachMedia(videoRef.current)
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Don't auto play, let user click play
            setIsLoading(false)
            setIsPlaying(true)
            videoRef.current?.play().catch(() => setIsPlaying(false))
          })
          
          hls.on(Hls.Events.ERROR, (event: string, data: any) => {
            console.error('HLS error:', data)
            if (data.fatal) {
              // Try to recover
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError()
                  break
                default:
                  setError('Stream yüklenemedi')
                  setIsLoading(false)
                  break
              }
            }
          })
          
          hlsRef.current = hls
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = streamUrl
          videoRef.current.addEventListener('loadedmetadata', () => {
            setIsLoading(false)
            setIsPlaying(true)
            videoRef.current?.play().catch(() => setIsPlaying(false))
          })
        }
      }
    } catch (err) {
      console.error('Stream initialization error:', err)
      setError('Stream başlatılamadı')
      setIsLoading(false)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const startRecording = async () => {
    try {
      // Always record from main stream for better quality
      const response = await axios.post('/api/recording/start', {
        cameraId,
        quality: 'main'
      })
      
      if (response.data.success) {
        setIsRecording(true)
        setRecordingTime(0)
        
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev: number) => prev + 1)
        }, 1000)
      }
    } catch (err) {
      console.error('Recording start error:', err)
      alert('Kayıt başlatılamadı!')
    }
  }

  const stopRecording = async () => {
    try {
      const response = await axios.post('/api/recording/stop', {
        cameraId
      })
      
      if (response.data.success) {
        finishRecording(response.data.filename)
      }
    } catch (err: any) {
      console.error('Recording stop error:', err)
      
      // Handle 400 error (Recording not found on server)
      if (err.response && err.response.status === 400) {
        alert('Sunucuda aktif kayıt bulunamadı. Arayüz sıfırlanıyor.')
        setIsRecording(false)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
        setRecordingTime(0)
      } else {
        alert('Kayıt durdurulamadı!')
      }
    }
  }

  const finishRecording = async (filename: string) => {
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    
    // Don't auto upload to Drive anymore
    // await uploadToGoogleDrive(filename)
    
    onRecordingComplete({
      cameraId,
      filename: filename,
      duration: recordingTime,
      timestamp: new Date().toISOString()
    })
    
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">{title}</h2>
            <p className="text-xs text-gray-400">{streamQuality === 'main' ? 'Ana Akış' : 'Alt Akış'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded text-green-500 text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          Çevrimiçi
        </div>
      </div>
      
      {/* Video Area */}
      <div className="relative bg-black aspect-video group">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
            <div className="text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="text-white text-sm">{error}</div>
            <button onClick={initializeStream} className="mt-4 px-4 py-2 bg-blue-600 rounded text-sm text-white">Tekrar Dene</button>
          </div>
        )}

        {!isPlaying && !isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <svg className="text-white/50" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div className="text-gray-400 text-sm">Canlı yayın kapalı</div>
            <div className="text-gray-500 text-xs mt-1">İzlemek için oynat butonuna tıklayın</div>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          style={{ transform: rotation ? `rotate(${rotation}deg) scale(${rotation % 180 !== 0 ? 0.6 : 1})` : undefined }}
          muted
          playsInline
        />
        
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur text-white px-3 py-1.5 rounded flex items-center gap-2 z-20 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-mono text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-[#1a1f2e] border-t border-gray-800 flex gap-3">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          title="Ayarlar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
        </button>
        
        <div className="flex-1 relative">
          <select 
            value={streamQuality}
            onChange={(e) => setStreamQuality(e.target.value as 'main' | 'sub')}
            className="w-full bg-black/20 text-gray-300 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="sub">Alt Akış (Düşük Kalite)</option>
            <option value="main">Ana Akış (Yüksek Kalite)</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <button 
          onClick={togglePlay}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors min-w-[100px] justify-center"
          >
            <div className="w-2 h-2 rounded-full border border-white"></div>
            Kaydet
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors min-w-[100px] justify-center animate-pulse"
          >
            <div className="w-2 h-2 bg-white rounded-sm"></div>
            Durdur
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-[#131620] border-t border-gray-800">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.196-13.196l-4.243 4.243m0 6.364l4.243 4.243M23 12h-6m-6 0H1m18.196 5.196l-4.243-4.243m0-6.364l4.243-4.243"/></svg>
            Kamera Ayarları
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Kamera ID</span>
              <span className="text-white font-mono">{cameraId}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Akış Kalitesi</span>
              <span className="text-white">{streamQuality === 'main' ? 'Yüksek (Ana)' : 'Düşük (Alt)'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Durum</span>
              <span className="text-green-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Çevrimiçi
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Oynatma</span>
              <span className="text-white">{isPlaying ? 'Aktif' : 'Duraklatıldı'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Kayıt</span>
              <span className={isRecording ? 'text-red-500' : 'text-white'}>
                {isRecording ? 'Kaydediliyor' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
