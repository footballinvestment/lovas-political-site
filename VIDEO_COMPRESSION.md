# Video Compression Guide

Ez a dokumentum leírja a projektben használt videó kompresszió rendszert.

## 🚀 Gyors használat

### Egyedi videó kompresszió
```bash
npm run compress-video path/to/video.mp4
```

### Összes videó kompresszió
```bash
npm run compress-videos
```

### Production build (automatikus kompresszió)
```bash
npm run build
```

### Development build (kompresszió nélkül)
```bash
npm run build:no-compress
```

## 📋 Script-ek

| Script | Leírás |
|--------|--------|
| `compress-video` | Egyedi videó kompresszió |
| `compress-videos` | Összes videó kompresszió |
| `compress-videos:check` | Ellenőrzés és automatikus kompresszió |
| `compress-videos:production` | Production kompresszió (teljes minőség) |

## 🎯 Kompresszió minőségek

| Minőség | Felbontás | Bitrate | Célcsoport |
|---------|-----------|---------|------------|
| **Low** | 640x360 | 400k | Mobil, lassú kapcsolat |
| **Medium** | 854x480 | 800k | Standard használat |
| **High** | 1280x720 | 1200k | HD tartalom |
| **Ultra** | 1920x1080 | 2000k | Kiváló minőség |

## 📁 Fájl struktúra

```
public/uploads/
├── original_video.mp4           # Eredeti videó
└── compressed/                  # Kompresszált verziók
    ├── original_video_360p.mp4  # Low minőség
    ├── original_video_480p.mp4  # Medium minőség
    ├── original_video_720p.mp4  # High minőség
    └── original_video_1080p.mp4 # Ultra minőség
```

## ⚙️ Beállítások

### Environment változók
- `NODE_ENV=production` - Production kompresszió (minden minőség)
- `NODE_ENV=development` - Development kompresszió (csak medium)

### Command line opciók
- `--force` - Újrakompresszió (már létező fájlok felülírása)
- `--yes` - Automatikus megerősítés

### Kompresszió beállítások
- **Minimum fájlméret**: 1MB (kisebb fájlok nem kerülnek kompresszálásra)
- **Codec**: H.264 (MP4)
- **Audio**: AAC 128k
- **Preset**: Fast (gyors kompresszió)
- **CRF**: 23 (jó minőség/méret arány)

## 🔧 FFmpeg követelmények

### Telepítés
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Töltsd le: https://ffmpeg.org/download.html
```

### Ellenőrzés
```bash
ffmpeg -version
```

## 📊 Monitoring

### Kompresszió jelentés
A kompresszió után `compression-report.json` fájl keletkezik:

```json
{
  "timestamp": "2024-07-02T14:30:00.000Z",
  "environment": "production",
  "summary": {
    "videosProcessed": 3,
    "variantsCreated": 12,
    "totalOriginalSize": 65536000,
    "totalCompressedSize": 8192000
  },
  "results": [...]
}
```

### Analytics
- Video loading analytics: `/api/video/analytics`
- Session tracking: `/api/video/analytics/session`
- Cache metrics: Service Worker cache status

## 🎬 Adaptive Video Player

### Használat
```tsx
import { AdaptiveVideoPlayer } from '@/components/video/AdaptiveVideoPlayer';

const sources = [
  {
    src: '/uploads/compressed/video_360p.mp4',
    quality: 'low',
    format: 'mp4',
    bitrate: 400,
    resolution: { width: 640, height: 360 }
  },
  // ... további minőségek
];

<AdaptiveVideoPlayer
  sources={sources}
  enableAdaptiveStreaming={true}
  enableQualitySelector={true}
/>
```

### Funkciók
- **Automatikus minőség váltás** hálózati feltételek alapján
- **Buffer health monitoring**
- **Quality selector UI**
- **Analytics integration**
- **Service Worker caching**

## 🚀 Production deployment

### 1. Build folyamat
```bash
npm run build  # Automatikus videó kompresszió + build
```

### 2. Manual kompresszió
```bash
npm run compress-videos:production
npm run build:no-compress
```

### 3. Ellenőrzés
```bash
# Kompresszált fájlok ellenőrzése
ls -la public/uploads/compressed/

# Analytics endpoint teszt
curl http://localhost:3000/api/video/analytics
```

## 🐛 Hibakeresés

### Gyakori problémák

**FFmpeg nem található**
```bash
# Telepítés ellenőrzése
which ffmpeg
ffmpeg -version
```

**WebM kompresszió hiba**
- WebM támogatás jelenleg korlátozott
- MP4 formátum ajánlott

**Túl nagy fájlméretek**
- CRF érték csökkentése (pl. 28-ra)
- Bitrate korlátozás

**Analytics nem működik**
```bash
# Data könyvtár létrehozása
mkdir -p data/analytics data/sessions
```

### Debug mód
```bash
DEBUG=1 npm run compress-videos
```

## 🔄 Maintenance

### Cache tisztítás
```bash
# Service Worker cache
# Browser DevTools > Application > Storage > Clear Storage

# Server cache
rm -rf data/analytics/*.jsonl
rm -rf data/sessions/*.jsonl
```

### Kompresszált fájlok újragenerálása
```bash
npm run compress-videos -- --force
```