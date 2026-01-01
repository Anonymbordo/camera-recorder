import type { NextApiRequest, NextApiResponse } from 'next'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { getActiveRecordings } from '@/lib/streamStore'

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Default to 'main' quality as requested by user for better recording quality
  const { cameraId, quality = 'main' } = req.body

  if (!cameraId) {
    return res.status(400).json({ error: 'Camera ID is required' })
  }

  const streamUrl = quality === 'main' 
    ? RTSP_STREAMS[cameraId]?.main 
    : RTSP_STREAMS[cameraId]?.sub

  if (!streamUrl) {
    return res.status(404).json({ error: 'Stream not found' })
  }

  const activeRecordings = getActiveRecordings()

  // Check if already recording
  if (activeRecordings[cameraId]) {
    return res.status(400).json({ error: 'Already recording this camera' })
  }

  const recordingsDir = path.join(process.cwd(), 'public', 'recordings')
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `camera${cameraId}_${timestamp}.mp4`
  const outputPath = path.join(recordingsDir, filename)

  try {
    const ffmpegProcess = ffmpeg(streamUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp'
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'superfast', // Faster encoding to prevent CPU overload and corruption
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-vsync', '1', // Enforce constant frame rate
        '-max_muxing_queue_size', '1024', // Prevent buffer overflow
        '-c:a', 'aac',
        '-b:a', '128k'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('Recording started:', commandLine)
      })
      .on('error', (err) => {
        console.error('Recording error:', err)
        if (fs.existsSync(outputPath)) {
          console.log('File exists despite error:', outputPath)
        } else {
          console.log('File does NOT exist on error:', outputPath)
        }
        delete activeRecordings[cameraId]
      })
      .on('end', () => {
        console.log('Recording ended')
        if (fs.existsSync(outputPath)) {
          console.log('File exists on end:', outputPath)
        } else {
          console.log('File does NOT exist on end:', outputPath)
        }
      })

    ffmpegProcess.run()
    
    activeRecordings[cameraId] = {
      process: ffmpegProcess,
      filename: filename,
      startTime: Date.now()
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Recording started',
      filename 
    })
  } catch (error) {
    console.error('Failed to start recording:', error)
    return res.status(500).json({ error: 'Failed to start recording' })
  }
}
