import Head from 'next/head'
import { useState } from 'react'
import CameraView from '@/components/CameraView'
import RecordingList, { Recording } from '@/components/RecordingList'
import DeveloperNotes from '@/components/DeveloperNotes'

export default function Home() {
  const [recordings, setRecordings] = useState<Recording[]>([])

  const handleRecordingComplete = (recording: Recording) => {
    setRecordings((prev: Recording[]) => [recording, ...prev])
  }

  return (
    <>
      <Head>
        <title>Kamera Kayıt Sistemi</title>
        <meta name="description" content="RTSP Kamera Kayıt ve Google Drive Yedekleme" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen bg-[#0f1117] text-white p-6">
        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Kamera Kayıt Sistemi
              </h1>
              <p className="text-gray-500 text-xs mt-1">Canlı İzleme ve Kayıt</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full text-green-500 text-xs font-medium border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                2 Çevrimiçi
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full text-gray-400 text-xs font-medium border border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                0 Kayıt
              </div>
              <button className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M17.36 17.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M17.36 6.64l1.42-1.42"/></svg>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-8">
            {/* Main Content - Cameras */}
            <div className="col-span-12 lg:col-span-9">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Canlı Kameralar</h2>
                <p className="text-gray-500 text-sm">Kameraları izleyin ve kayıt yapın</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <CameraView
                  cameraId="1"
                  title="Kamera 1"
                  mainStream={process.env.NEXT_PUBLIC_CAMERA1_RTSP_MAIN || ''}
                  subStream={process.env.NEXT_PUBLIC_CAMERA1_RTSP_SUB || ''}
                  onRecordingComplete={handleRecordingComplete}
                />
                
                <CameraView
                  cameraId="2"
                  title="Kamera 2"
                  mainStream={process.env.NEXT_PUBLIC_CAMERA2_RTSP_MAIN || ''}
                  subStream={process.env.NEXT_PUBLIC_CAMERA2_RTSP_SUB || ''}
                  onRecordingComplete={handleRecordingComplete}
                />
              </div>

              <DeveloperNotes />
            </div>

            {/* Sidebar - History */}
            <div className="col-span-12 lg:col-span-3 border-l border-gray-800 pl-8">
              <RecordingList recordings={recordings} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

