import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ArchitecturalTree, HedgeRow, NaturalPlantCluster } from './Botanicals'
import { B, BB, Cyl, G, Interact, RBB } from './prims'
import { isValidClick } from './raycastRegistry'
import { outdoorWoodDeck, travertineStone, whitePebbles } from './textures'
import type { V3 } from '../data/config'
import { useStore } from '../store'

const UNIT_BOX_GEOM = new THREE.BoxGeometry(1, 1, 1)
const FLAME_CONE_GEOM = new THREE.ConeGeometry(0.065, 0.24, 6)
const RIPPLE_BOX_GEOM = new THREE.BoxGeometry(0.14, 0.74, 0.012)
const KOI_BODY_GEOM = new THREE.SphereGeometry(0.075, 8, 6)
const KOI_TAIL_GEOM = new THREE.ConeGeometry(0.04, 0.13, 5)
KOI_TAIL_GEOM.rotateX(Math.PI / 2)

const _instObj = new THREE.Object3D()
const _koiTailObj = new THREE.Object3D()
const _koiColor = new THREE.Color()

// Pool vật liệu dùng chung cấp module (0 MeshPhysicalMaterial, tối ưu draw calls)
const SHARED_WATER_MAT = new THREE.MeshStandardMaterial({
  color: '#38B2AC',
  transparent: true,
  opacity: 0.55,
  roughness: 0.1,
  metalness: 0.8,
  depthWrite: false,
})

const TROUGH_WATER_MAT = new THREE.MeshStandardMaterial({
  color: '#38B2AC',
  emissive: '#38B2AC',
  emissiveIntensity: 0.35,
  roughness: 0.1,
  metalness: 0.8,
  transparent: true,
  opacity: 0.65,
})

const fenceSlatMatCache: { light?: THREE.MeshStandardMaterial; dark?: THREE.MeshStandardMaterial } = {}
function getFenceSlatMat(darkMode: boolean): THREE.MeshStandardMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!fenceSlatMatCache[key]) {
    fenceSlatMatCache[key] = new THREE.MeshStandardMaterial({
      color: darkMode ? '#B87435' : '#C68642',
      roughness: 0.56,
    })
  }
  return fenceSlatMatCache[key]!
}

const FENCE_POST_MAT = new THREE.MeshStandardMaterial({
  color: '#1E2229',
  roughness: 0.35,
  metalness: 0.55,
})

const KOI_MAT = new THREE.MeshStandardMaterial({
  color: '#FFFFFF',
  roughness: 0.28,
  metalness: 0.12,
})

const BOLLARD_METAL_MAT = new THREE.MeshStandardMaterial({
  color: '#1E2229',
  metalness: 0.55,
  roughness: 0.36,
})

const bollardLedMatCache: Record<string, THREE.MeshStandardMaterial> = {}
function getBollardLedMat(darkMode: boolean, lightsOn: boolean): THREE.MeshStandardMaterial {
  const key = `${darkMode ? 'dark' : 'light'}_${lightsOn ? 'on' : 'off'}`
  if (!bollardLedMatCache[key]) {
    bollardLedMatCache[key] = new THREE.MeshStandardMaterial({
      color: lightsOn ? '#FFAE52' : '#333842',
      emissive: lightsOn ? '#FFAE52' : '#000000',
      emissiveIntensity: lightsOn ? (darkMode ? 2.6 : 1.7) : 0,
      roughness: 0.35,
    })
  }
  return bollardLedMatCache[key]!
}

const flameMatCache: { light?: THREE.MeshStandardMaterial; dark?: THREE.MeshStandardMaterial } = {}
function getFlameMat(darkMode: boolean): THREE.MeshStandardMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!flameMatCache[key]) {
    flameMatCache[key] = new THREE.MeshStandardMaterial({
      color: '#FFB347',
      emissive: '#FF7A2F',
      emissiveIntensity: darkMode ? 3.2 : 1.1,
      roughness: 0.3,
    })
  }
  return flameMatCache[key]!
}

const rippleMatCache: { light?: THREE.MeshStandardMaterial; dark?: THREE.MeshStandardMaterial } = {}
function getRippleMat(darkMode: boolean): THREE.MeshStandardMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!rippleMatCache[key]) {
    rippleMatCache[key] = new THREE.MeshStandardMaterial({
      color: '#7FE8E0',
      emissive: '#5EEAD4',
      emissiveIntensity: darkMode ? 1.15 : 0.7,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  }
  return rippleMatCache[key]!
}

/** Tạo texture gạch mosaic xanh ngọc tự nhiên (dùng cho đáy & thành hồ bơi / hồ cảnh) */
function createEmeraldMosaicTexture(darkMode: boolean): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = darkMode ? '#0C3B38' : '#11534E'
  ctx.fillRect(0, 0, size, size)

  const palette = darkMode
    ? ['#11544F', '#156A63', '#197D74', '#0F4945', '#1E8D82']
    : ['#18756E', '#1D8B82', '#26A69A', '#15645E', '#30B8AC']

  const cells = 16
  const step = size / cells
  const gap = 1.5
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const hash = ((row * 31 + col * 17 + row * col * 7) % 97) / 97
      const color = palette[Math.floor(hash * palette.length) % palette.length]
      ctx.fillStyle = color
      ctx.fillRect(col * step + gap * 0.5, row * step + gap * 0.5, step - gap, step - gap)
      ctx.fillStyle = darkMode ? 'rgba(94, 234, 212, 0.08)' : 'rgba(167, 243, 208, 0.14)'
      ctx.fillRect(col * step + gap * 0.5, row * step + gap * 0.5, step - gap, 2.2)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

let travTexCache: THREE.CanvasTexture | null = null
function getLandscapeTravMap(): THREE.CanvasTexture {
  if (!travTexCache) {
    const t = travertineStone().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.5, 1.2)
    t.needsUpdate = true
    travTexCache = t
  }
  return travTexCache
}

let pebbleTexCache: THREE.CanvasTexture | null = null
function getLandscapePebbleMap(): THREE.CanvasTexture {
  if (!pebbleTexCache) {
    const t = whitePebbles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.8, 5.2)
    t.needsUpdate = true
    pebbleTexCache = t
  }
  return pebbleTexCache
}

let pebbleWideTexCache: THREE.CanvasTexture | null = null
function getLandscapePebbleWideMap(): THREE.CanvasTexture {
  if (!pebbleWideTexCache) {
    const t = whitePebbles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 3.2)
    t.needsUpdate = true
    pebbleWideTexCache = t
  }
  return pebbleWideTexCache
}

let deckTexCache: THREE.CanvasTexture | null = null
function getLandscapeDeckMap(): THREE.CanvasTexture {
  if (!deckTexCache) {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 4.0)
    t.needsUpdate = true
    deckTexCache = t
  }
  return deckTexCache
}

let sideWalkDeckTexCache: THREE.CanvasTexture | null = null
function getLandscapeSideWalkDeckMap(): THREE.CanvasTexture {
  if (!sideWalkDeckTexCache) {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.6, 5.5)
    t.needsUpdate = true
    sideWalkDeckTexCache = t
  }
  return sideWalkDeckTexCache
}

const mosaicCache: Record<string, THREE.CanvasTexture> = {}
function getMosaicMap(kind: 'poolFloor' | 'poolWall' | 'pond', darkMode: boolean): THREE.CanvasTexture {
  const key = `${kind}_${darkMode ? 'dark' : 'light'}`
  if (!mosaicCache[key]) {
    const t = createEmeraldMosaicTexture(darkMode)
    if (kind === 'poolFloor') t.repeat.set(6, 4.5)
    else if (kind === 'poolWall') t.repeat.set(8, 1)
    else t.repeat.set(2.5, 7.5)
    mosaicCache[key] = t
  }
  return mosaicCache[key]
}

const BOLLARD_POSITIONS: V3[] = [
  [-3.32, -0.18, 9.2],
  [0.52, -0.18, 9.2],
  [-3.32, -0.18, 12.1],
  [0.52, -0.18, 12.1],
  [-3.32, -0.18, 14.9],
  [0.52, -0.18, 14.9],
  [-6.2, -0.16, 13.8],
  [-16.1, -0.16, 13.8],
  [1.8, -0.15, 13.6],
]

/**
 * Quy hoạch Cảnh quan Biệt thự Nghỉ dưỡng (Resort Courtyard & Pool Landscaping)
 * Gồm: Đế nền đá mở rộng, Tường rào lam gỗ bao quanh, Lối vào đá bước nổi trên hồ nước + LED hắt gầm,
 * Hồ bơi vô cực mini + Sundeck ghế tắm nắng, Khu Lounge Firepit ngoài trời + Sỏi trắng, Cây xanh đa tầng.
 */
