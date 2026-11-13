import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Interact } from './prims'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { LuxuryLandscaping } from './LuxuryLandscaping'
import { RooftopTerrace } from './RooftopTerrace'
import { isHouseClosedOverview, isValidClick, registerOccluderMesh } from './raycastRegistry'
import { marbleTiles, rng, woodFloor } from './textures'
import { getHousePalette, LIVE_ACTORS, type V3 } from '../data/config'
import { useStore } from '../store'

export const TRIM_BLACK = '#1E2229'
export const TEAK_WARM = '#C68642'
export const TEAK_DEEP = '#B87333'
export const WARM_LED = '#FFAE52'

const UNIT_BOX_GEOM = new THREE.BoxGeometry(1, 1, 1)
const noopRaycast = () => null
const _shellObj = new THREE.Object3D()
const _shellColor = new THREE.Color()

const travRepeatCache = new Map<string, THREE.CanvasTexture>()
const teakRepeatCache = new Map<string, THREE.CanvasTexture>()
let floorWoodCache: THREE.CanvasTexture | null = null
let floorMarbleCache: THREE.CanvasTexture | null = null

function getCachedTravTex(rx: number, ry: number): THREE.CanvasTexture {
  const key = `${rx}_${ry}`
  let tex = travRepeatCache.get(key)
  if (!tex) {
    tex = getBrightTravertineTexture().clone()
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(rx, ry)
    tex.needsUpdate = true
    travRepeatCache.set(key, tex)
  }
  return tex
}

function getCachedTeakTex(rx: number, ry: number, rot = 0): THREE.CanvasTexture {
  const key = `${rx}_${ry}_${rot.toFixed(3)}`
  let tex = teakRepeatCache.get(key)
  if (!tex) {
    tex = getTeakPlankTexture().clone()
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    if (rot !== 0) tex.rotation = rot
    tex.repeat.set(rx, ry)
    tex.needsUpdate = true
    teakRepeatCache.set(key, tex)
  }
  return tex
}

function getCachedFloorWoodMap(): THREE.CanvasTexture {
  if (!floorWoodCache) {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 2.7)
    t.needsUpdate = true
    floorWoodCache = t
  }
  return floorWoodCache
}

function getCachedFloorMarbleMap(): THREE.CanvasTexture {
  if (!floorMarbleCache) {
    const t = marbleTiles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 2.8)
    t.needsUpdate = true
    floorMarbleCache = t
  }
  return floorMarbleCache
}

let brightTravertineCache: THREE.CanvasTexture | null = null
export function getBrightTravertineTexture(): THREE.CanvasTexture {
  if (brightTravertineCache) return brightTravertineCache
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const g = canvas.getContext('2d')
  if (g) {
    const r = rng(197)
    g.fillStyle = '#FCFBF8'
    g.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 48; i++) {
      const y = r() * 512
      const lw = 1.2 + r() * 4.5
      g.fillStyle = i % 2 === 0 ? 'rgba(220, 212, 196, 0.28)' : 'rgba(255, 253, 249, 0.36)'
      g.fillRect(0, y, 512, lw)
    }
    for (let i = 0; i < 85; i++) {
      g.fillStyle = 'rgba(196, 186, 170, 0.2)'
      g.beginPath()
      g.ellipse(r() * 512, r() * 512, 4 + r() * 15, 1 + r() * 2.5, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
  brightTravertineCache = tex
  return tex
}

let teakPlankCache: THREE.CanvasTexture | null = null
export function getTeakPlankTexture(): THREE.CanvasTexture {
  if (teakPlankCache) return teakPlankCache
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const g = canvas.getContext('2d')
  if (g) {
    const r = rng(313)
    const planks = 12
    const ph = 512 / planks
    const tones = [TEAK_WARM, TEAK_DEEP, '#CE8E4B', '#BD7937']
    for (let i = 0; i < planks; i++) {
      g.fillStyle = tones[Math.floor(r() * tones.length)]
      g.fillRect(0, i * ph, 512, ph - 2.5)
      for (let v = 0; v < 8; v++) {
        g.strokeStyle = v % 2 === 0 ? 'rgba(96, 52, 16, 0.2)' : 'rgba(246, 210, 160, 0.18)'
        g.lineWidth = 1.1
        g.beginPath()
        const y = i * ph + 3 + r() * (ph - 8)
        g.moveTo(0, y)
        g.bezierCurveTo(170, y + (r() - 0.5) * 4, 340, y + (r() - 0.5) * 4, 512, y)
        g.stroke()
      }
      g.fillStyle = '#5B3414'
      g.fillRect(0, (i + 1) * ph - 2.5, 512, 2.5)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
  teakPlankCache = tex
  return tex
}

export type ShellWallMode = 'full' | 'cutaway' | 'ghost'

type StoreStateWithFacade = ReturnType<typeof useStore.getState> & {
  nearInteriorOpen?: boolean
}

function resolveEffectiveWallMode(
  mode: 'orbit' | 'fp',
  viewPreset: 'overview' | 'floor1' | 'floor2',
  wallMode: ShellWallMode,
  nearInteriorOpen: boolean,
): ShellWallMode {
  if (mode === 'fp') return 'full'
  if (nearInteriorOpen || viewPreset === 'floor1' || viewPreset === 'floor2') return 'cutaway'
  return wallMode === 'cutaway' || wallMode === 'ghost' ? wallMode : 'full'
}

export const FLOOR1_HEIGHT = 4.35
export const FLOOR2_Y = 4.35
export const FLOOR2_HEIGHT = 4.2
export const ROOF_Y = FLOOR2_Y + FLOOR2_HEIGHT // 8.55
export const WALL_THICKNESS = 0.28
export const SLAB_THICKNESS = 0.3
export const CUTAWAY_HEIGHT = 1.05
export const WALL_CUT_DOT_THRESHOLD = -0.22

const HOUSE_CENTER = new THREE.Vector3(-2.8, 2.5, 0)
const _camToCenter = new THREE.Vector3()
const _wallNormal = new THREE.Vector3()

/** Kiểm tra tường có pháp tuyến hướng về phía Camera đang bị chắn hay không */
export function isWallCutByCamera(cameraPos: THREE.Vector3, normal: V3): boolean {
  _camToCenter.subVectors(HOUSE_CENTER, cameraPos)
  if (_camToCenter.lengthSq() <= 0.0001) return false
  _camToCenter.normalize()
  _wallNormal.set(normal[0], normal[1], normal[2]).normalize()
  return _camToCenter.dot(_wallNormal) < WALL_CUT_DOT_THRESHOLD
}

/** Ẩn đồng bộ các đồ vật ốp/dính lên tường khi tường đó đang hạ thấp hoặc mờ */
export function WallAttached({
  normal,
  floor,
  hideInGhost = true,
  children,
}: {
  normal: V3
  floor: 1 | 2
  hideInGhost?: boolean
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ camera }) => {
    if (!ref.current) return
    const st = useStore.getState() as StoreStateWithFacade
    const effectiveMode = resolveEffectiveWallMode(
      st.mode,
      st.viewPreset,
      st.wallMode as ShellWallMode,
      Boolean(st.nearInteriorOpen),
    )
    const activeForMode =
      effectiveMode === 'cutaway' || (effectiveMode === 'ghost' && hideInGhost)
    const cutawayActive =
      st.mode === 'orbit' &&
      activeForMode &&
      (st.viewPreset === (floor === 1 ? 'floor1' : 'floor2') || st.viewPreset === 'overview')
    const cut = cutawayActive && isWallCutByCamera(camera.position, normal)
    ref.current.visible = !cut
  })

  return <group ref={ref}>{children}</group>
}

interface ArchitectureShellProps {
  onFloorClick?: (e: ThreeEvent<MouseEvent>) => void
  onYardClick?: (e: ThreeEvent<MouseEvent>) => void
}

/**
 * Hệ thống Khung Kiến trúc Khối đặc (Solid Volume Architecture Shell)
 * Bao gồm: Sàn khối đặc 0.3 units, Tường bao 4 mặt dày 0.28 với CutawayWall hỗ trợ 3 chế độ (Full / Cutaway / Ghost),
 * giữ sắc nét hệ mặt tiền (khung chữ L kem #F4F1EA, lam gỗ Teak, cửa Pivot + mái hiên, ban công kính, cửa sổ tràn viền),
 * Vách ngăn nội thất 0.16-0.22 units, Hệ Mái bằng có seno & giếng trời, và Khuôn viên Sân vườn Resort.
 */
export function ArchitectureShell({ onFloorClick, onYardClick }: ArchitectureShellProps) {
  const darkMode = useStore((s) => s.darkMode)
  const mode = useStore((s) => s.mode)
  const viewPreset = useStore((s) => s.viewPreset)
  const roofVisible = useStore((s) => s.roofVisible)
  const nearInteriorOpen = useStore((s) => Boolean((s as StoreStateWithFacade).nearInteriorOpen))
  const rawWallMode = useStore((s) => s.wallMode) as ShellWallMode
  const wallMode: ShellWallMode =
    rawWallMode === 'cutaway' ? 'cutaway' : rawWallMode === 'ghost' ? 'ghost' : 'full'
  const palette = getHousePalette(darkMode)

  const isWalkthrough = mode === 'fp'
  const effectiveWallMode = resolveEffectiveWallMode(mode, viewPreset, wallMode, nearInteriorOpen)
  const showFloor2 = isWalkthrough || viewPreset !== 'floor1'
  const showRoof = isWalkthrough
    ? true
    : nearInteriorOpen || viewPreset === 'floor1' || viewPreset === 'floor2'
      ? false
      : viewPreset === 'overview' && roofVisible
  const showTerrace = showFloor2
  const cutawayFloor1 =
    !isWalkthrough &&
    effectiveWallMode !== 'full' &&
    (viewPreset === 'floor1' || viewPreset === 'overview')
  const cutawayFloor2 =
    !isWalkthrough &&
    effectiveWallMode !== 'full' &&
    (viewPreset === 'floor2' || viewPreset === 'overview')

  return (
    <group>
      {/* 1. Quy hoạch Sân vườn Resort, Đế đá tối màu, Lối đi mặt nước, Hồ bơi vô cực mini & Firepit Lounge */}
      <LuxuryLandscaping darkMode={darkMode} onYardClick={onYardClick} />

      {/* 2. Sàn Khối đặc Tầng 1 (dày 0.3 units, mảng 6 material, castShadow & receiveShadow) */}
      <SolidFloor1Slabs darkMode={darkMode} onFloorClick={onFloorClick} />

      {/* 3. Trụ cột góc kiến trúc cố định giữ vững khung khối 3D ở mọi góc xoay */}
      <StructuralCornerColumns palette={palette} showFloor2={showFloor2} />

      {/* 4. Hệ Tường bao Tầng 1 (dày 0.28, CutawayWall Full/Cutaway/Ghost) & Vách ngăn nội thất */}
      <Floor1Envelope
        darkMode={darkMode}
        palette={palette}
        cutawayEnabled={cutawayFloor1}
        wallMode={effectiveWallMode}
        onYardClick={onYardClick}
      />

      {/* 5. Hệ Tường bao Tầng 2 (dày 0.28, ẩn hoàn toàn khi viewPreset === 'floor1') */}
      <group visible={showFloor2}>
        <Floor2Envelope
          darkMode={darkMode}
          palette={palette}
          cutawayEnabled={cutawayFloor2}
          wallMode={effectiveWallMode}
        />
      </group>

      {/* 6. Sân thượng bên trái trên nóc Phòng tắm nối liền Tầng 2 */}
      {showTerrace && <RooftopTerrace darkMode={darkMode} />}

      {/* 7. Hệ Mái Pergola lam gỗ Teak khu vực hiên phải trên Sundeck (tạo bóng đổ sọc nắng) */}
      <RightPatioPergola darkMode={darkMode} />

      {/* 8. Hệ Mái bằng Tầng 2 đua sâu tới z = 7.75, ốp gỗ Teak soffit & đèn LED âm trần sáng cả ngày lẫn đêm */}
      {showRoof && <RoofSystem darkMode={darkMode} palette={palette} />}
    </group>
  )
}

const SCONCE_CONE_GEOM = new THREE.ConeGeometry(0.42, 0.96, 16, 1, true)
const BALCONY_LEAF_ICO = new THREE.IcosahedronGeometry(1, 1)

const SCONCE_CONE_MAT_DAY = new THREE.MeshBasicMaterial({
  color: WARM_LED,
  transparent: true,
  opacity: 0.14,
  side: THREE.DoubleSide,
  depthWrite: false,
})
const SCONCE_CONE_MAT_NIGHT = new THREE.MeshBasicMaterial({
  color: WARM_LED,
  transparent: true,
  opacity: 0.25,
  side: THREE.DoubleSide,
  depthWrite: false,
})

const BALCONY_LEAF_INST_MAT = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.75,
  flatShading: true,
})

