import * as THREE from 'three'

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void

const cache = new Map<string, THREE.CanvasTexture>()
const imgCache = new Map<string, THREE.Texture>()

function canvasTex(key: string, w: number, h: number, draw: Draw) {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.anisotropy = 8
  cache.set(key, t)
  return t
}

export function loadPhotoTexture(url: string) {
  const hit = imgCache.get(url)
  if (hit) return hit
  const loader = new THREE.TextureLoader()
  const tex = loader.load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  imgCache.set(url, tex)
  return tex
}

export function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Sàn gỗ sồi ấm tự nhiên đồng bộ cho cả Tầng 1 và Tầng 2 */
export function woodFloor() {
  return canvasTex('wood-warm-oak-v4', 1024, 1024, (g, w, h) => {
    const r = rng(23)
    const rows = 14
    const rh = h / rows
    for (let i = 0; i < rows; i++) {
      let x = -r() * 240
      while (x < w) {
        const len = 260 + r() * 260
        // Tone gỗ sồi ấm tự nhiên hài hòa cho cả 2 tầng
        const hue = 33 + r() * 5
        const sat = 44 + r() * 10
        const light = 58 + r() * 10
        g.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
        g.fillRect(x, i * rh, len, rh)

        // Thớ vân gỗ sồi mịn đẹp
        for (let k = 0; k < 8; k++) {
          g.strokeStyle = k % 2 === 0 ? 'rgba(120, 78, 34, 0.10)' : 'rgba(255, 240, 210, 0.14)'
          g.lineWidth = 1 + r() * 1.2
          g.beginPath()
          const y = i * rh + 4 + r() * (rh - 8)
          g.moveTo(x, y)
          g.bezierCurveTo(
            x + len * 0.33,
            y + (r() - 0.5) * 8,
            x + len * 0.66,
            y + (r() - 0.5) * 8,
            x + len,
            y,
          )
          g.stroke()
        }

        // Mắt gỗ nhỏ mờ tự nhiên
        if (r() < 0.24) {
          const kx = x + 35 + r() * (len - 70)
          const ky = i * rh + 12 + r() * (rh - 24)
          g.fillStyle = 'rgba(110, 70, 28, 0.14)'
          g.beginPath()
          g.ellipse(kx, ky, 7 + r() * 6, 3.5 + r() * 2.5, 0, 0, Math.PI * 2)
          g.fill()
        }

        // Khe ghép dọc giữa các tấm ván
        g.fillStyle = 'rgba(85, 55, 25, 0.32)'
        g.fillRect(x, i * rh, 1.8, rh)
        x += len
      }
      // Khe ghép ngang + highlight mép ván
      g.fillStyle = 'rgba(75, 48, 22, 0.36)'
      g.fillRect(0, i * rh, w, 1.8)
      g.fillStyle = 'rgba(255, 242, 218, 0.16)'
      g.fillRect(0, i * rh + 1.8, w, 1.1)
    }
  })
}

/** Sàn gỗ xương cá (Herringbone Light Oak Floor) cao cấp của Tầng 2 như trong ảnh mẫu */
export function herringboneOakFloor() {
  return canvasTex('herringbone-oak-v1', 1024, 1024, (g, w, h) => {
    const r = rng(57)
    // Nền gỗ sồi sáng tự nhiên
    g.fillStyle = '#edd7be'
    g.fillRect(0, 0, w, h)

    const plankW = 38
    const plankL = 152
    const stepX = plankL
    const stepY = plankL

    for (let x0 = -stepX; x0 < w + stepX * 2; x0 += stepX) {
      for (let y0 = -stepY; y0 < h + stepY * 2; y0 += stepY) {
        // Vẽ cặp xương cá đan chéo góc 45 độ
        for (let side = 0; side < 2; side++) {
          g.save()
          g.translate(x0, y0)
          g.rotate(side === 0 ? Math.PI / 4 : -Math.PI / 4)

          const lVari = 62 + (r() - 0.5) * 12
          const hue = 35 + (r() - 0.5) * 6
          const sat = 48 + (r() - 0.5) * 10
          g.fillStyle = `hsl(${hue}, ${sat}%, ${lVari}%)`
          g.fillRect(0, 0, plankL, plankW)

          // Đường vân gỗ sồi dọc thanh
          for (let v = 0; v < 4; v++) {
            g.strokeStyle = v % 2 === 0 ? 'rgba(140, 95, 45, 0.14)' : 'rgba(255, 245, 225, 0.22)'
            g.lineWidth = 1
            g.beginPath()
            const vy = 5 + v * 7 + (r() - 0.5) * 4
            g.moveTo(0, vy)
            g.lineTo(plankL, vy + (r() - 0.5) * 6)
            g.stroke()
          }

          // Viền rãnh vát cạnh micro-bevel
          g.strokeStyle = 'rgba(90, 58, 28, 0.38)'
          g.lineWidth = 1.6
          g.strokeRect(0, 0, plankL, plankW)
          g.restore()
        }
      }
    }
  })
}

