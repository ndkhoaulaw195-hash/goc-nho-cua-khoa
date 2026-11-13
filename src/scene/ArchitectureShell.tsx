import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Interact, Sph } from './prims'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { marbleTiles, woodFloor } from './textures'
import { getHousePalette, type V3 } from '../data/config'
import { useStore } from '../store'

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

interface ArchitectureShellProps {
  onFloorClick?: (e: ThreeEvent<MouseEvent>) => void
}

/**
 * Hệ thống Khung Kiến trúc Khối đặc (Solid Volume Architecture Shell)
 * Bao gồm: Sàn khối đặc 0.3 units, Tường bao 4 mặt dày 0.28 với Sims-style CutawayWall,
 * Vách ngăn nội thất 0.16-0.22 units, Cửa chính, Cửa sổ đố 3D, Hệ Mái bằng có seno & giếng trời,
 * và Khuôn viên Sân vườn bậc tam cấp + hiên + sân lát đá + thảm cỏ + cây xanh.
 */
export function ArchitectureShell({ onFloorClick }: ArchitectureShellProps) {
  const darkMode = useStore((s) => s.darkMode)
  const mode = useStore((s) => s.mode)
  const viewPreset = useStore((s) => s.viewPreset)
  const roofVisible = useStore((s) => s.roofVisible)
  const wallMode = useStore((s) => s.wallMode)
  const palette = getHousePalette(darkMode)

  const showFloor2 = viewPreset !== 'floor1'
  const showRoof = viewPreset === 'overview' && roofVisible
  const cutawayFloor1 =
    mode === 'orbit' && wallMode !== 'full' && (viewPreset === 'floor1' || (viewPreset === 'overview' && !roofVisible))
  const cutawayFloor2 =
    mode === 'orbit' && wallMode !== 'full' && (viewPreset === 'floor2' || (viewPreset === 'overview' && !roofVisible))

  return (
    <group>
      {/* 1. Khuôn viên Sân vườn, Nền móng sâu, Sân lát đá, Hiên & 3 Bậc tam cấp */}
      <SiteLandscaping darkMode={darkMode} />

      {/* 2. Sàn Khối đặc Tầng 1 (dày 0.3 units, mảng 6 material, castShadow & receiveShadow) */}
      <SolidFloor1Slabs darkMode={darkMode} onFloorClick={onFloorClick} />

      {/* 3. Trụ cột góc kiến trúc cố định giữ vững khung khối 3D ở mọi góc xoay */}
      <StructuralCornerColumns palette={palette} showFloor2={showFloor2} />

      {/* 4. Hệ Tường bao Tầng 1 (dày 0.28, Sims-style CutawayWall) & Vách ngăn nội thất */}
      <Floor1Envelope
        darkMode={darkMode}
        palette={palette}
        cutawayEnabled={cutawayFloor1}
        wallMode={wallMode}
      />

      {/* 5. Hệ Tường bao Tầng 2 (dày 0.28, ẩn hoàn toàn khi viewPreset === 'floor1') */}
      <group visible={showFloor2}>
        <Floor2Envelope
          darkMode={darkMode}
          palette={palette}
          cutawayEnabled={cutawayFloor2}
          wallMode={wallMode}
        />
      </group>

      {/* 6. Hệ Mái bằng dày 0.3 + Viền Seno + Giếng trời phòng tắm + Đèn hắt ngoại thất */}
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
 * 1. SIMS-STYLE DYNAMIC WALL CUTAWAY (Tường lửng 1.05m / Tường mờ / Đủ tường)
 * ============================================================================ */
function CutawayWall({
  normal,
  baseY,
  fullHeight,
  cutawayEnabled,
  wallMode,
  wallBox,
  upperChildren,
  children,
}: {
  normal: V3
  baseY: number
  fullHeight: number
  cutawayEnabled: boolean
  wallMode: 'cutaway' | 'ghost' | 'full'
  wallBox: { p: V3; s: V3 }
  upperChildren?: ReactNode
  children: ReactNode
}) {
  const wallRef = useRef<THREE.Group>(null)
  const solidRef = useRef<THREE.Group>(null)
  const upperRef = useRef<THREE.Group>(null)
  const ghostRef = useRef<THREE.Group>(null)
  const curHeightRef = useRef(fullHeight)
  const prevCutShadowRef = useRef(false)

  useFrame(({ camera }, dt) => {
    if (!wallRef.current || !solidRef.current) return

    const shouldCut = cutawayEnabled && isWallCutByCamera(camera.position, normal)
    const isGhost = wallMode === 'ghost' && shouldCut

    if (ghostRef.current) {
      ghostRef.current.visible = isGhost
    }
    solidRef.current.visible = !isGhost

    const targetH = wallMode === 'cutaway' && shouldCut ? CUTAWAY_HEIGHT : fullHeight
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 11)
    let nextH = THREE.MathUtils.lerp(curHeightRef.current, targetH, k)
    if (Math.abs(nextH - targetH) < 0.002) nextH = targetH
    curHeightRef.current = nextH

    const scaleY = nextH / fullHeight
    solidRef.current.scale.y = scaleY

    if (upperRef.current) {
      upperRef.current.visible = !isGhost && scaleY > 0.55
    }

    const disableShadow = isGhost || scaleY < 0.85
    if (disableShadow !== prevCutShadowRef.current) {
      prevCutShadowRef.current = disableShadow
      solidRef.current.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (!mesh.isMesh) return
        if (mesh.userData.origCastShadow === undefined) {
          mesh.userData.origCastShadow = mesh.castShadow
        }
        mesh.castShadow = disableShadow ? false : Boolean(mesh.userData.origCastShadow)
      })
    }
  })

  return (
    <group ref={wallRef} position={[0, baseY, 0]}>
      <group ref={solidRef}>
        {children}
        {upperChildren && <group ref={upperRef}>{upperChildren}</group>}
      </group>
      <group ref={ghostRef} visible={false}>
        <mesh position={wallBox.p}>
          <boxGeometry args={wallBox.s} />
          <meshPhysicalMaterial
            color="#9FB0C0"
            transparent
            opacity={0.14}
            roughness={0.18}
            metalness={0.05}
            depthWrite={false}
          />
        </mesh>
      </group>
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
 * 3. CỬA SỔ 3D CÓ ĐỐ & CỬA CHÍNH RA VÀO (Dùng BoxGeometry, không PlaneGeometry)
 * ============================================================================ */
function Window3DMullioned({
  pos,
  size,
  orientation,
  bays = 2,
  rows = 2,
  darkMode,
  frosted = false,
  sillColor = '#C8C0B4',
}: {
  pos: V3
  size: [number, number] // [width, height]
  orientation: 'z' | 'x' // 'z' = mặt trước/sau, 'x' = mặt trái/phải
  bays?: number
  rows?: number
  darkMode: boolean
  frosted?: boolean
  sillColor?: string
}) {
  const [W, H] = size
  const frameC = darkMode ? '#1E2022' : '#2B2D2F'
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frostedMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: darkMode ? '#6A7580' : '#E8E6E1',
        transparent: true,
        opacity: 0.62,
        roughness: 0.42,
        metalness: 0.05,
        ior: 1.48,
        depthWrite: false,
      }),
    [darkMode],
  )
  const isZ = orientation === 'z'
  const frameDepth = WALL_THICKNESS + 0.03
  const frameThick = 0.065
  const mullionThick = 0.042

  return (
    <group position={pos}>
      {/* Tấm kính khối đặc (BoxGeometry dày 0.03) */}
      <mesh
        material={frosted ? frostedMat : glassMat}
        userData={{ origCastShadow: false }}
      >
        <boxGeometry args={isZ ? [W - 0.08, H - 0.08, 0.03] : [0.03, H - 0.08, W - 0.08]} />
      </mesh>

      {/* Khung bao 4 cạnh ôm khít bề dày tường */}
      <B
        p={[0, H / 2 - frameThick / 2, 0]}
        s={isZ ? [W, frameThick, frameDepth] : [frameDepth, frameThick, W]}
        c={frameC}
        rough={0.32}
        metal={0.55}
        shadow
      />
      <B
        p={[0, -H / 2 + frameThick / 2, 0]}
        s={isZ ? [W, frameThick, frameDepth] : [frameDepth, frameThick, W]}
        c={frameC}
        rough={0.32}
        metal={0.55}
        shadow
      />
      <B
        p={isZ ? [-W / 2 + frameThick / 2, 0, 0] : [0, 0, -W / 2 + frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.32}
        metal={0.55}
        shadow
      />
      <B
        p={isZ ? [W / 2 - frameThick / 2, 0, 0] : [0, 0, W / 2 - frameThick / 2]}
        s={isZ ? [frameThick, H, frameDepth] : [frameDepth, H, frameThick]}
        c={frameC}
        rough={0.32}
        metal={0.55}
        shadow
      />

      {/* Đố đứng chia khoang */}
      {Array.from({ length: Math.max(0, bays - 1) }, (_, i) => {
        const offset = -W / 2 + ((i + 1) * W) / bays
        return (
          <B
            key={`v-${i}`}
            p={isZ ? [offset, 0, 0] : [0, 0, offset]}
            s={isZ ? [mullionThick, H - frameThick * 2, frameDepth - 0.04] : [frameDepth - 0.04, H - frameThick * 2, mullionThick]}
            c={frameC}
            rough={0.32}
            metal={0.55}
          />
        )
      })}

      {/* Đố ngang chia tầng kính */}
      {Array.from({ length: Math.max(0, rows - 1) }, (_, i) => {
        const offsetY = -H / 2 + ((i + 1) * H) / rows
        return (
          <B
            key={`h-${i}`}
            p={[0, offsetY, 0]}
            s={isZ ? [W - frameThick * 2, mullionThick, frameDepth - 0.05] : [frameDepth - 0.05, mullionThick, W - frameThick * 2]}
            c={frameC}
            rough={0.32}
            metal={0.55}
          />
        )
      })}

      {/* Bậu cửa sổ đá nhô nhẹ tạo khối 3D */}
      <B
        p={[0, -H / 2 - 0.025, 0]}
        s={isZ ? [W + 0.14, 0.055, WALL_THICKNESS + 0.12] : [WALL_THICKNESS + 0.12, 0.055, W + 0.14]}
        c={sillColor}
        rough={0.62}
        shadow
      />
    </group>
  )
}

