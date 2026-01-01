# Kamera Kayıt Sistemi

Panoramik RTSP kameralardan video kaydı yapan ve Google Drive'a yükleyen Next.js uygulaması.

## Özellikler

- 🎥 2 adet panoramik RTSP kamera desteği
- 📹 Canlı video akışı (HLS protokolü)
- ⚙️ Ana akış (HD) ve alt akış (SD) seçimi
- 🔴 Video kayıt yapma
- ☁️ Google Drive'a otomatik yükleme
- 📱 Responsive tasarım
- 🚀 Vercel deploy desteği

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. FFmpeg Kurulumu

**Windows:**
- [FFmpeg Windows build](https://www.gyan.dev/ffmpeg/builds/) adresinden indirin
- ZIP'i açın ve `bin` klasörünü PATH'e ekleyin
- Terminal'de `ffmpeg -version` ile test edin

**Linux/Mac:**
```bash
# Linux
sudo apt-get install ffmpeg

# Mac
brew install ffmpeg
```

### 3. Google Drive API Kurulumu

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni bir proje oluşturun
3. "APIs & Services" > "Library" > "Google Drive API"'yi etkinleştirin
4. "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
7. Client ID ve Client Secret'ı kopyalayın

### 4. Ortam Değişkenlerini Ayarlayın

`.env.local` dosyasını düzenleyin:

```env
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

CAMERA1_RTSP_MAIN=rtsp://admin:net.2024@78.183.47.237:5554/Streaming/Channels/201
CAMERA1_RTSP_SUB=rtsp://admin:net.2024@78.183.47.237:5554/Streaming/Channels/202
CAMERA2_RTSP_MAIN=rtsp://admin:net.2024@78.183.47.237:5555/Streaming/Channels/201
CAMERA2_RTSP_SUB=rtsp://admin:net.2024@78.183.47.237:5555/Streaming/Channels/202

NEXTAUTH_SECRET=rastgele_guvenli_bir_metin_buraya
NEXTAUTH_URL=http://localhost:3000
```

### 5. Uygulamayı Başlatın

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Google Drive Bağlantısı

1. Uygulamayı başlattıktan sonra tarayıcıda `http://localhost:3000/api/auth/google` adresine gidin
2. Google hesabınızla giriş yapın ve izinleri onaylayın
3. Başarılı olursa kayıtlar otomatik olarak Drive'a yüklenecek

## Kullanım

1. **Canlı Yayın**: Kameralar sayfa açılır açılmaz otomatik başlar
2. **Kalite Seçimi**: Alt Akış (SD) veya Ana Akış (HD) seçebilirsiniz
3. **Kayıt**: "Kaydı Başlat" butonuna tıklayın
4. **Durdur**: "Kaydı Durdur" butonuna tıklayın
5. **Drive Yükleme**: Kayıt durdurulunca otomatik olarak Google Drive'a yüklenir

## Vercel Deployment

⚠️ **ÖNEMLİ**: Vercel'in serverless fonksiyonları uzun süren işlemler için uygun değildir. Video kayıt gibi uzun işlemler için aşağıdaki alternatifler önerilir:

### Alternatif 1: External Worker Service
- [Railway](https://railway.app/) veya [Render](https://render.com/) gibi platformlarda ayrı bir Node.js servisi çalıştırın
- Bu servis video kaydını yönetsin
- Next.js uygulaması bu servise API çağrısı yapsın

### Alternatif 2: Edge Functions (Sınırlı)
- Sadece kısa süreli kayıtlar için kullanılabilir (max 60 saniye)
- Vercel Pro plan gerektirir

### Temel Vercel Deployment:

1. GitHub'a push edin
2. Vercel hesabınızı bağlayın
3. Environment variables ekleyin
4. Deploy edin

```bash
vercel
```

## Proje Yapısı

```
├── components/
│   ├── CameraView.tsx      # Kamera görüntüleme bileşeni
│   └── RecordingList.tsx   # Kayıt listesi bileşeni
├── pages/
│   ├── api/
│   │   ├── auth/           # Google OAuth
│   │   ├── drive/          # Google Drive işlemleri
│   │   ├── recording/      # Kayıt işlemleri
│   │   └── stream/         # RTSP stream API
│   ├── _app.tsx
│   └── index.tsx           # Ana sayfa
├── lib/
│   └── googleAuth.ts       # Google auth yardımcı fonksiyonlar
├── styles/
│   └── globals.css
├── .env.local              # Ortam değişkenleri
├── next.config.js
├── package.json
└── tsconfig.json
```

## Sorun Giderme

### FFmpeg bulunamadı
- FFmpeg'in PATH'e eklendiğinden emin olun
- Terminal'i yeniden başlatın

### RTSP bağlantı hatası
- Kamera IP adreslerinin doğru olduğunu kontrol edin
- Kullanıcı adı/şifre kontrolü yapın
- Firewall ayarlarını kontrol edin

### Google Drive yükleme hatası
- OAuth token'larının geçerli olduğundan emin olun
- `/api/auth/google` adresinden tekrar giriş yapın

## Lisans

MIT

## Destek

Sorularınız için issue açabilirsiniz.