let rightPergolaMatDay: THREE.MeshStandardMaterial | null = null
let rightPergolaMatNight: THREE.MeshStandardMaterial | null = null
function getRightPergolaSlatMat(darkMode: boolean): THREE.MeshStandardMaterial {
  if (darkMode) {
    if (!rightPergolaMatNight) {
      rightPergolaMatNight = new THREE.MeshStandardMaterial({
        map: getCachedTeakTex(2.4, 0.25),
        color: '#DFCBB2',
        roughness: 0.48,
      })
    }
    return rightPergolaMatNight
  }
  if (!rightPergolaMatDay) {
    rightPergolaMatDay = new THREE.MeshStandardMaterial({
      map: getCachedTeakTex(2.4, 0.25),
      color: '#FFFFFF',
      roughness: 0.48,
    })
  }
  return rightPergolaMatDay
}

/** Đèn hắt tường 2 chiều (Up + Down Wall Sconce #1E2229 / #FFAE52) phát sáng ấm cả Ban ngày lẫn Ban đêm */
function WallSconce({
  pos,
  darkMode,
}: {
  pos: V3
  darkMode: boolean
  includeLight?: boolean
  lightIntensity?: number
}) {
  const coneMat = darkMode ? SCONCE_CONE_MAT_NIGHT : SCONCE_CONE_MAT_DAY

  return (
    <group position={pos}>
      <B p={[0, 0, -0.012]} s={[0.095, 0.32, 0.068]} c={TRIM_BLACK} metal={0.62} rough={0.32} shadow={false} />
      <B p={[0, 0, 0.023]} s={[0.072, 0.25, 0.008]} c="#2B303A" metal={0.68} rough={0.3} />
      <B
        p={[0, 0.148, 0.004]}
        s={[0.082, 0.032, 0.056]}
        c={WARM_LED}
        emissive={WARM_LED}
        ei={darkMode ? 2.85 : 2.1}
        shadow={false}
      />
      <B
        p={[0, -0.148, 0.004]}
        s={[0.082, 0.032, 0.056]}
        c={WARM_LED}
        emissive={WARM_LED}
        ei={darkMode ? 2.95 : 2.15}
        shadow={false}
      />
      {/* Quầng sáng hắt lên + xuống ôm sát mặt tường đá */}
      <mesh
        position={[0, 0.62, -0.016]}
        rotation={[0, 0, Math.PI]}
        scale={[1, 1, 0.08]}
        geometry={SCONCE_CONE_GEOM}
        material={coneMat}
        raycast={noopRaycast}
      />
      <mesh
        position={[0, -0.64, -0.016]}
        scale={[1, 1, 0.08]}
        geometry={SCONCE_CONE_GEOM}
        material={coneMat}
        raycast={noopRaycast}
      />
    </group>
  )
}

/** Chậu cây rủ ban công Tầng 2 với các dải dây lá xanh rủ mềm xuống mép đua */
function HangingBalconyPlanter({
  pos,
  darkMode,
  variant = 0,
}: {
  pos: V3
  darkMode: boolean
  variant?: number
}) {
  const leafInstRef = useRef<THREE.InstancedMesh>(null)

  const leafInstances = useMemo(() => {
    const leafDark = darkMode ? '#2F462A' : '#3E5A36'
    const leafMid = darkMode ? '#3D5935' : '#537349'
    const leafLight = darkMode ? '#4E6E44' : '#6A8B5E'

    const items: { p: V3; r: V3; s: V3; color: string }[] = [
      { p: [-0.28, 0.31, 0.02], r: [0, 0, 0], s: [0.22, 0.13, 0.16], color: leafDark },
      { p: [-0.04, 0.34, -0.01], r: [0, 0, 0], s: [0.24, 0.15, 0.17], color: leafMid },
      { p: [0.24, 0.31, 0.02], r: [0, 0, 0], s: [0.22, 0.13, 0.16], color: leafLight },
      { p: [-0.14, 0.28, 0.09], r: [0, 0, 0], s: [0.16, 0.1, 0.14], color: leafLight },
      { p: [0.14, 0.28, 0.09], r: [0, 0, 0], s: [0.17, 0.1, 0.14], color: leafMid },
    ]

    const vineStrands = [
      { x: -0.35, len: 0.56 + (variant % 2) * 0.08, zOff: 0.135 },
      { x: -0.24, len: 0.72 - (variant % 3) * 0.06, zOff: 0.145 },
      { x: -0.12, len: 0.48 + ((variant + 1) % 3) * 0.09, zOff: 0.14 },
      { x: 0.02, len: 0.78 - (variant % 2) * 0.1, zOff: 0.15 },
      { x: 0.15, len: 0.62 + (variant % 3) * 0.07, zOff: 0.14 },
      { x: 0.27, len: 0.68 - ((variant + 1) % 2) * 0.12, zOff: 0.145 },
      { x: 0.37, len: 0.52 + (variant % 2) * 0.09, zOff: 0.135 },
    ]

    const steps = 5
    vineStrands.forEach((st, sIdx) => {
      for (let k = 0; k < steps; k++) {
        const t = k / (steps - 1)
        const vy = 0.21 - t * st.len
        const vz = st.zOff + Math.sin(t * 2.2 + sIdx) * 0.025
        const vx = st.x + Math.sin(t * 3.1 + sIdx * 1.4) * 0.022
        const rad = 0.068 * (1 - t * 0.42)
        const color = (sIdx + k) % 3 === 0 ? leafLight : (sIdx + k) % 2 === 0 ? leafMid : leafDark
        items.push({
          p: [vx, vy, vz],
          r: [0.3 * t, k * 0.7, 0.25],
          s: [rad * 1.05, rad * 1.35, rad * 0.85],
          color,
        })
      }
    })
    return items
  }, [darkMode, variant])

  useLayoutEffect(() => {
    const inst = leafInstRef.current
    if (!inst) return
    leafInstances.forEach((item, idx) => {
      _shellObj.position.set(item.p[0], item.p[1], item.p[2])
      _shellObj.rotation.set(item.r[0], item.r[1], item.r[2])
      _shellObj.scale.set(item.s[0], item.s[1], item.s[2])
      _shellObj.updateMatrix()
      inst.setMatrixAt(idx, _shellObj.matrix)
      _shellColor.set(item.color)
      inst.setColorAt(idx, _shellColor)
    })
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    inst.computeBoundingSphere()
  }, [leafInstances])

  return (
    <group position={pos}>
      {/* Thân chậu chữ nhật viền đen mờ #1E2229 & ngàm thép treo vào mép ban công */}
      <B p={[0, 0.12, 0]} s={[0.92, 0.24, 0.24]} c={TRIM_BLACK} rough={0.42} metal={0.35} shadow={false} />
      <B p={[0, 0.235, 0]} s={[0.96, 0.024, 0.27]} c={TRIM_BLACK} rough={0.34} metal={0.55} shadow={false} />
      <B p={[0, 0.228, 0]} s={[0.84, 0.02, 0.18]} c="#3A3027" rough={0.94} shadow={false} />
      {[-0.3, 0.3].map((bx, idx) => (
        <B key={`br-${idx}`} p={[bx, 0.14, -0.13]} s={[0.045, 0.045, 0.12]} c={TRIM_BLACK} metal={0.6} rough={0.35} shadow={false} />
      ))}

      {/* Tán lá & dải dây rủ gộp InstancedMesh */}
      <instancedMesh
        ref={leafInstRef}
        args={[BALCONY_LEAF_ICO, BALCONY_LEAF_INST_MAT, 40]}
        castShadow={false}
        receiveShadow
        raycast={noopRaycast}
      />
    </group>
  )
}

