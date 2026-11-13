import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Interact } from './prims'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { LuxuryLandscaping } from './LuxuryLandscaping'
import { RooftopTerrace } from './RooftopTerrace'
import { marbleTiles, outdoorWoodDeck, woodFloor } from './textures'
import { getHousePalette, LIVE_ACTORS, type V3 } from '../data/config'
import { useStore } from '../store'

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

      {/* 7. Hệ Mái bằng Tầng 2 đua rộng 0.6 units, ốp gỗ soffit & đèn LED âm trần */}
      {showRoof && <RoofSystem darkMode={darkMode} palette={palette} />}
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
  const trimColor = palette.crownMolding

  const f1Corners: [number, number][] = [
    [-15.74, -6.14],
    [-15.74, 6.14],
    [-10.14, -6.14],
    [-10.14, 6.14],
    [10.14, -6.14],
    [10.14, 6.14],
  ]

  const f2Corners: [number, number][] = [
    [-10.14, -6.14],
    [-10.14, 6.14],
    [10.14, -6.14],
    [10.14, 6.14],
  ]

  return (
    <group>
      {f1Corners.map(([cx, cz], i) => (
        <group key={`c1-${i}`}>
          <B p={[cx, H1 / 2, cz]} s={[0.34, H1, 0.34]} c={colColor} rough={0.82} shadow />
          <B p={[cx, H1 - 0.06, cz]} s={[0.37, 0.12, 0.37]} c={trimColor} rough={0.75} shadow={false} />
        </group>
      ))}
      {showFloor2 &&
        f2Corners.map(([cx, cz], i) => (
          <group key={`c2-${i}`}>
            <B p={[cx, Y + H2 / 2, cz]} s={[0.34, H2, 0.34]} c={colColor} rough={0.82} shadow />
            <B p={[cx, Y + H2 - 0.06, cz]} s={[0.37, 0.12, 0.37]} c={trimColor} rough={0.75} shadow={false} />
          </group>
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

  const floorMap = useMemo(() => {
    const t = woodFloor().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.5, 2.7)
    t.needsUpdate = true
    return t
  }, [])

  const marbleMap = useMemo(() => {
    const t = marbleTiles().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(2.4, 2.8)
    t.needsUpdate = true
    return t
  }, [])

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
    <group>
      {/* Sàn khối đặc Phòng sinh hoạt (x: -10..10, z: -6..6, y: -0.30..0) */}
      <mesh
        position={[0, -SLAB_THICKNESS / 2, 0]}
        material={livingMats}
        castShadow
        receiveShadow
        onClick={onFloorClick}
        onDoubleClick={onFloorClick}
      >
        <boxGeometry args={[20.0, SLAB_THICKNESS, 12.0]} />
      </mesh>

      {/* Sàn khối đặc Phòng tắm (x: -15.6..-10, z: -6..6, y: -0.30..0) */}
      <mesh
        position={[-12.8, -SLAB_THICKNESS / 2, 0]}
        material={bathMats}
        castShadow
        receiveShadow
        onClick={onFloorClick}
        onDoubleClick={onFloorClick}
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
  const frameC = darkMode ? '#16181B' : '#1C1E22'
  const resolvedSill = sillColor ?? (darkMode ? '#22262E' : '#2E333D')
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frostedMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: darkMode ? (fluted ? '#525E69' : '#6A7580') : fluted ? '#EAE7E0' : '#E8E6E1',
        transparent: true,
        opacity: fluted ? 0.78 : 0.64,
        roughness: fluted ? 0.72 : 0.52,
        metalness: 0.04,
        clearcoat: fluted ? 0.35 : 0.45,
        clearcoatRoughness: fluted ? 0.48 : 0.35,
        bumpMap: fluted ? getFlutedBumpTexture() : null,
        bumpScale: fluted ? 0.035 : 0,
        ior: 1.48,
        depthWrite: false,
      }),
    [darkMode, fluted],
  )
  const isZ = orientation === 'z'
  const frameDepth = WALL_THICKNESS + 0.025
  const frameThick = 0.048
  const mullionThick = 0.028

  return (
    <group position={pos}>
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
        shadow
      />
      <B
        p={[0, -H / 2 + frameThick / 2, 0]}
        s={isZ ? [W, frameThick, frameDepth] : [frameDepth, frameThick, W]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow
      />
      <B
        p={isZ ? [-W / 2 + frameThick / 2, 0, 0] : [0, 0, -W / 2 + frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow
      />
      <B
        p={isZ ? [W / 2 - frameThick / 2, 0, 0] : [0, 0, W / 2 - frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.34}
        metal={0.62}
        shadow
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
        shadow
      />
    </group>
  )
}

/** Hệ lam gỗ Teak dọc ốp ngoại thất mặt tiền + tấm nền khe âm tối màu */
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

  const backColor = darkMode ? '#14171C' : '#1B1F26'
  const tones = darkMode
    ? ['#7D4D2B', '#885530', '#734627']
    : ['#9E6338', '#AA6C3F', '#915931']

  return (
    <group>
      {/* Tấm nền khe rãnh tối màu phía sau lam gỗ */}
      <B p={[cx, cy, z - 0.018]} s={[width - 0.02, height, 0.016]} c={backColor} rough={0.82} shadow={false} />
      {Array.from({ length: count }, (_, i) => (
        <B
          key={i}
          p={[startX + i * pitch, cy, z + slatD / 2 - 0.01]}
          s={[slatW, height, slatD]}
          c={tones[i % tones.length]}
          rough={0.58}
          metal={0.04}
          shadow
        />
      ))}
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
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frameC = darkMode ? '#16181B' : '#1E2228'
  const brassHandle = darkMode ? '#C9B48C' : '#D9C8A5'
  const canopyTrim = darkMode ? '#1B1F25' : '#252A32'

  const doorWoodTex = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.rotation = Math.PI / 2
    t.repeat.set(1.8, 0.85)
    t.needsUpdate = true
    return t
  }, [])

  const soffitTex = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.2, 1.1)
    t.needsUpdate = true
    return t
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
      {/* Khung bao nhôm đen mờ toàn chiều cao y = 0..4.18 */}
      <BB p={[-0.825, 0, 0]} s={[0.05, 4.18, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow />
      <BB p={[0.825, 0, 0]} s={[0.05, 4.18, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow />
      <B p={[0, 4.155, 0]} s={[1.7, 0.05, 0.32]} c={frameC} rough={0.34} metal={0.62} shadow />

      {/* Ô kính dọc mảnh kịch trần bên phải (sidelight x: +0.44..+0.80, y: 0.04..4.13) */}
      <BB p={[0.44, 0.04, 0]} s={[0.042, 4.09, 0.28]} c={frameC} rough={0.34} metal={0.62} shadow />
      <mesh position={[0.62, 2.085, 0]} material={glassMat}>
        <boxGeometry args={[0.32, 4.09, 0.03]} />
      </mesh>

      {/* Bậu đá bazan tối màu (#23272F) — gắn onYardClick để đi qua ngưỡng cửa mượt mà */}
      <group
        onClick={
          onYardClick
            ? (e) => {
                e.stopPropagation()
                onYardClick(e)
              }
            : undefined
        }
      >
        <BB p={[0, 0, 0.025]} s={[1.76, 0.04, 0.36]} c={darkMode ? '#1F232A' : '#2C313A'} rough={0.58} />
      </group>

      {/* Cánh cửa gỗ Teak bản lớn dạng trục xoay Pivot cao kịch trần (rộng 1.22, cao 4.09, Click để đóng/mở) */}
      <Interact
        hint={doorOpen ? '🚪 Đóng cửa Pivot chính' : '🚪 Mở cửa Pivot chính'}
        onClick={() => setDoorOpen((v) => !v)}
      >
        <group ref={leafRef} position={[-0.62, 0.04, 0]}>
          {/* Thân cánh cửa gỗ Teak đặc dày 0.095 */}
          <BB
            p={[0.43, 0, 0]}
            s={[1.22, 4.09, 0.095]}
            map={doorWoodTex}
            c={darkMode ? '#A68E7A' : '#F2E5D6'}
            rough={0.56}
            shadow
          />
          {/* Viền nẹp kim loại đen mảnh đỉnh và chân cánh cửa */}
          <B p={[0.43, 4.075, 0]} s={[1.225, 0.03, 0.1]} c={frameC} metal={0.65} rough={0.3} />
          <B p={[0.43, 0.015, 0]} s={[1.225, 0.03, 0.1]} c={frameC} metal={0.65} rough={0.3} />

          {/* Chỉ rãnh âm dọc kiến trúc mặt ngoài & mặt trong */}
          {[-0.02, 0.32, 0.66].map((rx, idx) => (
            <group key={idx}>
              <B p={[rx, 2.045, 0.049]} s={[0.016, 4.0, 0.008]} c="#2E1E12" rough={0.7} />
              <B p={[rx, 2.045, -0.049]} s={[0.016, 4.0, 0.008]} c="#2E1E12" rough={0.7} />
            </group>
          ))}

          {/* Khe kính dọc siêu mảnh lấy sáng trên cánh cửa */}
          <mesh position={[0.14, 2.05, 0]} material={glassMat}>
            <boxGeometry args={[0.075, 3.65, 0.105]} />
          </mesh>
          <B p={[0.14, 2.05, 0]} s={[0.1, 3.69, 0.102]} c={frameC} rough={0.34} metal={0.6} />

          {/* Tay nắm kéo dài kim loại vàng Champagne cao 1.95m (mặt ngoài & mặt trong) */}
          <B p={[0.91, 1.48, 0.095]} s={[0.032, 1.95, 0.032]} c={brassHandle} metal={0.88} rough={0.22} shadow />
          <B p={[0.91, 2.22, 0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 0.74, 0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 1.48, -0.095]} s={[0.032, 1.95, 0.032]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 2.22, -0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
          <B p={[0.91, 0.74, -0.068]} s={[0.024, 0.024, 0.055]} c={brassHandle} metal={0.88} rough={0.22} />
        </group>
      </Interact>

      {/* MÁI HIÊN ĐUA RA CHE SẢNH CHÍNH (Cantilevered Entrance Canopy: x: -3.52..+1.12, z: +6.26..+7.76, y: 4.17..4.32) */}
      <group position={[0.2, 4.245, 0.87]}>
        {/* Khối mái hiên viền thép đen xám & mặt trên chống thấm */}
        <B p={[0, 0, 0]} s={[4.64, 0.15, 1.5]} c={canopyTrim} rough={0.42} metal={0.5} shadow />
        <B p={[0, 0.078, 0]} s={[4.48, 0.018, 1.38]} c={darkMode ? '#272C34' : '#3A404B'} rough={0.86} />
        {/* Mặt dưới trần mái hiên ốp gỗ Teak ấm áp */}
        <B
          p={[0, -0.072, -0.01]}
          s={[4.46, 0.02, 1.38]}
          map={soffitTex}
          c={darkMode ? '#A68D78' : '#EDDDC8'}
          rough={0.58}
        />
        {/* Dải LED âm trần chạy dài theo mũi mái hiên */}
        <B
          p={[0, -0.084, 0.59]}
          s={[4.26, 0.018, 0.04]}
          c="#FFD7A3"
          emissive="#FFD7A3"
          ei={darkMode ? 2.6 : 0.32}
          shadow={false}
        />
        {/* 2 mắt đèn downlight âm trần mái hiên */}
        {[-1.15, 1.15].map((dx, idx) => (
          <B
            key={idx}
            p={[dx, -0.084, -0.05]}
            s={[0.14, 0.016, 0.14]}
            c="#FFD7A3"
            emissive="#FFD7A3"
            ei={darkMode ? 2.4 : 0.25}
            shadow={false}
          />
        ))}
      </group>

      {/* Đèn tường 2 chiều hắt lam gỗ Teak hai bên cửa chính */}
      {[-1.18, 1.18].map((sx, idx) => (
        <group key={idx} position={[sx, 2.25, 0.22]}>
          <B p={[0, 0, -0.025]} s={[0.09, 0.28, 0.065]} c={frameC} metal={0.55} rough={0.35} shadow />
          <B
            p={[0, 0.125, 0.01]}
            s={[0.07, 0.03, 0.045]}
            c={darkMode ? '#FFD7A3' : '#EFECE6'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.2 : 0.15}
            shadow={false}
          />
          <B
            p={[0, -0.125, 0.01]}
            s={[0.07, 0.03, 0.045]}
            c={darkMode ? '#FFD7A3' : '#EFECE6'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.4 : 0.15}
            shadow={false}
          />
        </group>
      ))}
      {darkMode && (
        <>
          <pointLight position={[0, 3.85, 1.0]} intensity={2.4} distance={8.5} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[0, 1.9, 0.85]} intensity={1.8} distance={6.5} decay={2} color="#FFD7A3" castShadow={false} />
        </>
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

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: darkMode ? '#EAE4DA' : '#F4F0E8',
        roughness: 0.92,
        metalness: 0,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [darkMode, opacity],
  )

  useEffect(() => () => mat.dispose(), [mat])

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
      />
      {panels.map((panel, idx) => (
        <mesh
          key={idx}
          position={[panel.cx, cy, z]}
          geometry={panelGeoms[idx]}
          material={mat}
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
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frameC = darkMode ? '#16181B' : '#1E2228'
  const handleC = darkMode ? '#C9B48C' : '#D9C8A5'

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
      <B p={[0, 3.575, 0]} s={[WALL_THICKNESS + 0.04, 0.05, 2.04]} c={frameC} rough={0.34} metal={0.62} shadow />
      <B p={[0, 1.8, -0.99]} s={[WALL_THICKNESS + 0.04, 3.6, 0.045]} c={frameC} rough={0.34} metal={0.62} shadow />
      <B p={[0, 1.8, 0.99]} s={[WALL_THICKNESS + 0.04, 3.6, 0.045]} c={frameC} rough={0.34} metal={0.62} shadow />
      {/* Ngưỡng ray trượt sát sàn & thanh ray dẫn hướng mở rộng dọc mặt ngoài tường */}
      <B p={[0, 0.014, 0]} s={[WALL_THICKNESS + 0.06, 0.028, 2.02]} c={darkMode ? '#1F232A' : '#2C313A'} rough={0.55} />
      <B p={[-0.17, 3.56, 0]} s={[0.07, 0.06, 3.9]} c={frameC} rough={0.34} metal={0.62} shadow />

      <Interact
        hint={doorOpen ? '🚪 Đóng cửa lùa Sân thượng' : '🚪 Mở cửa lùa Sân thượng'}
        onClick={() => setDoorOpen((v) => !v)}
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
            c="#F5C98B"
            emissive="#F5C98B"
            ei={darkMode ? 1.15 : 1.1}
            shadow={false}
          />
        }
      >
        <B p={[-2.8, H / 2, -6.16]} s={[26.16, H, 0.24]} c={extC} rough={0.85} shadow />
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
        <B p={[-15.76, H / 2, -4.3]} s={[0.24, H, 3.4]} c={extC} rough={0.85} shadow />
        <B p={[-15.62, H / 2, -4.3]} s={[0.04, H, 3.4]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn dưới cửa sổ (z: -2.6..-0.6, y: 0..2.75) */}
        <B p={[-15.76, 1.375, -1.6]} s={[0.24, 2.75, 2.0]} c={extC} rough={0.85} shadow />
        <B p={[-15.62, 1.375, -1.6]} s={[0.04, 2.75, 2.0]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa sổ (z: -2.6..-0.6, y: 3.75..4.35) */}
        <B p={[-15.76, 4.05, -1.6]} s={[0.24, 0.6, 2.0]} c={extC} rough={0.85} shadow />
        <B p={[-15.62, 4.05, -1.6]} s={[0.04, 0.6, 2.0]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn trước cửa sổ (z: -0.6..+6.0) */}
        <B p={[-15.76, H / 2, 2.7]} s={[0.24, H, 6.6]} c={extC} rough={0.85} shadow />
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
        <B p={[10.16, H / 2, -4.825]} s={[0.24, H, 2.35]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H / 2, -4.825]} s={[0.04, H, 2.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Bệ chân vách kính kịch trần (z: -3.65..+1.65, y: 0..0.14) */}
        <B p={[10.16, 0.07, -1.0]} s={[0.24, 0.14, 5.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.07, -1.0]} s={[0.04, 0.14, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô mỏng trên vách kính kịch trần (z: -3.65..+1.65, y: 4.20..4.35) */}
        <B p={[10.16, 4.275, -1.0]} s={[0.24, 0.15, 5.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 4.275, -1.0]} s={[0.04, 0.15, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ tường trước cửa sổ (z: +1.65..+6.0) */}
        <B p={[10.16, H / 2, 3.825]} s={[0.24, H, 4.35]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H / 2, 3.825]} s={[0.04, H, 4.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[9.985, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[9.96, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4A. TƯỜNG MẶT TIỀN PHÒNG TẮM TẦNG 1 (x: -15.88..-10.00, z = +6.14, tường đặc 0..2.85m + ô kính mờ đặt cao 2.85..3.75m) */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={0}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        privacy
        darkMode={darkMode}
        facadeChildren={
          <group>
            {/* Ô cửa kính sọc mờ đặt cao bảo mật tuyệt đối Phòng tắm (x: -14.80..-11.00, y: 2.85..3.75, bays: 6) */}
            <Window3DMullioned
              pos={[-12.9, 3.3, 6.14]}
              size={[3.8, 0.9]}
              orientation="z"
              bays={6}
              rows={1}
              darkMode={darkMode}
              frosted
              fluted
            />
            {/* Lớp voan mỏng trang nhã phía sau ô kính mờ phòng tắm */}
            <FacadeSheerCurtain
              xRange={[-14.76, -11.04]}
              yRange={[2.88, 3.72]}
              z={5.82}
              darkMode={darkMode}
              split={false}
            />
          </group>
        }
      >
        {/* Trụ góc trái phòng tắm (x: -15.88..-14.80) */}
        <B p={[-15.34, H / 2, 6.16]} s={[1.08, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-15.2, H / 2, 6.02]} s={[0.8, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Tường đặc phía dưới ô kính mờ (x: -14.80..-11.00, y: 0..2.85) */}
        <B p={[-12.9, 1.425, 6.16]} s={[3.8, 2.85, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-12.9, 1.425, 6.02]} s={[3.8, 2.85, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên ô kính mờ (x: -14.80..-11.00, y: 3.75..4.35) */}
        <B p={[-12.9, 4.05, 6.16]} s={[3.8, 0.6, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-12.9, 4.05, 6.02]} s={[3.8, 0.6, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giáp ranh phòng tắm (x: -11.00..-10.00) */}
        <B p={[-10.5, H / 2, 6.16]} s={[1.0, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-10.5, H / 2, 6.02]} s={[1.0, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
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
        <B p={[-9.775, H / 2, 6.16]} s={[0.45, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-9.775, H / 2, 6.02]} s={[0.45, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng vách kính cầu thang/bếp (x: -9.55..-3.50) */}
        <B p={[-6.525, 0.07, 6.16]} s={[6.05, 0.14, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-6.525, 0.07, 6.02]} s={[6.05, 0.14, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-6.525, 4.275, 6.16]} s={[6.05, 0.15, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-6.525, 4.275, 6.02]} s={[6.05, 0.15, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ cạnh trái cửa chính (x: -3.50..-2.25) */}
        <B p={[-2.875, H / 2, 6.16]} s={[1.25, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-2.875, H / 2, 6.02]} s={[1.25, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô mỏng trên cửa Pivot kịch trần (x: -2.25..-0.55, y: 4.18..4.35) */}
        <B p={[-1.4, 4.265, 6.16]} s={[1.7, 0.17, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-1.4, 4.265, 6.02]} s={[1.7, 0.17, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa cửa chính & phòng khách (x: -0.55..+1.10) */}
        <B p={[0.275, H / 2, 6.16]} s={[1.65, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[0.275, H / 2, 6.02]} s={[1.65, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng vách kính phòng khách (x: +1.10..+9.15) */}
        <B p={[5.125, 0.07, 6.16]} s={[8.05, 0.14, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[5.125, 0.07, 6.02]} s={[8.05, 0.14, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[5.125, 4.275, 6.16]} s={[8.05, 0.15, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[5.125, 4.275, 6.02]} s={[8.05, 0.15, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải phòng khách (x: +9.15..+10.28) */}
        <B p={[9.715, H / 2, 6.16]} s={[1.13, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[9.575, H / 2, 6.02]} s={[0.85, H, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />

        {/* Phào chân tường & phào trần mặt trong (ngắt gọn tại cửa chính) */}
        <B p={[-6.125, 0.07, 5.985]} s={[7.75, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[4.725, 0.07, 5.985]} s={[10.55, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0, H - 0.08, 5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 5. VÁCH NGĂN NỘI THẤT PHÒNG TẮM (x = -10.0, dày 0.22) */}
      <group>
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
  // Đặt tại z = -0.05 (ngay phía sau SmartTvUnit ở z: 0.07..0.63), chừa hoàn toàn lối đi NAV_NODES hai bên
  return (
    <group>
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
  const railColor = darkMode ? '#16181B' : '#1E2228'
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const balconyDeckTex = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4.2, 0.7)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <group>
      {/* 1. TƯỜNG SAU TẦNG 2 (z = -6.14, normal [0,0,-1]: luôn giữ nguyên chiều cao làm phông tựa vòm LED & kệ sách) */}
      <CutawayWall
        normal={[0, 0, -1]}
        baseY={Y}
        cutawayEnabled={false}
        wallMode={wallMode}
        darkMode={darkMode}
      >
        <B p={[0, H2 / 2, -6.16]} s={[20.56, H2, 0.24]} c={extC} rough={0.85} shadow />
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
        <B p={[-10.16, H2 / 2, -1.95]} s={[0.24, H2, 8.1]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, H2 / 2, -1.95]} s={[0.04, H2, 8.1]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa lùa Sân thượng (z: +2.1..+4.1, y: 3.6..4.2) */}
        <B p={[-10.16, 3.9, 3.1]} s={[0.24, 0.6, 2.0]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, 3.9, 3.1]} s={[0.04, 0.6, 2.0]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn tường trước cửa lùa (z: +4.1..+6.0) */}
        <B p={[-10.16, H2 / 2, 5.05]} s={[0.24, H2, 1.9]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, H2 / 2, 5.05]} s={[0.04, H2, 1.9]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường ngắt gọn tại ô cửa lùa z: 2.1..4.1 & phào trần */}
        <B p={[-9.985, 0.07, -5.3]} s={[0.03, 0.14, 1.4]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.985, 0.07, 0.45]} s={[0.03, 0.14, 3.3]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.985, 0.07, 5.05]} s={[0.03, 0.14, 1.9]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.96, H2 - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
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
        <B p={[10.16, H2 / 2, -5.06]} s={[0.24, H2, 1.88]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, -5.06]} s={[0.04, H2, 1.88]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính 1 (z: -4.12..-0.48) */}
        <B p={[10.16, 0.07, -2.3]} s={[0.24, 0.14, 3.64]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.07, -2.3]} s={[0.04, 0.14, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 4.125, -2.3]} s={[0.24, 0.15, 3.64]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 4.125, -2.3]} s={[0.04, 0.15, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa 2 vách kính (z: -0.48..+1.10) */}
        <B p={[10.16, H2 / 2, 0.31]} s={[0.24, H2, 1.58]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, 0.31]} s={[0.04, H2, 1.58]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính 2 (z: +1.10..+4.70) */}
        <B p={[10.16, 0.07, 2.9]} s={[0.24, 0.14, 3.6]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.07, 2.9]} s={[0.04, 0.14, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 4.125, 2.9]} s={[0.24, 0.15, 3.6]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 4.125, 2.9]} s={[0.04, 0.15, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ trước (z: +4.70..+6.0) */}
        <B p={[10.16, H2 / 2, 5.35]} s={[0.24, H2, 1.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, 5.35]} s={[0.04, H2, 1.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[9.985, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[9.96, H2 - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4. TƯỜNG TRƯỚC TẦNG 2 (z = +6.14, Vách kính tràn viền mở rộng, Ban công kính nới rộng, Lam gỗ Teak & Khung chữ L ngược #F4F1EA) */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={Y}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        darkMode={darkMode}
        facadeChildren={
          <group>
            {/* Hệ vách kính tràn viền Ban công Tầng 2 mở rộng (x: -9.45..-1.40, y: 0.14..4.05, bays: 5) */}
            <Window3DMullioned
              pos={[-5.425, 2.095, 6.14]}
              size={[8.05, 3.91]}
              orientation="z"
              bays={5}
              rows={1}
              darkMode={darkMode}
            />
            {/* Lớp rèm vải voan mỏng xếp ly Phòng ngủ Tầng 2 mặt tiền (x: -9.45..-1.40, z = 5.82) */}
            <FacadeSheerCurtain
              xRange={[-9.42, -1.43]}
              yRange={[0.16, 4.03]}
              z={5.82}
              darkMode={darkMode}
              split
              gap={0.04}
            />
            {/* Hệ vách kính tràn viền Thông tầng Phòng khách mở rộng (x: +1.10..+9.15, y: 0.14..4.05, bays: 5) */}
            <Window3DMullioned
              pos={[5.125, 2.095, 6.14]}
              size={[8.05, 3.91]}
              orientation="z"
              bays={5}
              rows={1}
              darkMode={darkMode}
            />
            {/* Hệ lam gỗ Teak dọc mặt tiền trung tâm */}
            <VerticalTeakCladding xRange={[-1.36, 1.06]} yRange={[0.02, 4.18]} z={6.295} darkMode={darkMode} />

            {/* BAN CÔNG KÍNH CƯỜNG LỰC NỚI RỘNG MẶT TIỀN TẦNG 2 (x: -9.52..-1.34, z: 6.14..6.96) */}
            <group>
              <B p={[-5.43, 0.055, 6.55]} s={[8.18, 0.12, 0.82]} c={railColor} rough={0.5} metal={0.35} shadow />
              <B
                p={[-5.43, 0.122, 6.55]}
                s={[8.1, 0.02, 0.76]}
                map={balconyDeckTex}
                c={darkMode ? '#A68D78' : '#EEDEC8'}
                rough={0.68}
              />
              {/* Đèn LED hắt khe dưới mũi ban công */}
              <B
                p={[-5.43, -0.006, 6.91]}
                s={[7.76, 0.015, 0.03]}
                c="#FFD7A3"
                emissive="#FFD7A3"
                ei={darkMode ? 1.7 : 0.2}
                shadow={false}
              />
              {/* Lan can kính cường lực 3 cạnh */}
              <mesh position={[-5.43, 0.64, 6.94]} material={glassMat}>
                <boxGeometry args={[8.12, 1.02, 0.03]} />
              </mesh>
              <mesh position={[-9.5, 0.64, 6.55]} material={glassMat}>
                <boxGeometry args={[0.03, 1.02, 0.78]} />
              </mesh>
              <mesh position={[-1.36, 0.64, 6.55]} material={glassMat}>
                <boxGeometry args={[0.03, 1.02, 0.78]} />
              </mesh>
              {/* Tay vịn nhôm đen mờ siêu mảnh trên đỉnh kính & kẹp chân kính */}
              <B p={[-5.43, 1.16, 6.94]} s={[8.18, 0.04, 0.048]} c={railColor} rough={0.35} metal={0.62} shadow />
              <B p={[-9.496, 1.16, 6.55]} s={[0.048, 0.04, 0.82]} c={railColor} rough={0.35} metal={0.62} shadow />
              <B p={[-1.364, 1.16, 6.55]} s={[0.048, 0.04, 0.82]} c={railColor} rough={0.35} metal={0.62} shadow />
              {[-8.7, -7.05, -5.43, -3.8, -2.15].map((sx, idx) => (
                <B key={idx} p={[sx, 0.2, 6.94]} s={[0.06, 0.14, 0.065]} c={railColor} rough={0.35} metal={0.7} />
              ))}
            </group>

            {/* KHUNG VIỀN KIẾN TRÚC CHỮ L NGƯỢC TRẮNG KEM (#F4F1EA) NHÔ RA +0.45 UNITS BAO KHỐI TẦNG 2 BÊN PHẢI */}
            <group>
              {/* Thanh ngang trên của chữ L ngược (x: +0.96..+10.56, y: 3.84..4.18 nằm khít dưới diềm gỗ mái hiên, z: 6.26..6.73) */}
              <B p={[5.76, 4.01, 6.495]} s={[9.6, 0.34, 0.47]} c={palette.facadeFrame} rough={0.48} shadow />
              {/* Trụ đứng bên phải của chữ L ngược (x: +9.94..+10.56, y: -0.15..4.18, z: 6.26..6.73) */}
              <B p={[10.25, 2.015, 6.495]} s={[0.62, 4.33, 0.47]} c={palette.facadeFrame} rough={0.48} shadow />
              {/* Hồi góc ôm cạnh phải tạo khối L kiến trúc chắc khỏe */}
              <B p={[10.42, 2.015, 5.95]} s={[0.28, 4.33, 1.56]} c={palette.facadeFrame} rough={0.48} shadow />
              {/* Dải đèn LED hắt âm mặt dưới khung chữ L ngược */}
              <B
                p={[5.45, 3.828, 6.56]}
                s={[8.7, 0.02, 0.036]}
                c="#FFD7A3"
                emissive="#FFD7A3"
                ei={darkMode ? 1.8 : 0.22}
                shadow={false}
              />
            </group>
          </group>
        }
      >
        {/* Trụ góc trái (x: -10.28..-9.45) */}
        <B p={[-9.865, H2 / 2, 6.16]} s={[0.83, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-9.725, H2 / 2, 6.02]} s={[0.55, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính ban công (x: -9.45..-1.40) */}
        <B p={[-5.425, 0.07, 6.16]} s={[8.05, 0.14, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-5.425, 0.07, 6.02]} s={[8.05, 0.14, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.425, 4.125, 6.16]} s={[8.05, 0.15, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-5.425, 4.125, 6.02]} s={[8.05, 0.15, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ trung tâm mặt tiền giữa hai vách kính lớn (x: -1.40..+1.10) */}
        <B p={[-0.15, H2 / 2, 6.16]} s={[2.5, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-0.15, H2 / 2, 6.02]} s={[2.5, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Chân & Lanh tô mỏng Vách kính thông tầng (x: +1.10..+9.15) */}
        <B p={[5.125, 0.07, 6.16]} s={[8.05, 0.14, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[5.125, 0.07, 6.02]} s={[8.05, 0.14, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[5.125, 4.125, 6.16]} s={[8.05, 0.15, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[5.125, 4.125, 6.02]} s={[8.05, 0.15, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải (x: +9.15..+10.28) */}
        <B p={[9.715, H2 / 2, 6.16]} s={[1.13, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[9.575, H2 / 2, 6.02]} s={[0.85, H2, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường & phào trần */}
        <B p={[0, 0.07, 5.985]} s={[20.0, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[0, H2 - 0.08, 5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>
    </group>
  )
}

/* ============================================================================
 * 6. HỆ MÁI BẰNG ĐUA RỘNG +0.68 PHÍA TRƯỚC, TRẦN GỖ SOFFIT & DẢI LED ÂM TRẦN
 * ============================================================================ */
function RoofSystem({
  darkMode,
  palette,
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
}) {
  const roofColor = palette.extWall
  const senoCapColor = darkMode ? '#16181B' : '#22262D'
  const soffitLed = '#FFD7A3'

  const frontSoffitTex = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(12.0, 0.5)
    t.needsUpdate = true
    return t
  }, [])

  const sideSoffitTex = useMemo(() => {
    const t = outdoorWoodDeck().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.rotation = Math.PI / 2
    t.repeat.set(7.0, 0.45)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <group>
      {/* MÁI BẰNG CHÍNH TẦNG 2 ĐUA RỘNG RA PHÍA TRƯỚC (y = 8.55..8.85, dày 0.30, x: -10.70..+10.90, z: -6.48..+6.96) */}
      <B p={[0.1, ROOF_Y + 0.15, 0.24]} s={[21.6, 0.3, 13.44]} c={roofColor} rough={0.85} shadow />
      {/* Lớp chống thấm đá sẫm lòng mái seno */}
      <B p={[0.1, ROOF_Y + 0.305, 0.24]} s={[21.0, 0.02, 12.88]} c={darkMode ? '#22262C' : '#6A6E75'} rough={0.92} />

      {/* Viền Seno (Parapet 4 cạnh, y = 8.85..9.15) & Nẹp kim loại Matte Charcoal */}
      <B p={[0.1, ROOF_Y + 0.45, -6.37]} s={[21.6, 0.3, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[0.1, ROOF_Y + 0.45, 6.85]} s={[21.6, 0.3, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[-10.59, ROOF_Y + 0.45, 0.24]} s={[0.22, 0.3, 13.0]} c={roofColor} rough={0.85} shadow />
      <B p={[10.79, ROOF_Y + 0.45, 0.24]} s={[0.22, 0.3, 13.0]} c={roofColor} rough={0.85} shadow />

      <B p={[0.1, ROOF_Y + 0.62, -6.37]} s={[21.68, 0.05, 0.26]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[0.1, ROOF_Y + 0.62, 6.85]} s={[21.68, 0.05, 0.26]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[-10.59, ROOF_Y + 0.62, 0.24]} s={[0.26, 0.05, 13.0]} c={senoCapColor} rough={0.36} metal={0.55} />
      <B p={[10.79, ROOF_Y + 0.62, 0.24]} s={[0.26, 0.05, 13.0]} c={senoCapColor} rough={0.36} metal={0.55} />

      {/* Mặt dưới trần mái đua (Soffit) ốp gỗ ấm áp mặt tiền & hông phải */}
      <B
        p={[0.1, ROOF_Y - 0.008, 6.6]}
        s={[21.48, 0.022, 0.68]}
        map={frontSoffitTex}
        c={darkMode ? '#A68D78' : '#EEDDC7'}
        rough={0.6}
      />
      <B
        p={[10.58, ROOF_Y - 0.008, -0.09]}
        s={[0.58, 0.022, 12.7]}
        map={sideSoffitTex}
        c={darkMode ? '#A68D78' : '#EEDDC7'}
        rough={0.6}
      />

      {/* Dải đèn LED âm trần chạy dài mặt dưới mái đua mặt tiền & bên phải */}
      <B
        p={[0.1, ROOF_Y - 0.022, 6.83]}
        s={[21.0, 0.022, 0.045]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 2.4 : 0.32}
        shadow={false}
      />
      <B
        p={[10.74, ROOF_Y - 0.022, 0.24]}
        s={[0.045, 0.022, 13.0]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 2.1 : 0.28}
        shadow={false}
      />
      {darkMode && (
        <>
          <pointLight position={[-5.4, 8.2, 6.85]} intensity={1.7} distance={9} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[0.2, 8.2, 6.85]} intensity={1.9} distance={9} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[6.5, 8.2, 6.85]} intensity={1.8} distance={9} decay={2} color="#FFD7A3" castShadow={false} />
        </>
      )}
    </group>
  )
}