/** Ốp gỗ lam dọc đầu giường (Walnut Wood Slats) */
export function woodSlats() {
  return canvasTex('wood-slats', 512, 256, (g, w, h) => {
    const r = rng(41)
    const slats = 36
    const sw = w / slats
    for (let i = 0; i < slats; i++) {
      const l = 29 + r() * 7
      g.fillStyle = `hsl(24, 42%, ${l}%)`
      g.fillRect(i * sw, 0, sw, h)
      g.fillStyle = 'rgba(15, 7, 2, 0.55)'
      g.fillRect(i * sw, 0, 2.2, h)
    }
  })
}

/** Gạch đá cẩm thạch trắng Carrara cao cấp lát sàn & tường phòng tắm */
export function marbleTiles() {
  return canvasTex('marble-tiles-v1', 1024, 1024, (g, w, h) => {
    const r = rng(77)
    g.fillStyle = '#f8f7f5'
    g.fillRect(0, 0, w, h)

    for (let i = 0; i < 28; i++) {
      const grad = g.createRadialGradient(r() * w, r() * h, 10, r() * w, r() * h, 240 + r() * 200)
      grad.addColorStop(0, 'rgba(225, 222, 216, 0.45)')
      grad.addColorStop(0.5, 'rgba(238, 235, 230, 0.25)')
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    }

    for (let i = 0; i < 18; i++) {
      g.strokeStyle = i % 3 === 0 ? 'rgba(150, 142, 134, 0.28)' : 'rgba(190, 185, 178, 0.2)'
      g.lineWidth = 1 + r() * 2.5
      g.beginPath()
      let x = r() * w
      let y = r() * h
      g.moveTo(x, y)
      for (let s = 0; s < 4; s++) {
        x += (r() - 0.4) * 260
        y += (r() - 0.3) * 240
        g.lineTo(x, y)
      }
      g.stroke()
    }

    const tileSize = 256
    g.strokeStyle = 'rgba(180, 172, 162, 0.55)'
    g.lineWidth = 2.4
    for (let x = 0; x <= w; x += tileSize) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, h)
      g.stroke()
    }
    for (let y = 0; y <= h; y += tileSize) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
  })
}

/** Gạch thẻ ốp tường phòng tắm (Fluted Vertical Tiles) */
export function bathroomWallTiles() {
  return canvasTex('bath-wall-tiles', 512, 512, (g, w, h) => {
    g.fillStyle = '#f5f3ef'
    g.fillRect(0, 0, w, h)
    const colW = 24
    for (let x = 0; x < w; x += colW) {
      const grad = g.createLinearGradient(x, 0, x + colW, 0)
      grad.addColorStop(0, '#e5e1d8')
      grad.addColorStop(0.2, '#fbfaf8')
      grad.addColorStop(0.8, '#f5f2eb')
      grad.addColorStop(1, '#dfdbd2')
      g.fillStyle = grad
      g.fillRect(x + 1, 0, colW - 2, h)
      g.fillStyle = 'rgba(165, 155, 145, 0.45)'
      g.fillRect(x, 0, 1.6, h)
    }
  })
}

