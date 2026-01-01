import { useState } from 'react'
import axios from 'axios'

export interface Recording {
  cameraId: string
  filename: string
  duration: number
  timestamp: string
  size?: string
  streamType?: 'main' | 'sub'
}

interface RecordingListProps {
  recordings: Recording[]
}

export default function RecordingList({ recordings }: RecordingListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const getRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '(bir dakikadan az önce)'
    if (minutes < 60) return `(${minutes} dakika önce)`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `(${hours} saat önce)`
    return ''
  }

  const formatDuration = (seconds: number) => {
    return `${seconds}sn`
  }

  const handleUpload = async (recording: Recording) => {
    setUploadingId(recording.filename)
    try {
      const response = await axios.post('/api/drive/upload', {
        filename: recording.filename,
        cameraId: recording.cameraId
      })
      
      if (response.data.success) {
        alert('Video başarıyla Google Drive\'a yüklendi!')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      if (error.response?.status === 401) {
        if (confirm('Google Drive oturumu süresi dolmuş. Tekrar giriş yapmak ister misiniz?')) {
          window.location.href = '/api/auth/google'
        }
      } else {
        alert('Yükleme sırasında bir hata oluştu: ' + (error.response?.data?.error || error.message))
      }
    } finally {
      setUploadingId(null)
    }
  }

  const filteredRecordings = recordings.filter(rec => 
    rec.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.cameraId.includes(searchTerm)
  )

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Kayıt Geçmişi
        </h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="ID veya kamera adı ara..." 
            className="w-full bg-[#1a1f2e] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-[#1a1f2e] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Tüm Durumlar
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button className="flex-1 bg-[#1a1f2e] border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 flex items-center justify-between hover:bg-gray-800 transition-colors">
            Tüm Kameralar
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-800 rounded-xl bg-[#1a1f2e]/30">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
            <svg className="text-gray-600" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-5c-1.7 0-3 1.3-3 3"/><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M22 22v-2a2 2 0 0 0-2-2h-2"/><path d="M22 16a6 6 0 0 0-12 0"/><path d="M2 22v-2a2 2 0 0 1 2-2h2"/><path d="M2 16a6 6 0 0 1 12 0"/></svg>
          </div>
          <h3 className="text-gray-400 font-medium mb-1">Kayıt bulunamadı</h3>
          <p className="text-gray-600 text-xs max-w-[200px]">
            Kayıt yapmak için bir kamerada kaydet butonuna tıklayın
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredRecordings.map((recording, index) => (
            <div
              key={index}
              className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition group relative"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-200">Kamera {recording.cameraId}</h3>
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[10px] font-medium border border-green-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Tamamlandı
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="text-gray-300">Bugün {formatDate(recording.timestamp)}</span>
                    <span className="text-gray-500">{getRelativeTime(recording.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                    <div className="flex items-center gap-1">
                      <span>{recording.filename.substring(0, 8)}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </div>
                    <span>{formatDuration(recording.duration)}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">1000.0 KB</span>
                    <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[10px] border border-gray-700">
                      {recording.streamType === 'main' ? 'Ana Akış' : 'Alt Akış'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1">
                  <button 
                    onClick={() => setPlayingVideo(recording.filename)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" 
                    title="Oynat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </button>
                  <a 
                    href={`/recordings/${recording.filename}`}
                    download
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors" 
                    title="İndir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </a>
                  <button 
                    onClick={() => handleUpload(recording)}
                    disabled={!!uploadingId}
                    className={`p-1.5 rounded transition-colors ${uploadingId === recording.filename ? 'text-blue-500 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} 
                    title="Drive'a Yükle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Sil">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Video Önizleme
              </h3>
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                src={`/recordings/${playingVideo}`} 
                controls 
                autoPlay 
                className="w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.error-msg')?.classList.remove('hidden');
                }}
              >
                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
              <div className="error-msg hidden absolute text-red-500 flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>Video oynatılamadı veya dosya bulunamadı.</p>
                <p className="text-xs text-gray-400">Dosya henüz işleniyor olabilir veya bozuk.</p>
              </div>
            </div>
            <div className="p-4 bg-[#131620] flex justify-end gap-3">
              <button 
                onClick={() => setPlayingVideo(null)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Kapat
              </button>
              <a 
                href={`/recordings/${playingVideo}`}
                download
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                İndir
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

