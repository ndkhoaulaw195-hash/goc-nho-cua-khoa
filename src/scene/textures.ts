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
  return canvasTex('wood-oak-slate-v1', 1024, 1024, (g, w, h) => {
    const r = rng(23)
    const rows = 14
    const rh = h / rows
    const oakTones = ['#D8C7B2', '#D4C2AC', '#CFC0AB', '#DECEBA', '#C4AF97']
    for (let i = 0; i < rows; i++) {
      let x = -r() * 240
      while (x < w) {
        const len = 260 + r() * 260
        // Sàn gỗ sồi sáng #D8C7B2 phối vân/tấm đậm #C4AF97
        g.fillStyle = oakTones[Math.floor(r() * oakTones.length)]
        g.fillRect(x, i * rh, len, rh)

        // Thớ vân gỗ sồi mịn #C4AF97 & highlight #EFECE6
        for (let k = 0; k < 8; k++) {
          g.strokeStyle = k % 2 === 0 ? 'rgba(155, 134, 110, 0.22)' : 'rgba(239, 236, 230, 0.2)'
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
        if (r() < 0.22) {
          const kx = x + 35 + r() * (len - 70)
          const ky = i * rh + 12 + r() * (rh - 24)
          g.fillStyle = 'rgba(140, 120, 96, 0.16)'
          g.beginPath()
          g.ellipse(kx, ky, 7 + r() * 6, 3.5 + r() * 2.5, 0, 0, Math.PI * 2)
          g.fill()
        }

        // Khe ghép dọc giữa các tấm ván
        g.fillStyle = 'rgba(128, 112, 92, 0.28)'
        g.fillRect(x, i * rh, 1.6, rh)
        x += len
      }
      // Khe ghép ngang + highlight mép ván
      g.fillStyle = 'rgba(128, 112, 92, 0.32)'
      g.fillRect(0, i * rh, w, 1.6)
      g.fillStyle = 'rgba(239, 236, 230, 0.2)'
      g.fillRect(0, i * rh + 1.6, w, 1.0)
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
  return canvasTex('wood-slats-slate-v1', 512, 256, (g, w, h) => {
    const r = rng(41)
    const slats = 36
    const sw = w / slats
    for (let i = 0; i < slats; i++) {
      g.fillStyle = i % 2 === 0 ? '#5E7487' : r() > 0.4 ? '#556B7E' : '#4A5E6F'
      g.fillRect(i * sw, 0, sw, h)
      g.fillStyle = '#2B2D2F'
      g.fillRect(i * sw, 0, 2.2, h)
    }
  })
}

/** Gạch sàn phòng tắm chuẩn tone #E5E4E0 vân đá dịu */
export function marbleTiles() {
  return canvasTex('marble-tiles-slate-v1', 1024, 1024, (g, w, h) => {
    const r = rng(77)
    g.fillStyle = '#E5E4E0'
    g.fillRect(0, 0, w, h)

    for (let i = 0; i < 24; i++) {
      const grad = g.createRadialGradient(r() * w, r() * h, 10, r() * w, r() * h, 240 + r() * 200)
      grad.addColorStop(0, 'rgba(214, 209, 201, 0.42)')
      grad.addColorStop(0.5, 'rgba(239, 236, 230, 0.25)')
      grad.addColorStop(1, 'rgba(229, 228, 224, 0)')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
    }

    for (let i = 0; i < 16; i++) {
      g.strokeStyle = i % 3 === 0 ? 'rgba(182, 183, 181, 0.3)' : 'rgba(214, 209, 201, 0.28)'
      g.lineWidth = 1 + r() * 2.2
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
    g.strokeStyle = 'rgba(182, 183, 181, 0.55)'
    g.lineWidth = 2.2
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

/** Gạch thẻ ốp tường phòng tắm tone #EFECE6 / #E5E4E0 */
export function bathroomWallTiles() {
  return canvasTex('bath-wall-tiles-v2', 512, 512, (g, w, h) => {
    g.fillStyle = '#EFECE6'
    g.fillRect(0, 0, w, h)
    const colW = 24
    for (let x = 0; x < w; x += colW) {
      const grad = g.createLinearGradient(x, 0, x + colW, 0)
      grad.addColorStop(0, '#D6D1C9')
      grad.addColorStop(0.2, '#EFECE6')
      grad.addColorStop(0.8, '#E5E4E0')
      grad.addColorStop(1, '#D6D1C9')
      g.fillStyle = grad
      g.fillRect(x + 1, 0, colW - 2, h)
      g.fillStyle = 'rgba(142, 144, 143, 0.35)'
      g.fillRect(x, 0, 1.5, h)
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

/** Tranh hoa nghệ thuật warm camel & rust (#C4834E / #9E6338) hòa quyện nền kem #EFECE6 */
export function sunflowerArt() {
  return canvasTex('sunflower-camel-v4', 512, 600, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#EFECE6')
    bg.addColorStop(0.72, '#E5E4E0')
    bg.addColorStop(0.72, '#D6D1C9')
    bg.addColorStop(1, '#B7AFA5')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    // Bình gốm đất nung #9E6338 & #C4834E
    g.fillStyle = '#9E6338'
    g.beginPath()
    g.ellipse(w / 2, h * 0.72, 92, 115, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#C4834E'
    g.beginPath()
    g.ellipse(w / 2, h * 0.62, 66, 16, 0, 0, Math.PI * 2)
    g.fill()

    const drawFlower = (cx: number, cy: number, R: number) => {
      g.strokeStyle = '#566E4C'
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
        g.fillStyle = i % 2 ? '#C4834E' : '#D8C7B2'
        g.beginPath()
        g.ellipse(R * 0.85, 0, R * 0.55, R * 0.22, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      g.fillStyle = '#2B2D2F'
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

/** Màn hình máy tính đôi (Slate Blue + Ánh sáng ấm 3000K #FFD7A3 đồng bộ, không RGB) */
export function screen(variant: number, warmMode = false) {
  return canvasTex(`screen-slate-v4-${variant}-${warmMode ? 'warm' : 'code'}`, 512, 300, (g, w, h) => {
    const r = rng(variant * 31 + 3)
    const grd = g.createLinearGradient(0, 0, w, h)
    if (warmMode) {
      grd.addColorStop(0, '#2B2D2F')
      grd.addColorStop(0.55, '#4A5E6F')
      grd.addColorStop(1, '#FFD7A3')
    } else if (variant === 1) {
      grd.addColorStop(0, '#2B2D2F')
      grd.addColorStop(0.55, '#4A5E6F')
      grd.addColorStop(1, '#B7AFA5')
    } else {
      grd.addColorStop(0, '#2B2D2F')
      grd.addColorStop(0.6, '#5E7487')
      grd.addColorStop(1, '#EFECE6')
    }
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Dãy núi phong cảnh trên màn hình
    g.fillStyle = 'rgba(43, 45, 47, 0.78)'
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
    g.fillStyle = 'rgba(43, 45, 47, 0.92)'
    g.fillRect(36, 26, w - 72, h - 56)
    g.fillStyle = '#363A3E'
    g.fillRect(36, 26, w - 72, 16)
    for (let i = 0; i < 16; i++) {
      const y = 52 + i * 12
      let x = 54 + (i % 3) * 14
      const n = 1 + Math.floor(r() * 3)
      for (let k = 0; k < n; k++) {
        const len = 24 + r() * 75
        const cols = ['#EFECE6', '#FFD7A3', '#B6B7B5', '#D8C7B2', '#5E7487']
        g.fillStyle = cols[Math.floor(r() * cols.length)]
        g.fillRect(x, y, len, 5)
        x += len + 8
      }
    }
  })
}

/** Khung cảnh bầu trời trung tính ngoài cửa sổ lớn bên phải */
export function windowSky(night: boolean) {
  return canvasTex(night ? 'sky-night-slate-v4' : 'sky-day-studio-v4', 512, 640, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h)
    if (night) {
      grd.addColorStop(0, '#1B1E22')
      grd.addColorStop(0.6, '#262A2F')
      grd.addColorStop(1, '#333840')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
      const r = rng(99)
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(239,236,230,${0.3 + r() * 0.5})`
        const sz = 1 + r() * 2.2
        g.beginPath()
        g.arc(r() * w, r() * h * 0.8, sz, 0, Math.PI * 2)
        g.fill()
      }
    } else {
      grd.addColorStop(0, '#EFECE6')
      grd.addColorStop(0.55, '#E5E4E0')
      grd.addColorStop(1, '#D6D1C9')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
    }
  })
}

/** Bảng phi tiêu đồng bộ Slate Blue & Rust/Sage */
export function dartboard() {
  return canvasTex('dart-slate-v3', 256, 256, (g, w) => {
    const c = w / 2
    g.fillStyle = '#2B2D2F'
    g.beginPath()
    g.arc(c, c, c, 0, Math.PI * 2)
    g.fill()
    const rings = [118, 100, 92, 64, 56, 16, 8]
    for (let ri = 1; ri < rings.length - 1; ri++) {
      for (let s = 0; s < 20; s++) {
        const a0 = (s / 20) * Math.PI * 2
        const a1 = ((s + 1) / 20) * Math.PI * 2
        const isDouble = ri === 1 || ri === 3
        g.fillStyle = isDouble ? (s % 2 ? '#9E6338' : '#566E4C') : s % 2 ? '#EFECE6' : '#2B2D2F'
        g.beginPath()
        g.moveTo(c, c)
        g.arc(c, c, rings[ri], a0, a1)
        g.closePath()
        g.fill()
      }
    }
    g.fillStyle = '#566E4C'
    g.beginPath()
    g.arc(c, c, 16, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#9E6338'
    g.beginPath()
    g.arc(c, c, 8, 0, Math.PI * 2)
    g.fill()
  })
}

/** Sàn gỗ sồi sáng #D8C7B2 & #C4AF97 đồng bộ 2 tầng */
export function lightOakFloor() {
  return canvasTex('light-oak-slate-v3', 512, 512, (g, w, h) => {
    g.fillStyle = '#D8C7B2'
    g.fillRect(0, 0, w, h)
    const rows = 8
    const rowH = h / rows
    const tones = ['#D8C7B2', '#D3C0AA', '#DFCEBA', '#C4AF97', '#D6C4AE']
    for (let r = 0; r < rows; r++) {
      const y = r * rowH
      const offset = (r % 2) * 120
      for (let x = -offset; x < w; x += 240) {
        const tone = tones[(r * 3 + Math.floor((x + offset) / 240)) % tones.length]
        g.fillStyle = tone
        g.fillRect(x + 1, y + 1, 238, rowH - 2)
        // Vân gỗ sồi mảnh #C4AF97
        g.strokeStyle = 'rgba(155, 134, 110, 0.22)'
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
      g.fillStyle = 'rgba(128, 112, 92, 0.26)'
      g.fillRect(0, y, w, 1.5)
    }
  })
}

/** Thảm tròn dệt xám trung tính (#B6B7B5 phối #8E908F) */
export function fluffyCreamRug() {
  return canvasTex('fluffy-neutral-rug-v2', 512, 512, (g, w, h) => {
    g.fillStyle = '#B6B7B5'
    g.fillRect(0, 0, w, h)
    const r = rng(99)
    for (let i = 0; i < 1600; i++) {
      const x = r() * w
      const y = r() * h
      const rad = 3 + r() * 7
      g.fillStyle = i % 3 === 0 ? 'rgba(239,236,230,0.45)' : 'rgba(142,144,143,0.48)'
      g.beginPath()
      g.arc(x, y, rad, 0, Math.PI * 2)
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
  return canvasTex(`girl-pc-ui-slate-v3-${mode}`, 512, 300, (g, w, h) => {
    if (mode === 'rgb') {
      // Chế độ Vẽ 3D Studio (Warm 3000K + Slate Blue Studio Viewport)
      const bg = g.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#2B2D2F')
      bg.addColorStop(0.55, '#3A4652')
      bg.addColorStop(1, '#4A5E6F')
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)

      // Lưới phối cảnh 3D (Viewport Grid)
      g.strokeStyle = 'rgba(239, 236, 230, 0.14)'
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

      // Trục tọa độ trung tính
      g.strokeStyle = '#C4834E'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(90, h * 0.62)
      g.lineTo(w - 90, h * 0.62)
      g.stroke()

      g.strokeStyle = '#6F8763'
      g.beginPath()
      g.moveTo(w * 0.5, 42)
      g.lineTo(w * 0.5, h - 28)
      g.stroke()

      // Khối 3D ở trung tâm (Warm 3000K #FFD7A3 Glow)
      const glow = g.createRadialGradient(w * 0.5, h * 0.5, 8, w * 0.5, h * 0.5, 86)
      glow.addColorStop(0, 'rgba(255, 215, 163, 0.72)')
      glow.addColorStop(0.5, 'rgba(183, 175, 165, 0.35)')
      glow.addColorStop(1, 'rgba(43, 45, 47, 0)')
      g.fillStyle = glow
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 84, 0, Math.PI * 2)
      g.fill()

      const sph = g.createRadialGradient(w * 0.47, h * 0.44, 6, w * 0.5, h * 0.5, 48)
      sph.addColorStop(0, '#EFECE6')
      sph.addColorStop(0.6, '#B7AFA5')
      sph.addColorStop(1, '#4A5E6F')
      g.fillStyle = sph
      g.beginPath()
      g.arc(w * 0.5, h * 0.5, 46, 0, Math.PI * 2)
      g.fill()

      g.strokeStyle = '#FFD7A3'
      g.lineWidth = 3.2
      g.beginPath()
      g.ellipse(w * 0.5, h * 0.52, 74, 24, -0.28, 0, Math.PI * 2)
      g.stroke()

      // Thanh công cụ & Inspector
      g.fillStyle = 'rgba(43, 45, 47, 0.92)'
      g.fillRect(10, 32, 62, h - 44)
      g.fillRect(w - 96, 32, 86, h - 44)
      g.fillRect(0, 0, w, 26)

      const toolCols = ['#EFECE6', '#B7AFA5', '#5E7487', '#FFD7A3', '#C4834E']
      toolCols.forEach((tc, i) => {
        g.fillStyle = tc
        g.fillRect(24, 48 + i * 36, 34, 22)
      })

      g.fillStyle = '#FFD7A3'
      g.font = 'bold 12px sans-serif'
      g.fillText('STUDIO 3000K · 3D', 16, 17)
      g.fillStyle = '#EFECE6'
      g.fillRect(w - 84, 48, 62, 10)
      g.fillStyle = '#B7AFA5'
      g.fillRect(w - 84, 70, 48, 10)
      g.fillStyle = '#5E7487'
      g.fillRect(w - 84, 92, 56, 10)
      return
    }

    const grd = g.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, '#EFECE6')
    grd.addColorStop(0.55, '#D6D1C9')
    grd.addColorStop(1, '#B7AFA5')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)

    // Mặt trời ấm & dãy núi tối giản Slate Blue / Greige
    g.fillStyle = '#FFD7A3'
    g.beginPath()
    g.arc(w * 0.65, h * 0.42, 42, 0, Math.PI * 2)
    g.fill()

    g.fillStyle = '#5E7487'
    g.beginPath()
    g.moveTo(0, h)
    g.lineTo(w * 0.35, h * 0.52)
    g.lineTo(w * 0.72, h)
    g.closePath()
    g.fill()

    g.fillStyle = '#4A5E6F'
    g.beginPath()
    g.moveTo(w * 0.3, h)
    g.lineTo(w * 0.68, h * 0.48)
    g.lineTo(w, h)
    g.closePath()
    g.fill()

    // Cửa sổ ứng dụng nhỏ
    g.fillStyle = 'rgba(239, 236, 230, 0.92)'
    g.fillRect(36, 32, 180, 115)
    g.fillStyle = '#4A5E6F'
    g.fillRect(48, 48, 90, 8)
    g.fillStyle = '#B7AFA5'
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

/** Thảm trải sàn họa tiết trung tính (#8E908F phối #B6B7B5) */
export function persianTerracottaRug() {
  return canvasTex('persian-neutral-rug-v3', 512, 340, (g, w, h) => {
    // Nền ngoài viền xám nhạt #B6B7B5
    g.fillStyle = '#B6B7B5'
    g.fillRect(0, 0, w, h)

    // Khung viền ngoài Matte Charcoal nhẹ #4A5E6F
    g.strokeStyle = '#6B6E6E'
    g.lineWidth = 8
    g.strokeRect(12, 12, w - 24, h - 24)

    // Khung viền họa tiết trung tâm #8E908F
    g.fillStyle = '#8E908F'
    g.fillRect(24, 24, w - 48, h - 48)

    g.strokeStyle = '#D6D1C9'
    g.lineWidth = 3
    g.strokeRect(36, 36, w - 72, h - 72)

    // Nền trung tâm xám dệt phối #989A99
    g.fillStyle = '#8E908F'
    g.fillRect(46, 46, w - 92, h - 92)

    // Hoa văn hình học mảnh #B6B7B5 quanh viền
    g.fillStyle = '#B6B7B5'
    for (let x = 30; x < w - 30; x += 22) {
      g.fillRect(x, 27, 8, 6)
      g.fillRect(x, h - 33, 8, 6)
    }
    for (let y = 30; y < h - 30; y += 22) {
      g.fillRect(27, y, 6, 8)
      g.fillRect(w - 33, y, 6, 8)
    }

    // Họa tiết góc #B6B7B5
    const corners = [
      [46, 46, 1, 1],
      [w - 46, 46, -1, 1],
      [46, h - 46, 1, -1],
      [w - 46, h - 46, -1, -1],
    ]
    corners.forEach(([cx, cy, sx, sy]) => {
      g.fillStyle = '#B6B7B5'
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx + sx * 68, cy)
      g.lineTo(cx, cy + sy * 54)
      g.closePath()
      g.fill()
    })

    // Medallion hình học tối giản trung tâm
    const mx = w / 2
    const my = h / 2
    g.fillStyle = '#B6B7B5'
    g.beginPath()
    g.moveTo(mx, my - 76)
    g.lineTo(mx + 122, my)
    g.lineTo(mx, my + 76)
    g.lineTo(mx - 122, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#8E908F'
    g.beginPath()
    g.moveTo(mx, my - 52)
    g.lineTo(mx + 84, my)
    g.lineTo(mx, my + 52)
    g.lineTo(mx - 84, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#737675'
    g.beginPath()
    g.moveTo(mx, my - 26)
    g.lineTo(mx + 42, my)
    g.lineTo(mx, my + 26)
    g.lineTo(mx - 42, my)
    g.closePath()
    g.fill()

    g.fillStyle = '#EFECE6'
    g.beginPath()
    g.arc(mx, my, 8, 0, Math.PI * 2)
    g.fill()
  })
}

/** Tranh nghệ thuật trừu tượng đồng bộ điểm nhấn ấm (#C4834E & #9E6338) treo đầu giường Tầng 2 */
export function colorfulBedArt() {
  return canvasTex('camel-bed-art-v3', 512, 340, (g, w, h) => {
    // Bo viền trắng kem ấm #EFECE6 bên ngoài
    g.fillStyle = '#EFECE6'
    g.fillRect(0, 0, w, h)

    const pad = 22
    const iw = w - pad * 2
    const ih = h - pad * 2
    g.save()
    g.beginPath()
    g.rect(pad, pad, iw, ih)
    g.clip()

    // Nền tranh gradient #EFECE6 -> #D6D1C9
    const bg = g.createLinearGradient(pad, pad, pad + iw, pad + ih)
    bg.addColorStop(0, '#EFECE6')
    bg.addColorStop(0.55, '#E5E4E0')
    bg.addColorStop(1, '#D6D1C9')
    g.fillStyle = bg
    g.fillRect(pad, pad, iw, ih)

    // Mảng khối hình học hữu cơ camel (#C4834E), nâu gỉ ấm (#9E6338), taupe (#B7AFA5) & slate (#5E7487)
    const blobs = [
      { x: 0.24, y: 0.36, rx: 78, ry: 58, c: '#C4834E', rot: 0.2 },
      { x: 0.5, y: 0.3, rx: 86, ry: 62, c: '#D8C7B2', rot: -0.15 },
      { x: 0.76, y: 0.4, rx: 72, ry: 60, c: '#9E6338', rot: 0.35 },
      { x: 0.32, y: 0.68, rx: 82, ry: 54, c: '#B7AFA5', rot: -0.25 },
      { x: 0.64, y: 0.68, rx: 88, ry: 54, c: '#C4834E', rot: 0.15 },
      { x: 0.82, y: 0.74, rx: 60, ry: 46, c: '#5E7487', rot: -0.3 },
      { x: 0.48, y: 0.52, rx: 58, ry: 44, c: '#EFECE6', rot: 0.1 },
    ]
    blobs.forEach((b) => {
      g.fillStyle = b.c
      g.beginPath()
      g.ellipse(pad + iw * b.x, pad + ih * b.y, b.rx, b.ry, b.rot, 0, Math.PI * 2)
      g.fill()
    })

    // Đường nét phác họa trừu tượng hiện đại
    g.strokeStyle = 'rgba(43, 45, 47, 0.38)'
    g.lineWidth = 2.6
    g.beginPath()
    g.moveTo(pad + 30, pad + ih * 0.62)
    g.bezierCurveTo(pad + iw * 0.35, pad + ih * 0.22, pad + iw * 0.65, pad + ih * 0.78, pad + iw - 30, pad + ih * 0.34)
    g.stroke()

    g.restore()

    // Viền mảnh ngăn cách passepartout
    g.strokeStyle = '#D6D1C9'
    g.lineWidth = 2
    g.strokeRect(pad, pad, iw, ih)
  })
}

/** Bóng đổ mềm (Ambient Contact Shadow) dưới đế mô hình ngôi nhà tạo chiều sâu Studio 3D */
export function houseDropShadow() {
  return canvasTex('house-drop-shadow-v2', 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.save()
    g.filter = 'blur(26px)'
    g.fillStyle = 'rgba(24, 25, 27, 0.78)'
    const mx = 66
    const my = 66
    g.beginPath()
    g.roundRect(mx, my, w - mx * 2, h - my * 2, 34)
    g.fill()
    g.restore()
  })
}

/** Texture Ambient Occlusion dải thẳng dùng cho chân tường & chân cầu thang */
export function aoLinearFalloff() {
  return canvasTex('ao-linear-falloff-v1', 64, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    const grd = g.createLinearGradient(0, 0, 0, h)
    grd.addColorStop(0, 'rgba(22, 24, 26, 0.56)')
    grd.addColorStop(0.28, 'rgba(22, 24, 26, 0.26)')
    grd.addColorStop(0.65, 'rgba(22, 24, 26, 0.08)')
    grd.addColorStop(1, 'rgba(22, 24, 26, 0)')
    g.fillStyle = grd
    g.fillRect(0, 0, w, h)
  })
}

/** Texture Ambient Occlusion mềm hình chữ nhật/oval dùng dưới gầm giường, gầm sofa, kệ tủ */
export function aoContactShadow() {
  return canvasTex('ao-contact-shadow-v1', 256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.save()
    g.filter = 'blur(18px)'
    g.fillStyle = 'rgba(20, 22, 24, 0.62)'
    const pad = 42
    g.beginPath()
    g.roundRect(pad, pad, w - pad * 2, h - pad * 2, 28)
    g.fill()
    g.restore()
  })
}