/** Hệ mái Pergola hiên phải bên trên Sundeck ([1.2..5.5, 6.45..9.95]) */
function RightPatioPergola({ darkMode }: { darkMode: boolean }) {
  const slatInstRef = useRef<THREE.InstancedMesh>(null)
  const slatMat = getRightPergolaSlatMat(darkMode)
  const louverCount = 15
  const startZ = 6.62
  const endZ = 9.72

  useLayoutEffect(() => {
    const inst = slatInstRef.current
    if (!inst) return
    _shellObj.rotation.set(0, 0, 0)
    _shellObj.scale.set(4.08, 0.09, 0.055)
    for (let i = 0; i < louverCount; i++) {
      const lz = startZ + (i / (louverCount - 1)) * (endZ - startZ)
      _shellObj.position.set(3.35, 4.135, lz)
      _shellObj.updateMatrix()
      inst.setMatrixAt(i, _shellObj.matrix)
    }
    inst.instanceMatrix.needsUpdate = true
    inst.computeBoundingSphere()
  }, [])

  return (
    <group>
      {/* 2 Trụ thép góc mảnh #1E2229 tại [1.25, -0.15, 9.85] & [5.45, -0.15, 9.85], cao tới y = 4.18 */}
      {[1.25, 5.45].map((px, idx) => (
        <group key={`pergola-post-${idx}`}>
          <BB p={[px, -0.15, 9.85]} s={[0.18, 0.03, 0.18]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
          <BB p={[px, -0.15, 9.85]} s={[0.105, 4.3, 0.105]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
        </group>
      ))}

      {/* Khung xà thép mảnh #1E2229 ở y = 4.04..4.18 (nằm gọn dưới dầm đua Tầng 2 y = 4.22) */}
      <B p={[1.25, 4.11, 8.2]} s={[0.11, 0.14, 3.5]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      <B p={[5.45, 4.11, 8.2]} s={[0.11, 0.14, 3.5]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      <B p={[3.35, 4.11, 9.85]} s={[4.31, 0.14, 0.12]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      <B p={[3.35, 4.11, 6.5]} s={[4.31, 0.14, 0.1]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      {/* Thanh đỡ giữa & tay ngàm gắn sạch vào dầm tường Tầng 1 */}
      <B p={[3.35, 4.085, 8.175]} s={[0.06, 0.09, 3.35]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      {[1.25, 5.45].map((tx, idx) => (
        <B key={`tie-${idx}`} p={[tx, 4.11, 6.39]} s={[0.1, 0.12, 0.22]} c={TRIM_BLACK} metal={0.65} rough={0.34} shadow={false} />
      ))}

      {/* Hệ thanh lam gỗ Teak #C68642 gộp InstancedMesh */}
      <instancedMesh
        ref={slatInstRef}
        args={[UNIT_BOX_GEOM, slatMat, louverCount]}
        castShadow={false}
        receiveShadow
        raycast={noopRaycast}
      />
    </group>
  )
}

/** Hệ trụ cột góc cố định giữ hình khối kiến trúc luôn vững chắc khi tường hạ/mờ */
function StructuralCornerColumns({
  palette,
  showFloor2,
}: {
  palette: ReturnType<typeof getHousePalette>
  showFloor2: boolean
}) {
  const H1 = FLOOR1_HEIGHT
  const H2 = FLOOR2_HEIGHT
  const Y = FLOOR2_Y
  const colColor = palette.extWall
  const colGroupRef = useRef<THREE.Group>(null)
  const travTex = useMemo(() => getCachedTravTex(0.5, 2.2), [])

  useEffect(() => {
    const grp = colGroupRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'wall')
  }, [showFloor2])

  const f1Corners: [number, number][] = [
    [-15.74, -6.14],
    [-15.74, 6.14],
    [-10.14, -6.14],
    [-10.14, 6.14],
    [10.14, -6.14],
    [10.14, 6.14],
  ]

  const f2Corners: [number, number][] = [
    [-10.11, -6.14],
    [-10.11, 6.32],
    [10.11, -6.14],
    [10.11, 6.32],
  ]

  return (
    <group ref={colGroupRef}>
      {f1Corners.map(([cx, cz], i) => (
        <B
          key={`c1-${i}`}
          p={[cx, H1 / 2, cz]}
          s={[0.34, H1, 0.34]}
          map={travTex}
          c={colColor}
          rough={0.4}
          shadow
        />
      ))}
      {showFloor2 &&
        f2Corners.map(([cx, cz], i) => (
          <B
            key={`c2-${i}`}
            p={[cx, Y + H2 / 2, cz]}
            s={[0.34, H2, 0.34]}
            map={travTex}
            c={colColor}
            rough={0.4}
            shadow
          />
        ))}
    </group>
  )
}

/* ============================================================================
 * 1. DYNAMIC WALL CUTAWAY / GHOST MODE (3 chế độ: Full / Cutaway / Ghost)
 * ============================================================================ */
function CutawayWall({
  normal,
  baseY,
  cutawayEnabled,
  wallMode,
  privacy = false,
  darkMode,
  facadeChildren,
  children,
}: {
  normal: V3
  baseY: number
  fullHeight?: number
  cutawayEnabled: boolean
  wallMode: ShellWallMode
  privacy?: boolean
  darkMode: boolean
  facadeChildren?: ReactNode
  children: ReactNode
}) {
  const masonryRef = useRef<THREE.Group>(null)
  const facadeRef = useRef<THREE.Group>(null)
  const prevStateRef = useRef<ShellWallMode | null>(null)

  useLayoutEffect(() => {
    prevStateRef.current = null
  }, [darkMode, privacy])

  useEffect(() => {
    const grp = masonryRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'wall')
  }, [])

  useEffect(() => {
    const grp = masonryRef.current
    return () => {
      if (!grp) return
      grp.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        if (mesh.userData.ghostMat) {
          ;(mesh.userData.ghostMat as THREE.Material).dispose()
          mesh.userData.ghostMat = undefined
        }
      })
    }
  }, [])

  useFrame(({ camera }) => {
    if (!masonryRef.current) return
    const shouldCut = cutawayEnabled && isWallCutByCamera(camera.position, normal)
    const visualState: ShellWallMode = !shouldCut ? 'full' : wallMode
    if (visualState === prevStateRef.current) return
    prevStateRef.current = visualState

    if (visualState === 'cutaway') {
      // Ẩn hoàn toàn phần tường xây & mặt tiền (kính, khung, ban công, lam Teak, rèm voan) để lộ 100% nội thất sắc nét
      masonryRef.current.visible = false
      if (facadeRef.current) facadeRef.current.visible = false
      return
    }

    masonryRef.current.visible = true
    if (facadeRef.current) facadeRef.current.visible = true
    const isGhost = visualState === 'ghost'

    masonryRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return

      if (
        mesh.userData.origMat === undefined ||
        (mesh.material !== mesh.userData.ghostMat && mesh.material !== mesh.userData.origMat)
      ) {
        mesh.userData.origMat = mesh.material
        if (mesh.userData.origCastShadow === undefined) {
          mesh.userData.origCastShadow = mesh.castShadow
        }
        if (mesh.userData.ghostMat) {
          ;(mesh.userData.ghostMat as THREE.Material).dispose()
          mesh.userData.ghostMat = undefined
        }
      }

      if (isGhost) {
        if (!mesh.userData.ghostMat || mesh.userData.ghostPrivacy !== privacy) {
          if (mesh.userData.ghostMat) {
            ;(mesh.userData.ghostMat as THREE.Material).dispose()
          }
          const orig = mesh.userData.origMat as THREE.MeshStandardMaterial
          const cloned = orig.clone()
          cloned.transparent = true
          cloned.opacity = privacy ? 0.28 : 0.1
          cloned.depthWrite = false
          if (privacy) {
            cloned.roughness = 0.55
          }
          cloned.needsUpdate = true
          mesh.userData.ghostMat = cloned
          mesh.userData.ghostPrivacy = privacy
        }
        mesh.material = mesh.userData.ghostMat
        mesh.castShadow = false
      } else if (mesh.userData.origMat !== undefined) {
        mesh.material = mesh.userData.origMat
        mesh.castShadow = Boolean(mesh.userData.origCastShadow)
      }
    })
  })

  return (
    <group position={[0, baseY, 0]}>
      <group ref={masonryRef}>{children}</group>
      {facadeChildren && <group ref={facadeRef}>{facadeChildren}</group>}
    </group>
  )
}

/* ============================================================================
 * 2. SÀN KHỐI ĐẶC TẦNG 1 (BoxGeometry dày 0.3 units, mảng 6 material)
 * ============================================================================ */
function SolidFloor1Slabs({
  darkMode,
  onFloorClick,
}: {
  darkMode: boolean
  onFloorClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const palette = getHousePalette(darkMode)
  const slabsRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const grp = slabsRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'slab')
  }, [])

  const floorMap = useMemo(() => getCachedFloorWoodMap(), [])
  const marbleMap = useMemo(() => getCachedFloorMarbleMap(), [])

  const handleFloorClick = useMemo(() => {
    if (!onFloorClick) return undefined
    return (e: ThreeEvent<MouseEvent>) => {
      if (!isValidClick(e.clientX, e.clientY)) return
      if (isHouseClosedOverview()) return
      onFloorClick(e)
    }
  }, [onFloorClick])

  const livingMats = useMemo(() => {
    const topMat = new THREE.MeshStandardMaterial({
      map: floorMap,
      roughness: 0.48,
      metalness: 0.04,
      color: palette.floorTint,
    })
    const edgeMat = new THREE.MeshStandardMaterial({
      color: palette.subFloor,
      roughness: 0.82,
      metalness: 0.02,
    })
    const bottomMat = new THREE.MeshStandardMaterial({
      color: '#2B2D2F',
      roughness: 0.88,
      metalness: 0.04,
    })
    // [right(+x), left(-x), top(+y), bottom(-y), front(+z), back(-z)]
    return [edgeMat, edgeMat, topMat, bottomMat, edgeMat, edgeMat]
  }, [floorMap, palette.floorTint, palette.subFloor])

  const bathMats = useMemo(() => {
    const topMat = new THREE.MeshStandardMaterial({
      map: marbleMap,
      roughness: 0.38,
      metalness: 0.05,
      color: darkMode ? '#ACA59B' : '#DCD5CB',
    })
    const edgeMat = new THREE.MeshStandardMaterial({
      color: palette.subFloor,
      roughness: 0.82,
      metalness: 0.02,
    })
    const bottomMat = new THREE.MeshStandardMaterial({
      color: '#2B2D2F',
      roughness: 0.88,
      metalness: 0.04,
    })
    return [edgeMat, edgeMat, topMat, bottomMat, edgeMat, edgeMat]
  }, [marbleMap, darkMode, palette.subFloor])

  return (
    <group ref={slabsRef}>
      {/* Sàn khối đặc Phòng sinh hoạt (x: -10..10, z: -6..6, y: -0.30..0) */}
      <mesh
        position={[0, -SLAB_THICKNESS / 2, 0]}
        material={livingMats}
        castShadow
        receiveShadow
        onClick={handleFloorClick}
        onDoubleClick={handleFloorClick}
      >
        <boxGeometry args={[20.0, SLAB_THICKNESS, 12.0]} />
      </mesh>

      {/* Sàn khối đặc Phòng tắm (x: -15.6..-10, z: -6..6, y: -0.30..0) */}
      <mesh
        position={[-12.8, -SLAB_THICKNESS / 2, 0]}
        material={bathMats}
        castShadow
        receiveShadow
        onClick={handleFloorClick}
        onDoubleClick={handleFloorClick}
      >
        <boxGeometry args={[5.6, SLAB_THICKNESS, 12.0]} />
      </mesh>
    </group>
  )
}

/* ============================================================================
 * 3. HỆ VÁCH KÍNH TRÀN VIỀN, LAM GỖ TEAK DỌC & CỬA PIVOT KỊCH TRẦN + MÁI HIÊN
 * ============================================================================ */
let flutedBumpCache: THREE.CanvasTexture | null = null
function getFlutedBumpTexture(): THREE.CanvasTexture {
  if (flutedBumpCache) return flutedBumpCache
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  if (ctx) {
    for (let x = 0; x < 128; x++) {
      const phase = (x / 128) * Math.PI * 2 * 8
      const v = Math.round(128 + 115 * Math.sin(phase))
      ctx.fillStyle = `rgb(${v},${v},${v})`
      ctx.fillRect(x, 0, 1, 16)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 1)
  tex.needsUpdate = true
  flutedBumpCache = tex
  return tex
}

const frostedMatCache = new Map<string, THREE.MeshStandardMaterial>()
function getFrostedGlassMat(darkMode: boolean, fluted: boolean): THREE.MeshStandardMaterial {
  const key = `${darkMode ? 'd' : 'l'}_${fluted ? 'f' : 's'}`
  let mat = frostedMatCache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: darkMode ? (fluted ? '#525E69' : '#6A7580') : fluted ? '#EAE7E0' : '#E8E6E1',
      transparent: true,
      opacity: fluted ? 0.78 : 0.64,
      roughness: fluted ? 0.68 : 0.48,
      metalness: 0.08,
      bumpMap: fluted ? getFlutedBumpTexture() : null,
      bumpScale: fluted ? 0.035 : 0,
      depthWrite: false,
    })
    frostedMatCache.set(key, mat)
  }
  return mat
}

const TEAK_SLAT_INST_MAT = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.48,
  metalness: 0.04,
})

const sheerCurtainMatCache = new Map<string, THREE.MeshStandardMaterial>()
function getSheerCurtainMat(darkMode: boolean, opacity: number): THREE.MeshStandardMaterial {
  const key = `${darkMode ? 'd' : 'l'}_${opacity.toFixed(2)}`
  let mat = sheerCurtainMatCache.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: darkMode ? '#EAE4DA' : '#F4F0E8',
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    sheerCurtainMatCache.set(key, mat)
  }
  return mat
}

