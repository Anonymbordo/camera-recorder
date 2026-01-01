import type { NextApiRequest, NextApiResponse } from 'next'
import { getTokens } from '@/lib/googleAuth'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No authorization code provided' })
  }

  try {
    const tokens = await getTokens(code)
    
    // Save tokens to a file (in production, use a database)
    const tokensPath = path.join(process.cwd(), 'tokens.json')
    fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2))

    res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google Drive Bağlandı</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              text-align: center;
            }
            h1 { color: #4CAF50; margin-bottom: 20px; }
            p { color: #666; margin-bottom: 30px; }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Başarılı!</h1>
            <p>Google Drive hesabınız başarıyla bağlandı. Artık kayıtlarınız otomatik olarak Drive'a yüklenecek.</p>
            <button onclick="window.close()">Pencereyi Kapat</button>
          </div>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('Token exchange error:', error)
    res.status(500).json({ error: 'Failed to exchange authorization code' })
  }
}