/** Trang sách mở ra với chữ & hình minh họa */
export function openBookPages(page = 1) {
  return canvasTex(`book-pages-${page}`, 512, 360, (g, w, h) => {
    // Hai trang sách mở
    g.fillStyle = '#fbf7ed'
    g.fillRect(0, 0, w, h)

    // Nếp gáy sách ở giữa
    const spineGrad = g.createLinearGradient(w / 2 - 18, 0, w / 2 + 18, 0)
    spineGrad.addColorStop(0, 'rgba(0,0,0,0)')
    spineGrad.addColorStop(0.5, 'rgba(40,25,12,0.35)')
    spineGrad.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = spineGrad
    g.fillRect(w / 2 - 18, 0, 36, h)

    // Dòng chữ trang trái
    g.fillStyle = 'rgba(45,35,25,0.72)'
    for (let i = 0; i < 14; i++) {
      const lineW = (i % 4 === 3 ? 0.65 : 0.88) * (w / 2 - 50)
      g.fillRect(36, 40 + i * 20, lineW, 4)
    }

    // Trang phải: Hình minh họa + vài dòng chữ
    g.fillStyle = '#e8dec8'
    g.fillRect(w / 2 + 36, 42, w / 2 - 72, 110)
    g.fillStyle = '#d97706'
    g.beginPath()
    g.arc(w / 2 + 75, 96, 24, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#059669'
    g.beginPath()
    g.moveTo(w / 2 + 100, 152)
    g.lineTo(w / 2 + 140, 75)
    g.lineTo(w / 2 + 180, 152)
    g.closePath()
    g.fill()

    g.fillStyle = 'rgba(45,35,25,0.72)'
    for (let i = 0; i < 8; i++) {
      const lineW = (i % 3 === 2 ? 0.6 : 0.88) * (w / 2 - 60)
      g.fillRect(w / 2 + 36, 175 + i * 18, lineW, 4)
    }

    // Số trang
    g.fillStyle = '#8c7d6b'
    g.font = '600 13px sans-serif'
    g.fillText(`- ${page * 2 - 1} -`, 105, h - 14)
    g.fillText(`- ${page * 2} -`, w / 2 + 105, h - 14)
  })
}

/** Bề mặt thảm dệt (Woven Fabric Rug) */
export function rugWeave(baseHex: string) {
  return canvasTex(`rug-${baseHex}`, 256, 256, (g, w, h) => {
    const r = rng(73)
    g.fillStyle = baseHex
    g.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)'
        g.fillRect(x, y, 2, 2)
      }
    }
  })
}

