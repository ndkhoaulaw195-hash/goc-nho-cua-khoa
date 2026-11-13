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

/** Sàn gỗ sồi trầm ấm tự nhiên đồng bộ cho cả Tầng 1 và Tầng 2 */
export function woodFloor() {
  return canvasTex('wood-ash-neutral-v6', 1024, 1024, (g, w, h) => {
    const r = rng(23)
    const rows = 14
    const rh = h / rows
    for (let i = 0; i < rows; i++) {
      let x = -r() * 240
      while (x < w) {
        const len = 260 + r() * 260
        // Tone gỗ sồi xám tro trung tính hài hòa cho cả 2 tầng
        const hue = 31 + r() * 5
        const sat = 15 + r() * 6
        const light = 51 + r() * 8
        g.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
        g.fillRect(x, i * rh, len, rh)

        // Thớ vân gỗ sồi mịn trung tính
        for (let k = 0; k < 8; k++) {
          g.strokeStyle = k % 2 === 0 ? 'rgba(78, 70, 62, 0.10)' : 'rgba(246, 243, 238, 0.14)'
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
          g.fillStyle = 'rgba(72, 65, 58, 0.13)'
          g.beginPath()
          g.ellipse(kx, ky, 7 + r() * 6, 3.5 + r() * 2.5, 0, 0, Math.PI * 2)
          g.fill()
        }

        // Khe ghép dọc giữa các tấm ván
        g.fillStyle = 'rgba(62, 56, 50, 0.28)'
        g.fillRect(x, i * rh, 1.8, rh)
        x += len
      }
      // Khe ghép ngang + highlight mép ván
      g.fillStyle = 'rgba(58, 52, 46, 0.32)'
      g.fillRect(0, i * rh, w, 1.8)
      g.fillStyle = 'rgba(246, 243, 238, 0.14)'
      g.fillRect(0, i * rh + 1.8, w, 1.1)
    }
  })
}

/** Sàn gỗ xương cá (Neutral Ash Herringbone Floor) */
export function herringboneOakFloor() {
  return canvasTex('herringbone-oak-neutral-v2', 1024, 1024, (g, w, h) => {
    const r = rng(57)
    // Nền gỗ sồi tro sáng trung tính
    g.fillStyle = '#dad3c9'
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

          const lVari = 66 + (r() - 0.5) * 10
          const hue = 32 + (r() - 0.5) * 5
          const sat = 16 + (r() - 0.5) * 6
          g.fillStyle = `hsl(${hue}, ${sat}%, ${lVari}%)`
          g.fillRect(0, 0, plankL, plankW)

          // Đường vân gỗ dọc thanh
          for (let v = 0; v < 4; v++) {
            g.strokeStyle = v % 2 === 0 ? 'rgba(92, 84, 74, 0.13)' : 'rgba(248, 245, 240, 0.2)'
            g.lineWidth = 1
            g.beginPath()
            const vy = 5 + v * 7 + (r() - 0.5) * 4
            g.moveTo(0, vy)
            g.lineTo(plankL, vy + (r() - 0.5) * 6)
            g.stroke()
          }

          // Viền rãnh vát cạnh micro-bevel
          g.strokeStyle = 'rgba(72, 65, 58, 0.30)'
          g.lineWidth = 1.6
          g.strokeRect(0, 0, plankL, plankW)
          g.restore()
        }
      }
    }
  })
}

