import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { filename, cameraId } = req.query

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' })
    }

    const recordingsDir = path.join(process.cwd(), 'recordings')
    const filePath = path.join(recordingsDir, filename)

    // Security check: ensure the file is within recordings directory
    if (!filePath.startsWith(recordingsDir)) {
      return res.status(400).json({ error: 'Invalid file path' })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Delete the file
    fs.unlinkSync(filePath)

    res.status(200).json({ 
      success: true, 
      message: 'Recording deleted successfully',
      filename 
    })
  } catch (error: any) {
    console.error('Delete error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete recording' })
  }
}