export function LuxuryLandscaping({
  darkMode,
  onYardClick,
}: {
  darkMode: boolean
  onYardClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const yardLightsOn = useStore((s) => s.electronicStates?.yard_lights ?? true)
  const lawnColor = darkMode ? '#2C3D28' : '#4C6442'
  const lawnAccent = darkMode ? '#34482F' : '#5B7450'
  const patioDark = darkMode ? '#252930' : '#3A3F47'
  const stoneBorder = darkMode ? '#4B5058' : '#8D8982'
  const plinthColor = '#1E2229'
  const earthDeep = darkMode ? '#1A1816' : '#322C26'
  const soilColor = darkMode ? '#25201C' : '#42382F'

  const travertineMap = getLandscapeTravMap()
  const pebbleMap = getLandscapePebbleMap()
  const pebbleWideMap = getLandscapePebbleWideMap()
  const deckMap = getLandscapeDeckMap()
  const sideWalkDeckMap = getLandscapeSideWalkDeckMap()

  const mosaicPoolFloorMap = useMemo(() => getMosaicMap('poolFloor', darkMode), [darkMode])
  const mosaicPoolWallMap = useMemo(() => getMosaicMap('poolWall', darkMode), [darkMode])
  const mosaicPondMap = useMemo(() => getMosaicMap('pond', darkMode), [darkMode])

  const handleToggleYardLights = (e?: ThreeEvent<MouseEvent>) => {
    if (e && !isValidClick(e.clientX, e.clientY)) return
    const st = useStore.getState()
    const cur = st.electronicStates?.yard_lights ?? true
    const next = !cur
    st.toggleElectronicState?.('yard_lights', next)
    st.notify(
      next ? '💡 Bật đèn trụ sân vườn & LED hồ bơi' : '💡 Tắt đèn trụ sân vườn & LED hồ bơi',
    )
  }

  const yardClickHandler = onYardClick
    ? (e: ThreeEvent<MouseEvent>) => {
        if (!isValidClick(e.clientX, e.clientY)) return
        e.stopPropagation()
        onYardClick(e)
      }
    : undefined

  return (
    <group>
      {/* =====================================================================
       * 1. NỀN ĐẤT MỞ RỘNG & ĐẾ VIỀN ĐÁ TỐI MÀU (x: -22.4..+17.2, z: -10.2..+16.2)
       * ===================================================================== */}
      <B p={[-2.6, -1.42, 3.0]} s={[40.4, 0.22, 27.2]} c={plinthColor} rough={0.85} shadow={false} />
      <B p={[-2.6, -0.84, 3.0]} s={[39.56, 0.94, 26.04]} c={earthDeep} rough={0.94} shadow={false} />
      <B p={[-2.6, -0.33, 3.0]} s={[39.48, 0.08, 25.98]} c={soilColor} rough={0.92} shadow={false} />

      {/* Viền ốp đá tối màu bao quanh 4 cạnh bệ khuôn viên biệt thự (không chồng lấn 4 góc) */}
      <B p={[-2.6, -0.25, -10.12]} s={[40.0, 0.22, 0.24]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[-2.6, -0.25, 16.12]} s={[40.0, 0.22, 0.24]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[-22.48, -0.25, 3.0]} s={[0.24, 0.22, 26.0]} c={plinthColor} rough={0.78} shadow={false} />
      <B p={[17.28, -0.25, 3.0]} s={[0.24, 0.22, 26.0]} c={plinthColor} rough={0.78} shadow={false} />

      {/* Chân tường móng đá bao quanh chu vi sàn Tầng 1 (mặt trên -0.004 tránh z-fighting với y=0) */}
      <B p={[-2.8, -0.152, -6.14]} s={[26.16, 0.296, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-2.8, -0.152, 6.14]} s={[26.16, 0.296, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-15.74, -0.152, 0]} s={[0.28, 0.296, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[10.14, -0.152, 0]} s={[0.28, 0.296, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />

      {/* =====================================================================
       * 2. THẢM CỎ CẢNH QUAN PHÂN VÙNG RÕ RÀNG (tách ranh giới, không coplanar)
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        <B p={[-2.6, -0.245, -8.14]} s={[39.5, 0.09, 3.72]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[-19.12, -0.245, 0.415]} s={[6.47, 0.09, 13.37]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[-19.82, -0.247, 11.55]} s={[5.05, 0.09, 8.9]} c={lawnAccent} rough={0.88} shadow={false} />
        <B p={[-4.52, -0.245, 11.55]} s={[1.55, 0.09, 8.9]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[-11.295, -0.245, 15.41]} s={[11.99, 0.09, 1.18]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[15.27, -0.245, 0.465]} s={[3.75, 0.09, 13.47]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[16.0, -0.247, 10.65]} s={[2.3, 0.09, 6.9]} c={lawnAccent} rough={0.88} shadow={false} />
        <B p={[9.05, -0.245, 15.05]} s={[16.2, 0.09, 1.9]} c={lawnColor} rough={0.88} shadow={false} />
        <B p={[-10.5, -0.247, 6.72]} s={[10.8, 0.09, 0.88]} c={lawnAccent} rough={0.88} shadow={false} />
        <B p={[-1.4, -0.245, 15.785]} s={[4.7, 0.09, 0.43]} c={lawnColor} rough={0.88} shadow={false} />
      </group>

      {/* =====================================================================
       * 3. LỐI VÀO CHÍNH — ĐÁ BƯỚC DẠO NỔI TRÊN MẶT NƯỚC & SỎI TRẮNG
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        <B p={[-3.34, -0.24, 10.885]} s={[0.82, 0.08, 9.17]} map={pebbleMap} c={darkMode ? '#9C9890' : '#FFFFFF'} rough={0.92} shadow={false} />
        <B p={[0.54, -0.24, 10.885]} s={[0.82, 0.08, 9.17]} map={pebbleMap} c={darkMode ? '#9C9890' : '#FFFFFF'} rough={0.92} shadow={false} />
      </group>
      <B p={[-2.92, -0.215, 10.885]} s={[0.08, 0.11, 9.17]} c="#1E2229" rough={0.65} shadow={false} />
      <B p={[0.12, -0.215, 10.885]} s={[0.08, 0.11, 9.17]} c="#1E2229" rough={0.65} shadow={false} />
      <B p={[-1.4, -0.215, 15.52]} s={[3.12, 0.11, 0.1]} c="#1E2229" rough={0.65} shadow={false} />

      {/* Đáy hồ ốp gạch mosaic xanh ngọc tự nhiên & Mặt nước ngọc bích */}
      <B p={[-1.4, -0.31, 10.9]} s={[2.98, 0.04, 9.2]} map={mosaicPondMap} c={darkMode ? '#A2E8E0' : '#FFFFFF'} rough={0.28} shadow={false} />
      {/* 4 cạnh dải LED ngọc bích viền hồ cá Koi đồng bộ theo công tắc đèn sân vườn */}
      {[
        { p: [-2.85, -0.205, 10.9] as V3, s: [0.045, 0.045, 9.035] as V3 },
        { p: [0.05, -0.205, 10.9] as V3, s: [0.045, 0.045, 9.035] as V3 },
        { p: [-1.4, -0.205, 15.44] as V3, s: [2.92, 0.045, 0.045] as V3 },
        { p: [-1.4, -0.205, 6.36] as V3, s: [2.92, 0.045, 0.045] as V3 },
      ].map((edge, idx) => (
        <B
          key={`pond-led-${idx}`}
          p={edge.p}
          s={edge.s}
          c={yardLightsOn ? '#5EEAD4' : '#1E2A30'}
          emissive={yardLightsOn ? '#38B2AC' : '#000000'}
          ei={yardLightsOn ? (darkMode ? 1.4 : 0.65) : 0}
          shadow={false}
        />
      ))}
      <mesh position={[-1.4, -0.195, 10.9]} rotation={[-Math.PI / 2, 0, 0]} material={SHARED_WATER_MAT}>
        <planeGeometry args={[2.96, 9.16]} />
      </mesh>
      <KoiPondFish darkMode={darkMode} />

      {/* Bệ sảnh chính rộng nổi trên mặt nước (Porch Landing y = -0.01) */}
      <FloatingTravertineStep
        pos={[-1.4, -0.055, 7.06]}
        size={[3.4, 0.09, 1.56]}
        tex={travertineMap}
        darkMode={darkMode}
        lightsOn={yardLightsOn}
        onClick={yardClickHandler}
      />
      {/* 5 phiến đá bước dạo Travertine khổ rộng xếp giật cấp nổi trên mặt nước */}
      {[
        { z: 8.5, y: -0.09, w: 2.55, d: 1.05 },
        { z: 9.85, y: -0.12, w: 2.55, d: 1.05 },
        { z: 11.2, y: -0.145, w: 2.55, d: 1.05 },
        { z: 12.55, y: -0.165, w: 2.55, d: 1.05 },
        { z: 14.05, y: -0.178, w: 2.8, d: 1.32 },
      ].map((step, i) => (
        <FloatingTravertineStep
          key={i}
          pos={[-1.4, step.y, step.z]}
          size={[step.w, 0.075, step.d]}
          tex={travertineMap}
          darkMode={darkMode}
          lightsOn={yardLightsOn}
          onClick={yardClickHandler}
        />
      ))}

      {/* Cụm cây cảnh tự nhiên bất đối xứng xen đá tảng nhỏ dọc hai bên lối nước */}
      {[
        { pos: [-3.38, -0.2, 7.8] as V3, scale: 0.72, rot: 0.3, v: 0 },
        { pos: [-3.42, -0.2, 10.6] as V3, scale: 0.66, rot: 1.6, v: 1 },
        { pos: [-3.34, -0.2, 13.45] as V3, scale: 0.75, rot: 2.4, v: 2 },
        { pos: [0.58, -0.2, 7.95] as V3, scale: 0.7, rot: 1.1, v: 3 },
        { pos: [0.62, -0.2, 10.75] as V3, scale: 0.68, rot: 2.8, v: 4 },
        { pos: [0.56, -0.2, 13.5] as V3, scale: 0.74, rot: 0.6, v: 5 },
      ].map((item, idx) => (
        <NaturalPlantCluster
          key={`pond-plant-${idx}`}
          pos={item.pos}
          scale={item.scale}
          rotationY={item.rot}
          variant={item.v}
          darkMode={darkMode}
        />
      ))}

      {/* =====================================================================
       * 4. SÂN BÊN PHẢI — HỒ BƠI VÔ CỰC MINI & SUNDECK GỖ NGOÀI TRỜI
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        <B p={[11.82, -0.21, 0.45]} s={[3.08, 0.07, 13.5]} map={sideWalkDeckMap} c={darkMode ? '#A28E7A' : '#FFFFFF'} rough={0.72} shadow={false} />
        <B p={[3.35, -0.19, 10.22]} s={[4.5, 0.08, 7.8]} map={deckMap} c={darkMode ? '#A28E7A' : '#FFFFFF'} rough={0.68} shadow={false} />
        <B p={[3.35, -0.215, 14.16]} s={[4.5, 0.05, 0.1]} c="#2B2D2F" rough={0.6} shadow={false} />
      </group>

      {/* 2 Ghế tắm nắng cao cấp + Bàn trà nhỏ trên Sundeck */}
      {[9.0, 11.45].map((lz, idx) => (
        <SunLounger key={idx} index={idx} pos={[3.15, -0.15, lz]} darkMode={darkMode} />
      ))}
      <SundeckTeaTable darkMode={darkMode} />

      {/* Thác nước tràn nghệ thuật tại mép Bắc hồ bơi (tách Interact độc lập ngoài hồ bơi) */}
      <WaterFeatureWall pos={[8.8, -0.2, 6.94]} darkMode={darkMode} />

      {/* Hồ bơi vô cực mini (Mini Infinity Pool: zone="exterior") */}
      <Interact
        id="infinity_pool"
        zone="exterior"
        category="CONTAINER_INFO"
        label="Hồ bơi vô cực"
        hint="🏊 Thư giãn & ngắm hồ bơi vô cực"
        infoTitle="Hồ Bơi Vô Cực Muối Khoáng"
        infoBody="Làn nước muối khoáng ấm áp với thác tràn nghệ thuật và dải LED hắt sáng ban đêm giữa khuôn viên resort."
        icon="🏊"
        customStandOffset={[5.18, -0.15, 10.6]}
        onClick={(e) => {
          if (e && !isValidClick(e.clientX, e.clientY)) return
          useStore.getState().notify('🏊 Thư giãn bên làn nước xanh hồ bơi vô cực')
        }}
      >
        <group>
          <B p={[10.3, -0.78, 10.52]} s={[8.9, 0.06, 6.65]} map={mosaicPoolFloorMap} c={darkMode ? '#A2E8E0' : '#FFFFFF'} rough={0.28} shadow={false} />
          <B p={[10.3, -0.42, 7.22]} s={[9.1, 0.72, 0.24]} map={mosaicPoolWallMap} c={darkMode ? '#9EDFD8' : '#FFFFFF'} rough={0.28} shadow={false} />
          <B p={[5.82, -0.42, 10.63]} s={[0.24, 0.72, 6.58]} map={mosaicPoolWallMap} c={darkMode ? '#9EDFD8' : '#FFFFFF'} rough={0.28} shadow={false} />
          <B p={[10.32, -0.46, 13.72]} s={[9.0, 0.64, 0.16]} c="#1E2229" rough={0.28} shadow={false} />
          <B p={[14.72, -0.46, 10.49]} s={[0.16, 0.64, 6.3]} c="#1E2229" rough={0.28} shadow={false} />
          <B p={[10.405, -0.32, 13.92]} s={[9.31, 0.26, 0.28]} c="#181B20" rough={0.4} shadow={false} />
          <B p={[14.92, -0.32, 10.44]} s={[0.28, 0.26, 6.68]} c="#181B20" rough={0.4} shadow={false} />

          {/* Viền đá Travertine sáng màu ở thành Bắc & Tây nối liền Sundeck (tách góc sạch) */}
          <B p={[10.26, -0.145, 7.15]} s={[9.42, 0.07, 0.42]} map={travertineMap} c={darkMode ? '#D8D2C7' : '#F5F2EB'} rough={0.42} shadow={false} />
          <B p={[5.76, -0.145, 10.66]} s={[0.42, 0.07, 6.6]} map={travertineMap} c={darkMode ? '#D8D2C7' : '#F5F2EB'} rough={0.42} shadow={false} />

          {/* Dải viền gạch mosaic phát sáng nhẹ quanh mép nước hồ bơi */}
          <B p={[10.3, -0.185, 7.355]} s={[8.72, 0.045, 0.04]} c="#5EEAD4" emissive="#38B2AC" ei={darkMode ? 1.4 : 0.65} shadow={false} />
          <B p={[5.955, -0.185, 10.49]} s={[0.04, 0.045, 6.23]} c="#5EEAD4" emissive="#38B2AC" ei={darkMode ? 1.4 : 0.65} shadow={false} />
          <B p={[10.3, -0.185, 13.625]} s={[8.72, 0.045, 0.04]} c="#5EEAD4" emissive="#38B2AC" ei={darkMode ? 1.4 : 0.65} shadow={false} />
          <B p={[14.625, -0.185, 10.49]} s={[0.04, 0.045, 6.23]} c="#5EEAD4" emissive="#38B2AC" ei={darkMode ? 1.4 : 0.65} shadow={false} />

          {/* Mặt nước hồ bơi ngọc bích (#38B2AC) dùng MeshStandardMaterial */}
          <mesh position={[10.3, -0.175, 10.52]} rotation={[-Math.PI / 2, 0, 0]} material={SHARED_WATER_MAT}>
            <planeGeometry args={[8.75, 6.42]} />
          </mesh>

          {/* Bậc thang inox lên xuống hồ bơi sát Sundeck */}
          <G p={[6.05, -0.14, 8.2]}>
            <Cyl p={[0, 0.16, -0.24]} rt={0.022} h={0.52} c="#D6D1C9" metal={0.85} rough={0.2} shadow={false} />
            <Cyl p={[0, 0.16, 0.24]} rt={0.022} h={0.52} c="#D6D1C9" metal={0.85} rough={0.2} shadow={false} />
            <B p={[0.04, -0.18, 0]} s={[0.08, 0.025, 0.48]} c="#D6D1C9" metal={0.8} rough={0.22} shadow={false} />
            <B p={[0.04, -0.38, 0]} s={[0.08, 0.025, 0.48]} c="#D6D1C9" metal={0.8} rough={0.22} shadow={false} />
          </G>

          {/* Đèn LED âm dưới lòng hồ bơi (emissive phát sáng không tốn pointLight) */}
          {[7.6, 10.3, 13.0].map((px, idx) => (
            <B
              key={`pool-led-${idx}`}
              p={[px, -0.45, 7.36]}
              s={[0.52, 0.12, 0.04]}
              c={yardLightsOn ? (darkMode ? '#9AEBFF' : '#DDF6FA') : '#1E2A30'}
              emissive={yardLightsOn ? '#5EEAD4' : '#000000'}
              ei={yardLightsOn ? (darkMode ? 2.6 : 0.75) : 0}
              shadow={false}
            />
          ))}
        </group>
      </Interact>

      {/* =====================================================================
       * 5. SÂN BÊN TRÁI — GÓC THƯ GIÃN FIREPIT NGOÀI TRỜI & SỎI TRẮNG
       * ===================================================================== */}
      <group onClick={yardClickHandler}>
        <B p={[-11.3, -0.23, 10.97]} s={[12.0, 0.06, 7.62]} map={pebbleWideMap} c={darkMode ? '#98948C' : '#FFFFFF'} rough={0.92} shadow={false} />
        <B p={[-11.3, -0.195, 11.0]} s={[10.5, 0.06, 6.2]} c={patioDark} rough={0.76} shadow={false} />
        <B p={[-5.15, -0.18, 11.2]} s={[1.15, 0.05, 1.3]} map={travertineMap} c={darkMode ? '#8D877E' : '#F4F1EA'} rough={0.62} shadow={false} />
      </group>

      {/* Bồn cây đá Travertine viền đen mờ dọc chân tường mặt tiền cánh trái (cách chân tường 6.28) */}
      <G p={[-10.4, -0.195, 6.76]}>
        <BB p={[0, 0.025, 0]} s={[10.72, 0.05, 0.88]} c="#1E2229" rough={0.55} shadow={false} />
        <BB p={[0, 0.205, 0]} s={[10.6, 0.31, 0.84]} c={darkMode ? '#EBE6DC' : '#F5F2EB'} rough={0.4} shadow />
        <BB p={[0, 0.375, 0]} s={[10.68, 0.03, 0.88]} c="#1E2229" rough={0.5} shadow={false} />
        <BB p={[0, 0.398, 0]} s={[10.2, 0.035, 0.68]} c={soilColor} rough={0.94} shadow={false} />
        {[
          { x: -4.2, s: 0.92, r: 0.3, v: 0 },
          { x: -2.25, s: 1.06, r: 1.4, v: 1 },
          { x: -0.25, s: 0.88, r: 2.6, v: 2 },
          { x: 1.85, s: 1.04, r: 0.8, v: 3 },
          { x: 3.95, s: 0.95, r: 2.1, v: 4 },
        ].map((cl, idx) => (
          <NaturalPlantCluster
            key={`front-planter-${idx}`}
            pos={[cl.x, 0.42, 0]}
            scale={cl.s}
            rotationY={cl.r}
            variant={cl.v}
            darkMode={darkMode}
          />
        ))}
      </G>

      {/* Ghế băng dài chữ L (L-Shaped Outdoor Lounge) quay vào bàn Firepit */}
      <Interact
        id="outdoor_firepit_sofa"
        zone="exterior"
        category="SEAT"
        label="Sofa sưởi ấm Firepit"
        hint="🛋️ Ngồi Sofa sưởi ấm ngoài trời"
        customStandOffset={[-10.8, -0.15, 10.12]}
        customSitAnchor={{ pos: [-11.2, 0.05, 9.28], yaw: 0, pose: 'sit' }}
        userData={{
          customStandOffset: [-10.8, -0.15, 10.12],
          customSitAnchor: { pos: [-11.2, 0.05, 9.28], yaw: 0, pose: 'sit' },
        }}
        onClick={(e) => {
          if (e && !isValidClick(e.clientX, e.clientY)) return
          const st = useStore.getState()
          if (!st.firepitLit) st.toggleFirepit(true)
          const targetChar = st.userRole ?? st.activeChar ?? 'boy'
          st.setDynamicSeatTarget({
            id: 'outdoor_firepit_sofa',
            char: targetChar,
            pos: [-11.2, 0.05, 9.28],
            yaw: 0,
            pose: 'sit',
            label: 'Sofa sưởi ấm Firepit',
          })
          st.notify('🛋️ Ngồi Sofa sưởi ấm bên bếp lửa Firepit')
        }}
      >
        <G p={[-11.6, -0.16, 11.1]}>
          <RBB p={[0.35, 0, -1.85]} s={[4.6, 0.32, 0.92]} c="#9E6B43" rough={0.6} radius={0.03} shadow />
          <RBB p={[0.35, 0.32, -1.82]} s={[4.45, 0.16, 0.82]} c="#EFECE6" rough={0.86} radius={0.04} shadow={false} />
          <RBB p={[0.35, 0.48, -2.18]} s={[4.45, 0.42, 0.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow={false} />
          <RBB p={[-1.48, 0, 0.25]} s={[0.92, 0.32, 3.3]} c="#9E6B43" rough={0.6} radius={0.03} shadow />
          <RBB p={[-1.45, 0.32, 0.25]} s={[0.82, 0.16, 3.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow={false} />
          <RBB p={[-1.82, 0.48, 0.25]} s={[0.2, 0.42, 3.2]} c="#EFECE6" rough={0.86} radius={0.04} shadow={false} />
          {[-1.1, 0.3, 1.7].map((px, i) => (
            <RBB key={`fp-p1-${i}`} p={[px, 0.56, -1.96]} r={[0.2, 0, 0]} s={[0.46, 0.36, 0.14]} c={i % 2 ? '#9E6338' : '#C4834E'} rough={0.88} radius={0.04} shadow={false} />
          ))}
          {[-0.4, 0.9].map((pz, i) => (
            <RBB key={`fp-p2-${i}`} p={[-1.62, 0.56, pz]} r={[0, 0, -0.2]} s={[0.14, 0.36, 0.46]} c={i % 2 ? '#C4834E' : '#9E6338'} rough={0.88} radius={0.04} shadow={false} />
          ))}
        </G>
      </Interact>

      {/* Bàn Lò sưởi ngoài trời hiện đại (Outdoor Firepit phát sáng ấm, Interact zone="exterior") */}
      <FirepitTable pos={[-10.95, -0.16, 11.2]} darkMode={darkMode} />

      {/* =====================================================================
       * 6. HỆ TƯỜNG RÀO THẤP KẾT HỢP THANH LAM HIỆN ĐẠI (InstancedMesh, castShadow=false)
       * ===================================================================== */}
      <SlattedPerimeterFence pos={[-22.12, -0.2, 2.95]} length={25.8} orientation="z" darkMode={darkMode} />
      <SlattedPerimeterFence pos={[16.92, -0.2, 2.95]} length={25.8} orientation="z" darkMode={darkMode} />
      <SlattedPerimeterFence pos={[-2.6, -0.2, -9.95]} length={39.1} orientation="x" darkMode={darkMode} />

      {/* =====================================================================
       * 7. CÂY XANH KIẾN TRÚC ĐA TẦNG & HÀNG BỤI CÂY CẮT TỈA SÁT TƯỜNG
       * ===================================================================== */}
      <ArchitecturalTree pos={[-19.6, -0.2, 11.4]} scale={1.18} rotationY={0.4} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[-19.4, -0.2, -4.6]} scale={1.04} rotationY={1.8} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[15.3, -0.2, 4.2]} scale={1.12} rotationY={2.5} darkMode={darkMode} uplight />
      <ArchitecturalTree pos={[15.1, -0.2, -6.4]} scale={0.96} rotationY={0.9} darkMode={darkMode} />
      <ArchitecturalTree pos={[-6.8, -0.2, -8.2]} scale={0.98} rotationY={3.1} darkMode={darkMode} />
      <ArchitecturalTree pos={[5.2, -0.2, -8.4]} scale={1.06} rotationY={1.3} darkMode={darkMode} />

      <HedgeRow pos={[-21.5, -0.2, 2.8]} length={16.5} orientation="z" height={0.58} darkMode={darkMode} />
      <HedgeRow pos={[16.3, -0.2, 2.4]} length={17.5} orientation="z" height={0.56} darkMode={darkMode} />
      <HedgeRow pos={[-2.6, -0.2, -9.35]} length={36.0} orientation="x" height={0.54} darkMode={darkMode} />
      {[
        { pos: [-18.3, -0.2, 14.3] as V3, scale: 1.08, rot: 0.5, v: 0 },
        { pos: [-17.4, -0.2, 8.1] as V3, scale: 0.94, rot: 1.9, v: 1 },
        { pos: [-4.45, -0.2, 14.85] as V3, scale: 0.78, rot: 2.3, v: 2 },
        { pos: [12.85, -0.2, 14.95] as V3, scale: 0.96, rot: 0.9, v: 3 },
        { pos: [15.35, -0.2, 14.5] as V3, scale: 1.1, rot: 2.7, v: 4 },
        { pos: [15.7, -0.2, 9.1] as V3, scale: 0.9, rot: 1.2, v: 5 },
      ].map((cl, idx) => (
        <NaturalPlantCluster
          key={`corner-plant-${idx}`}
          pos={cl.pos}
          scale={cl.scale}
          rotationY={cl.rot}
          variant={cl.v}
          darkMode={darkMode}
        />
      ))}

      {/* =====================================================================
       * 8. ĐÈN TRỤ LỐI ĐI (InstancedMesh) & ĐÈN HẮT ÂM SÀN (emissive #FFAE52)
       * ===================================================================== */}
      <BollardLightsGroup darkMode={darkMode} lightsOn={yardLightsOn} />

      {/* Công tắc điều khiển đèn trụ sân vườn, LED hắt đá bước & LED âm hồ bơi */}
      <Interact
        id="yard_lights"
        zone="exterior"
        category="ELECTRONIC"
        label={yardLightsOn ? 'Đèn sân vườn & hồ bơi' : 'Bật đèn sân vườn & hồ bơi'}
        hint={yardLightsOn ? '💡 Tắt đèn sân vườn & hồ bơi' : '💡 Bật đèn sân vườn & hồ bơi'}
        customStandOffset={[0.58, -0.15, 8.6]}
        onClick={handleToggleYardLights}
      >
        <G p={[0.52, -0.18, 9.2]}>
          <B p={[0, 0.34, 0]} s={[0.134, 0.13, 0.134]} c="#272B33" metal={0.65} rough={0.32} shadow={false} />
          <B
            p={[0, 0.34, -0.068]}
            s={[0.038, 0.038, 0.02]}
            c={yardLightsOn ? '#4ADE80' : '#64748B'}
            emissive={yardLightsOn ? '#22C55E' : '#000000'}
            ei={yardLightsOn ? 1.85 : 0}
            shadow={false}
          />
          <B
            p={[0, 0.695, 0]}
            s={[0.134, 0.022, 0.134]}
            c={yardLightsOn ? '#FFAE52' : '#2D3138'}
            emissive={yardLightsOn ? '#FFAE52' : '#000000'}
            ei={yardLightsOn ? (darkMode ? 2.1 : 1.2) : 0}
            shadow={false}
          />
        </G>
      </Interact>

      {[-2.85, -0.15, 0.55].map((ux, idx) => (
        <G key={`facade-up-${idx}`} p={[ux, -0.18, 6.52]}>
          <Cyl rt={0.095} rb={0.105} h={0.04} c="#1E2229" metal={0.6} rough={0.35} shadow={false} />
          <Cyl
            p={[0, 0.024, 0]}
            rt={0.068}
            rb={0.068}
            h={0.015}
            c={yardLightsOn ? '#FFAE52' : '#2D3138'}
            emissive={yardLightsOn ? '#FFAE52' : '#000000'}
            ei={yardLightsOn ? (darkMode ? 2.6 : 1.75) : 0}
            shadow={false}
          />
        </G>
      ))}

      {/* Duy nhất 1 PointLight đại diện khu vực sân vườn/hồ bơi ban đêm (castShadow=false) */}
      {darkMode && <GardenNightLight yardLightsOn={yardLightsOn} />}
    </group>
  )
}

function GardenNightLight({ yardLightsOn }: { yardLightsOn: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null)
  const firepitLit = useStore((s) => s.firepitLit)

  useFrame((_, delta) => {
    if (!lightRef.current) return
    const target =
      yardLightsOn && firepitLit
        ? 2.4
        : yardLightsOn
          ? 1.65
          : firepitLit
            ? 1.15
            : 0.25
    lightRef.current.intensity = THREE.MathUtils.lerp(
      lightRef.current.intensity,
      target,
      Math.min(1, delta * 5),
    )
  })

  return (
    <pointLight
      ref={lightRef}
      position={[-1.0, 2.2, 10.6]}
      intensity={2.4}
      distance={22}
      decay={1.4}
      color="#FFAE52"
      castShadow={false}
    />
  )
}

const KOI_COUNT = 6
const KOI_PALETTE = ['#F97316', '#F8FAFC', '#FACC15', '#EA580C', '#FB923C', '#FF6B35']
const KOI_HOME_LANES = [
  { mode: 'left', cx: -2.66, cz: 9.6, rx: 0.08, rz: 1.45, speed: 0.55, phase: 0.0 },
  { mode: 'left', cx: -2.64, cz: 11.4, rx: 0.09, rz: 1.75, speed: 0.48, phase: 2.1 },
  { mode: 'left', cx: -2.68, cz: 10.6, rx: 0.07, rz: 1.55, speed: 0.62, phase: 4.2 },
  { mode: 'right', cx: -0.14, cz: 9.8, rx: 0.08, rz: 1.5, speed: 0.52, phase: 1.1 },
  { mode: 'right', cx: -0.12, cz: 11.6, rx: 0.08, rz: 1.65, speed: 0.58, phase: 3.4 },
  { mode: 'cross', cx: -1.42, cz: 10.52, rx: 1.18, rz: 0.07, speed: 0.44, phase: 0.8 },
] as const

function KoiPondFish({ darkMode }: { darkMode: boolean }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const tailRef = useRef<THREE.InstancedMesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const feedTriggerRef = useRef(false)
  const feedUntilRef = useRef(-1)
  const posRef = useRef(new Float32Array(KOI_COUNT * 2))
  const yawRef = useRef(new Float32Array(KOI_COUNT))

  useLayoutEffect(() => {
    const bMesh = bodyRef.current
    const tMesh = tailRef.current
    for (let i = 0; i < KOI_COUNT; i++) {
      const lane = KOI_HOME_LANES[i]
      posRef.current[i * 2] = lane.cx
      posRef.current[i * 2 + 1] = lane.cz
      yawRef.current[i] = 0
      _koiColor.set(KOI_PALETTE[i % KOI_PALETTE.length])
      if (bMesh) {
        bMesh.setColorAt(i, _koiColor)
        _instObj.position.set(lane.cx, -0.208, lane.cz)
        _instObj.rotation.set(0, 0, 0)
        _instObj.scale.set(0.68, 0.48, 1.92)
        _instObj.updateMatrix()
        bMesh.setMatrixAt(i, _instObj.matrix)
      }
      if (tMesh) {
        tMesh.setColorAt(i, _koiColor)
        _koiTailObj.position.set(lane.cx, -0.208, lane.cz - 0.14)
        _koiTailObj.rotation.set(0, 0, 0)
        _koiTailObj.scale.set(0.85, 0.55, 1)
        _koiTailObj.updateMatrix()
        tMesh.setMatrixAt(i, _koiTailObj.matrix)
      }
    }
    if (bMesh) {
      if (bMesh.instanceColor) bMesh.instanceColor.needsUpdate = true
      bMesh.instanceMatrix.needsUpdate = true
      bMesh.computeBoundingSphere()
    }
    if (tMesh) {
      if (tMesh.instanceColor) tMesh.instanceColor.needsUpdate = true
      tMesh.instanceMatrix.needsUpdate = true
      tMesh.computeBoundingSphere()
    }
  }, [])

  useFrame(({ clock }, delta) => {
    const bMesh = bodyRef.current
    const tMesh = tailRef.current
    if (!bMesh || !tMesh) return

    const t = clock.elapsedTime
    if (feedTriggerRef.current) {
      feedUntilRef.current = t + 6.5
      feedTriggerRef.current = false
    }
    const isFeeding = t < feedUntilRef.current
    const dt = Math.min(0.05, delta)

    for (let i = 0; i < KOI_COUNT; i++) {
      const lane = KOI_HOME_LANES[i]
      let targetX: number
      let targetZ: number

      if (isFeeding && (lane.mode === 'left' || lane.mode === 'cross')) {
        const ang = t * 2.25 + i * 1.45
        targetX = -2.54 + Math.cos(ang) * (0.12 + (i % 2) * 0.08)
        targetZ = 10.55 + Math.sin(ang) * (0.14 + (i % 3) * 0.06)
      } else if (isFeeding) {
        // Cá kênh phải tiến gần khe nước giữa để hướng về góc cho ăn
        const ang = t * 1.6 + lane.phase
        targetX = -0.14 + Math.cos(ang) * 0.07
        targetZ = 10.52 + Math.sin(ang) * 0.35
      } else {
        const ang = t * lane.speed + lane.phase
        targetX = lane.cx + Math.sin(ang * 1.7) * lane.rx
        targetZ = lane.cz + Math.cos(ang) * lane.rz
      }

      const prevX = posRef.current[i * 2]
      const prevZ = posRef.current[i * 2 + 1]
      const followRate = isFeeding ? 3.2 : 2.1
      const nextX = THREE.MathUtils.lerp(prevX, targetX, Math.min(1, dt * followRate))
      const nextZ = THREE.MathUtils.lerp(prevZ, targetZ, Math.min(1, dt * followRate))
      const vx = nextX - prevX
      const vz = nextZ - prevZ
      posRef.current[i * 2] = nextX
      posRef.current[i * 2 + 1] = nextZ

      if (vx * vx + vz * vz > 1e-7) {
        const desiredYaw = Math.atan2(vx, vz)
        let diff = desiredYaw - yawRef.current[i]
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        yawRef.current[i] += diff * Math.min(1, dt * 8)
      }

      const yaw = yawRef.current[i]
      const wag = Math.sin(t * (isFeeding ? 14.5 : 7.5) + i * 1.3) * 0.32
      const sinY = Math.sin(yaw)
      const cosY = Math.cos(yaw)

      _instObj.position.set(nextX, -0.208, nextZ)
      _instObj.rotation.set(0, yaw + wag * 0.22, 0)
      _instObj.scale.set(0.68, 0.48, 1.92)
      _instObj.updateMatrix()
      bMesh.setMatrixAt(i, _instObj.matrix)

      _koiTailObj.position.set(nextX - sinY * 0.145, -0.208, nextZ - cosY * 0.145)
      _koiTailObj.rotation.set(0, yaw + wag, 0)
      _koiTailObj.scale.set(0.85, 0.55, 1)
      _koiTailObj.updateMatrix()
      tMesh.setMatrixAt(i, _koiTailObj.matrix)
    }

    bMesh.instanceMatrix.needsUpdate = true
    tMesh.instanceMatrix.needsUpdate = true

    if (ringRef.current) {
      const pulse = isFeeding ? 1 + Math.sin(t * 7.2) * 0.24 : 0.96 + Math.sin(t * 2.1) * 0.04
      ringRef.current.scale.set(pulse, pulse, 1)
    }
  })

  return (
    <Interact
      id="koi_pond"
      zone="exterior"
      category="CONTAINER_INFO"
      label="Hồ cá Koi"
      hint="🐟 Cho đàn cá Koi ăn"
      customStandOffset={[-3.25, -0.15, 10.6]}
      infoTitle="Hồ Cá Koi Nghệ Thuật"
      infoBody="Đàn cá Koi Nhật Bản nhiều màu tung tăng dọc lối dạo đá nổi trước sảnh chính."
      icon="🐟"
      onClick={(e) => {
        if (e && !isValidClick(e.clientX, e.clientY)) return
        feedTriggerRef.current = true
        useStore.getState().notify('🐟 Rắc thức ăn cho đàn cá Koi tung tăng!')
      }}
    >
      <group>
        {/* Điểm thả thức ăn bên bờ Tây hồ cá Koi giúp xác định vị trí tương tác rõ ràng */}
        <mesh position={[-2.74, -0.186, 10.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 12]} />
          <meshStandardMaterial color={darkMode ? '#3D5E46' : '#4E7A56'} roughness={0.78} />
        </mesh>
        <mesh ref={ringRef} position={[-2.62, -0.191, 10.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.17, 0.25, 16]} />
          <meshStandardMaterial
            color="#7FE8E0"
            emissive="#5EEAD4"
            emissiveIntensity={darkMode ? 1.15 : 0.65}
            transparent
            opacity={0.48}
            depthWrite={false}
          />
        </mesh>
        <instancedMesh ref={bodyRef} args={[KOI_BODY_GEOM, KOI_MAT, KOI_COUNT]} castShadow={false} />
        <instancedMesh ref={tailRef} args={[KOI_TAIL_GEOM, KOI_MAT, KOI_COUNT]} castShadow={false} />
      </group>
    </Interact>
  )
}

function SundeckTeaTable({ darkMode }: { darkMode: boolean }) {
  const glassesRef = useRef<THREE.Group>(null)
  const triggerRef = useRef(false)
  const sparkleUntilRef = useRef(-1)

  useFrame(({ clock }) => {
    if (!glassesRef.current) return
    const t = clock.elapsedTime
    if (triggerRef.current) {
      sparkleUntilRef.current = t + 2.0
      triggerRef.current = false
    }
    if (t < sparkleUntilRef.current) {
      const lift = Math.abs(Math.sin(t * 9.5)) * 0.045
      glassesRef.current.position.y = lift
      glassesRef.current.rotation.y = Math.sin(t * 7.0) * 0.14
    } else {
      glassesRef.current.position.y = 0
      glassesRef.current.rotation.y = 0
    }
  })

  return (
    <Interact
      id="sundeck_juice"
      zone="exterior"
      category="CONTAINER_INFO"
      label="Nước ép bên hồ bơi"
      hint="🍹 Thưởng thức nước ép bên hồ bơi"
      customStandOffset={[4.35, -0.15, 10.22]}
      infoTitle="Nước Ép Trái Cây Tươi Mát"
      infoBody="Hai ly nước ép cam chanh dây & trà xanh bạc hà mát lạnh đặt cạnh ghế tắm nắng Sundeck."
      icon="🍹"
      onClick={(e) => {
        if (e && !isValidClick(e.clientX, e.clientY)) return
        triggerRef.current = true
        useStore.getState().notify('🍹 Thưởng thức nước ép mát lạnh bên hồ bơi!')
      }}
    >
      <G p={[3.3, -0.15, 10.22]}>
        <Cyl p={[0, 0.16, 0]} rt={0.1} rb={0.14} h={0.32} c="#2B2D2F" metal={0.45} shadow={false} />
        <Cyl p={[0, 0.34, 0]} rt={0.36} rb={0.35} h={0.04} c={darkMode ? '#8D877E' : '#EAE4DA'} rough={0.35} shadow={false} />
        <group ref={glassesRef}>
          <Cyl p={[-0.08, 0.42, 0.05]} rt={0.04} rb={0.032} h={0.12} c="#566E4C" opacity={0.8} shadow={false} />
          <Cyl p={[0.1, 0.42, -0.06]} rt={0.04} rb={0.032} h={0.12} c="#C4834E" opacity={0.85} shadow={false} />
        </group>
      </G>
    </Interact>
  )
}

function FirepitTable({ pos, darkMode }: { pos: V3; darkMode: boolean }) {
  const fireLit = useStore((s) => s.firepitLit)
  const flameRef = useRef<THREE.Group>(null)
  const flameMat = useMemo(() => getFlameMat(darkMode), [darkMode])

  useFrame(({ clock }) => {
    if (!flameRef.current || !fireLit) return
    const t = clock.elapsedTime
    flameRef.current.children.forEach((child, idx) => {
      const s = 0.92 + Math.sin(t * 7.5 + idx * 1.9) * 0.16
      child.scale.set(1, s, 1)
    })
  })

  return (
    <Interact
      id="firepit"
      zone="exterior"
      category="ELECTRONIC"
      label="Lò sưởi Firepit ngoài trời"
      hint={fireLit ? '🔥 Tắt lửa Firepit ngoài trời' : '🔥 Thắp lửa Firepit ngoài trời'}
      customStandOffset={[-9.65, -0.15, 11.2]}
      onClick={(e) => {
        if (e && !isValidClick(e.clientX, e.clientY)) return
        useStore.getState().toggleFirepit()
      }}
    >
      <G p={pos}>
        <RBB p={[0, 0, 0]} s={[1.65, 0.42, 1.18]} c="#2B303A" rough={0.58} radius={0.04} shadow />
        <RBB p={[0, 0.42, 0]} s={[1.72, 0.05, 1.24]} c={darkMode ? '#4B5058' : '#D6D1C9'} rough={0.42} radius={0.02} shadow={false} />
        <B p={[0, 0.45, 0]} s={[0.88, 0.05, 0.44]} c="#1A1C20" rough={0.95} shadow={false} />
        <B
          p={[0, 0.47, 0]}
          s={[0.78, 0.04, 0.34]}
          c={fireLit ? '#FF7A2F' : '#3A2820'}
          emissive={fireLit ? '#FF6A1A' : '#000000'}
          ei={fireLit ? (darkMode ? 2.4 : 1.5) : 0}
          shadow={false}
        />
        {fireLit && (
          <group ref={flameRef} position={[0, 0.52, 0]}>
            {[-0.22, -0.07, 0.09, 0.24].map((fx, i) => (
              <mesh
                key={i}
                position={[fx, 0.05, i % 2 ? 0.04 : -0.04]}
                scale={[1, (0.22 + (i % 2) * 0.06) / 0.24, 1]}
                geometry={FLAME_CONE_GEOM}
                material={flameMat}
              />
            ))}
          </group>
        )}
      </G>
    </Interact>
  )
}

function FloatingTravertineStep({
  pos,
  size,
  tex,
  darkMode,
  lightsOn = true,
  onClick,
}: {
  pos: V3
  size: V3
  tex: THREE.Texture
  darkMode: boolean
  lightsOn?: boolean
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const [w, h, d] = size
  const handleStepClick = onClick
    ? (e: ThreeEvent<MouseEvent>) => {
        if (!isValidClick(e.clientX, e.clientY)) return
        onClick(e)
      }
    : undefined

  return (
    <group position={pos} onClick={handleStepClick}>
      {/* Bệ đỡ âm tối ẩn dưới gầm bậc đá tạo hiệu ứng phiến đá bay nổi trên mặt nước */}
      <B p={[0, -h * 0.85, 0]} s={[w - 0.36, h * 0.9, d - 0.32]} c="#1A1D22" rough={0.85} shadow={false} />
      {/* Phiến đá Travertine khổ rộng */}
      <B
        p={[0, 0, 0]}
        s={[w, h, d]}
        map={tex}
        c={darkMode ? '#969087' : '#FFFFFF'}
        rough={0.58}
        shadow={false}
      />
      {/* Dải đèn LED vàng ấm #FFAE52 hắt ngầm dưới viền gầm bậc đá (emissive >= 1.5, 0 pointLight) */}
      <B
        p={[0, -h * 0.52, 0]}
        s={[w - 0.14, 0.018, d - 0.12]}
        c={lightsOn ? '#FFAE52' : '#2D3138'}
        emissive={lightsOn ? '#FFAE52' : '#000000'}
        ei={lightsOn ? (darkMode ? 2.6 : 1.7) : 0}
        shadow={false}
      />
    </group>
  )
}

function SunLounger({ pos, darkMode, index }: { pos: V3; darkMode: boolean; index: number }) {
  const seatId = `sun_lounger_${index}`
  return (
    <Interact
      id={seatId}
      zone="exterior"
      category="SEAT"
      label="Ghế tắm nắng Sundeck"
      hint="🛋️ Ngồi thư giãn ghế tắm nắng Sundeck"
      customStandOffset={[4.65, -0.15, pos[2]]}
      customSitAnchor={{ pos: [pos[0] + 0.12, -0.02, pos[2]], yaw: Math.PI / 2, pose: 'recline' }}
      onClick={(e) => {
        if (e && !isValidClick(e.clientX, e.clientY)) return
        const st = useStore.getState()
        const targetChar = st.userRole ?? st.activeChar ?? 'boy'
        st.setDynamicSeatTarget({
          id: seatId,
          char: targetChar,
          pos: [pos[0] + 0.12, -0.02, pos[2]],
          yaw: Math.PI / 2,
          pose: 'recline',
          label: 'Ghế tắm nắng Sundeck',
        })
        st.notify('🛋️ Thư giãn ngả lưng trên ghế tắm nắng Sundeck')
      }}
    >
      <G p={pos} r={[0, Math.PI / 2, 0]}>
        <RBB p={[0, 0.16, 0]} s={[2.02, 0.08, 0.78]} c="#9E6B43" rough={0.58} radius={0.025} shadow={false} />
        {[-0.86, 0.86].map((lx) =>
          [-0.32, 0.32].map((lz) => (
            <B key={`${lx}-${lz}`} p={[lx, 0.08, lz]} s={[0.05, 0.16, 0.05]} c="#2B2D2F" metal={0.5} shadow={false} />
          )),
        )}
        <RBB p={[0.3, 0.24, 0]} s={[1.3, 0.09, 0.72]} c={darkMode ? '#CFCAC0' : '#F4F1EA'} rough={0.86} radius={0.03} shadow={false} />
        <RBB
          p={[-0.58, 0.42, 0]}
          r={[0, 0, -0.45]}
          s={[0.68, 0.09, 0.72]}
          c={darkMode ? '#CFCAC0' : '#F4F1EA'}
          rough={0.86}
          radius={0.03}
          shadow={false}
        />
        <Cyl p={[-0.72, 0.54, 0]} r={[Math.PI / 2, 0, 0]} rt={0.075} rb={0.075} h={0.44} c="#C4834E" rough={0.88} shadow={false} />
      </G>
    </Interact>
  )
}

function SlattedPerimeterFence({
  pos,
  length,
  orientation,
  darkMode,
}: {
  pos: V3
  length: number
  orientation: 'x' | 'z'
  darkMode: boolean
}) {
  const isX = orientation === 'x'
  const wallC = darkMode ? '#EBE6DC' : '#F5F2EB'
  const postC = '#1E2229'
  const numPosts = Math.max(3, Math.round(length / 3.2) + 1)
  const slatMat = useMemo(() => getFenceSlatMat(darkMode), [darkMode])
  const slatsRef = useRef<THREE.InstancedMesh>(null)
  const postsRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const sMesh = slatsRef.current
    if (sMesh) {
      const slatYs = [0.68, 0.85, 1.02, 1.19]
      for (let i = 0; i < slatYs.length; i++) {
        _instObj.position.set(0, slatYs[i], 0)
        _instObj.rotation.set(0, 0, 0)
        _instObj.scale.set(
          isX ? length - 0.1 : 0.055,
          0.075,
          isX ? 0.055 : length - 0.1,
        )
        _instObj.updateMatrix()
        sMesh.setMatrixAt(i, _instObj.matrix)
      }
      sMesh.instanceMatrix.needsUpdate = true
      sMesh.computeBoundingSphere()
    }

    const pMesh = postsRef.current
    if (pMesh) {
      for (let i = 0; i < numPosts; i++) {
        const offset = -length / 2 + (i / (numPosts - 1)) * length
        _instObj.position.set(isX ? offset : 0, 0.645, isX ? 0 : offset)
        _instObj.rotation.set(0, 0, 0)
        _instObj.scale.set(0.092, 1.29, 0.092)
        _instObj.updateMatrix()
        pMesh.setMatrixAt(i, _instObj.matrix)
      }
      pMesh.instanceMatrix.needsUpdate = true
      pMesh.computeBoundingSphere()
    }
  }, [isX, length, numPosts])

  return (
    <group position={pos}>
      {/* Bệ tường xây thấp Đá Travertine trắng kem #F5F2EB (castShadow=false) */}
      <B
        p={[0, 0.26, 0]}
        s={isX ? [length, 0.52, 0.22] : [0.22, 0.52, length]}
        c={wallC}
        rough={0.4}
        shadow={false}
      />
      <B
        p={[0, 0.535, 0]}
        s={isX ? [length + 0.04, 0.035, 0.26] : [0.26, 0.035, length + 0.04]}
        c={postC}
        rough={0.42}
        metal={0.45}
        shadow={false}
      />

      {/* Hệ 4 thanh lam gỗ ngang Teak ấm #C68642 dùng InstancedMesh (castShadow=false) */}
      <instancedMesh
        ref={slatsRef}
        args={[UNIT_BOX_GEOM, slatMat, 4]}
        castShadow={false}
        receiveShadow
      />

      {/* Thanh nẹp đỉnh hàng rào thép đen #1E2229 */}
      <B
        p={[0, 1.32, 0]}
        s={isX ? [length + 0.04, 0.045, 0.11] : [0.11, 0.045, length + 0.04]}
        c={postC}
        rough={0.35}
        metal={0.55}
        shadow={false}
      />

      {/* Trụ thép hộp dọc #1E2229 dùng InstancedMesh (castShadow=false) */}
      <instancedMesh
        key={numPosts}
        ref={postsRef}
        args={[UNIT_BOX_GEOM, FENCE_POST_MAT, numPosts]}
        castShadow={false}
        receiveShadow
      />
    </group>
  )
}

function BollardLightsGroup({ darkMode, lightsOn }: { darkMode: boolean; lightsOn: boolean }) {
  const metalRef = useRef<THREE.InstancedMesh>(null)
  const ledRef = useRef<THREE.InstancedMesh>(null)
  const ledMat = useMemo(() => getBollardLedMat(darkMode, lightsOn), [darkMode, lightsOn])
  const count = BOLLARD_POSITIONS.length

  useLayoutEffect(() => {
    const mMesh = metalRef.current
    const lMesh = ledRef.current
    if (!mMesh || !lMesh) return

    let mIdx = 0
    for (let i = 0; i < count; i++) {
      const [bx, by, bz] = BOLLARD_POSITIONS[i]
      // Base
      _instObj.position.set(bx, by + 0.025, bz)
      _instObj.rotation.set(0, 0, 0)
      _instObj.scale.set(0.16, 0.05, 0.16)
      _instObj.updateMatrix()
      mMesh.setMatrixAt(mIdx++, _instObj.matrix)
      // Body
      _instObj.position.set(bx, by + 0.34, bz)
      _instObj.scale.set(0.11, 0.62, 0.11)
      _instObj.updateMatrix()
      mMesh.setMatrixAt(mIdx++, _instObj.matrix)
      // Top cap
      _instObj.position.set(bx, by + 0.66, bz)
      _instObj.scale.set(0.12, 0.04, 0.12)
      _instObj.updateMatrix()
      mMesh.setMatrixAt(mIdx++, _instObj.matrix)
      // LED head (#FFAE52 emissive)
      _instObj.position.set(bx, by + 0.58, bz)
      _instObj.scale.set(0.102, 0.11, 0.102)
      _instObj.updateMatrix()
      lMesh.setMatrixAt(i, _instObj.matrix)
    }

    mMesh.instanceMatrix.needsUpdate = true
    mMesh.computeBoundingSphere()
    lMesh.instanceMatrix.needsUpdate = true
    lMesh.computeBoundingSphere()
  }, [count])

  return (
    <group>
      <instancedMesh
        ref={metalRef}
        args={[UNIT_BOX_GEOM, BOLLARD_METAL_MAT, count * 3]}
        castShadow={false}
        receiveShadow
      />
      <instancedMesh
        ref={ledRef}
        args={[UNIT_BOX_GEOM, ledMat, count]}
        castShadow={false}
      />
    </group>
  )
}

function WaterFeatureWall({ pos, darkMode }: { pos: V3; darkMode: boolean }) {
  const waterfallOn = useStore((s) => s.electronicStates?.waterfall ?? true)
  const sheetMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const rippleGroupRef = useRef<THREE.Group>(null)
  const foamMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const travertine = darkMode ? '#EBE6DC' : '#F5F2EB'
  const rippleMat = useMemo(() => getRippleMat(darkMode), [darkMode])

  useFrame(({ clock }) => {
    if (!waterfallOn) return
    const t = clock.elapsedTime
    if (sheetMatRef.current) {
      sheetMatRef.current.emissiveIntensity = (darkMode ? 0.52 : 0.28) + Math.sin(t * 5.2) * 0.12
      sheetMatRef.current.opacity = 0.55 + Math.sin(t * 6.5) * 0.06
    }
    if (rippleGroupRef.current) {
      rippleGroupRef.current.children.forEach((child, idx) => {
        const wave = Math.sin(t * 7.2 - idx * 0.9)
        child.position.y = 0.45 + wave * 0.035
        child.scale.x = 0.92 + Math.cos(t * 5.4 + idx) * 0.12
      })
    }
    if (foamMatRef.current) {
      foamMatRef.current.emissiveIntensity = (darkMode ? 1.15 : 0.65) + Math.sin(t * 8.1) * 0.22
    }
  })

  return (
    <Interact
      id="waterfall"
      zone="exterior"
      category="ELECTRONIC"
      label={waterfallOn ? 'Thác nước tràn hồ bơi' : 'Bật thác nước tràn'}
      hint={waterfallOn ? '🌊 Tắt thác nước tràn' : '🌊 Bật thác nước tràn'}
      customStandOffset={[5.15, -0.15, 7.65]}
      onClick={(e) => {
        if (e && !isValidClick(e.clientX, e.clientY)) return
        const st = useStore.getState()
        const cur = st.electronicStates?.waterfall ?? true
        const next = !cur
        st.toggleElectronicState?.('waterfall', next)
        st.notify(next ? '🌊 Bật thác nước tràn hồ bơi' : '🌊 Tắt thác nước tràn')
      }}
    >
      <group position={pos}>
        <B p={[0, 0.04, 0]} s={[2.82, 0.08, 0.36]} c="#1E2229" rough={0.55} shadow={false} />
        <B p={[0, 0.606, -0.01]} s={[2.8, 1.048, 0.3]} c={travertine} rough={0.4} shadow />
        <B p={[0, 0.59, 0.142]} s={[2.3, 0.96, 0.036]} c="#1E2229" rough={0.75} shadow={false} />
        <B p={[-1.28, 0.606, 0.155]} s={[0.24, 1.048, 0.03]} c={travertine} rough={0.4} shadow={false} />
        <B p={[1.28, 0.606, 0.155]} s={[0.24, 1.048, 0.03]} c={travertine} rough={0.4} shadow={false} />
        <B p={[0, 1.15, -0.005]} s={[2.86, 0.04, 0.35]} c="#1E2229" rough={0.4} metal={0.45} shadow={false} />

        <B p={[0, 0.88, 0.17]} s={[2.22, 0.06, 0.1]} c="#1E2229" metal={0.7} rough={0.32} shadow={false} />
        <B p={[0, 0.89, 0.31]} s={[2.16, 0.025, 0.34]} c="#1E2229" metal={0.75} rough={0.28} shadow={false} />
        <B p={[-1.07, 0.91, 0.31]} s={[0.025, 0.035, 0.34]} c="#1E2229" metal={0.75} rough={0.28} shadow={false} />
        <B p={[1.07, 0.91, 0.31]} s={[0.025, 0.035, 0.34]} c="#1E2229" metal={0.75} rough={0.28} shadow={false} />

        {/* Lớp nước tràn trong máng kim loại (MeshStandardMaterial) */}
        <mesh position={[0, 0.908, 0.31]} material={TROUGH_WATER_MAT} visible={waterfallOn}>
          <boxGeometry args={[2.1, 0.014, 0.32]} />
        </mesh>

        {/* Dải LED ấm #FFAE52 & ngọc bích hắt dưới môi thác đổ xuống mặt hồ (không dùng pointLight) */}
        <B
          p={[0, 0.862, 0.23]}
          s={[2.12, 0.02, 0.035]}
          c={waterfallOn ? '#FFAE52' : '#2D3138'}
          emissive={waterfallOn ? '#FFAE52' : '#000000'}
          ei={waterfallOn ? (darkMode ? 2.5 : 1.7) : 0}
          shadow={false}
        />
        <B
          p={[0, 0.865, 0.38]}
          s={[2.1, 0.018, 0.03]}
          c={waterfallOn ? '#7FE8E0' : '#1E2A30'}
          emissive={waterfallOn ? '#38B2AC' : '#000000'}
          ei={waterfallOn ? (darkMode ? 2.2 : 1.2) : 0}
          shadow={false}
        />

        {/* Màng nước chảy màu ngọc bích (MeshStandardMaterial) */}
        <mesh position={[0, 0.45, 0.455]} visible={waterfallOn}>
          <boxGeometry args={[2.08, 0.86, 0.024]} />
          <meshStandardMaterial
            ref={sheetMatRef}
            color="#38B2AC"
            emissive="#7FE8E0"
            emissiveIntensity={darkMode ? 0.52 : 0.28}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>

        {/* Các gợn sóng lấp lánh dọc màng thác (dùng chung geometry & material) */}
        <group ref={rippleGroupRef} visible={waterfallOn}>
          {[-0.82, -0.48, -0.14, 0.18, 0.52, 0.84].map((rx, idx) => (
            <mesh key={`wf-rip-${idx}`} position={[rx, 0.45, 0.47]} geometry={RIPPLE_BOX_GEOM} material={rippleMat} />
          ))}
        </group>

        {/* Dải bọt sóng tiếp nước trên mặt hồ bơi */}
        <mesh position={[0, 0.034, 0.47]} visible={waterfallOn}>
          <boxGeometry args={[2.16, 0.022, 0.2]} />
          <meshStandardMaterial
            ref={foamMatRef}
            color="#7FE8E0"
            emissive="#5EEAD4"
            emissiveIntensity={darkMode ? 1.15 : 0.65}
            transparent
            opacity={0.62}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Interact>
  )
}
