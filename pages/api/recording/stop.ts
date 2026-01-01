import type { NextApiRequest, NextApiResponse } from 'next'
import { getActiveRecordings } from '@/lib/streamStore'
import path from 'path'
import fs from 'fs'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cameraId } = req.body

  if (!cameraId) {
    return res.status(400).json({ error: 'Camera ID is required' })
  }

  const activeRecordings = getActiveRecordings()
  const recording = activeRecordings[cameraId]

  if (!recording) {
    return res.status(400).json({ error: 'No active recording for this camera' })
  }

  try {
    // Stop the ffmpeg process
    const command = recording.process
    if (command.ffmpegProc && command.ffmpegProc.stdin && command.ffmpegProc.stdin.writable) {
      command.ffmpegProc.stdin.write('q')
    } else {
      command.kill('SIGINT')
    }
    
    const filename = recording.filename
    delete activeRecordings[cameraId]

    // Give ffmpeg time to finalize the file (increased to 5 seconds)
    // Also check if file exists and has size
    const filePath = path.join(process.cwd(), 'public', 'recordings', filename)
    
    let retries = 0
    while (retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        // If file is growing or just created, wait a bit more for MOOV atom
        if (stats.size > 0) {
           // Wait an extra second for safety
           await new Promise(resolve => setTimeout(resolve, 1000))
           break
        }
      }
      retries++
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Recording stopped',
      filename 
    })
  } catch (error) {
    console.error('Failed to stop recording:', error)
    return res.status(500).json({ error: 'Failed to stop recording' })
  }
}