function Window3DMullioned({
  pos,
  size,
  orientation,
  bays = 2,
  rows = 1,
  darkMode,
  frosted = false,
  fluted = false,
  sillColor,
}: {
  pos: V3
  size: [number, number] // [width, height]
  orientation: 'z' | 'x' // 'z' = mặt trước/sau, 'x' = mặt trái/phải
  bays?: number
  rows?: number
  darkMode: boolean
  frosted?: boolean
  fluted?: boolean
  sillColor?: string
}) {
  const [W, H] = size
  const frameC = TRIM_BLACK
  const resolvedSill = sillColor ?? TRIM_BLACK
  const rootRef = useRef<THREE.Group>(null)
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frostedMat = useMemo(() => getFrostedGlassMat(darkMode, fluted), [darkMode, fluted])
  const isZ = orientation === 'z'
  const frameDepth = WALL_THICKNESS + 0.025
  const frameThick = 0.048
  const mullionThick = 0.028

  useEffect(() => {
    const grp = rootRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'glass')
  }, [])

  return (
    <group ref={rootRef} position={pos}>
      {/* Tấm kính khối đặc tràn viền */}
      <mesh
        material={frosted ? frostedMat : glassMat}
        userData={{ origCastShadow: false }}
      >
        <boxGeometry args={isZ ? [W - 0.06, H - 0.06, 0.03] : [0.03, H - 0.06, W - 0.06]} />
      </mesh>

      {/* Khung bao nhôm đen mờ siêu mảnh (Matte Black) */}
      <B
        p={[0, H / 2 - frameThick / 2, 0]}
        s={isZ ? [W, frameThick, frameDepth] : [frameDepth, frameThick, W]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow={false}
      />
      <B
        p={[0, -H / 2 + frameThick / 2, 0]}
        s={isZ ? [W, frameThick, frameDepth] : [frameDepth, frameThick, W]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow={false}
      />
      <B
        p={isZ ? [-W / 2 + frameThick / 2, 0, 0] : [0, 0, -W / 2 + frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow={false}
      />
      <B
        p={isZ ? [W / 2 - frameThick / 2, 0, 0] : [0, 0, W / 2 - frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow={false}
      />

      {/* Đố đứng chia nhịp kính panorama mảnh mai */}
      {Array.from({ length: Math.max(0, bays - 1) }, (_, i) => {
        const offset = -W / 2 + ((i + 1) * W) / bays
        return (
          <B
            key={`v-${i}`}
            p={isZ ? [offset, 0, 0] : [0, 0, offset]}
            s={isZ ? [mullionThick, H - frameThick * 2, frameDepth - 0.035] : [frameDepth - 0.035, H - frameThick * 2, mullionThick]}
            c={frameC}
            rough={0.34}
            metal={0.62}
            shadow={false}
          />
        )
      })}

      {/* Chỉ chia tầng ngang khi được yêu cầu tường minh (mặc định rows = 1 không chia chữ thập) */}
      {Array.from({ length: Math.max(0, rows - 1) }, (_, i) => {
        const offsetY = -H / 2 + ((i + 1) * H) / rows
        return (
          <B
            key={`h-${i}`}
            p={[0, offsetY, 0]}
            s={isZ ? [W - frameThick * 2, mullionThick, frameDepth - 0.04] : [frameDepth - 0.04, mullionThick, W - frameThick * 2]}
            c={frameC}
            rough={0.34}
            metal={0.62}
            shadow={false}
          />
        )
      })}

      {/* Ngưỡng/nẹp chân vách kính âm mỏng sắc nét */}
      <B
        p={[0, -H / 2 - 0.018, 0]}
        s={isZ ? [W + 0.06, 0.036, WALL_THICKNESS + 0.06] : [WALL_THICKNESS + 0.06, 0.036, W + 0.06]}
        c={resolvedSill}
        rough={0.55}
        metal={0.25}
        shadow={false}
      />
    </group>
  )
}

/** Hệ lam gỗ Teak dọc ốp ngoại thất mặt tiền + tấm nền khe âm tối màu (InstancedMesh) */
function VerticalTeakCladding({
  xRange,
  yRange,
  z = 6.295,
  pitch = 0.135,
  slatW = 0.068,
  slatD = 0.055,
  darkMode,
}: {
  xRange: [number, number]
  yRange: [number, number]
  z?: number
  pitch?: number
  slatW?: number
  slatD?: number
  darkMode: boolean
}) {
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange
  const width = xMax - xMin
  const height = yMax - yMin
  const cx = (xMin + xMax) / 2
  const cy = (yMin + yMax) / 2
  const count = Math.max(2, Math.floor((width - 0.06) / pitch) + 1)
  const span = (count - 1) * pitch
  const startX = cx - span / 2
  const slatsRef = useRef<THREE.InstancedMesh>(null)

  const backColor = TRIM_BLACK

  useLayoutEffect(() => {
    const inst = slatsRef.current
    if (!inst) return
    const tones = darkMode
      ? [TEAK_DEEP, TEAK_WARM, '#A8672B']
      : [TEAK_WARM, TEAK_DEEP, '#CE8E4B']
    _shellObj.rotation.set(0, 0, 0)
    _shellObj.scale.set(slatW, height, slatD)
    for (let i = 0; i < count; i++) {
      _shellObj.position.set(startX + i * pitch, cy, z + slatD / 2 - 0.01)
      _shellObj.updateMatrix()
      inst.setMatrixAt(i, _shellObj.matrix)
      _shellColor.set(tones[i % tones.length])
      inst.setColorAt(i, _shellColor)
    }
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    inst.computeBoundingSphere()
  }, [count, startX, pitch, cy, z, slatW, height, slatD, darkMode])

  return (
    <group>
      {/* Tấm nền khe rãnh tối màu phía sau lam gỗ */}
      <B p={[cx, cy, z - 0.018]} s={[width - 0.02, height, 0.016]} c={backColor} rough={0.78} shadow={false} />
      <instancedMesh
        key={count}
        ref={slatsRef}
        args={[UNIT_BOX_GEOM, TEAK_SLAT_INST_MAT, count]}
        castShadow={false}
        receiveShadow
        raycast={noopRaycast}
      />
    </group>
  )
}

function MainEntranceDoor({
  darkMode,
  onYardClick,
}: {
  darkMode: boolean
  onYardClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const [doorOpen, setDoorOpen] = useState(false)
  const leafRef = useRef<THREE.Group>(null)
  const frameGroupRef = useRef<THREE.Group>(null)
  const sidelightRef = useRef<THREE.Mesh>(null)
  const canopyRef = useRef<THREE.Group>(null)
  const closedOverview = useStore((s) => isHouseClosedOverview(s))
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frameC = TRIM_BLACK
  const brassHandle = darkMode ? '#C9B48C' : '#D9C8A5'
  const canopyTrim = TRIM_BLACK

  const doorWoodTex = useMemo(() => getCachedTeakTex(1.8, 0.85, Math.PI / 2), [])
  const soffitTex = useMemo(() => getCachedTeakTex(3.2, 0.85), [])

  useEffect(() => {
    const cleanups: (() => void)[] = []
    if (frameGroupRef.current) cleanups.push(registerOccluderMesh(frameGroupRef.current, 'wall'))
    if (sidelightRef.current) cleanups.push(registerOccluderMesh(sidelightRef.current, 'glass'))
    if (canopyRef.current) cleanups.push(registerOccluderMesh(canopyRef.current, 'roof'))
    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [])

  useFrame((_, dt) => {
    if (!leafRef.current) return
    const DOOR_X = -1.4
    const DOOR_Z = 6.14
    const PROXIMITY_RADIUS = 1.8
    const khoaNear =
      LIVE_ACTORS.khoaFloorY < 1.2 &&
      Math.hypot(LIVE_ACTORS.khoaPos[0] - DOOR_X, LIVE_ACTORS.khoaPos[1] - DOOR_Z) <= PROXIMITY_RADIUS
    const girlNear =
      LIVE_ACTORS.girlPos[1] < 1.2 &&
      Math.hypot(LIVE_ACTORS.girlPos[0] - DOOR_X, LIVE_ACTORS.girlPos[2] - DOOR_Z) <= PROXIMITY_RADIUS
    const isOpen = doorOpen || khoaNear || girlNear
    const targetRot = isOpen ? -1.35 : 0
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 9)
    leafRef.current.rotation.y = THREE.MathUtils.lerp(leafRef.current.rotation.y, targetRot, k)
  })

  // Vị trí cửa chính Pivot kịch trần: x = -1.40, z = +6.14, lọt lòng rộng 1.70 (x: -2.25..-0.55), cao kịch trần 4.18
  return (
    <group position={[-1.4, 0, 6.14]}>
      {/* Khung bao nhôm đen mờ #1E2229 toàn chiều cao y = 0..4.18 */}
      <group ref={frameGroupRef}>
        <BB p={[-0.825, 0, 0]} s={[0.05, 4.18, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        <BB p={[0.825, 0, 0]} s={[0.05, 4.18, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        <B p={[0, 4.155, 0]} s={[1.7, 0.05, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow={false} />

        {/* Nẹp hồi đứng bọc hai bên khối Teak sảnh chính (world x = -3.50 & +1.10) */}
        <BB p={[-2.1, 0, 0.14]} s={[0.048, 4.18, 0.24]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        <BB p={[2.5, 0, 0.14]} s={[0.048, 4.18, 0.24]} c={frameC} rough={0.34} metal={0.62} shadow={false} />

        {/* Đố phân ô kính sidelight */}
        <BB p={[0.44, 0.04, 0]} s={[0.042, 4.09, 0.28]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
      </group>
      {/* Ô kính dọc mảnh kịch trần bên phải (sidelight x: +0.44..+0.80, y: 0.04..4.13) */}
      <mesh ref={sidelightRef} position={[0.62, 2.085, 0]} material={glassMat}>
        <boxGeometry args={[0.32, 4.09, 0.03]} />
      </mesh>

      {/* Bậu đá bazan tối màu (#1E2229) — gắn onYardClick để đi qua ngưỡng cửa mượt mà */}
      <group
        onClick={
          onYardClick
            ? (e) => {
                if (!isValidClick(e.clientX, e.clientY)) return
                e.stopPropagation()
                onYardClick(e)
              }
            : undefined
        }
      >
        <BB p={[0, 0, 0.025]} s={[1.76, 0.04, 0.36]} c={TRIM_BLACK} rough={0.55} shadow={false} />
      </group>

      {/* Cánh cửa gỗ Teak bản lớn dạng trục xoay Pivot cao kịch trần */}
      <Interact
        zone="exterior"
        hint={
          closedOverview
            ? '🚶 Bước vào khám phá bên trong nhà'
            : doorOpen
              ? '🚪 Đóng cửa Pivot chính'
              : '🚪 Mở cửa Pivot chính'
        }
        onClick={(e) => {
          if (e && !isValidClick(e.clientX, e.clientY)) return
          if (isHouseClosedOverview()) {
            const st = useStore.getState()
            st.setMode('fp')
            st.notify('🚶 Bước vào khám phá bên trong nhà')
            return
          }
          setDoorOpen((v) => !v)
        }}
      >
        <group ref={leafRef} position={[-0.62, 0.04, 0]}>
          {/* Thân cánh cửa gỗ Teak ấm #C68642 / #B87333 đặc dày 0.095 */}
          <BB
            p={[0.43, 0, 0]}
            s={[1.22, 4.09, 0.095]}
            map={doorWoodTex}
            c={darkMode ? '#EADBC6' : '#FFFFFF'}
            rough={0.48}
            shadow
          />
          {/* Viền nẹp kim loại đen mảnh đỉnh và chân cánh cửa */}
          <B p={[0.43, 4.075, 0]} s={[1.225, 0.03, 0.1]} c={frameC} metal={0.65} rough={0.3} />
          <B p={[0.43, 0.015, 0]} s={[1.225, 0.03, 0.1]} c={frameC} metal={0.65} rough={0.3} />

          {/* Chỉ rãnh âm dọc kiến trúc mặt ngoài & mặt trong */}
          {[-0.02, 0.32, 0.66].map((rx, idx) => (
            <group key={idx}>
              <B p={[rx, 2.045, 0.049]} s={[0.016, 4.0, 0.008]} c="#3A220F" rough={0.65} />
              <B p={[rx, 2.045, -0.049]} s={[0.016, 4.0, 0.008]} c="#3A220F" rough={0.65} />
            </group>
          ))}

          {/* Khe kính dọc siêu mảnh lấy sáng trên cánh cửa */}
          <mesh position={[0.14, 2.05, 0]} material={glassMat}>
            <boxGeometry args={[0.075, 3.65, 0.105]} />
          </mesh>
          <B p={[0.14, 2.05, 0]} s={[0.1, 3.69, 0.102]} c={frameC} rough={0.34} metal={0.6} />

          {/* Tay nắm kéo dài kim loại vàng Champagne cao 1.95m (mặt ngoài & mặt trong) */}
          <B p={[0.91, 1.48, 0.095]} s={[0.032, 1.95, 0.032]} c={brassHandle} metal={0.88} rough={0.22} shadow={false} />
          <B p={[0.91, 2.22, 0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 0.74, 0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 1.48, -0.095]} s={[0.032, 1.95, 0.032]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 2.22, -0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 0.74, -0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
        </group>
      </Interact>

      {/* MÁI HIÊN ĐUA RA CHE SẢNH CHÍNH TỚI z = 8.05 (bước tiếp nối sạch từ mép đua Tầng 2 z = 7.18 -> z = 8.05, zero z-fighting) */}
      <group ref={canopyRef} position={[0.2, 4.26, 1.476]}>
        {/* Khối mái hiên viền thép đen mờ #1E2229 & mặt trên chống thấm */}
        <B p={[0, 0, 0]} s={[4.64, 0.18, 0.868]} c={canopyTrim} rough={0.4} metal={0.55} shadow />
        <B p={[0, 0.095, 0]} s={[4.48, 0.016, 0.78]} c="#2B303A" rough={0.86} />
        {/* Mặt dưới trần mái hiên ốp gỗ Teak ấm #C68642 */}
        <B
          p={[0, -0.092, 0]}
          s={[4.48, 0.02, 0.78]}
          map={soffitTex}
          c={darkMode ? '#EADBC6' : '#FFFFFF'}
          rough={0.48}
        />
        {/* Dải LED âm trần #FFAE52 chạy dài theo mũi mái hiên sáng cả ban ngày */}
        <B
          p={[0, -0.106, 0.34]}
          s={[4.3, 0.018, 0.045]}
          c={WARM_LED}
          emissive={WARM_LED}
          ei={darkMode ? 2.8 : 2.1}
          shadow={false}
        />
        {/* 2 mắt đèn downlight âm trần mái hiên sáng ấm */}
        {[-1.15, 1.15].map((dx, idx) => (
          <B
            key={idx}
            p={[dx, -0.106, -0.02]}
            s={[0.14, 0.016, 0.14]}
            c={WARM_LED}
            emissive={WARM_LED}
            ei={darkMode ? 2.6 : 1.95}
            shadow={false}
          />
        ))}
      </group>

      {/* 2 mắt downlight sảnh ngay dưới trần khối đua Tầng 2 (z = 6.74, y = 4.202) */}
      {[-0.95, 1.35].map((dx, idx) => (
        <B
          key={`inner-porch-dl-${idx}`}
          p={[dx, 4.202, 0.58]}
          s={[0.14, 0.016, 0.14]}
          c={WARM_LED}
          emissive={WARM_LED}
          ei={darkMode ? 2.6 : 1.95}
          shadow={false}
        />
      ))}

      {/* 2 Đèn hắt tường 2 chiều rọi mảng lam gỗ Teak hai bên cửa chính */}
      {[-1.18, 1.18].map((sx, idx) => (
        <WallSconce key={idx} pos={[sx, 2.25, 0.225]} darkMode={darkMode} />
      ))}

      {/* 1 Đèn pointLight đại diện rọi sảnh mặt tiền ban đêm */}
      {darkMode && (
        <pointLight
          position={[0.1, 3.6, 1.35]}
          intensity={2.6}
          distance={10.5}
          decay={1.8}
          color={WARM_LED}
          castShadow={false}
        />
      )}
    </group>
  )
}

/**
 * Lớp rèm vải voan mỏng xếp ly mềm mịn nằm ngay sau kính mặt tiền (z = 5.82)
 * Nằm trong facadeChildren nên luôn đóng kín tinh tế ở Toàn cảnh & Vào nhà, và tự động ẩn ở Cutaway.
 */
function FacadeSheerCurtain({
  xRange,
  yRange,
  z = 5.82,
  darkMode,
  split = true,
  gap = 0,
  opacity = 0.44,
}: {
  xRange: [number, number]
  yRange: [number, number]
  z?: number
  darkMode: boolean
  split?: boolean
  gap?: number
  opacity?: number
}) {
  const [xMin, xMax] = xRange
  const [yMin, yMax] = yRange
  const totalW = xMax - xMin
  const height = yMax - yMin
  const cy = (yMin + yMax) / 2
  const trackColor = darkMode ? '#1A1C20' : '#25282E'

  const panels = useMemo(() => {
    if (!split) {
      return [{ cx: (xMin + xMax) / 2, w: totalW }]
    }
    const panelW = (totalW - gap) / 2
    return [
      { cx: xMin + panelW / 2, w: panelW },
      { cx: xMax - panelW / 2, w: panelW },
    ]
  }, [xMin, xMax, totalW, split, gap])

  const mat = useMemo(() => getSheerCurtainMat(darkMode, opacity), [darkMode, opacity])

  const panelGeoms = useMemo(() => {
    return panels.map(({ w }) => {
      const segX = Math.max(16, Math.round(w * 10))
      const geom = new THREE.PlaneGeometry(w, height, segX, 1)
      const pos = geom.attributes.position
      const pleats = Math.max(5, Math.round(w * 3.2))
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i)
        const u = (px + w / 2) / w
        pos.setZ(i, Math.sin(u * Math.PI * 2 * pleats) * 0.032)
      }
      pos.needsUpdate = true
      geom.computeVertexNormals()
      return geom
    })
  }, [panels, height])

  useEffect(() => {
    return () => {
      panelGeoms.forEach((g) => g.dispose())
    }
  }, [panelGeoms])

  return (
    <group>
      <B
        p={[(xMin + xMax) / 2, yMax - 0.01, z]}
        s={[totalW, 0.022, 0.03]}
        c={trackColor}
        rough={0.35}
        metal={0.6}
        shadow={false}
      />
      {panels.map((panel, idx) => (
        <mesh
          key={idx}
          position={[panel.cx, cy, z]}
          geometry={panelGeoms[idx]}
          material={mat}
          castShadow={false}
          raycast={noopRaycast}
          userData={{ origCastShadow: false }}
        />
      ))}
    </group>
  )
}

/**
 * Cửa kính lùa thông ra Sân thượng Tầng 2 (x = -10.14, z: 2.1..4.1, y: 0.0..3.6)
 * Tự động mở trượt mượt 2 cánh về 2 phía khi Khoa hoặc Bạn Gái lại gần, hoặc click thủ công.
 */
function TerraceSlidingDoor({ darkMode }: { darkMode: boolean }) {
  const [doorOpen, setDoorOpen] = useState(false)
  const leftLeafRef = useRef<THREE.Group>(null)
  const rightLeafRef = useRef<THREE.Group>(null)
  const frameRef = useRef<THREE.Group>(null)
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frameC = TRIM_BLACK
  const handleC = darkMode ? '#C9B48C' : '#D9C8A5'

  useEffect(() => {
    const grp = frameRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'wall')
  }, [])

  useFrame((_, dt) => {
    const DOOR_X = -10.14
    const DOOR_Z = 3.1
    const PROXIMITY_RADIUS = 2.0
    const khoaNear =
      LIVE_ACTORS.khoaFloorY > 2.5 &&
      Math.hypot(LIVE_ACTORS.khoaPos[0] - DOOR_X, LIVE_ACTORS.khoaPos[1] - DOOR_Z) <= PROXIMITY_RADIUS
    const girlNear =
      LIVE_ACTORS.girlPos[1] > 2.5 &&
      Math.hypot(LIVE_ACTORS.girlPos[0] - DOOR_X, LIVE_ACTORS.girlPos[2] - DOOR_Z) <= PROXIMITY_RADIUS
    const isOpen = doorOpen || khoaNear || girlNear
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 9)
    if (leftLeafRef.current) {
      leftLeafRef.current.position.z = THREE.MathUtils.lerp(
        leftLeafRef.current.position.z,
        isOpen ? -1.42 : -0.485,
        k,
      )
    }
    if (rightLeafRef.current) {
      rightLeafRef.current.position.z = THREE.MathUtils.lerp(
        rightLeafRef.current.position.z,
        isOpen ? 1.42 : 0.485,
        k,
      )
    }
  })

  const leafW = 0.97
  const leafH = 3.48
  const st = 0.045

  return (
    <group position={[-10.14, 0, 3.1]}>
      {/* Khung bao nhôm đen mờ quanh ô cửa lùa */}
      <group ref={frameRef}>
        <B p={[0, 3.575, 0]} s={[WALL_THICKNESS + 0.04, 0.05, 2.04]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        <B p={[0, 1.8, -0.99]} s={[WALL_THICKNESS + 0.04, 3.6, 0.045]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        <B p={[0, 1.8, 0.99]} s={[WALL_THICKNESS + 0.04, 3.6, 0.045]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
        {/* Ngưỡng ray trượt sát sàn & thanh ray dẫn hướng mở rộng dọc mặt ngoài tường */}
        <B p={[0, 0.014, 0]} s={[WALL_THICKNESS + 0.06, 0.028, 2.02]} c={darkMode ? '#1F232A' : '#2C313A'} rough={0.55} shadow={false} />
        <B p={[-0.17, 3.56, 0]} s={[0.07, 0.06, 3.9]} c={frameC} rough={0.34} metal={0.62} shadow={false} />
      </group>

      <Interact
        zone="interior_f2"
        hint={doorOpen ? '🚪 Đóng cửa lùa Sân thượng' : '🚪 Mở cửa lùa Sân thượng'}
        onClick={(e) => {
          if (e && !isValidClick(e.clientX, e.clientY)) return
          setDoorOpen((v) => !v)
        }}
      >
        <group ref={leftLeafRef} position={[-0.17, 1.78, -0.485]}>
          <mesh material={glassMat} userData={{ origCastShadow: false }}>
            <boxGeometry args={[0.024, leafH - st * 2, leafW - st * 2]} />
          </mesh>
          <B p={[0, leafH / 2 - st / 2, 0]} s={[0.042, st, leafW]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, -leafH / 2 + st / 2, 0]} s={[0.042, st, leafW]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, 0, -leafW / 2 + st / 2]} s={[0.042, leafH, st]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, 0, leafW / 2 - st / 2]} s={[0.042, leafH, st]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0.032, -0.35, leafW / 2 - 0.09]} s={[0.02, 0.42, 0.024]} c={handleC} metal={0.85} rough={0.22} />
          <B p={[-0.032, -0.35, leafW / 2 - 0.09]} s={[0.02, 0.42, 0.024]} c={handleC} metal={0.85} rough={0.22} />
        </group>

        <group ref={rightLeafRef} position={[-0.17, 1.78, 0.485]}>
          <mesh material={glassMat} userData={{ origCastShadow: false }}>
            <boxGeometry args={[0.024, leafH - st * 2, leafW - st * 2]} />
          </mesh>
          <B p={[0, leafH / 2 - st / 2, 0]} s={[0.042, st, leafW]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, -leafH / 2 + st / 2, 0]} s={[0.042, st, leafW]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, 0, -leafW / 2 + st / 2]} s={[0.042, leafH, st]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0, 0, leafW / 2 - st / 2]} s={[0.042, leafH, st]} c={frameC} rough={0.32} metal={0.65} />
          <B p={[0.032, -0.35, -leafW / 2 + 0.09]} s={[0.02, 0.42, 0.024]} c={handleC} metal={0.85} rough={0.22} />
          <B p={[-0.032, -0.35, -leafW / 2 + 0.09]} s={[0.02, 0.42, 0.024]} c={handleC} metal={0.85} rough={0.22} />
        </group>
      </Interact>
    </group>
  )
}

/* ============================================================================
 * 4. TƯỜNG BAO TẦNG 1 & VÁCH NGĂN NỘI THẤT (Tường bao 0.28, Vách ngăn 0.16-0.22)
 * ============================================================================ */
function Floor1Envelope({
  darkMode,
  palette,
  cutawayEnabled,
  wallMode,
  onYardClick,
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
  cutawayEnabled: boolean
  wallMode: ShellWallMode
  onYardClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const H = FLOOR1_HEIGHT
  const extC = palette.extWall
  const travTex = useMemo(() => getCachedTravTex(3.2, 1.4), [])
  const bathPartRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const grp = bathPartRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'wall')
  }, [])

  return (
    <group>
      {/* 1. TƯỜNG SAU TẦNG 1 (z = -6.14, dày 0.28: luôn giữ nguyên chiều cao làm phông tựa nội thất chuẩn Diorama) */}
      <CutawayWall
        normal={[0, 0, -1]}
        baseY={0}
        cutawayEnabled={false}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <B
            p={[-5.4, H - 0.17, -5.93]}
            s={[9.1, 0.045, 0.05]}
            c={WARM_LED}
            emissive={WARM_LED}
            ei={darkMode ? 1.95 : 1.35}
            shadow={false}
          />
        }
      >
        <B p={[-2.8, H / 2, -6.16]} s={[26.16, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-12.8, H / 2, -6.02]} s={[5.6, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.4, H / 2, -6.02]} s={[9.2, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[4.6, H / 2, -6.02]} s={[10.8, H, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[0.0, 0.07, -5.985]} s={[20.0, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-12.8, 0.07, -5.985]} s={[5.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0.0, H - 0.08, -5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
        <B p={[-12.8, H - 0.08, -5.96]} s={[5.6, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 2. TƯỜNG TRÁI PHÒNG TẮM (x = -15.74, dày 0.28, bảo mật riêng tư ở Ghost Mode) */}
      <CutawayWall
        normal={[-1, 0, 0]}
        baseY={0}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        privacy
        darkMode={darkMode}
        facadeChildren={
          <Window3DMullioned
            pos={[-15.74, 3.25, -1.6]}
            size={[2.0, 1.0]}
            orientation="x"
            bays={2}
            rows={1}
            darkMode={darkMode}
            frosted
          />
        }
      >
        {/* Đoạn sau cửa sổ (z: -6.0..-2.6) */}
        <B p={[-15.76, H / 2, -4.3]} s={[0.24, H, 3.4]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-15.62, H / 2, -4.3]} s={[0.04, H, 3.4]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn dưới cửa sổ (z: -2.6..-0.6, y: 0..2.75) */}
        <B p={[-15.76, 1.375, -1.6]} s={[0.24, 2.75, 2.0]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-15.62, 1.375, -1.6]} s={[0.04, 2.75, 2.0]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa sổ (z: -2.6..-0.6, y: 3.75..4.35) */}
        <B p={[-15.76, 4.05, -1.6]} s={[0.24, 0.6, 2.0]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-15.62, 4.05, -1.6]} s={[0.04, 0.6, 2.0]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn trước cửa sổ (z: -0.6..+6.0) */}
        <B p={[-15.76, H / 2, 2.7]} s={[0.24, H, 6.6]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-15.62, H / 2, 2.7]} s={[0.04, H, 6.6]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[-15.585, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-15.56, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 3. TƯỜNG PHẢI TẦNG 1 (x = +10.14, dày 0.28, có ô cửa sổ Panorama khớp PanoramicWindow) */}
      <CutawayWall
        normal={[1, 0, 0]}
        baseY={0}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <Window3DMullioned
            pos={[10.14, 2.17, -1.0]}
            size={[5.3, 4.06]}
            orientation="x"
            bays={3}
            rows={1}
            darkMode={darkMode}
          />
        }
      >
        {/* Trụ tường sau cửa sổ (z: -6.0..-3.65) */}
        <B p={[10.16, H / 2, -4.825]} s={[0.24, H, 2.35]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, H / 2, -4.825]} s={[0.04, H, 2.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Bệ chân vách kính kịch trần (z: -3.65..+1.65, y: 0..0.14) */}
        <B p={[10.16, 0.07, -1.0]} s={[0.24, 0.14, 5.3]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 0.07, -1.0]} s={[0.04, 0.14, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô mỏng trên vách kính kịch trần (z: -3.65..+1.65, y: 4.20..4.35) */}
        <B p={[10.16, 4.275, -1.0]} s={[0.24, 0.15, 5.3]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 4.275, -1.0]} s={[0.04, 0.15, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ tường trước cửa sổ (z: +1.65..+6.0) */}
        <B p={[10.16, H / 2, 3.825]} s={[0.24, H, 4.35]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, H / 2, 3.825]} s={[0.04, H, 4.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[9.985, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[9.96, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4A. TƯỜNG MẶT TIỀN PHÒNG TẮM TẦNG 1 (x: -15.88..-10.00, z = +6.14): Mảng đá Travertine đặc xuyên suốt + 1 khe kính dọc mờ + 2 đèn hắt tường */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={0}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        privacy
        darkMode={darkMode}
        facadeChildren={
          <group>
            {/* Duy nhất 1 khe kính dọc hẹp mờ tinh tế ở tâm mảng tường phòng tắm */}
            <Window3DMullioned
              pos={[-12.9, 2.35, 6.14]}
              size={[0.42, 3.0]}
              orientation="z"
              bays={1}
              rows={1}
              darkMode={darkMode}
              frosted
            />
            {/* 2 Đèn hắt tường 2 đầu (WallSconce) hai bên khe kính dọc sáng ấm cả Ban ngày & Ban đêm */}
            <WallSconce pos={[-13.78, 2.35, 6.31]} darkMode={darkMode} />
            <WallSconce pos={[-12.02, 2.35, 6.31]} darkMode={darkMode} />
          </group>
        }
      >
        {/* Mảng tường đặc trái khe kính (x: -15.88..-13.11) */}
        <B p={[-14.495, H / 2, 6.16]} s={[2.77, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-14.355, H / 2, 6.02]} s={[2.49, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Tường đặc dưới khe kính (x: -13.11..-12.69, y: 0..0.85) */}
        <B p={[-12.9, 0.425, 6.16]} s={[0.42, 0.85, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-12.9, 0.425, 6.02]} s={[0.42, 0.85, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên khe kính (x: -13.11..-12.69, y: 3.85..H) */}
        <B p={[-12.9, (H + 3.85) / 2, 6.16]} s={[0.42, H - 3.85, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-12.9, (H + 3.85) / 2, 6.02]} s={[0.42, H - 3.85, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Mảng tường đặc phải khe kính (x: -12.69..-10.00) */}
        <B p={[-11.345, H / 2, 6.16]} s={[2.69, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-11.345, H / 2, 6.02]} s={[2.69, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Rãnh ron đá Travertine tinh tế trên mảng tường mặt tiền phòng tắm */}
        {[0.85, 1.85, 2.85, 3.85].map((jy) => (
          <group key={jy}>
            <B
              p={[-14.495, jy, 6.283]}
              s={[2.73, 0.016, 0.008]}
              c={darkMode ? '#BEB6A8' : '#DBD3C6'}
              rough={0.55}
              shadow={false}
              polyOffset
            />
            <B
              p={[-11.345, jy, 6.283]}
              s={[2.65, 0.016, 0.008]}
              c={darkMode ? '#BEB6A8' : '#DBD3C6'}
              rough={0.55}
              shadow={false}
              polyOffset
            />
          </group>
        ))}
        <B
          p={[-14.5, H / 2, 6.283]}
          s={[0.016, H - 0.04, 0.008]}
          c={darkMode ? '#BEB6A8' : '#DBD3C6'}
          rough={0.55}
          shadow={false}
          polyOffset
        />
        <B
          p={[-11.35, H / 2, 6.283]}
          s={[0.016, H - 0.04, 0.008]}
          c={darkMode ? '#BEB6A8' : '#DBD3C6'}
          rough={0.55}
          shadow={false}
          polyOffset
        />
        {/* Phào chân tường & phào trần phòng tắm */}
        <B p={[-12.8, 0.07, 5.985]} s={[5.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-12.8, H - 0.08, 5.96]} s={[5.6, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4B. TƯỜNG TRƯỚC KHU SINH HOẠT TẦNG 1 (x: -10.00..+10.28, z = +6.14, Cửa Pivot tự động, Lam Teak & Vách kính mở rộng) */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={0}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <group>
            <MainEntranceDoor darkMode={darkMode} onYardClick={onYardClick} />
            <VerticalTeakCladding xRange={[-3.48, -2.27]} yRange={[0.02, 4.18]} z={6.295} darkMode={darkMode} />
            <VerticalTeakCladding xRange={[-0.53, 1.08]} yRange={[0.02, 4.18]} z={6.295} darkMode={darkMode} />
            {/* Vách kính tràn viền Tầng 1 trái - Cầu thang/Bếp mở rộng (x: -9.55..-3.50, y: 0.14..4.20, bays: 4) */}
            <Window3DMullioned
              pos={[-6.525, 2.17, 6.14]}
              size={[6.05, 4.06]}
              orientation="z"
              bays={4}
              rows={1}
              darkMode={darkMode}
            />
            {/* Lớp rèm vải voan mỏng phủ bán phần trang nhã sau kính Tầng 1 trái */}
            <FacadeSheerCurtain
              xRange={[-9.52, -3.53]}
              yRange={[0.16, 4.18]}
              z={5.82}
              darkMode={darkMode}
              split
              gap={0.75}
            />
            {/* Vách kính tràn viền Tầng 1 phải - Phòng khách mở rộng (x: +1.10..+9.15, y: 0.14..4.20, bays: 5) */}
            <Window3DMullioned
              pos={[5.125, 2.17, 6.14]}
              size={[8.05, 4.06]}
              orientation="z"
              bays={5}
              rows={1}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Trụ ngăn giữa phòng tắm & vách kính cầu thang/bếp (x: -10.00..-9.55) */}
        <B p={[-9.775, H / 2, 6.16]} s={[0.45, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-9.775, H / 2, 6.02]} s={[0.45, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng vách kính cầu thang/bếp (x: -9.55..-3.50) */}
        <B p={[-6.525, 0.07, 6.16]} s={[6.05, 0.14, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-6.525, 0.07, 6.02]} s={[6.05, 0.14, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-6.525, 4.275, 6.16]} s={[6.05, 0.15, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-6.525, 4.275, 6.02]} s={[6.05, 0.15, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ cạnh trái cửa chính (x: -3.50..-2.25) */}
        <B p={[-2.875, H / 2, 6.16]} s={[1.25, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-2.875, H / 2, 6.02]} s={[1.25, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô mỏng trên cửa Pivot kịch trần (x: -2.25..-0.55, y: 4.18..4.35) */}
        <B p={[-1.4, 4.265, 6.16]} s={[1.7, 0.17, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-1.4, 4.265, 6.02]} s={[1.7, 0.17, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa cửa chính & phòng khách (x: -0.55..+1.10) */}
        <B p={[0.275, H / 2, 6.16]} s={[1.65, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[0.275, H / 2, 6.02]} s={[1.65, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng vách kính phòng khách (x: +1.10..+9.15) */}
        <B p={[5.125, 0.07, 6.16]} s={[8.05, 0.14, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[5.125, 0.07, 6.02]} s={[8.05, 0.14, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[5.125, 4.275, 6.16]} s={[8.05, 0.15, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[5.125, 4.275, 6.02]} s={[8.05, 0.15, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải phòng khách (x: +9.15..+10.28) */}
        <B p={[9.715, H / 2, 6.16]} s={[1.13, H, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[9.575, H / 2, 6.02]} s={[0.85, H, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />

        {/* Phào chân tường & phào trần mặt trong (ngắt gọn tại cửa chính) */}
        <B p={[-6.125, 0.07, 5.985]} s={[7.75, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[4.725, 0.07, 5.985]} s={[10.55, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0, H - 0.08, 5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 5. VÁCH NGĂN NỘI THẤT PHÒNG TẮM (x = -10.0, dày 0.22) */}
      <group ref={bathPartRef}>
        <B p={[-10.0, H / 2, -5.05]} s={[0.22, H, 1.9]} c={palette.wallPartition} rough={0.85} shadow />
        <B p={[-9.875, 0.07, -5.05]} s={[0.03, 0.14, 1.9]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-10.125, 0.07, -5.05]} s={[0.03, 0.14, 1.9]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-10.0, 3.45, -3.4]} s={[0.22, 1.8, 1.4]} c={palette.wallPartition} rough={0.85} shadow />
        <B p={[-10.0, H / 2, 1.65]} s={[0.22, H, 8.7]} c={palette.wallPartition} rough={0.85} shadow />
        <B p={[-9.875, 0.07, 1.65]} s={[0.03, 0.14, 8.7]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-10.125, 0.07, 1.65]} s={[0.03, 0.14, 8.7]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        {/* Phào trần vách ngăn phòng tắm */}
        <B p={[-9.85, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
        <B p={[-10.15, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </group>

      {/* 6. VÁCH NGĂN NHẸ PHÂN KHU PHÒNG KHÁCH & BẾP/NGỦ (z = -0.05, dày 0.16, cổng vòm thông thoáng không chắn NAV_NODES) */}
      <InteriorLivingPartition palette={palette} />
    </group>
  )
}

function InteriorLivingPartition({ palette }: { palette: ReturnType<typeof getHousePalette> }) {
  const partRef = useRef<THREE.Group>(null)
  useEffect(() => {
    const grp = partRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'wall')
  }, [])

  // Đặt tại z = -0.05 (ngay phía sau SmartTvUnit ở z: 0.07..0.63), chừa hoàn toàn lối đi NAV_NODES hai bên
  return (
    <group ref={partRef}>
      {/* Mảng vách đặc sau kệ TV (x: 2.45..6.05, y: 0..4.05, dày 0.16) */}
      <B p={[4.25, 2.025, -0.05]} s={[3.6, 4.05, 0.16]} c={palette.wallPartition} rough={0.85} shadow />
      {/* Đường viền nhấn gỗ ấm & nẹp Matte Charcoal mặt phòng khách */}
      <B p={[4.25, 2.15, 0.038]} s={[3.35, 3.65, 0.025]} c={palette.wallAccent} rough={0.82} shadow={false} polyOffset />
      {/* Baseboard 0.14 hai mặt vách TV */}
      <B p={[4.25, 0.07, 0.045]} s={[3.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      <B p={[4.25, 0.07, -0.145]} s={[3.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      {/* Crown molding 0.16 dưới mặt đáy sàn Tầng 2 */}
      <B p={[4.25, 3.97, 0.055]} s={[3.6, 0.16, 0.06]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      <B p={[4.25, 3.97, -0.155]} s={[3.6, 0.16, 0.06]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />

      {/* Khung cổng vòm thông thoáng bên phải (x: 6.05..9.98, chừa cao 3.25m không chắn lối đi [7.35, -2.0]<->[7.35, 2.2]) */}
      <B p={[8.02, 3.65, -0.05]} s={[3.95, 0.8, 0.16]} c={palette.wallPartition} rough={0.85} shadow />
      <B p={[9.91, 1.625, -0.05]} s={[0.18, 3.25, 0.16]} c={palette.wallPartition} rough={0.85} shadow />
      <B p={[6.05, 1.625, -0.05]} s={[0.08, 3.25, 0.19]} c="#2B2D2F" rough={0.5} shadow={false} />
      <B p={[8.02, 3.25, -0.05]} s={[3.95, 0.06, 0.19]} c="#2B2D2F" rough={0.5} shadow={false} />

      {/* Khung dầm cổng mở kết nối khu ngủ / cầu thang & phòng khách (x: -1.20..2.45, cao 3.25m thông thoáng) */}
      <B p={[0.625, 3.65, -0.05]} s={[3.65, 0.8, 0.16]} c={palette.wallPartition} rough={0.85} shadow />
      <B p={[2.45, 1.625, -0.05]} s={[0.08, 3.25, 0.19]} c="#2B2D2F" rough={0.5} shadow={false} />
      <B p={[0.625, 3.25, -0.05]} s={[3.65, 0.06, 0.19]} c="#2B2D2F" rough={0.5} shadow={false} />

      {/* Dầm kiến trúc trần dọc ranh giới khu cầu thang/ngủ & sảnh thông tầng (x = -1.20, y: 3.92..4.35, không cột sàn) */}
      <B p={[-1.2, 4.135, -2.95]} s={[0.16, 0.43, 6.1]} c={palette.wallPartition} rough={0.85} shadow={false} />
    </group>
  )
}

/* ============================================================================
 * 5. TƯỜNG BAO TẦNG 2 (dày 0.28, đồng bộ lớp sơn nội thất & CutawayWall Ghost Mode)
 * ============================================================================ */
function Floor2Envelope({
  darkMode,
  palette,
  cutawayEnabled,
  wallMode,
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
  cutawayEnabled: boolean
  wallMode: ShellWallMode
}) {
  const Y = FLOOR2_Y
  const H2 = FLOOR2_HEIGHT
  const extC = palette.extWall
  const railColor = TRIM_BLACK
  const landingSlabRef = useRef<THREE.Group>(null)
  const balconySlabRef = useRef<THREE.Group>(null)
  const balconyGlassRef = useRef<THREE.Mesh>(null)
  const lFrameRef = useRef<THREE.Group>(null)
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const travTex = useMemo(() => getCachedTravTex(3.2, 1.4), [])
  const teakTex = useMemo(() => getCachedTeakTex(9.5, 0.55), [])
  const balconyDeckTex = useMemo(() => getCachedTeakTex(8.5, 0.5), [])

  useEffect(() => {
    const cleanups: (() => void)[] = []
    if (landingSlabRef.current) cleanups.push(registerOccluderMesh(landingSlabRef.current, 'slab'))
    if (balconySlabRef.current) cleanups.push(registerOccluderMesh(balconySlabRef.current, 'slab'))
    if (balconyGlassRef.current) cleanups.push(registerOccluderMesh(balconyGlassRef.current, 'glass'))
    if (lFrameRef.current) cleanups.push(registerOccluderMesh(lFrameRef.current, 'wall'))
    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <group>
      {/* Dải sàn nối mép trong Tầng 2 gặp tường mặt tiền lùi tại z = 6.22 (chừa khoảng thông tầng x > -1.2) */}
      <group ref={landingSlabRef}>
        <B p={[-5.59, Y - 0.15, 6.102]} s={[8.78, 0.3, 0.24]} c={palette.wallCream} rough={0.85} shadow />
      </group>

      {/* 1. TƯỜNG SAU TẦNG 2 (z = -6.14, normal [0,0,-1]: luôn giữ nguyên chiều cao làm phông tựa vòm LED & kệ sách) */}
      <CutawayWall
        normal={[0, 0, -1]}
        baseY={Y}
        cutawayEnabled={false}
        wallMode={wallMode}
        darkMode={darkMode}
      >
        <B p={[0, H2 / 2, -6.16]} s={[20.56, H2, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-5.525, H2 / 2, -6.02]} s={[8.95, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[4.475, H2 / 2, -6.02]} s={[11.05, H2, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.9, 0.07, -5.985]} s={[8.2, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[4.85, 0.07, -5.985]} s={[10.3, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0, H2 - 0.08, -5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 2. TƯỜNG TRÁI TẦNG 2 (x = -10.14, normal [-1,0,0], có Cửa lùa kính ra Sân thượng z: 2.1..4.1, y: 0..3.6) */}
      <CutawayWall
        normal={[-1, 0, 0]}
        baseY={Y}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={<TerraceSlidingDoor darkMode={darkMode} />}
      >
        {/* Đoạn tường sau cửa lùa (z: -6.0..+2.1) */}
        <B p={[-10.16, H2 / 2, -1.95]} s={[0.24, H2, 8.1]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-10.02, H2 / 2, -1.95]} s={[0.04, H2, 8.1]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa lùa Sân thượng (z: +2.1..+4.1, y: 3.6..4.2) */}
        <B p={[-10.16, 3.9, 3.1]} s={[0.24, 0.6, 2.0]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-10.02, 3.9, 3.1]} s={[0.04, 0.6, 2.0]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn tường trước cửa lùa nối tới mặt tiền lùi (z: +4.1..+6.22) */}
        <B p={[-10.16, H2 / 2, 5.16]} s={[0.24, H2, 2.12]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-10.02, H2 / 2, 5.14]} s={[0.04, H2, 2.08]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường ngắt gọn tại ô cửa lùa z: 2.1..4.1 & phào trần */}
        <B p={[-9.985, 0.07, -5.3]} s={[0.03, 0.14, 1.4]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.985, 0.07, 0.45]} s={[0.03, 0.14, 3.3]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.985, 0.07, 5.14]} s={[0.03, 0.14, 2.08]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.96, H2 - 0.08, 0.09]} s={[0.08, 0.16, 12.18]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 3. TƯỜNG PHẢI TẦNG 2 (x = +10.14, normal [+1,0,0], 2 hệ vách kính tràn viền kịch trần) */}
      <CutawayWall
        normal={[1, 0, 0]}
        baseY={Y}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <group>
            {/* Vách kính kịch trần 1 Phòng ngủ (z: -4.12..-0.48, y: 0.14..4.05) */}
            <Window3DMullioned
              pos={[10.14, 2.095, -2.3]}
              size={[3.64, 3.91]}
              orientation="x"
              bays={3}
              rows={1}
              darkMode={darkMode}
            />
            {/* Vách kính kịch trần 2 Sảnh thông tầng (z: +1.1..+4.7, y: 0.14..4.05) */}
            <Window3DMullioned
              pos={[10.14, 2.095, 2.9]}
              size={[3.6, 3.91]}
              orientation="x"
              bays={3}
              rows={1}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Trụ sau (z: -6.0..-4.12) */}
        <B p={[10.16, H2 / 2, -5.06]} s={[0.24, H2, 1.88]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, H2 / 2, -5.06]} s={[0.04, H2, 1.88]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính 1 (z: -4.12..-0.48) */}
        <B p={[10.16, 0.07, -2.3]} s={[0.24, 0.14, 3.64]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 0.07, -2.3]} s={[0.04, 0.14, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 4.125, -2.3]} s={[0.24, 0.15, 3.64]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 4.125, -2.3]} s={[0.04, 0.15, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa 2 vách kính (z: -0.48..+1.10) */}
        <B p={[10.16, H2 / 2, 0.31]} s={[0.24, H2, 1.58]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, H2 / 2, 0.31]} s={[0.04, H2, 1.58]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính 2 (z: +1.10..+4.70) */}
        <B p={[10.16, 0.07, 2.9]} s={[0.24, 0.14, 3.6]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 0.07, 2.9]} s={[0.04, 0.14, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 4.125, 2.9]} s={[0.24, 0.15, 3.6]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, 4.125, 2.9]} s={[0.04, 0.15, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ trước nối mặt tiền lùi (z: +4.70..+6.22) */}
        <B p={[10.16, H2 / 2, 5.46]} s={[0.24, H2, 1.52]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[10.02, H2 / 2, 5.44]} s={[0.04, H2, 1.48]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[9.985, 0.07, 0.09]} s={[0.03, 0.14, 12.18]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[9.96, H2 - 0.08, 0.09]} s={[0.08, 0.16, 12.18]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4. TƯỜNG TRƯỚC TẦNG 2 LÙI TẠI z = 6.32 + ĐUA KHỐI MẠNH MẼ RA z = 7.18 + BAN CÔNG SUỐT MẶT TIỀN + KHUNG CHỮ L NGƯỢC z = 7.24 */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={Y}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <group>
            {/* Vách kính Phòng ngủ Tầng 2 lùi tại z = 6.32 (x: -9.45..-1.40, y: 0.14..4.05, bays: 5) */}
            <Window3DMullioned
              pos={[-5.425, 2.095, 6.32]}
              size={[8.05, 3.91]}
              orientation="z"
              bays={5}
              rows={1}
              darkMode={darkMode}
            />
            {/* Lớp rèm vải voan mỏng xếp ly Phòng ngủ Tầng 2 mặt tiền (z = 6.00) */}
            <FacadeSheerCurtain
              xRange={[-9.42, -1.43]}
              yRange={[0.16, 4.03]}
              z={6.0}
              darkMode={darkMode}
              split
              gap={0.04}
            />
            {/* Vách kính Thông tầng Phòng khách lùi tại z = 6.32 (x: +1.10..+9.15, y: 0.14..4.05, bays: 5) */}
            <Window3DMullioned
              pos={[5.125, 2.095, 6.32]}
              size={[8.05, 3.91]}
              orientation="z"
              bays={5}
              rows={1}
              darkMode={darkMode}
            />
            {/* Hệ lam gỗ Teak dọc mặt tiền trung tâm tựa trên sàn ban công */}
            <VerticalTeakCladding xRange={[-1.36, 1.06]} yRange={[0.14, 4.18]} z={6.475} darkMode={darkMode} />

            {/* KHỐI ĐUA TẦNG 2 MẠNH MẼ TỚI z = 7.18 + TRẦN GỖ TEAK & LED BAN NGÀY + HÀNH LANG BAN CÔNG KÍNH CHẠY DÀI MẶT TIỀN */}
            <group>
              <group ref={balconySlabRef}>
                {/* Kết cấu sàn đua dưới & mũi đá Travertine #F5F2EB nổi khối */}
                <B p={[-0.04, -0.064, 6.6825]} s={[19.96, 0.128, 0.795]} c={extC} map={travTex} rough={0.4} shadow />
                <B p={[-0.04, 0.056, 6.77]} s={[19.96, 0.112, 0.62]} c={railColor} rough={0.45} metal={0.35} shadow />
                <B p={[-0.04, 0.001, 7.13]} s={[19.96, 0.258, 0.1]} c={extC} map={travTex} rough={0.4} shadow />
                {/* Sàn hành lang ban công ốp gỗ Teak ấm chạy dài suốt mặt tiền */}
                <B
                  p={[-0.04, 0.122, 6.7725]}
                  s={[19.96, 0.02, 0.605]}
                  map={balconyDeckTex}
                  c={darkMode ? '#EADBC6' : '#FFFFFF'}
                  rough={0.48}
                />
                {/* Mặt dưới khối đua Tầng 2 ốp kín Gỗ Teak #C68642 */}
                <B
                  p={[-0.04, -0.136, 6.7225]}
                  s={[19.96, 0.016, 0.875]}
                  map={teakTex}
                  c={darkMode ? '#EADBC6' : '#FFFFFF'}
                  rough={0.48}
                />
                {/* Cánh đá Travertine bo mép trái khối đua Tầng 2 */}
                <B p={[-10.149, 2.01, 6.8375]} s={[0.258, 4.3, 0.685]} c={extC} map={travTex} rough={0.4} shadow />
              </group>

              {/* Dải đèn LED #FFAE52 âm trần dưới mũi khối đua Tầng 2 sáng ấm cả Ban ngày & Ban đêm */}
              <B
                p={[-0.04, -0.15, 7.06]}
                s={[19.6, 0.018, 0.045]}
                c={WARM_LED}
                emissive={WARM_LED}
                ei={darkMode ? 2.7 : 2.0}
                shadow={false}
              />

              {/* Lan can kính cường lực trong suốt tại z = 7.12 (nẹp đáy, tay vịn & kẹp chân #1E2229) */}
              <B p={[-0.04, 0.15, 7.12]} s={[19.94, 0.04, 0.055]} c={railColor} rough={0.35} metal={0.62} shadow={false} />
              <mesh ref={balconyGlassRef} position={[-0.04, 0.655, 7.12]} material={glassMat}>
                <boxGeometry args={[19.92, 0.97, 0.028]} />
              </mesh>
              <B p={[-0.04, 1.16, 7.12]} s={[19.96, 0.04, 0.05]} c={railColor} rough={0.35} metal={0.62} shadow={false} />
              {[-8.8, -6.6, -4.4, -2.2, 0.0, 2.2, 4.4, 6.6, 8.8].map((sx, idx) => (
                <B key={idx} p={[sx, 0.21, 7.12]} s={[0.055, 0.14, 0.068]} c={railColor} rough={0.35} metal={0.7} shadow={false} />
              ))}

              {/* 4 chậu cây rủ nhẹ dọc mép ban công (tránh mái hiên sảnh chính x: -3.52..+1.12) */}
              {[-8.1, -4.9, 2.8, 7.4].map((px, idx) => (
                <HangingBalconyPlanter key={`planter-${idx}`} pos={[px, 0.14, 7.25]} darkMode={darkMode} variant={idx} />
              ))}
            </group>

            {/* KHUNG VIỀN KIẾN TRÚC CHỮ L NGƯỢC ĐÁ TRAVERTINE #F5F2EB BÊN PHẢI TẦNG 2 ÔM KHÍT RA z = 7.24 */}
            <group ref={lFrameRef}>
              {/* Thanh ngang trên của chữ L ngược (x: +0.96..+10.56, y: 3.84..4.16 dưới diềm gỗ mái hiên, z: 6.495..7.24) */}
              <B p={[5.76, 4.0, 6.8675]} s={[9.6, 0.32, 0.745]} c={palette.facadeFrame} map={travTex} rough={0.4} shadow />
              {/* Trụ đứng bên phải của chữ L ngược (x: +9.94..+10.56, y: -0.15..3.84, z: 6.495..7.24) */}
              <B p={[10.25, 1.845, 6.8675]} s={[0.62, 3.99, 0.745]} c={palette.facadeFrame} map={travTex} rough={0.4} shadow />
              {/* Hồi góc ôm cạnh phải tạo khối L kiến trúc chắc khỏe */}
              <B p={[10.44, 2.005, 5.9475]} s={[0.24, 4.31, 1.095]} c={palette.facadeFrame} map={travTex} rough={0.4} shadow />
              {/* Dải đèn LED #FFAE52 hắt âm mặt dưới khung chữ L ngược sáng ấm cả Ban ngày & Ban đêm */}
              <B
                p={[5.45, 3.828, 7.12]}
                s={[8.7, 0.02, 0.04]}
                c={WARM_LED}
                emissive={WARM_LED}
                ei={darkMode ? 2.65 : 1.95}
                shadow={false}
              />
            </group>
          </group>
        }
      >
        {/* Trụ góc trái (x: -10.28..-9.45) */}
        <B p={[-9.865, H2 / 2, 6.34]} s={[0.83, H2, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-9.725, H2 / 2, 6.2]} s={[0.55, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính ban công (x: -9.45..-1.40) */}
        <B p={[-5.425, 0.07, 6.34]} s={[8.05, 0.14, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-5.425, 0.07, 6.2]} s={[8.05, 0.14, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.425, 4.125, 6.34]} s={[8.05, 0.15, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-5.425, 4.125, 6.2]} s={[8.05, 0.15, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ trung tâm mặt tiền giữa hai vách kính lớn (x: -1.40..+1.10) */}
        <B p={[-0.15, H2 / 2, 6.34]} s={[2.5, H2, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[-0.15, H2 / 2, 6.2]} s={[2.5, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính thông tầng (x: +1.10..+9.15) */}
        <B p={[5.125, 0.07, 6.34]} s={[8.05, 0.14, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[5.125, 0.07, 6.2]} s={[8.05, 0.14, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[5.125, 4.125, 6.34]} s={[8.05, 0.15, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[5.125, 4.125, 6.2]} s={[8.05, 0.15, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải (x: +9.15..+10.28) */}
        <B p={[9.715, H2 / 2, 6.34]} s={[1.13, H2, 0.24]} c={extC} map={travTex} rough={0.4} shadow />
        <B p={[9.575, H2 / 2, 6.2]} s={[0.85, H2, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[0, 0.07, 6.165]} s={[20.0, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0, H2 - 0.08, 6.14]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>
    </group>
  )
}

/* ============================================================================
 * 6. HỆ MÁI BẰNG TRAVERTINE #F5F2EB ĐUA TỚI z = 7.75, TRẦN GỖ TEAK SOFFIT & LED BAN NGÀY
 * ============================================================================ */
function RoofSystem({
  darkMode,
  palette,
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
}) {
  const roofColor = palette.extWall
  const senoCapColor = TRIM_BLACK
  const soffitLed = WARM_LED
  const roofRef = useRef<THREE.Group>(null)

  const travTex = useMemo(() => getCachedTravTex(5.5, 3.5), [])
  const frontSoffitTex = useMemo(() => getCachedTeakTex(14.0, 0.65), [])
  const sideSoffitTex = useMemo(() => getCachedTeakTex(8.5, 0.5, Math.PI / 2), [])

  useEffect(() => {
    const grp = roofRef.current
    if (!grp) return
    return registerOccluderMesh(grp, 'roof')
  }, [])

  return (
    <group ref={roofRef}>
      {/* MÁI BẰNG CHÍNH ĐÁ TRAVERTINE #F5F2EB ĐUA SÂU RA TỚI z = 7.75 (x: -10.70..+10.90, z: -6.48..+7.75) */}
      <B p={[0.1, ROOF_Y + 0.15, 0.635]} s={[21.6, 0.3, 14.23]} map={travTex} c={roofColor} rough={0.4} shadow />
      {/* Lớp chống thấm đá sẫm lòng mái seno */}
      <B p={[0.1, ROOF_Y + 0.305, 0.635]} s={[21.0, 0.02, 13.67]} c={darkMode ? '#22262C' : '#6A6E75'} rough={0.92} />

      {/* Viền Seno (Parapet 4 cạnh, y = 8.85..9.15) & Nẹp kim loại Đen mờ #1E2229 */}
      <B p={[0.1, ROOF_Y + 0.45, -6.37]} s={[21.6, 0.3, 0.22]} map={travTex} c={roofColor} rough={0.4} shadow />
      <B p={[0.1, ROOF_Y + 0.45, 7.64]} s={[21.6, 0.3, 0.22]} map={travTex} c={roofColor} rough={0.4} shadow />
      <B p={[-10.59, ROOF_Y + 0.45, 0.635]} s={[0.22, 0.3, 13.79]} map={travTex} c={roofColor} rough={0.4} shadow />
      <B p={[10.79, ROOF_Y + 0.45, 0.635]} s={[0.22, 0.3, 13.79]} map={travTex} c={roofColor} rough={0.4} shadow />

      <B p={[0.1, ROOF_Y + 0.62, -6.37]} s={[21.68, 0.05, 0.26]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[0.1, ROOF_Y + 0.62, 7.64]} s={[21.68, 0.05, 0.26]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[-10.59, ROOF_Y + 0.62, 0.635]} s={[0.26, 0.05, 13.79]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[10.79, ROOF_Y + 0.62, 0.635]} s={[0.26, 0.05, 13.79]} c={senoCapColor} rough={0.36} metal={0.55} />

      {/* Mặt dưới trần mái đua (Soffit) ốp kín Gỗ Teak #C68642 mặt tiền (z: 6.46..7.73) & hai hông */}
      <B
        p={[0.1, ROOF_Y - 0.008, 7.095]}
        s={[21.48, 0.022, 1.27]}
        map={frontSoffitTex}
        c={darkMode ? '#EADBC6' : '#FFFFFF'}
        rough={0.48}
      />
      <B
        p={[10.57, ROOF_Y - 0.008, 0.01]}
        s={[0.58, 0.022, 12.9]}
        map={sideSoffitTex}
        c={darkMode ? '#EADBC6' : '#FFFFFF'}
        rough={0.48}
      />
      <B
        p={[-10.47, ROOF_Y - 0.008, 0.01]}
        s={[0.38, 0.022, 12.9]}
        map={sideSoffitTex}
        c={darkMode ? '#EADBC6' : '#FFFFFF'}
        rough={0.48}
      />

      {/* Dải đèn LED #FFAE52 âm trần chạy dài mặt dưới mái đua sáng CẢ BAN NGÀY LẪN ĐÊM */}
      <B
        p={[0.1, ROOF_Y - 0.024, 7.62]}
        s={[21.0, 0.022, 0.048]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 2.65 : 1.95}
        shadow={false}
      />
      <B
        p={[10.74, ROOF_Y - 0.024, 0.635]}
        s={[0.045, 0.022, 13.8]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 2.5 : 1.9}
        shadow={false}
      />
      <B
        p={[-10.54, ROOF_Y - 0.024, 0.635]}
        s={[0.045, 0.022, 13.8]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 2.5 : 1.9}
        shadow={false}
      />
    </group>
  )
}
