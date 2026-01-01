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
    
    try {
      const ffmpegProcess = ffmpeg(streamUrl)
        .inputOptions([
          '-rtsp_transport', 'tcp',
          '-stimeout', '5000000',
          '-err_detect', 'ignore_err'
        ])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'zerolatency',
          '-crf', '28',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-ar', '44100',
          '-ac', '2',
          '-b:a', '128k',
          '-f', 'hls',
          '-hls_time', '2',
          '-hls_list_size', '5',
          '-hls_flags', 'delete_segments+append_list',
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

      // Wait for playlist to be created
      let retries = 0
      while (!fs.existsSync(playlistPath) && retries < 100) { // Increased retries
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (!fs.existsSync(playlistPath)) {
        console.error('Playlist file was not created in time.')
        // Don't kill the process yet, maybe it's just slow connecting
      }
      
    } catch (error) {
      console.error('Stream creation error:', error)
      return res.status(500).json({ error: 'Failed to create stream' })
    }
  }

  // Redirect to the HLS playlist
  res.redirect(`/streams/${cameraId}/${quality}.m3u8`)
}