function MainEntranceDoor({ darkMode }: { darkMode: boolean }) {
  const [doorOpen, setDoorOpen] = useState(false)
  const leafRef = useRef<THREE.Group>(null)
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const frameC = darkMode ? '#1E2022' : '#2B2D2F'

  useFrame((_, dt) => {
    if (!leafRef.current) return
    const targetRot = doorOpen ? -Math.PI * 0.44 : 0
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 9)
    leafRef.current.rotation.y = THREE.MathUtils.lerp(leafRef.current.rotation.y, targetRot, k)
  })

  // Vị trí cửa chính: x = -1.40, z = +6.14, lọt lòng rộng 1.70 (x: -2.25..-0.55), cao 2.85 + ô kính lấy sáng 2.85..3.65
  return (
    <group position={[-1.4, 0, 6.14]}>
      {/* Khuôn cửa chính Matte Charcoal ôm khít tường 0.28 */}
      <BB p={[-0.81, 0, 0]} s={[0.08, 3.65, 0.31]} c={frameC} rough={0.4} metal={0.45} shadow />
      <BB p={[0.81, 0, 0]} s={[0.08, 3.65, 0.31]} c={frameC} rough={0.4} metal={0.45} shadow />
      <B p={[0, 3.61, 0]} s={[1.7, 0.08, 0.31]} c={frameC} rough={0.4} metal={0.45} shadow />
      <B p={[0, 2.85, 0]} s={[1.56, 0.07, 0.3]} c={frameC} rough={0.4} metal={0.45} shadow />

      {/* Đố kính lấy sáng cố định bên phải cánh cửa (sidelight x: +0.34..+0.77) */}
      <BB p={[0.34, 0, 0]} s={[0.055, 2.82, 0.28]} c={frameC} rough={0.4} metal={0.45} shadow />
      <mesh position={[0.555, 1.41, 0]} material={glassMat}>
        <boxGeometry args={[0.38, 2.74, 0.03]} />
      </mesh>

      {/* Ô kính lấy sáng trên đầu cửa (transom y: 2.89..3.57) */}
      <mesh position={[0, 3.23, 0]} material={glassMat}>
        <boxGeometry args={[1.54, 0.68, 0.03]} />
      </mesh>
      <B p={[0.34, 3.23, 0]} s={[0.04, 0.68, 0.22]} c={frameC} rough={0.4} metal={0.45} />

      {/* Ngưỡng cửa đá granite (#C8C0B4) */}
      <BB p={[0, 0, 0]} s={[1.74, 0.035, 0.34]} c="#C8C0B4" rough={0.45} />

      {/* Cánh cửa gỗ sồi hiện đại (Click để đóng/mở mượt mà) */}
      <Interact
        hint={doorOpen ? '🚪 Đóng cửa chính' : '🚪 Mở cửa chính'}
        onClick={() => setDoorOpen((v) => !v)}
      >
        <group ref={leafRef} position={[-0.76, 0.035, 0]}>
          {/* Thân cánh cửa gỗ sồi dày 0.065, rộng 1.07 */}
          <BB p={[0.535, 0, 0]} s={[1.07, 2.78, 0.065]} c="#B48E68" rough={0.55} shadow />
          {/* Đường chỉ âm trang trí hiện đại trên mặt ngoài & mặt trong */}
          <B p={[0.535, 1.4, 0.036]} s={[0.88, 2.48, 0.01]} c="#9D7A56" rough={0.6} />
          <B p={[0.535, 1.4, -0.036]} s={[0.88, 2.48, 0.01]} c="#9D7A56" rough={0.6} />
          {/* Khe kính dọc mảnh trên cánh cửa */}
          <mesh position={[0.25, 1.5, 0]} material={glassMat}>
            <boxGeometry args={[0.14, 1.9, 0.075]} />
          </mesh>
          <B p={[0.25, 1.5, 0]} s={[0.17, 1.94, 0.072]} c={frameC} rough={0.35} metal={0.5} />
          {/* Tay nắm kéo dài Matte Charcoal mặt ngoài & mặt trong */}
          <B p={[0.92, 1.18, 0.075]} s={[0.028, 0.68, 0.028]} c={frameC} metal={0.65} rough={0.3} />
          <B p={[0.92, 1.42, 0.048]} s={[0.022, 0.022, 0.045]} c={frameC} metal={0.65} rough={0.3} />
          <B p={[0.92, 0.94, 0.048]} s={[0.022, 0.022, 0.045]} c={frameC} metal={0.65} rough={0.3} />
          <B p={[0.92, 1.18, -0.075]} s={[0.028, 0.68, 0.028]} c={frameC} metal={0.65} rough={0.3} />
        </group>
      </Interact>

      {/* Đèn tường ngoại thất gắn hai bên cửa chính (ấm áp 3000K vào ban đêm) */}
      {[-1.18, 1.18].map((sx, idx) => (
        <group key={idx} position={[sx, 2.35, 0.21]}>
          <B p={[0, 0, -0.04]} s={[0.11, 0.24, 0.06]} c={frameC} metal={0.5} rough={0.35} shadow />
          <B
            p={[0, -0.08, 0.01]}
            s={[0.085, 0.06, 0.06]}
            c={darkMode ? '#FFD7A3' : '#EFECE6'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.1 : 0.15}
            shadow={false}
          />
        </group>
      ))}
      {darkMode && (
        <pointLight position={[0, 2.3, 0.85]} intensity={1.9} distance={6.5} decay={2} color="#FFD7A3" castShadow={false} />
      )}
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
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
  cutawayEnabled: boolean
  wallMode: 'cutaway' | 'ghost' | 'full'
}) {
  const H = FLOOR1_HEIGHT
  const extC = palette.extWall

  return (
    <group>
      {/* 1. TƯỜNG SAU TẦNG 1 (z = -6.14, dày 0.28: ngoài 0.24 tại -6.16 + trong 0.04 tại -6.02) */}
      <CutawayWall
        normal={[0, 0, -1]}
        baseY={0}
        fullHeight={H}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [-2.8, H / 2, -6.14], s: [26.16, H, 0.28] }}
        upperChildren={
          <group>
            <B p={[0.0, H - 0.08, -5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            <B p={[-12.8, H - 0.08, -5.96]} s={[5.6, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            <B
              p={[-5.4, H - 0.17, -5.93]}
              s={[9.1, 0.045, 0.05]}
              c="#F5C98B"
              emissive="#F5C98B"
              ei={darkMode ? 1.15 : 1.1}
              shadow={false}
            />
          </group>
        }
      >
        <B p={[-2.8, H / 2, -6.16]} s={[26.16, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-12.8, H / 2, -6.02]} s={[5.6, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.4, H / 2, -6.02]} s={[9.2, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[4.6, H / 2, -6.02]} s={[10.8, H, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[0.0, 0.07, -5.985]} s={[20.0, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-12.8, 0.07, -5.985]} s={[5.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 2. TƯỜNG TRÁI PHÒNG TẮM (x = -15.74, dày 0.28, có cửa sổ kính mờ trên cao) */}
      <CutawayWall
        normal={[-1, 0, 0]}
        baseY={0}
        fullHeight={H}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [-15.74, H / 2, 0], s: [0.28, H, 12.28] }}
        upperChildren={
          <group>
            <B p={[-15.56, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            <Window3DMullioned
              pos={[-15.74, 3.25, -1.6]}
              size={[2.0, 1.0]}
              orientation="x"
              bays={2}
              rows={1}
              darkMode={darkMode}
              frosted
            />
          </group>
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
        {/* Phào chân tường */}
        <B p={[-15.585, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 3. TƯỜNG PHẢI TẦNG 1 (x = +10.14, dày 0.28, có ô cửa sổ Panorama khớp PanoramicWindow) */}
      <CutawayWall
        normal={[1, 0, 0]}
        baseY={0}
        fullHeight={H}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [10.14, H / 2, 0], s: [0.28, H, 12.28] }}
        upperChildren={
          <group>
            <B p={[9.96, H - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            <Window3DMullioned
              pos={[10.14, 2.25, -1.0]}
              size={[5.3, 3.14]}
              orientation="x"
              bays={3}
              rows={2}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Trụ tường sau cửa sổ (z: -6.0..-3.65) */}
        <B p={[10.16, H / 2, -4.825]} s={[0.24, H, 2.35]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H / 2, -4.825]} s={[0.04, H, 2.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Bệ tường dưới cửa sổ (z: -3.65..+1.65, y: 0..0.68) */}
        <B p={[10.16, 0.34, -1.0]} s={[0.24, 0.68, 5.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.34, -1.0]} s={[0.04, 0.68, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa sổ (z: -3.65..+1.65, y: 3.82..4.35) */}
        <B p={[10.16, 4.085, -1.0]} s={[0.24, 0.53, 5.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 4.085, -1.0]} s={[0.04, 0.53, 5.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ tường trước cửa sổ (z: +1.65..+6.0) */}
        <B p={[10.16, H / 2, 3.825]} s={[0.24, H, 4.35]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H / 2, 3.825]} s={[0.04, H, 4.35]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường */}
        <B p={[9.985, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4. TƯỜNG TRƯỚC TẦNG 1 (z = +6.14, dày 0.28, có Cửa chính ra vào & 3 hệ Cửa sổ 3D có đố) */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={0}
        fullHeight={H}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [-2.8, H / 2, 6.14], s: [26.16, H, 0.28] }}
        upperChildren={
          <group>
            <B p={[-2.8, H - 0.08, 5.96]} s={[25.6, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            <MainEntranceDoor darkMode={darkMode} />
            {/* Cửa sổ 3D Phòng khách phía trước (x: +1.1..+7.7, y: 0.65..3.75) */}
            <Window3DMullioned
              pos={[4.4, 2.2, 6.14]}
              size={[6.6, 3.1]}
              orientation="z"
              bays={4}
              rows={2}
              darkMode={darkMode}
            />
            {/* Cửa sổ 3D Góc thú cưng & Cầu thang (x: -7.1..-3.5, y: 0.85..3.55) */}
            <Window3DMullioned
              pos={[-5.3, 2.2, 6.14]}
              size={[3.6, 2.7]}
              orientation="z"
              bays={2}
              rows={2}
              darkMode={darkMode}
            />
            {/* Cửa sổ kính mờ trên cao Phòng tắm (x: -14.2..-11.4, y: 2.55..3.65) */}
            <Window3DMullioned
              pos={[-12.8, 3.1, 6.14]}
              size={[2.8, 1.1]}
              orientation="z"
              bays={2}
              rows={1}
              darkMode={darkMode}
              frosted
            />
          </group>
        }
      >
        {/* Trụ góc trái phòng tắm (x: -15.88..-14.20) */}
        <B p={[-15.04, H / 2, 6.16]} s={[1.68, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-14.9, H / 2, 6.02]} s={[1.4, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên cửa sổ phòng tắm (x: -14.20..-11.40) */}
        <B p={[-12.8, 1.275, 6.16]} s={[2.8, 2.55, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-12.8, 1.275, 6.02]} s={[2.8, 2.55, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        <B p={[-12.8, 4.0, 6.16]} s={[2.8, 0.7, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-12.8, 4.0, 6.02]} s={[2.8, 0.7, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa phòng tắm & cửa sổ cầu thang (x: -11.40..-7.10) */}
        <B p={[-9.25, H / 2, 6.16]} s={[4.3, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-10.7, H / 2, 6.02]} s={[1.4, H, 0.04]} c={palette.wallBath} rough={0.85} shadow={false} polyOffset />
        <B p={[-8.55, H / 2, 6.02]} s={[2.9, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên cửa sổ trái (x: -7.10..-3.50) */}
        <B p={[-5.3, 0.425, 6.16]} s={[3.6, 0.85, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-5.3, 0.425, 6.02]} s={[3.6, 0.85, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.3, 3.95, 6.16]} s={[3.6, 0.8, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-5.3, 3.95, 6.02]} s={[3.6, 0.8, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ cạnh trái cửa chính (x: -3.50..-2.25) */}
        <B p={[-2.875, H / 2, 6.16]} s={[1.25, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-2.875, H / 2, 6.02]} s={[1.25, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Lanh tô trên cửa chính (x: -2.25..-0.55, y: 3.65..4.35) */}
        <B p={[-1.4, 4.0, 6.16]} s={[1.7, 0.7, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-1.4, 4.0, 6.02]} s={[1.7, 0.7, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa cửa chính & cửa sổ phòng khách (x: -0.55..+1.10) */}
        <B p={[0.275, H / 2, 6.16]} s={[1.65, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[0.275, H / 2, 6.02]} s={[1.65, H, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên cửa sổ phòng khách (x: +1.10..+7.70) */}
        <B p={[4.4, 0.325, 6.16]} s={[6.6, 0.65, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[4.4, 0.325, 6.02]} s={[6.6, 0.65, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[4.4, 4.05, 6.16]} s={[6.6, 0.6, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[4.4, 4.05, 6.02]} s={[6.6, 0.6, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải phòng khách (x: +7.70..+10.28) */}
        <B p={[8.99, H / 2, 6.16]} s={[2.58, H, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[8.85, H / 2, 6.02]} s={[2.3, H, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />

        {/* Phào chân tường mặt trong tường trước (ngắt gọn tại cửa chính) */}
        <B p={[-12.8, 0.07, 5.985]} s={[5.6, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-6.125, 0.07, 5.985]} s={[7.75, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[4.725, 0.07, 5.985]} s={[10.55, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
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
 * 5. TƯỜNG BAO TẦNG 2 (dày 0.28, đồng bộ lớp sơn nội thất & CutawayWall)
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
  wallMode: 'cutaway' | 'ghost' | 'full'
}) {
  const Y = FLOOR2_Y
  const H2 = FLOOR2_HEIGHT
  const extC = palette.extWall

  return (
    <group>
      {/* 1. TƯỜNG SAU TẦNG 2 (z = -6.14, normal [0,0,-1]) */}
      <CutawayWall
        normal={[0, 0, -1]}
        baseY={Y}
        fullHeight={H2}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [0, H2 / 2, -6.14], s: [20.56, H2, 0.28] }}
        upperChildren={
          <B p={[0, H2 - 0.08, -5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
        }
      >
        <B p={[0, H2 / 2, -6.16]} s={[20.56, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-5.525, H2 / 2, -6.02]} s={[8.95, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[4.475, H2 / 2, -6.02]} s={[11.05, H2, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[-5.9, 0.07, -5.985]} s={[8.2, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[4.85, 0.07, -5.985]} s={[10.3, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 2. TƯỜNG TRÁI TẦNG 2 (x = -10.14, normal [-1,0,0]) */}
      <CutawayWall
        normal={[-1, 0, 0]}
        baseY={Y}
        fullHeight={H2}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [-10.14, H2 / 2, 0], s: [0.28, H2, 12.28] }}
        upperChildren={
          <group>
            <B p={[-9.96, H2 - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            {/* Cửa sổ 3D nhỏ trên cao mặt bên Tầng 2 (z: +2.2..+4.2, y: 1.8..3.4) */}
            <Window3DMullioned
              pos={[-10.14, 2.6, 3.2]}
              size={[2.0, 1.6]}
              orientation="x"
              bays={2}
              rows={1}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Đoạn tường sau (z: -6.0..+2.2) */}
        <B p={[-10.16, H2 / 2, -1.9]} s={[0.24, H2, 8.2]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, H2 / 2, -1.9]} s={[0.04, H2, 8.2]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên cửa sổ (z: +2.2..+4.2) */}
        <B p={[-10.16, 0.9, 3.2]} s={[0.24, 1.8, 2.0]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, 0.9, 3.2]} s={[0.04, 1.8, 2.0]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-10.16, 3.8, 3.2]} s={[0.24, 0.8, 2.0]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, 3.8, 3.2]} s={[0.04, 0.8, 2.0]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Đoạn tường trước (z: +4.2..+6.0) */}
        <B p={[-10.16, H2 / 2, 5.1]} s={[0.24, H2, 1.8]} c={extC} rough={0.85} shadow />
        <B p={[-10.02, H2 / 2, 5.1]} s={[0.04, H2, 1.8]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường */}
        <B p={[-9.985, 0.07, -5.3]} s={[0.03, 0.14, 1.4]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
        <B p={[-9.985, 0.07, 2.4]} s={[0.03, 0.14, 7.2]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 3. TƯỜNG PHẢI TẦNG 2 (x = +10.14, normal [+1,0,0], có 2 cửa sổ 3D lớn: phòng ngủ & thông tầng) */}
      <CutawayWall
        normal={[1, 0, 0]}
        baseY={Y}
        fullHeight={H2}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [10.14, H2 / 2, 0], s: [0.28, H2, 12.28] }}
        upperChildren={
          <group>
            <B p={[9.96, H2 - 0.08, 0]} s={[0.08, 0.16, 12.0]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            {/* Cửa sổ 1 khớp SecondFloorCurtains (z: -4.12..-0.48, y: 0.42..3.72) */}
            <Window3DMullioned
              pos={[10.14, 2.07, -2.3]}
              size={[3.64, 3.3]}
              orientation="x"
              bays={3}
              rows={2}
              darkMode={darkMode}
            />
            {/* Cửa sổ 2 chiếu sáng sảnh thông tầng (z: +1.1..+4.7, y: 0.30..3.72) */}
            <Window3DMullioned
              pos={[10.14, 2.01, 2.9]}
              size={[3.6, 3.42]}
              orientation="x"
              bays={3}
              rows={2}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Trụ sau (z: -6.0..-4.12) */}
        <B p={[10.16, H2 / 2, -5.06]} s={[0.24, H2, 1.88]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, -5.06]} s={[0.04, H2, 1.88]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên Cửa sổ 1 (z: -4.12..-0.48) */}
        <B p={[10.16, 0.21, -2.3]} s={[0.24, 0.42, 3.64]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.21, -2.3]} s={[0.04, 0.42, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 3.96, -2.3]} s={[0.24, 0.48, 3.64]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 3.96, -2.3]} s={[0.04, 0.48, 3.64]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa 2 cửa sổ (z: -0.48..+1.10) */}
        <B p={[10.16, H2 / 2, 0.31]} s={[0.24, H2, 1.58]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, 0.31]} s={[0.04, H2, 1.58]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên Cửa sổ 2 (z: +1.10..+4.70) */}
        <B p={[10.16, 0.15, 2.9]} s={[0.24, 0.3, 3.6]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 0.15, 2.9]} s={[0.04, 0.3, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[10.16, 3.96, 2.9]} s={[0.24, 0.48, 3.6]} c={extC} rough={0.85} shadow />
        <B p={[10.02, 3.96, 2.9]} s={[0.04, 0.48, 3.6]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ trước (z: +4.70..+6.0) */}
        <B p={[10.16, H2 / 2, 5.35]} s={[0.24, H2, 1.3]} c={extC} rough={0.85} shadow />
        <B p={[10.02, H2 / 2, 5.35]} s={[0.04, H2, 1.3]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường */}
        <B p={[9.985, 0.07, 0]} s={[0.03, 0.14, 12.0]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>

      {/* 4. TƯỜNG TRƯỚC TẦNG 2 (z = +6.14, normal [0,0,+1], Cửa kính ban công & Kính lớn thông tầng) */}
      <CutawayWall
        normal={[0, 0, 1]}
        baseY={Y}
        fullHeight={H2}
        cutawayEnabled={cutawayEnabled}
        wallMode={wallMode}
        wallBox={{ p: [0, H2 / 2, 6.14], s: [20.56, H2, 0.28] }}
        upperChildren={
          <group>
            <B p={[0, H2 - 0.08, 5.96]} s={[20.0, 0.16, 0.08]} c={palette.crownMolding} rough={0.85} shadow={false} polyOffset />
            {/* Hệ cửa kính lớn mặt tiền Ban công Tầng 2 (x: -7.5..-1.4, y: 0.25..3.65) */}
            <Window3DMullioned
              pos={[-4.45, 1.95, 6.14]}
              size={[6.1, 3.4]}
              orientation="z"
              bays={4}
              rows={2}
              darkMode={darkMode}
            />
            {/* Hệ kính thông tầng Phòng khách (x: +1.1..+7.7, y: 0.30..3.65) */}
            <Window3DMullioned
              pos={[4.4, 1.975, 6.14]}
              size={[6.6, 3.35]}
              orientation="z"
              bays={4}
              rows={2}
              darkMode={darkMode}
            />
          </group>
        }
      >
        {/* Trụ góc trái (x: -10.28..-7.50) */}
        <B p={[-8.89, H2 / 2, 6.16]} s={[2.78, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-8.75, H2 / 2, 6.02]} s={[2.5, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên Cửa kính ban công (x: -7.50..-1.40) */}
        <B p={[-4.45, 0.125, 6.16]} s={[6.1, 0.25, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-4.45, 0.125, 6.02]} s={[6.1, 0.25, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        <B p={[-4.45, 3.925, 6.16]} s={[6.1, 0.55, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-4.45, 3.925, 6.02]} s={[6.1, 0.55, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Trụ giữa mặt tiền (x: -1.40..+1.10) */}
        <B p={[-0.15, H2 / 2, 6.16]} s={[2.5, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[-0.15, H2 / 2, 6.02]} s={[2.5, H2, 0.04]} c={palette.wallCream} rough={0.85} shadow={false} polyOffset />
        {/* Dưới & Trên Kính thông tầng (x: +1.10..+7.70) */}
        <B p={[4.4, 0.15, 6.16]} s={[6.6, 0.3, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[4.4, 0.15, 6.02]} s={[6.6, 0.3, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        <B p={[4.4, 3.925, 6.16]} s={[6.6, 0.55, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[4.4, 3.925, 6.02]} s={[6.6, 0.55, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Trụ góc phải (x: +7.70..+10.28) */}
        <B p={[8.99, H2 / 2, 6.16]} s={[2.58, H2, 0.24]} c={extC} rough={0.85} shadow />
        <B p={[8.85, H2 / 2, 6.02]} s={[2.3, H2, 0.04]} c={palette.wallAccent} rough={0.85} shadow={false} polyOffset />
        {/* Phào chân tường */}
        <B p={[0, 0.07, 5.985]} s={[20.0, 0.14, 0.03]} c={palette.baseboard} rough={0.85} shadow={false} polyOffset />
      </CutawayWall>
    </group>
  )
}

/* ============================================================================
 * 6. HỆ MÁI BẰNG DÀY 0.3 + VIỀN SENO + GIẾNG TRỜI PHÒNG TẮM + ĐÈN HẮT NGOẠI THẤT
 * ============================================================================ */
function RoofSystem({
  darkMode,
  palette,
}: {
  darkMode: boolean
  palette: ReturnType<typeof getHousePalette>
}) {
  const roofColor = palette.extWall
  const senoCapColor = darkMode ? '#1F2123' : '#2B2D2F'
  const soffitLed = '#FFD7A3'
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])

  return (
    <group>
      {/* ---------- A. MÁI BẰNG CHÍNH TẦNG 2 (y = 8.55..8.85, dày 0.30, x: -10.48..+10.48, z: -6.48..+6.48) ---------- */}
      <B p={[0, ROOF_Y + 0.15, 0]} s={[20.96, 0.3, 12.96]} c={roofColor} rough={0.85} shadow />
      {/* Lớp chống thấm đá sẫm lòng mái seno */}
      <B p={[0, ROOF_Y + 0.305, 0]} s={[20.4, 0.02, 12.4]} c={darkMode ? '#2E3136' : '#8D8982'} rough={0.92} />

      {/* Viền Seno (Parapet 4 cạnh, y = 8.85..9.15) & Nẹp kim loại Matte Charcoal */}
      <B p={[0, ROOF_Y + 0.45, -6.37]} s={[20.96, 0.3, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[0, ROOF_Y + 0.45, 6.37]} s={[20.96, 0.3, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[-10.37, ROOF_Y + 0.45, 0]} s={[0.22, 0.3, 12.52]} c={roofColor} rough={0.85} shadow />
      <B p={[10.37, ROOF_Y + 0.45, 0]} s={[0.22, 0.3, 12.52]} c={roofColor} rough={0.85} shadow />

      <B p={[0, ROOF_Y + 0.62, -6.37]} s={[21.04, 0.05, 0.26]} c={senoCapColor} rough={0.38} metal={0.5} />
      <B p={[0, ROOF_Y + 0.62, 6.37]} s={[21.04, 0.05, 0.26]} c={senoCapColor} rough={0.38} metal={0.5} />
      <B p={[-10.37, ROOF_Y + 0.62, 0]} s={[0.26, 0.05, 12.52]} c={senoCapColor} rough={0.38} metal={0.5} />
      <B p={[10.37, ROOF_Y + 0.62, 0]} s={[0.26, 0.05, 12.52]} c={senoCapColor} rough={0.38} metal={0.5} />

      {/* Dải đèn LED hắt trần mái ngoại thất mặt tiền & bên phải */}
      <B
        p={[0, ROOF_Y - 0.01, 6.36]}
        s={[19.8, 0.03, 0.04]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 1.8 : 0.25}
        shadow={false}
      />
      <B
        p={[10.36, ROOF_Y - 0.01, 0]}
        s={[0.04, 0.03, 12.2]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 1.8 : 0.25}
        shadow={false}
      />
      {darkMode && (
        <>
          <pointLight position={[-1.4, 8.2, 6.8]} intensity={1.8} distance={9} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[5.0, 8.2, 6.8]} intensity={1.5} distance={8} decay={2} color="#FFD7A3" castShadow={false} />
        </>
      )}

      {/* ---------- B. MÁI PHÒNG TẮM (y = 4.35..4.65, dày 0.30, x: -16.08..-10.28, z: -6.48..+6.48) + GIẾNG TRỜI ---------- */}
      {/* Ô giếng trời: x: -13.8..-11.8, z: -2.7..-0.5 */}
      {/* Dải mái sau giếng trời (z: -6.48..-2.70) */}
      <B p={[-13.18, FLOOR2_Y + 0.15, -4.59]} s={[5.8, 0.3, 3.78]} c={roofColor} rough={0.85} shadow />
      {/* Dải mái trước giếng trời (z: -0.50..+6.48) */}
      <B p={[-13.18, FLOOR2_Y + 0.15, 2.99]} s={[5.8, 0.3, 6.98]} c={roofColor} rough={0.85} shadow />
      {/* Dải mái trái giếng trời (x: -16.08..-13.80, z: -2.70..-0.50) */}
      <B p={[-14.94, FLOOR2_Y + 0.15, -1.6]} s={[2.28, 0.3, 2.2]} c={roofColor} rough={0.85} shadow />
      {/* Dải mái phải giếng trời (x: -11.80..-10.28, z: -2.70..-0.50) */}
      <B p={[-11.04, FLOOR2_Y + 0.15, -1.6]} s={[1.52, 0.3, 2.2]} c={roofColor} rough={0.85} shadow />

      {/* Viền Seno 3 cạnh ngoài mái phòng tắm (y = 4.65..4.90) */}
      <B p={[-13.18, FLOOR2_Y + 0.425, -6.37]} s={[5.8, 0.25, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[-13.18, FLOOR2_Y + 0.425, 6.37]} s={[5.8, 0.25, 0.22]} c={roofColor} rough={0.85} shadow />
      <B p={[-15.97, FLOOR2_Y + 0.425, 0]} s={[0.22, 0.25, 12.52]} c={roofColor} rough={0.85} shadow />

      <B p={[-13.18, FLOOR2_Y + 0.57, -6.37]} s={[5.86, 0.045, 0.26]} c={senoCapColor} rough={0.38} metal={0.5} />
      <B p={[-13.18, FLOOR2_Y + 0.57, 6.37]} s={[5.86, 0.045, 0.26]} c={senoCapColor} rough={0.38} metal={0.5} />
      <B p={[-15.97, FLOOR2_Y + 0.57, 0]} s={[0.26, 0.045, 12.52]} c={senoCapColor} rough={0.38} metal={0.5} />

      {/* Đèn hắt ngoại thất dưới diềm mái phòng tắm */}
      <B
        p={[-13.18, FLOOR2_Y - 0.01, 6.36]}
        s={[5.2, 0.03, 0.04]}
        c={soffitLed}
        emissive={soffitLed}
        ei={darkMode ? 1.7 : 0.25}
        shadow={false}
      />

      {/* Giếng trời phòng tắm (Skylight x: -13.8..-11.8, z: -2.7..-0.5) */}
      <group position={[-12.8, FLOOR2_Y + 0.36, -1.6]}>
        <B p={[0, 0, -1.12]} s={[2.16, 0.16, 0.08]} c={senoCapColor} rough={0.35} metal={0.55} shadow />
        <B p={[0, 0, 1.12]} s={[2.16, 0.16, 0.08]} c={senoCapColor} rough={0.35} metal={0.55} shadow />
        <B p={[-1.04, 0, 0]} s={[0.08, 0.16, 2.16]} c={senoCapColor} rough={0.35} metal={0.55} shadow />
        <B p={[1.04, 0, 0]} s={[0.08, 0.16, 2.16]} c={senoCapColor} rough={0.35} metal={0.55} shadow />
        {/* Thanh chia giếng trời */}
        <B p={[0, 0.05, 0]} s={[0.05, 0.06, 2.16]} c={senoCapColor} rough={0.35} metal={0.55} />
        <B p={[0, 0.05, 0]} s={[2.0, 0.06, 0.05]} c={senoCapColor} rough={0.35} metal={0.55} />
        {/* Kính giếng trời khối đặc */}
        <mesh position={[0, 0.06, 0]} material={glassMat}>
          <boxGeometry args={[2.04, 0.03, 2.16]} />
        </mesh>
      </group>
    </group>
  )
}

/* ============================================================================
 * 7. SÂN VƯỜN & NỀN MÓNG SÂU (Cỏ xanh #566E4C, Sân đá #D6D1C9, Hiên & 3 Bậc tam cấp)
 * ============================================================================ */
function SiteLandscaping({ darkMode }: { darkMode: boolean }) {
  const lawnColor = darkMode ? '#3B4E35' : '#566E4C'
  const lawnAccent = darkMode ? '#44593D' : '#637D58'
  const stoneColor = darkMode ? '#7C7872' : '#D6D1C9'
  const stoneBorder = darkMode ? '#635F5A' : '#B7AFA5'
  const stepColor = darkMode ? '#6F6B66' : '#C8C0B4'
  const soilColor = darkMode ? '#292420' : '#4A3F35'
  const earthDeep = darkMode ? '#1F1B18' : '#3A332C'
  const plinthColor = '#2B2D2F'

  return (
    <group>
      {/* 1. Khối Nền móng đất sâu & chân tường móng (thay thế hoàn toàn tấm đế đen phẳng cũ) */}
      <B p={[-2.8, -1.42, 1.8]} s={[36.4, 0.14, 24.4]} c={plinthColor} rough={0.88} shadow={false} />
      <B p={[-2.8, -0.88, 1.8]} s={[36.0, 0.94, 24.0]} c={earthDeep} rough={0.95} shadow={false} />
      <B p={[-2.8, -0.355, 1.8]} s={[35.8, 0.11, 23.8]} c={soilColor} rough={0.92} shadow={false} />
      {/* Chân tường móng đá bao quanh chu vi sàn Tầng 1 (y: -0.30..0.00) */}
      <B p={[-2.8, -0.15, -6.14]} s={[26.16, 0.3, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-2.8, -0.15, 6.14]} s={[26.16, 0.3, 0.28]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[-15.74, -0.15, 0]} s={[0.28, 0.3, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />
      <B p={[10.14, -0.15, 0]} s={[0.28, 0.3, 12.0]} c={stoneBorder} rough={0.82} shadow={false} />

      {/* 2. Thảm cỏ xanh (#566E4C) bao quanh ngôi nhà (tránh giao nhau với nhà & sân lát đá) */}
      {/* Cỏ sân sau (z: -10.1..-6.28) */}
      <B p={[-2.8, -0.25, -8.19]} s={[35.8, 0.1, 3.82]} c={lawnColor} rough={0.88} />
      {/* Cỏ bên trái nhà (x: -20.7..-15.88, z: -6.28..+13.7) */}
      <B p={[-18.29, -0.25, 3.71]} s={[4.82, 0.1, 19.98]} c={lawnColor} rough={0.88} />
      {/* Cỏ bên phải sân hông (x: +13.3..+15.1, z: -6.28..+13.7) */}
      <B p={[14.2, -0.25, 3.71]} s={[1.8, 0.1, 19.98]} c={lawnColor} rough={0.88} />
      {/* Cỏ sân trước bên trái lối đi (x: -15.88..-3.2, z: +6.28..+13.7) */}
      <B p={[-9.54, -0.25, 9.99]} s={[12.68, 0.1, 7.42]} c={lawnColor} rough={0.88} />
      {/* Cỏ sân trước bên phải sân lát đá (x: +7.8..+13.3, z: +9.2..+13.7) */}
      <B p={[10.55, -0.25, 11.45]} s={[5.5, 0.1, 4.5]} c={lawnAccent} rough={0.88} />

      {/* 3. Đường dạo & Sân trước lát đá (#D6D1C9) */}
      {/* Sân hông bên phải dọc phòng khách (x: +10.28..+13.3, z: -6.28..+9.2) */}
      <B p={[11.79, -0.255, 1.46]} s={[3.02, 0.09, 15.48]} c={stoneColor} rough={0.76} />
      {/* Sân trước nhà rộng rãi (x: -4.2..+10.28, z: +6.28..+9.2) */}
      <B p={[3.04, -0.255, 7.74]} s={[14.48, 0.09, 2.92]} c={stoneColor} rough={0.76} />
      {/* Đường dạo đá lát bước ra cổng trước (x: -3.2..+0.4, z: +9.2..+13.7) */}
      <B p={[-1.4, -0.255, 11.45]} s={[3.6, 0.09, 4.5]} c={stoneBorder} rough={0.78} />
      {/* Các phiến đá dạo bước nổi khối trên nền cỏ & đường dạo */}
      {[9.55, 10.65, 11.75, 12.85].map((pz, idx) => (
        <B key={idx} p={[-1.4, -0.195, pz]} s={[2.2, 0.04, 0.86]} c={stoneColor} rough={0.68} shadow />
      ))}
      {/* Đường dạo sân vườn bên phải dẫn ra thềm */}
      <B p={[4.1, -0.255, 11.45]} s={[7.4, 0.09, 4.5]} c={lawnColor} rough={0.88} />

      {/* 4. Hiên nhà & 3 Bậc tam cấp dẫn lên Cửa chính tại z = +6.28 (x = -1.40) */}
      {/* Hiên nhà (porch landing: x: -3.15..+0.35, z: +6.28..+7.65, mặt trên y = -0.005) */}
      <B p={[-1.4, -0.11, 6.965]} s={[3.5, 0.21, 1.37]} c={stoneColor} rough={0.65} shadow />
      <B p={[-1.4, -0.02, 7.64]} s={[3.54, 0.04, 0.06]} c={stoneBorder} rough={0.55} />
      {/* Bậc 2 (z: +7.65..+8.10, mặt trên y = -0.08) */}
      <B p={[-1.4, -0.145, 7.875]} s={[3.3, 0.13, 0.45]} c={stepColor} rough={0.65} shadow />
      {/* Bậc 1 (z: +8.10..+8.55, mặt trên y = -0.15) */}
      <B p={[-1.4, -0.18, 8.325]} s={[3.1, 0.06, 0.45]} c={stoneColor} rough={0.65} shadow />
      {/* Đèn LED hắt khe dưới mũi bậc tam cấp vào ban đêm */}
      {darkMode &&
        [7.66, 8.11, 8.56].map((lz, i) => (
          <B
            key={i}
            p={[-1.4, -0.04 - i * 0.075, lz]}
            s={[2.8 - i * 0.2, 0.018, 0.02]}
            c="#FFD7A3"
            emissive="#FFD7A3"
            ei={1.65}
            shadow={false}
          />
        ))}

      {/* 5. Bồn cây xây đá hai bên hiên cửa chính & bồn cây cửa sổ phòng khách */}
      {[
        { x: -4.15, z: 6.85, w: 1.75, d: 1.05 },
        { x: 1.35, z: 6.85, w: 1.75, d: 1.05 },
        { x: 5.2, z: 6.72, w: 4.4, d: 0.78 },
      ].map((pb, idx) => (
        <group key={idx} position={[pb.x, -0.21, pb.z]}>
          <BB p={[0, 0, 0]} s={[pb.w, 0.34, pb.d]} c={stoneBorder} rough={0.78} shadow />
          <BB p={[0, 0.28, 0]} s={[pb.w - 0.14, 0.08, pb.d - 0.14]} c={soilColor} rough={0.94} />
          {/* Bụi cây xanh nhiều lớp trong bồn */}
          {Array.from({ length: Math.max(3, Math.round(pb.w * 2)) }, (_, k) => {
            const count = Math.max(3, Math.round(pb.w * 2))
            const ox = -pb.w * 0.36 + (k / (count - 1)) * (pb.w * 0.72)
            return (
              <group key={k} position={[ox, 0.44, 0]}>
                <Sph p={[0, 0, 0]} s={[0.28, 0.22, 0.26]} c={k % 2 ? lawnAccent : lawnColor} rough={0.78} shadow />
                <Sph p={[0.07, 0.12, 0.04]} s={[0.17, 0.15, 0.17]} c={lawnAccent} rough={0.75} />
              </group>
            )
          })}
        </group>
      ))}

      {/* 6. Cây xanh ngoại thất nhiều tầng tán quanh sân vườn */}
      <GardenTree pos={[-17.8, -0.2, 8.2]} scale={1.15} darkMode={darkMode} />
      <GardenTree pos={[-18.2, -0.2, -3.5]} scale={1.0} darkMode={darkMode} />
      <GardenTree pos={[12.8, -0.2, 7.8]} scale={1.08} darkMode={darkMode} />
      <GardenTree pos={[12.8, -0.2, -4.5]} scale={0.95} darkMode={darkMode} />
      <GardenTree pos={[-10.8, -0.2, 11.4]} scale={0.88} darkMode={darkMode} />

      {/* Cụm bụi cây trang trí góc sân */}
      <GardenShrubCluster pos={[-7.6, -0.2, 9.8]} darkMode={darkMode} />
      <GardenShrubCluster pos={[9.6, -0.2, 11.2]} darkMode={darkMode} />

      {/* 7. Đèn trụ sân vườn (Bollard Lights) dọc lối đi & thềm hiên */}
      {[
        [-3.05, -0.21, 9.15],
        [0.25, -0.21, 9.15],
        [-3.05, -0.21, 11.8],
        [0.25, -0.21, 11.8],
        [12.75, -0.21, 2.2],
      ].map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <Cyl p={[0, 0.03, 0]} rt={0.1} rb={0.11} h={0.06} c="#2B2D2F" metal={0.5} rough={0.4} />
          <Cyl p={[0, 0.36, 0]} rt={0.06} rb={0.06} h={0.62} c="#2B2D2F" metal={0.5} rough={0.35} shadow />
          <Cyl
            p={[0, 0.62, 0]}
            rt={0.056}
            rb={0.056}
            h={0.12}
            c={darkMode ? '#FFD7A3' : '#EFECE6'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.2 : 0.12}
          />
          <Cyl p={[0, 0.7, 0]} rt={0.068} rb={0.068} h={0.04} c="#2B2D2F" metal={0.5} rough={0.35} />
        </group>
      ))}
      {darkMode && (
        <>
          <pointLight position={[-1.4, 0.85, 9.6]} intensity={1.7} distance={7.5} decay={2} color="#FFD7A3" castShadow={false} />
          <pointLight position={[-1.4, 0.85, 12.1]} intensity={1.4} distance={6.5} decay={2} color="#FFD7A3" castShadow={false} />
        </>
      )}
    </group>
  )
}

function GardenTree({ pos, scale = 1, darkMode }: { pos: V3; scale?: number; darkMode: boolean }) {
  const leafDark = darkMode ? '#374931' : '#4C6242'
  const leafMid = darkMode ? '#43583B' : '#566E4C'
  const leafLight = darkMode ? '#516948' : '#6F8763'

  return (
    <G p={pos} s={scale}>
      {/* Gốc & Thân cây chính + 2 nhánh chính */}
      <Cyl p={[0, 1.05, 0]} rt={0.14} rb={0.22} h={2.1} c="#5C4938" rough={0.88} shadow />
      <Cyl p={[-0.28, 1.95, 0.12]} r={[0.2, 0, 0.45]} rt={0.07} rb={0.11} h={0.95} c="#5C4938" rough={0.88} />
      <Cyl p={[0.3, 2.05, -0.12]} r={[-0.2, 0, -0.48]} rt={0.07} rb={0.11} h={0.95} c="#5C4938" rough={0.88} />

      {/* Hệ tán lá 3 tầng tạo chiều sâu hữu cơ */}
      <Sph p={[0, 2.55, 0]} s={[1.15, 0.82, 1.15]} c={leafDark} rough={0.82} shadow />
      <Sph p={[-0.68, 2.38, 0.35]} s={[0.78, 0.62, 0.78]} c={leafMid} rough={0.82} shadow />
      <Sph p={[0.66, 2.42, -0.28]} s={[0.82, 0.64, 0.8]} c={leafMid} rough={0.82} shadow />
      <Sph p={[0.15, 3.15, 0.12]} s={[0.88, 0.68, 0.88]} c={leafMid} rough={0.8} shadow />
      <Sph p={[-0.25, 3.45, -0.1]} s={[0.62, 0.5, 0.62]} c={leafLight} rough={0.78} shadow />
    </G>
  )
}

function GardenShrubCluster({ pos, darkMode }: { pos: V3; darkMode: boolean }) {
  const c1 = darkMode ? '#3D5037' : '#566E4C'
  const c2 = darkMode ? '#4A5F43' : '#6F8763'
  return (
    <G p={pos}>
      <Sph p={[0, 0.3, 0]} s={[0.65, 0.42, 0.58]} c={c1} rough={0.85} shadow />
      <Sph p={[0.52, 0.24, 0.18]} s={[0.48, 0.34, 0.46]} c={c2} rough={0.85} shadow />
      <Sph p={[-0.48, 0.22, -0.14]} s={[0.44, 0.32, 0.42]} c={c2} rough={0.85} shadow />
    </G>
  )
}