/** Ốp gỗ lam dọc đầu giường (Smoked Taupe Slats) */
export function woodSlats() {
  return canvasTex('wood-slats-neutral-v2', 512, 256, (g, w, h) => {
    const r = rng(41)
    const slats = 36
    const sw = w / slats
    for (let i = 0; i < slats; i++) {
      const l = 28 + r() * 6
      g.fillStyle = `hsl(28, 14%, ${l}%)`
      g.fillRect(i * sw, 0, sw, h)
      g.fillStyle = 'rgba(18, 16, 14, 0.52)'
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

    // Trang phải: Hình minh họa tối giản trung tính + vài dòng chữ
    g.fillStyle = '#e7e1d6'
    g.fillRect(w / 2 + 36, 42, w / 2 - 72, 110)
    g.fillStyle = '#b8a995'
    g.beginPath()
    g.arc(w / 2 + 75, 96, 24, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#5e6b5b'
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
  return canvasTex('sunflower-neutral-v3', 512, 600, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#f4f0e8')
    bg.addColorStop(0.72, '#e8e2d7')
    bg.addColorStop(0.72, '#cfc6b8')
    bg.addColorStop(1, '#bfb5a6')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    // Bình gốm đá tối giản
    g.fillStyle = '#8b8175'
    g.beginPath()
    g.ellipse(w / 2, h * 0.72, 92, 115, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#b5aca0'
    g.beginPath()
    g.ellipse(w / 2, h * 0.62, 66, 16, 0, 0, Math.PI * 2)
    g.fill()

    const drawFlower = (cx: number, cy: number, R: number) => {
      g.strokeStyle = '#566250'
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
        g.fillStyle = i % 2 ? '#cbb996' : '#ddd1b6'
        g.beginPath()
        g.ellipse(R * 0.85, 0, R * 0.55, R * 0.22, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      g.fillStyle = '#5a4e42'
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

/** Màn hình máy tính đôi (Núi sương mù + Cửa sổ Code / Studio tối giản) */
export function screen(variant: number, rgbMode = false) {
  return canvasTex(`screen-neutral-v3-${variant}-${rgbMode ? 'rgb' : 'code'}`, 512, 300, (g, w, h) => {
    const r = rng(variant * 31 + 3)
    const grd = g.createLinearGradient(0, 0, w, h)
    if (rgbMode) {
      grd.addColorStop(0, '#222126')
      grd.addColorStop(0.5, '#47434d')
      grd.addColorStop(1, '#7c7378')
    } else if (variant === 1) {
      grd.addColorStop(0, '#1e2024')
      grd.addColorStop(0.55, '#3b414a')
      grd.addColorStop(1, '#a99d8b')
    } else {
      grd.addColorStop(0, '#25292e')
      grd.addColorStop(0.6, '#4d565e')
      grd.addColorStop(1, '#d9d1c2')
    }
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Dãy núi phong cảnh trên màn hình
    g.fillStyle = 'rgba(22, 23, 26, 0.78)'
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
    g.fillStyle = 'rgba(24, 24, 27, 0.90)'
    g.fillRect(36, 26, w - 72, h - 56)
    g.fillStyle = '#2d2d30'
    g.fillRect(36, 26, w - 72, 16)
    for (let i = 0; i < 16; i++) {
      const y = 52 + i * 12
      let x = 54 + (i % 3) * 14
      const n = 1 + Math.floor(r() * 3)
      for (let k = 0; k < n; k++) {
        const len = 24 + r() * 75
        const cols = ['#d6d3cd', '#b3bec7', '#a8b8ab', '#cabbb0', '#ded4be']
        g.fillStyle = cols[Math.floor(r() * cols.length)]
        g.fillRect(x, y, len, 5)
        x += len + 8
      }
    }
  })
}

/** Khung cảnh bầu trời trung tính ngoài cửa sổ lớn bên phải */
export function windowSky(night: boolean) {
  return canvasTex(night ? 'sky-night-neutral-v3' : 'sky-day-neutral-v3', 512, 640, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    if (night) {
      grd.addColorStop(0, '#141518')
      grd.addColorStop(0.6, '#212328')
      grd.addColorStop(1, '#2f3238')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
      const r = rng(99)
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(245,243,238,${0.32 + r() * 0.55})`
        const sz = 1 + r() * 2.2
        g.beginPath()
        g.arc(r() * w, r() * h * 0.8, sz, 0, Math.PI * 2)
        g.fill()
      }
    } else {
      grd.addColorStop(0, '#dce0e4')
      grd.addColorStop(0.5, '#edeae4')
      grd.addColorStop(1, '#e7e1d6')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
    }
  })
}

/** Bảng phi tiêu bảng màu cổ điển trung tính */
export function dartboard() {
  return canvasTex('dart-neutral-v2', 256, 256, (g, w) => {
    const c = w / 2
    g.fillStyle = '#1b1a18'
    g.beginPath()
    g.arc(c, c, c, 0, Math.PI * 2)
    g.fill()
    const rings = [118, 100, 92, 64, 56, 16, 8]
    for (let ri = 1; ri < rings.length - 1; ri++) {
      for (let s = 0; s < 20; s++) {
        const a0 = (s / 20) * Math.PI * 2
        const a1 = ((s + 1) / 20) * Math.PI * 2
        const isDouble = ri === 1 || ri === 3
        g.fillStyle = isDouble ? (s % 2 ? '#7f4d46' : '#516052') : s % 2 ? '#e6dfd1' : '#23211e'
        g.beginPath()
        g.moveTo(c, c)
        g.arc(c, c, rings[ri], a0, a1)
        g.closePath()
        g.fill()
      }
    }
    g.fillStyle = '#516052'
    g.beginPath()
    g.arc(c, c, 16, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#7f4d46'
    g.beginPath()
    g.arc(c, c, 8, 0, Math.PI * 2)
    g.fill()
  })
}

/** Sàn gỗ sồi tro sáng trung tính (Neutral Ash Oak) */
export function lightOakFloor() {
  return canvasTex('light-oak-neutral-v2', 512, 512, (g, w, h) => {
    g.fillStyle = '#d3cbc0'
    g.fillRect(0, 0, w, h)
    const rows = 8
    const rowH = h / rows
    const tones = ['#d7d0c5', '#cdc4b8', '#dcd5cb', '#c7beb2', '#d2cabf']
    for (let r = 0; r < rows; r++) {
      const y = r * rowH
      const offset = (r % 2) * 120
      for (let x = -offset; x < w; x += 240) {
        const tone = tones[(r * 3 + Math.floor((x + offset) / 240)) % tones.length]
        g.fillStyle = tone
        g.fillRect(x + 1, y + 1, 238, rowH - 2)
        // Vân gỗ mảnh trung tính
        g.strokeStyle = 'rgba(84, 76, 68, 0.14)'
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
      g.fillStyle = 'rgba(72, 65, 58, 0.24)'
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

/** Màn hình cảm ứng Smart Home gắn tường tone Trung Tính */
export function smartPanelScreen() {
  return canvasTex('smart-panel-ui-neutral-v2', 256, 360, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, '#1d1e20')
    grd.addColorStop(1, '#2d2e32')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Nhiệt độ & thời tiết
    g.fillStyle = '#d6cfc4'
    g.font = 'bold 42px sans-serif'
    g.fillText('24°C', 28, 70)
    g.fillStyle = '#9e978e'
    g.font = '600 15px sans-serif'
    g.fillText('SMART HOME · 2 TẦNG', 28, 98)

    // Các ô widget cảm ứng trung tính
    const cards = [
      { y: 125, c: '#8f9aa3', title: 'ĐIỀU HÒA', sub: 'Đang bật · Eco' },
      { y: 195, c: '#7d8c7a', title: 'ÁNH SÁNG DỊU', sub: 'Chế độ Thư giãn' },
      { y: 265, c: '#c2b39d', title: 'KHÔNG GIAN YÊN BÌNH', sub: 'Kết nối đồng bộ' },
    ]
    cards.forEach((card) => {
      g.fillStyle = 'rgba(255,255,255,0.06)'
      g.fillRect(22, card.y, w - 44, 56)
      g.fillStyle = card.c
      g.fillRect(22, card.y, 6, 56)
      g.fillStyle = '#f2efe9'
      g.font = 'bold 15px sans-serif'
      g.fillText(card.title, 40, card.y + 24)
      g.fillStyle = '#bdb7ae'
      g.font = '13px sans-serif'
      g.fillText(card.sub, 40, card.y + 44)
    })
  })
}

/** Màn hình máy tính của bạn gái (hỗ trợ 2 chế độ: 'on' = UI Design Tối giản & 'rgb' = Vẽ 3D Studio) */
export function girlPcScreen(mode: 'on' | 'rgb' = 'on') {
  return canvasTex(`girl-pc-ui-neutral-v2-${mode}`, 512, 300, (g, w, h) => {
    if (mode === 'rgb') {
      // Chế độ Vẽ 3D Studio (Dark Slate Viewport + Khối 3D Titanium & Stone)
      const bg = g.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#18191c')
      bg.addColorStop(0.55, '#25262b')
      bg.addColorStop(1, '#343230')
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)

      // Lưới phối cảnh 3D (Viewport Grid)
      g.strokeStyle = 'rgba(180, 176, 170, 0.16)'
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

      // Trục tọa độ dịu
      g.strokeStyle = '#9c7872'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(90, h * 0.62)
      g.lineTo(w - 90, h * 0.62)
      g.stroke()

      g.strokeStyle = '#7b8c7c'
      g.beginPath()
      g.moveTo(w * 0.5, 42)
      g.lineTo(w * 0.5, h - 28)
      g.stroke()

      // Khối 3D ở trung tâm (Warm Champagne & Silver Glow)
      const glow = g.createRadialGradient(w * 0.5, h * 0.5, 8, w * 0.5, h * 0.5, 86)
      glow.addColorStop(0, '#dcd5c9')
      glow.addColorStop(0.5, '#9b958e')
      glow.addColorStop(1, 'rgba(120, 114, 108, 0)')
      g.fillStyle = glow
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 84, 0, Math.PI * 2)
      g.fill()

      const sph = g.createRadialGradient(w * 0.47, h * 0.44, 6, w * 0.5, h * 0.5, 48)
      sph.addColorStop(0, '#ede7dd')
      sph.addColorStop(0.6, '#9e958a')
      sph.addColorStop(1, '#4b4742')
      g.fillStyle = sph
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 46, 0, Math.PI * 2)
      g.fill()

      g.strokeStyle = '#cfc6b8'
      g.lineWidth = 3.5
      g.beginPath()
      g.ellipse(w * 0.5, h * 0.52, 74, 24, -0.28, 0, Math.PI * 2)
      g.stroke()

      // Thanh công cụ & Inspector
      g.fillStyle = 'rgba(20, 21, 24, 0.90)'
      g.fillRect(10, 32, 62, h - 44)
      g.fillRect(w - 96, 32, 86, h - 44)
      g.fillRect(0, 0, w, 26)

      const toolCols = ['#d8d1c5', '#b5aca0', '#8b968a', '#c9baa3', '#8c949c']
      toolCols.forEach((tc, i) => {
        g.fillStyle = tc
        g.fillRect(24, 48 + i * 36, 34, 22)
      })

      g.fillStyle = '#e8e3da'
      g.font = 'bold 12px sans-serif'
      g.fillText('3D STUDIO · RENDER', 16, 17)
      g.fillStyle = '#cfc6b8'
      g.fillRect(w - 84, 48, 62, 10)
      g.fillStyle = '#a39a8e'
      g.fillRect(w - 84, 70, 48, 10)
      g.fillStyle = '#7d887c'
      g.fillRect(w - 84, 92, 56, 10)
      return
    }

    const grd = g.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, '#e8e2d8')
    grd.addColorStop(0.5, '#dad3c8')
    grd.addColorStop(1, '#c9c5bd')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Đồi cát & mặt trời tối giản trung tính
    g.fillStyle = '#cfc2b0'
    g.beginPath()
    g.arc(w * 0.65, h * 0.42, 42, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = '#7e756b'
    g.beginPath()
    g.moveTo(0, h)
    g.lineTo(w * 0.35, h * 0.52)
    g.lineTo(w * 0.72, h)
    g.closePath()
    g.fill()

    g.fillStyle = '#534d46'
    g.beginPath()
    g.moveTo(w * 0.3, h)
    g.lineTo(w * 0.68, h * 0.48)
    g.lineTo(w, h)
    g.closePath()
    g.fill()

    // Cửa sổ ứng dụng nhỏ
    g.fillStyle = 'rgba(250,248,244,0.88)'
    g.fillRect(36, 32, 180, 115)
    g.fillStyle = '#8b7f71'
    g.fillRect(48, 48, 90, 8)
    g.fillStyle = '#a8a096'
    g.fillRect(48, 66, 140, 6)
    g.fillRect(48, 80, 120, 6)
    g.fillRect(48, 94, 150, 6)
  })
}

/** Tranh nghệ thuật trừu tượng Wabi-sabi trên đầu giường (Abstract Neutral Wall Art) */
export function abstractBedArt() {
  return canvasTex('abstract-bed-art-neutral-v2', 512, 380, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#f4f0e8')
    bg.addColorStop(1, '#e6dfd4')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    g.fillStyle = 'rgba(182, 170, 155, 0.52)'
    g.beginPath()
    g.ellipse(w * 0.45, h * 0.48, 140, 100, Math.PI / 6, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = 'rgba(138, 127, 115, 0.42)'
    g.beginPath()
    g.ellipse(w * 0.62, h * 0.42, 110, 80, -Math.PI / 5, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = 'rgba(216, 207, 194, 0.68)'
    g.beginPath()
    g.ellipse(w * 0.32, h * 0.6, 95, 65, Math.PI / 4, 0, Math.PI * 2)
    g.fill()

    g.strokeStyle = '#f8f6f2'
    g.lineWidth = 3.5
    g.beginPath()
    g.arc(w * 0.52, h * 0.46, 75, 0.4, Math.PI * 1.6)
    g.stroke()

    g.strokeStyle = 'rgba(110, 100, 88, 0.55)'
    g.lineWidth = 2.2
    g.beginPath()
    g.moveTo(w * 0.2, h * 0.3)
    g.bezierCurveTo(w * 0.4, h * 0.15, w * 0.7, h * 0.5, w * 0.82, h * 0.35)
    g.stroke()
  })
}

/** Màn hình TV chiếu phong cảnh núi non sương mù dịu nhẹ (Misty Nordic Mountains) */
export function mountainLandscapeTv() {
  return canvasTex('mountain-landscape-tv-neutral-v2', 640, 360, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.65)
    sky.addColorStop(0, '#b9c2ca')
    sky.addColorStop(0.5, '#d3d8dc')
    sky.addColorStop(1, '#e7e4de')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)

    // Ánh mặt trời dịu qua màn sương
    const sun = g.createRadialGradient(w * 0.52, h * 0.32, 10, w * 0.52, h * 0.32, 120)
    sun.addColorStop(0, 'rgba(248, 244, 232, 0.85)')
    sun.addColorStop(0.5, 'rgba(232, 224, 206, 0.38)')
    sun.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.fillStyle = sun
    g.fillRect(0, 0, w, h)

    // Dãy núi đá xám khói phía xa
    g.fillStyle = '#6c7278'
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

    // Dãy núi đá trung tâm màu taupe đá trầm
    g.fillStyle = '#7e7366'
    g.beginPath()
    g.moveTo(w * 0.22, h)
    g.lineTo(w * 0.48, h * 0.26)
    g.lineTo(w * 0.58, h * 0.42)
    g.lineTo(w * 0.72, h * 0.28)
    g.lineTo(w * 0.88, h)
    g.closePath()
    g.fill()

    // Thung lũng & rừng thông olive trầm phía dưới
    g.fillStyle = '#4c594b'
    g.beginPath()
    g.moveTo(0, h * 0.72)
    g.bezierCurveTo(w * 0.3, h * 0.62, w * 0.65, h * 0.78, w, h * 0.68)
    g.lineTo(w, h)
    g.lineTo(0, h)
    g.closePath()
    g.fill()

    // Thảm rêu sage nhạt tiền cảnh
    g.fillStyle = '#6c7969'
    g.beginPath()
    g.moveTo(0, h * 0.85)
    g.bezierCurveTo(w * 0.4, h * 0.76, w * 0.7, h * 0.88, w, h * 0.82)
    g.lineTo(w, h)
    g.lineTo(0, h)
    g.closePath()
    g.fill()
  })
}

/** Thảm dệt họa tiết hình học trung tính (Neutral Stone Kilim Rug) */
export function persianTerracottaRug() {
  return canvasTex('persian-neutral-rug-v2', 512, 340, (g, w, h) => {
    // Nền ngoài viền kem đá
    g.fillStyle = '#dfd9cf'
    g.fillRect(0, 0, w, h)

    // Khung viền ngoài charcoal trầm
    g.strokeStyle = '#4a453f'
    g.lineWidth = 10
    g.strokeRect(12, 12, w - 24, h - 24)

    // Khung viền họa tiết taupe trung tính
    g.fillStyle = '#8b8175'
    g.fillRect(24, 24, w - 48, h - 48)

    g.strokeStyle = '#ebe6de'
    g.lineWidth = 4
    g.strokeRect(36, 36, w - 72, h - 72)

    // Nền trung tâm xám đá ấm
    g.fillStyle = '#665f57'
    g.fillRect(46, 46, w - 92, h - 92)

    // Hoa văn chuỗi hạt quanh viền
    g.fillStyle = '#e7e1d7'
    for (let x = 30; x < w - 30; x += 22) {
      g.fillRect(x, 27, 8, 6)
      g.fillRect(x, h - 33, 8, 6)
    }
    for (let y = 30; y < h - 30; y += 22) {
      g.fillRect(27, y, 6, 8)
      g.fillRect(w - 33, y, 6, 8)
    }

    // Họa tiết góc màu kem đá
    const corners = [
      [46, 46, 1, 1],
      [w - 46, 46, -1, 1],
      [46, h - 46, 1, -1],
      [w - 46, h - 46, -1, -1],
    ]
    corners.forEach(([cx, cy, sx, sy]) => {
      g.fillStyle = '#cfc7bc'
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
    g.fillStyle = '#d4ccc0'
    g.beginPath()
    g.moveTo(mx, my - 78)
    g.lineTo(mx + 125, my)
    g.lineTo(mx, my + 78)
    g.lineTo(mx - 125, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#978d81'
    g.beginPath()
    g.moveTo(mx, my - 54)
    g.lineTo(mx + 86, my)
    g.lineTo(mx, my + 54)
    g.lineTo(mx - 86, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#3f3b36'
    g.beginPath()
    g.moveTo(mx, my - 28)
    g.lineTo(mx + 44, my)
    g.lineTo(mx, my + 28)
    g.lineTo(mx - 44, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#efeae2'
    g.beginPath()
    g.arc(mx, my, 10, 0, Math.PI * 2)
    g.fill()
  })
}

/** Tranh nghệ thuật trừu tượng Wabi-sabi đồng bộ tone trung tính treo đầu giường Tầng 2 */
export function colorfulBedArt() {
  return canvasTex('neutral-bed-art-v2', 512, 340, (g, w, h) => {
    // Bo viền trắng kem passepartout bên ngoài
    g.fillStyle = '#f5f2ec'
    g.fillRect(0, 0, w, h)

    const pad = 22
    const iw = w - pad * 2
    const ih = h - pad * 2
    g.save()
    g.beginPath()
    g.rect(pad, pad, iw, ih)
    g.clip()

    // Nền tranh gradient kem cát - đá sáng
    const bg = g.createLinearGradient(pad, pad, pad + iw, pad + ih)
    bg.addColorStop(0, '#ebe5dc')
    bg.addColorStop(0.5, '#ded6ca')
    bg.addColorStop(1, '#cfc8be')
    g.fillStyle = bg
    g.fillRect(pad, pad, iw, ih)

    // Các mảng khối hữu cơ trung tính (Warm Taupe, Greige, Olive trầm, Charcoal Stone)
    const blobs = [
      { x: 0.22, y: 0.35, rx: 75, ry: 55, c: '#a69a8c', rot: 0.3 },
      { x: 0.48, y: 0.28, rx: 85, ry: 60, c: '#cfc4b4', rot: -0.2 },
      { x: 0.76, y: 0.38, rx: 70, ry: 58, c: '#727c6e', rot: 0.4 },
      { x: 0.32, y: 0.68, rx: 80, ry: 52, c: '#787e84', rot: -0.3 },
      { x: 0.62, y: 0.65, rx: 90, ry: 56, c: '#8f8478', rot: 0.2 },
      { x: 0.82, y: 0.72, rx: 65, ry: 48, c: '#5c5751', rot: -0.4 },
      { x: 0.5, y: 0.5, rx: 60, ry: 45, c: '#dfd7c8', rot: 0.1 },
      { x: 0.18, y: 0.75, rx: 55, ry: 42, c: '#b8aa99', rot: 0.5 },
    ]
    blobs.forEach((b) => {
      g.fillStyle = b.c
      g.beginPath()
      g.ellipse(pad + iw * b.x, pad + ih * b.y, b.rx, b.ry, b.rot, 0, Math.PI * 2)
      g.fill()
    })

    // Điểm xuyết nét chấm nhẹ tone đá & kem tự nhiên
    const colors = ['#f5f2ec', '#d8cfc2', '#646d60', '#8d8275', '#4b4742', '#bfb5a7']
    for (let i = 0; i < 45; i++) {
      g.fillStyle = colors[i % colors.length]
      const bx = pad + ((i * 73) % iw)
      const by = pad + ((i * 53) % ih)
      g.beginPath()
      g.arc(bx, by, 5 + (i % 8), 0, Math.PI * 2)
      g.fill()
    }

    // Đường nét phác họa uyển chuyển tạo chiều sâu nghệ thuật
    g.strokeStyle = 'rgba(42, 38, 34, 0.42)'
    g.lineWidth = 2.8
    g.beginPath()
    g.moveTo(pad + 30, pad + ih * 0.6)
    g.bezierCurveTo(pad + iw * 0.35, pad + ih * 0.2, pad + iw * 0.65, pad + ih * 0.8, pad + iw - 30, pad + ih * 0.35)
    g.stroke()

    g.restore()

    // Viền mảnh ngăn cách passepartout
    g.strokeStyle = '#d4ccc1'
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
