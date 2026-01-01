import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import { setCredentials } from '@/lib/googleAuth'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filename, cameraId } = req.body

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' })
  }

  try {
    // Load tokens
    const tokensPath = path.join(process.cwd(), 'tokens.json')
    if (!fs.existsSync(tokensPath)) {
      return res.status(401).json({ 
        error: 'Not authenticated with Google Drive',
        authUrl: '/api/auth/google'
      })
    }

    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'))
    const oauth2Client = setCredentials(tokens)

    // Create Drive API client
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // Read the video file
    const filePath = path.join(process.cwd(), 'recordings', filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Recording file not found' })
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    const fileMetadata = {
      name: filename,
      mimeType: 'video/mp4',
      parents: folderId ? [folderId] : []
    }

    const media = {
      mimeType: 'video/mp4',
      body: fs.createReadStream(filePath)
    }

    // Upload to Google Drive
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    })

    console.log('File uploaded to Drive:', file.data)

    // Optionally delete local file after upload
    // fs.unlinkSync(filePath)

    return res.status(200).json({
      success: true,
      message: 'File uploaded to Google Drive',
      fileId: file.data.id,
      fileLink: file.data.webViewLink
    })
  } catch (error: any) {
    console.error('Google Drive upload error:', error)
    
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({ 
        error: 'Google Drive authentication expired',
        authUrl: '/api/auth/google'
      })
    }
    
    return res.status(500).json({ 
      error: 'Failed to upload to Google Drive',
      details: error.message 
    })
  }
}
