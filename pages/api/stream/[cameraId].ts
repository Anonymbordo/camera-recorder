import type { NextApiRequest, NextApiResponse } from 'next'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { getActiveStreams } from '@/lib/streamStore'

const RTSP_STREAMS: { [key: string]: { main: string; sub: string } } = {
  '1': {
    main: process.env.CAMERA1_RTSP_MAIN || '',
    sub: process.env.CAMERA1_RTSP_SUB || ''
  },
  '2': {
    main: process.env.CAMERA2_RTSP_MAIN || '',
    sub: process.env.CAMERA2_RTSP_SUB || ''
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { cameraId } = req.query
  const quality = (req.query.quality as string) || 'sub'

  if (!cameraId || typeof cameraId !== 'string') {
    return res.status(400).json({ error: 'Invalid camera ID' })
  }

  const streamUrl = quality === 'main' 
    ? RTSP_STREAMS[cameraId]?.main 
    : RTSP_STREAMS[cameraId]?.sub

  if (!streamUrl) {
    return res.status(404).json({ error: 'Stream not found' })
  }

  const streamKey = `${cameraId}-${quality}`
  const outputDir = path.join(process.cwd(), 'public', 'streams', cameraId)
  const playlistPath = path.join(outputDir, `${quality}.m3u8`)
  
  const activeStreams = getActiveStreams()

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Check if stream is already active
  if (!activeStreams[streamKey]) {
    console.log(`Starting stream for Camera ${cameraId} (${quality})...`)
    console.log(`RTSP URL: ${streamUrl}`)

    // Clean up old files to ensure live stream starts fresh
    try {
      if (fs.existsSync(playlistPath)) {
        fs.unlinkSync(playlistPath)
      }
      const files = fs.readdirSync(outputDir)
      files.forEach(file => {
        if (file.startsWith(`${quality}_`) && file.endsWith('.ts')) {
          fs.unlinkSync(path.join(outputDir, file))
        }
      })
    } catch (e) {
      console.error('Error cleaning up old files:', e)
    }
    
    try {
      // Main stream needs higher quality for ML
      const isMainStream = quality === 'main'
      
      const ffmpegProcess = ffmpeg(streamUrl)
        .inputOptions([
          '-rtsp_transport', 'tcp',
          '-stimeout', '10000000', // 10 seconds timeout
          '-err_detect', 'ignore_err'
        ])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'superfast', // Slightly better compression than ultrafast
          '-tune', 'zerolatency',
          // CRF 23 is default high quality. Lower is better but uses more bandwidth/CPU.
          // For ML, we want good quality but not lossless to avoid network choke.
          '-crf', isMainStream ? '23' : '28', 
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-ar', '44100',
          '-ac', '2',
          '-b:a', '128k',
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '3',
          '-hls_flags', 'delete_segments',
          '-hls_allow_cache', '0',
          '-hls_segment_filename', path.join(outputDir, `${quality}_%03d.ts`)
        ])
        .output(playlistPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg started:', commandLine)
        })
        .on('stderr', (stderrLine) => {
          // Log only errors or warnings to avoid clutter
          if (stderrLine.includes('error') || stderrLine.includes('fail')) {
             console.error('FFmpeg stderr:', stderrLine)
          }
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          delete activeStreams[streamKey]
        })
        .on('end', () => {
          console.log('FFmpeg ended')
          delete activeStreams[streamKey]
        })

      ffmpegProcess.run()
      activeStreams[streamKey] = ffmpegProcess

      // Wait for playlist to be created (max 2 seconds)
      // We don't want to block the response too long, causing 504 Gateway Timeout.
      // If the file isn't ready, the frontend (HLS.js) will retry 404s.
      let retries = 0
      while (!fs.existsSync(playlistPath) && retries < 20) { 
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      // Even if file doesn't exist yet, return success so client can start polling
      if (!fs.existsSync(playlistPath)) {
        console.log('Playlist not ready yet, but returning success to avoid timeout.')
      }
      
    } catch (error) {
      console.error('Stream creation error:', error)
      return res.status(500).json({ error: 'Failed to create stream' })
    }
  } else {
    // If stream is already active, check if file exists
    if (!fs.existsSync(playlistPath)) {
       // Wait a bit just in case it's being created
       await new Promise(resolve => setTimeout(resolve, 1000))
       // Don't error out, let the client retry
    }
  }

  // Redirect to the HLS playlist
  res.redirect(`/streams/${cameraId}/${quality}.m3u8`)
}