/** Tranh bình hoa hướng dương kiểu sơn dầu ấm áp như ảnh mẫu */
export function sunflowerArt() {
  return canvasTex('sunflower-v2', 512, 600, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#f6f1e3')
    bg.addColorStop(0.72, '#ede3cc')
    bg.addColorStop(0.72, '#e2be5a')
    bg.addColorStop(1, '#d1a43c')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    // Bình gốm vàng
    g.fillStyle = '#eab308'
    g.beginPath()
    g.ellipse(w / 2, h * 0.72, 92, 115, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fef08a'
    g.beginPath()
    g.ellipse(w / 2, h * 0.62, 66, 16, 0, 0, Math.PI * 2)
    g.fill()

    const drawFlower = (cx: number, cy: number, R: number) => {
      g.strokeStyle = '#3f6212'
      g.lineWidth = 7
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(w / 2 + (cx - w / 2) * 0.35, h * 0.62)
      g.stroke()

      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2
        g.save()
        g.translate(cx, cy)
        g.rotate(a)
        g.fillStyle = i % 2 ? '#f59e0b' : '#facc15'
        g.beginPath()
        g.ellipse(R * 0.85, 0, R * 0.55, R * 0.22, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      g.fillStyle = '#78350f'
      g.beginPath()
      g.arc(cx, cy, R * 0.46, 0, Math.PI * 2)
      g.fill()
    }

    drawFlower(256, 175, 58)
    drawFlower(175, 235, 48)
    drawFlower(335, 225, 50)
    drawFlower(215, 310, 46)
    drawFlower(298, 305, 44)
    drawFlower(145, 315, 38)
    drawFlower(365, 305, 38)
  })
}

/** Màn hình máy tính đôi (Phong cảnh + Cửa sổ Code / Gaming RGB) */
export function screen(variant: number, rgbMode = false) {
  return canvasTex(`screen-v2-${variant}-${rgbMode ? 'rgb' : 'code'}`, 512, 300, (g, w, h) => {
    const r = rng(variant * 31 + 3)
    const grd = g.createLinearGradient(0, 0, w, h)
    if (rgbMode) {
      grd.addColorStop(0, '#1e1b4b')
      grd.addColorStop(0.5, '#7e22ce')
      grd.addColorStop(1, '#ec4899')
    } else if (variant === 1) {
      grd.addColorStop(0, '#0f172a')
      grd.addColorStop(0.55, '#1e3a8a')
      grd.addColorStop(1, '#f59e0b')
    } else {
      grd.addColorStop(0, '#0c4a6e')
      grd.addColorStop(0.6, '#0284c7')
      grd.addColorStop(1, '#fde68a')
    }
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Dãy núi phong cảnh trên màn hình
    g.fillStyle = 'rgba(15, 23, 42, 0.78)'
    g.beginPath()
    g.moveTo(0, h)
    g.lineTo(0, h * 0.65)
    g.lineTo(w * 0.28, h * 0.42)
    g.lineTo(w * 0.55, h * 0.62)
    g.lineTo(w * 0.82, h * 0.38)
    g.lineTo(w, h * 0.58)
    g.lineTo(w, h)
    g.closePath()
    g.fill()

    // Cửa sổ IDE nổi trên màn hình
    g.fillStyle = 'rgba(15, 20, 32, 0.88)'
    g.fillRect(36, 26, w - 72, h - 56)
    g.fillStyle = '#1e293b'
    g.fillRect(36, 26, w - 72, 16)
    for (let i = 0; i < 16; i++) {
      const y = 52 + i * 12
      let x = 54 + (i % 3) * 14
      const n = 1 + Math.floor(r() * 3)
      for (let k = 0; k < n; k++) {
        const len = 24 + r() * 75
        const cols = ['#7dd3fc', '#c4b5fd', '#86efac', '#fda4af', '#fde68a']
        g.fillStyle = cols[Math.floor(r() * cols.length)]
        g.fillRect(x, y, len, 5)
        x += len + 8
      }
    }
  })
}

/** Khung cảnh bầu trời ngoài cửa sổ lớn bên phải */
export function windowSky(night: boolean) {
  return canvasTex(night ? 'sky-night-v2' : 'sky-day-v2', 512, 640, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    if (night) {
      grd.addColorStop(0, '#090d1a')
      grd.addColorStop(0.6, '#151e38')
      grd.addColorStop(1, '#232c4b')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
      const r = rng(99)
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,240,${0.35 + r() * 0.65})`
        const sz = 1 + r() * 2.4
        g.beginPath()
        g.arc(r() * w, r() * h * 0.8, sz, 0, Math.PI * 2)
        g.fill()
      }
    } else {
      grd.addColorStop(0, '#e0f2fe')
      grd.addColorStop(0.5, '#fffbeb')
      grd.addColorStop(1, '#fef3c7')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
    }
  })
}

/** Bảng phi tiêu */
export function dartboard() {
  return canvasTex('dart', 256, 256, (g, w) => {
    const c = w / 2
    g.fillStyle = '#111'
    g.beginPath()
    g.arc(c, c, c, 0, Math.PI * 2)
    g.fill()
    const rings = [118, 100, 92, 64, 56, 16, 8]
    for (let ri = 1; ri < rings.length - 1; ri++) {
      for (let s = 0; s < 20; s++) {
        const a0 = (s / 20) * Math.PI * 2
        const a1 = ((s + 1) / 20) * Math.PI * 2
        const isDouble = ri === 1 || ri === 3
        g.fillStyle = isDouble ? (s % 2 ? '#c0392b' : '#1e8449') : s % 2 ? '#f1e7c6' : '#151515'
        g.beginPath()
        g.moveTo(c, c)
        g.arc(c, c, rings[ri], a0, a1)
        g.closePath()
        g.fill()
      }
    }
    g.fillStyle = '#1e8449'
    g.beginPath()
    g.arc(c, c, 16, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#c0392b'
    g.beginPath()
    g.arc(c, c, 8, 0, Math.PI * 2)
    g.fill()
  })
}

/** Sàn gỗ sồi sáng màu (Bright Light Oak) cho tầng 2 của bạn gái */
export function lightOakFloor() {
  return canvasTex('light-oak-floor', 512, 512, (g, w, h) => {
    g.fillStyle = '#d8b892'
    g.fillRect(0, 0, w, h)
    const rows = 8
    const rowH = h / rows
    const tones = ['#dec09a', '#d3b289', '#e3c7a3', '#cfa97e', '#dab992']
    for (let r = 0; r < rows; r++) {
      const y = r * rowH
      const offset = (r % 2) * 120
      for (let x = -offset; x < w; x += 240) {
        const tone = tones[(r * 3 + Math.floor((x + offset) / 240)) % tones.length]
        g.fillStyle = tone
        g.fillRect(x + 1, y + 1, 238, rowH - 2)
        // Vân gỗ sồi mảnh tự nhiên
        g.strokeStyle = 'rgba(130, 90, 50, 0.14)'
        g.lineWidth = 1.2
        for (let k = 0; k < 4; k++) {
          g.beginPath()
          g.moveTo(x + 8, y + (k + 1) * (rowH / 5))
          g.bezierCurveTo(
            x + 80,
            y + (k + 0.6) * (rowH / 5),
            x + 160,
            y + (k + 1.4) * (rowH / 5),
            x + 232,
            y + (k + 1) * (rowH / 5),
          )
          g.stroke()
        }
      }
      g.fillStyle = 'rgba(110, 75, 40, 0.25)'
      g.fillRect(0, y, w, 1.5)
    }
  })
}

/** Thảm tròn lông xù màu kem (Fluffy Cream Round Rug) */
export function fluffyCreamRug() {
  return canvasTex('fluffy-cream-rug', 512, 512, (g, w, h) => {
    g.fillStyle = '#f2ece1'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      const r = 3 + Math.random() * 7
      g.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(218,208,192,0.45)'
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
  })
}

/** Màn hình cảm ứng Smart Home gắn tường */
export function smartPanelScreen() {
  return canvasTex('smart-panel-ui', 256, 360, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#0f172a')
    grd.addColorStop(1, '#1e293b')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Nhiệt độ & thời tiết
    g.fillStyle = '#38bdf8'
    g.font = 'bold 42px sans-serif'
    g.fillText('24°C', 28, 70)
    g.fillStyle = '#94a3b8'
    g.font = '600 15px sans-serif'
    g.fillText('SMART HOME · 2 TẦNG', 28, 98)

    // Các ô widget cảm ứng
    const cards = [
      { y: 125, c: '#0284c7', title: 'ĐIỀU HÒA', sub: 'Đang bật · Eco' },
      { y: 195, c: '#10b981', title: 'ROBOT HÚT BỤI', sub: 'Đang làm sạch' },
      { y: 265, c: '#f59e0b', title: 'RÒNG RỌC TẦNG 2', sub: 'Kết nối thông tầng' },
    ]
    cards.forEach((card) => {
      g.fillStyle = 'rgba(255,255,255,0.08)'
      g.fillRect(22, card.y, w - 44, 56)
      g.fillStyle = card.c
      g.fillRect(22, card.y, 6, 56)
      g.fillStyle = '#f8fafc'
      g.font = 'bold 15px sans-serif'
      g.fillText(card.title, 40, card.y + 24)
      g.fillStyle = '#cbd5e1'
      g.font = '13px sans-serif'
      g.fillText(card.sub, 40, card.y + 44)
    })
  })
}

/** Màn hình máy tính của bạn gái (hỗ trợ 2 chế độ: 'on' = UI Design Pastel & 'rgb' = Vẽ 3D Studio) */
export function girlPcScreen(mode: 'on' | 'rgb' = 'on') {
  return canvasTex(`girl-pc-ui-${mode}`, 512, 300, (g, w, h) => {
    if (mode === 'rgb') {
      // Chế độ Vẽ 3D Studio (Blender / Spline Dark Viewport + Khối 3D Neon)
      const bg = g.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#0f172a')
      bg.addColorStop(0.55, '#1e1b4b')
      bg.addColorStop(1, '#311042')
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)

      // Lưới phối cảnh 3D (Viewport Grid)
      g.strokeStyle = 'rgba(148, 163, 184, 0.2)'
      g.lineWidth = 1
      for (let x = 80; x < w - 80; x += 28) {
        g.beginPath()
        g.moveTo(x, 34)
        g.lineTo(x, h - 24)
        g.stroke()
      }
      for (let y = 44; y < h - 24; y += 28) {
        g.beginPath()
        g.moveTo(80, y)
        g.lineTo(w - 80, y)
        g.stroke()
      }

      // Trục tọa độ X (Đỏ) & Z (Xanh)
      g.strokeStyle = '#ef4444'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(90, h * 0.62)
      g.lineTo(w - 90, h * 0.62)
      g.stroke()

      g.strokeStyle = '#22c55e'
      g.beginPath()
      g.moveTo(w * 0.5, 42)
      g.lineTo(w * 0.5, h - 28)
      g.stroke()

      // Khối 3D đang dựng ở trung tâm (Isometric/Torus/Sphere Neon)
      const glow = g.createRadialGradient(w * 0.5, h * 0.5, 8, w * 0.5, h * 0.5, 86)
      glow.addColorStop(0, '#38bdf8')
      glow.addColorStop(0.5, '#a855f7')
      glow.addColorStop(1, 'rgba(236, 72, 153, 0)')
      g.fillStyle = glow
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 84, 0, Math.PI * 2)
      g.fill()

      // Khối cầu 3D & vòng nhẫn quỹ đạo
      const sph = g.createRadialGradient(w * 0.47, h * 0.44, 6, w * 0.5, h * 0.5, 48)
      sph.addColorStop(0, '#f472b6')
      sph.addColorStop(0.6, '#7c3aed')
      sph.addColorStop(1, '#1d4ed8')
      g.fillStyle = sph
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 46, 0, Math.PI * 2)
      g.fill()

      g.strokeStyle = '#38bdf8'
      g.lineWidth = 4
      g.beginPath()
      g.ellipse(w * 0.5, h * 0.52, 74, 24, -0.28, 0, Math.PI * 2)
      g.stroke()

      // Thanh công cụ trái (3D Tools) & Panel thuộc tính phải (Inspector)
      g.fillStyle = 'rgba(15, 23, 42, 0.88)'
      g.fillRect(10, 32, 62, h - 44)
      g.fillRect(w - 96, 32, 86, h - 44)
      g.fillRect(0, 0, w, 26)

      const toolCols = ['#38bdf8', '#f472b6', '#a855f7', '#fbbf24', '#34d399']
      toolCols.forEach((tc, i) => {
        g.fillStyle = tc
        g.fillRect(24, 48 + i * 36, 34, 22)
      })

      g.fillStyle = '#e2e8f0'
      g.font = 'bold 12px sans-serif'
      g.fillText('3D STUDIO · RENDER', 16, 17)
      g.fillStyle = '#38bdf8'
      g.fillRect(w - 84, 48, 62, 10)
      g.fillStyle = '#f472b6'
      g.fillRect(w - 84, 70, 48, 10)
      g.fillStyle = '#a855f7'
      g.fillRect(w - 84, 92, 56, 10)
      return
    }

    const grd = g.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, '#fbcfe8')
    grd.addColorStop(0.5, '#e9d5ff')
    grd.addColorStop(1, '#bfdbfe')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Đồi núi hoàng hôn pastel như ảnh mẫu
    g.fillStyle = '#f472b6'
    g.beginPath()
    g.arc(w * 0.65, h * 0.42, 42, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = '#6d28d9'
    g.beginPath()
    g.moveTo(0, h)
    g.lineTo(w * 0.35, h * 0.52)
    g.lineTo(w * 0.72, h)
    g.closePath()
    g.fill()

    g.fillStyle = '#4c1d95'
    g.beginPath()
    g.moveTo(w * 0.3, h)
    g.lineTo(w * 0.68, h * 0.48)
    g.lineTo(w, h)
    g.closePath()
    g.fill()

    // Cửa sổ ứng dụng nhỏ
    g.fillStyle = 'rgba(255,255,255,0.82)'
    g.fillRect(36, 32, 180, 115)
    g.fillStyle = '#ec4899'
    g.fillRect(48, 48, 90, 8)
    g.fillStyle = '#94a3b8'
    g.fillRect(48, 66, 140, 6)
    g.fillRect(48, 80, 120, 6)
    g.fillRect(48, 94, 150, 6)
  })
}

/** Tranh nghệ thuật trừu tượng khổ lớn trên đầu giường Bạn Gái (Abstract Wall Art) */
export function abstractBedArt() {
  return canvasTex('abstract-bed-art', 512, 380, (g, w, h) => {
    // Nền kem be ấm
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#f7f2ea')
    bg.addColorStop(1, '#ebe0d0')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    // Các mảng màu sơn trừu tượng mềm mại phong cách Scandivian / Wabi-sabi
    g.fillStyle = 'rgba(212, 163, 115, 0.55)'
    g.beginPath()
    g.ellipse(w * 0.45, h * 0.48, 140, 100, Math.PI / 6, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = 'rgba(169, 132, 103, 0.45)'
    g.beginPath()
    g.ellipse(w * 0.62, h * 0.42, 110, 80, -Math.PI / 5, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = 'rgba(244, 211, 204, 0.65)'
    g.beginPath()
    g.ellipse(w * 0.32, h * 0.6, 95, 65, Math.PI / 4, 0, Math.PI * 2)
    g.fill()

    // Những nét phác nghệ thuật màu trắng và vàng đồng
    g.strokeStyle = '#ffffff'
    g.lineWidth = 3.5
    g.beginPath()
    g.arc(w * 0.52, h * 0.46, 75, 0.4, Math.PI * 1.6)
    g.stroke()

    g.strokeStyle = 'rgba(180, 130, 70, 0.6)'
    g.lineWidth = 2.2
    g.beginPath()
    g.moveTo(w * 0.2, h * 0.3)
    g.bezierCurveTo(w * 0.4, h * 0.15, w * 0.7, h * 0.5, w * 0.82, h * 0.35)
    g.stroke()
  })
}

/** Màn hình TV chiếu hình ảnh phong cảnh núi non thiên nhiên hùng vĩ theo đúng ảnh mẫu */
export function mountainLandscapeTv() {
  return canvasTex('mountain-landscape-tv', 640, 360, (g, w, h) => {
    // Bầu trời xanh biếc với mây nhẹ
    const sky = g.createLinearGradient(0, 0, 0, h * 0.65)
    sky.addColorStop(0, '#38bdf8')
    sky.addColorStop(0.5, '#7dd3fc')
    sky.addColorStop(1, '#bae6fd')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)

    // Ánh mặt trời vàng ấm
    const sun = g.createRadialGradient(w * 0.52, h * 0.32, 10, w * 0.52, h * 0.32, 120)
    sun.addColorStop(0, 'rgba(254, 240, 138, 0.85)')
    sun.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)')
    sun.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.fillStyle = sun
    g.fillRect(0, 0, w, h)

    // Dãy núi đá hùng vĩ phía xa (màu xanh tím mờ)
    g.fillStyle = '#64748b'
    g.beginPath()
    g.moveTo(0, h * 0.65)
    g.lineTo(w * 0.18, h * 0.36)
    g.lineTo(w * 0.38, h * 0.52)
    g.lineTo(w * 0.62, h * 0.3)
    g.lineTo(w * 0.82, h * 0.48)
    g.lineTo(w, h * 0.62)
    g.lineTo(w, h)
    g.lineTo(0, h)
    g.closePath()
    g.fill()

    // Dãy núi đá nhô cao ở trung tâm (màu vàng đất + ánh nắng)
    g.fillStyle = '#b45309'
    g.beginPath()
    g.moveTo(w * 0.22, h)
    g.lineTo(w * 0.48, h * 0.26)
    g.lineTo(w * 0.58, h * 0.42)
    g.lineTo(w * 0.72, h * 0.28)
    g.lineTo(w * 0.88, h)
    g.closePath()
    g.fill()

    // Thung lũng & rừng cây xanh ngút ngàn phía dưới
    g.fillStyle = '#15803d'
    g.beginPath()
    g.moveTo(0, h * 0.72)
    g.bezierCurveTo(w * 0.3, h * 0.62, w * 0.65, h * 0.78, w, h * 0.68)
    g.lineTo(w, h)
    g.lineTo(0, h)
    g.closePath()
    g.fill()

    // Thảm cỏ vàng xanh tiền cảnh
    g.fillStyle = '#4ade80'
    g.beginPath()
    g.moveTo(0, h * 0.85)
    g.bezierCurveTo(w * 0.4, h * 0.76, w * 0.7, h * 0.88, w, h * 0.82)
    g.lineTo(w, h)
    g.lineTo(0, h)
    g.closePath()
    g.fill()
  })
}

/** Thảm dệt họa tiết cổ điển tông nâu đỏ ấm áp (Vintage Persian Terracotta Rug) */
export function persianTerracottaRug() {
  return canvasTex('persian-terracotta-rug', 512, 340, (g, w, h) => {
    // Nền ngoài viền kem be
    g.fillStyle = '#e5d5c3'
    g.fillRect(0, 0, w, h)

    // Khung viền ngoài nâu trầm
    g.strokeStyle = '#5c2c1d'
    g.lineWidth = 10
    g.strokeRect(12, 12, w - 24, h - 24)

    // Khung viền họa tiết hình học cam đất
    g.fillStyle = '#9e472a'
    g.fillRect(24, 24, w - 48, h - 48)

    g.strokeStyle = '#e8d8c8'
    g.lineWidth = 4
    g.strokeRect(36, 36, w - 72, h - 72)

    // Nền trung tâm nâu đỏ ấm
    g.fillStyle = '#7c3622'
    g.fillRect(46, 46, w - 92, h - 92)

    // Hoa văn chuỗi hạt quanh viền
    g.fillStyle = '#ebd9c8'
    for (let x = 30; x < w - 30; x += 22) {
      g.fillRect(x, 27, 8, 6)
      g.fillRect(x, h - 33, 8, 6)
    }
    for (let y = 30; y < h - 30; y += 22) {
      g.fillRect(27, y, 6, 8)
      g.fillRect(w - 33, y, 6, 8)
    }

    // Họa tiết góc (Corner spandrels) màu kem & vàng đất
    const corners = [
      [46, 46, 1, 1],
      [w - 46, 46, -1, 1],
      [46, h - 46, 1, -1],
      [w - 46, h - 46, -1, -1],
    ]
    corners.forEach(([cx, cy, sx, sy]) => {
      g.fillStyle = '#d8bfa9'
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx + sx * 68, cy)
      g.lineTo(cx, cy + sy * 54)
      g.closePath()
      g.fill()
    })

    // Medallion hình thoi lớn ở trung tâm
    const mx = w / 2
    const my = h / 2
    g.fillStyle = '#d9c2ad'
    g.beginPath()
    g.moveTo(mx, my - 78)
    g.lineTo(mx + 125, my)
    g.lineTo(mx, my + 78)
    g.lineTo(mx - 125, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#b4532a'
    g.beginPath()
    g.moveTo(mx, my - 54)
    g.lineTo(mx + 86, my)
    g.lineTo(mx, my + 54)
    g.lineTo(mx - 86, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#4a2115'
    g.beginPath()
    g.moveTo(mx, my - 28)
    g.lineTo(mx + 44, my)
    g.lineTo(mx, my + 28)
    g.lineTo(mx - 44, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#f3e5d7'
    g.beginPath()
    g.arc(mx, my, 10, 0, Math.PI * 2)
    g.fill()
  })
}

/** Tranh nghệ thuật đa sắc màu rực rỡ treo chính giữa đầu giường Tầng 2 */
export function colorfulBedArt() {
  return canvasTex('colorful-bed-art', 512, 340, (g, w, h) => {
    // Bo viền trắng passepartout bên ngoài
    g.fillStyle = '#faf6f0'
    g.fillRect(0, 0, w, h)

    // Khung tranh bên trong
    const pad = 22
    const iw = w - pad * 2
    const ih = h - pad * 2
    g.save()
    g.beginPath()
    g.rect(pad, pad, iw, ih)
    g.clip()

    // Nền tranh chuyển sắc ấm áp
    const bg = g.createLinearGradient(pad, pad, pad + iw, pad + ih)
    bg.addColorStop(0, '#fde68a')
    bg.addColorStop(0.5, '#fca5a5')
    bg.addColorStop(1, '#c4b5fd')
    g.fillStyle = bg
    g.fillRect(pad, pad, iw, ih)

    // Các mảng màu nghệ thuật Pop-Impressionism đầy sức sống (đỏ, cam, vàng, lục, lam, tím)
    const blobs = [
      { x: 0.22, y: 0.35, rx: 75, ry: 55, c: '#ef4444', rot: 0.3 },
      { x: 0.48, y: 0.28, rx: 85, ry: 60, c: '#f59e0b', rot: -0.2 },
      { x: 0.76, y: 0.38, rx: 70, ry: 58, c: '#10b981', rot: 0.4 },
      { x: 0.32, y: 0.68, rx: 80, ry: 52, c: '#3b82f6', rot: -0.3 },
      { x: 0.62, y: 0.65, rx: 90, ry: 56, c: '#ec4899', rot: 0.2 },
      { x: 0.82, y: 0.72, rx: 65, ry: 48, c: '#8b5cf6', rot: -0.4 },
      { x: 0.5, y: 0.5, rx: 60, ry: 45, c: '#facc15', rot: 0.1 },
      { x: 0.18, y: 0.75, rx: 55, ry: 42, c: '#f97316', rot: 0.5 },
    ]
    blobs.forEach((b) => {
      g.fillStyle = b.c
      g.beginPath()
      g.ellipse(pad + iw * b.x, pad + ih * b.y, b.rx, b.ry, b.rot, 0, Math.PI * 2)
      g.fill()
    })

    // Điểm xuyết các nét cọ & tán lá đa sắc
    const colors = ['#ffffff', '#fde047', '#15803d', '#be123c', '#1d4ed8', '#fb923c']
    for (let i = 0; i < 65; i++) {
      g.fillStyle = colors[i % colors.length]
      const bx = pad + ((i * 73) % iw)
      const by = pad + ((i * 53) % ih)
      g.beginPath()
      g.arc(bx, by, 6 + (i % 10), 0, Math.PI * 2)
      g.fill()
    }

    // Các đường nét phác họa uyển chuyển tạo bố cục tranh
    g.strokeStyle = 'rgba(30, 20, 15, 0.45)'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(pad + 30, pad + ih * 0.6)
    g.bezierCurveTo(pad + iw * 0.35, pad + ih * 0.2, pad + iw * 0.65, pad + ih * 0.8, pad + iw - 30, pad + ih * 0.35)
    g.stroke()

    g.restore()

    // Viền mảnh ngăn cách passepartout
    g.strokeStyle = '#d6ccc2'
    g.lineWidth = 2
    g.strokeRect(pad, pad, iw, ih)
  })
}

/** Bóng đổ mềm (Ambient Contact Shadow) dưới đế mô hình ngôi nhà tạo chiều sâu Studio 3D */
export function houseDropShadow() {
  return canvasTex('house-drop-shadow-v1', 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.save()
    g.filter = 'blur(28px)'
    g.fillStyle = 'rgba(18, 12, 8, 0.85)'
    const mx = 68
    const my = 68
    g.beginPath()
    g.roundRect(mx, my, w - mx * 2, h - my * 2, 36)
    g.fill()
    g.restore()
  })
}
