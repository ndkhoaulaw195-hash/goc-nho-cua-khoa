import { useEffect, useMemo, useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ArchitectureShell } from './ArchitectureShell'
import { B, Interact, Occluder } from './prims'
import { isOccluderHit, isValidClick, isZoneInteractive, registerOccluderMesh } from './raycastRegistry'
import {
  aoContactShadow,
  aoLinearFalloff,
  persianTerracottaRug,
  rugWeave,
  woodSlats,
} from './textures'
import { useStore } from '../store'

export const ROOM = { w: 20, d: 12, h: 4.35 }

const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => {}
const TARGET_RING_GEOM = new THREE.RingGeometry(0.16, 0.24, 24)
const TARGET_RING_MAT = new THREE.MeshBasicMaterial({ color: '#EFECE6', transparent: true, opacity: 0.85 })
const AO_PLANE_GEOM = new THREE.PlaneGeometry(1, 1)
const RUG_BOX_GEOM = new THREE.BoxGeometry(1, 1, 1)
const HEADBOARD_SLAT_GEOM = new THREE.BoxGeometry(4.9, 1.44, 0.06)

export function Room() {
  const darkMode = useStore((s) => s.darkMode)
  const avatarTarget = useStore((s) => s.avatarTarget)
  const floor1HeadboardLedOn = useStore((s) => s.floor1HeadboardLedOn)

  const slatMap = useMemo(() => {
    const t = woodSlats().clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3.5, 1)
    t.needsUpdate = true
    return t
  }, [])

  const slatMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: slatMap,
        roughness: 0.82,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [slatMap],
  )

  useEffect(
    () => () => {
      slatMat.dispose()
      slatMap.dispose()
    },
    [slatMat, slatMap],
  )

  const { d } = ROOM

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isValidClick(e.clientX, e.clientY)) return
    const st = useStore.getState()
    if (st.mode !== 'orbit' && st.mode !== 'fp') return
    if (!isZoneInteractive('interior_f1', st)) return
    const first = e.intersections?.[0]
    const isGhostThrough =
      st.mode === 'orbit' &&
      st.wallMode === 'ghost' &&
      first?.object.userData?.occluderKind !== 'slab'
    if (first && first.object !== e.object && isOccluderHit(first.object) && !isGhostThrough) return
    e.stopPropagation()
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -14.8, 9.1)
    const z = THREE.MathUtils.clamp(p.z, -5.1, 5.2)
    st.setAvatarTarget([x, 0, z])
  }

  const handleYardClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isValidClick(e.clientX, e.clientY)) return
    const st = useStore.getState()
    if (st.mode !== 'orbit' && st.mode !== 'fp') return
    const first = e.intersections?.[0]
    const isGhostThrough =
      st.mode === 'orbit' &&
      st.wallMode === 'ghost' &&
      first?.object.userData?.occluderKind !== 'slab'
    if (first && first.object !== e.object && isOccluderHit(first.object) && !isGhostThrough) return
    e.stopPropagation()
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -21.0, 16.0)
    const z = THREE.MathUtils.clamp(p.z, -9.0, 14.8)
    // Tránh click nhầm vào lòng hồ bơi [5.75..14.85, 7.1..13.95] (+ viền thành)
    if (x >= 5.65 && x <= 15.05 && z >= 7.0 && z <= 14.1) return
    st.setAvatarTarget([x, p.y, z])
  }

  return (
    <group>
      {/* Hệ thống Khung Kiến trúc Khối đặc (Sàn 0.3, Tường bao 0.28 + CutawayWall, Vách ngăn, Mái bằng & Sân vườn) */}
      <ArchitectureShell onFloorClick={handleFloorClick} onYardClick={handleYardClick} />

      {avatarTarget && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[avatarTarget[0], avatarTarget[1] + 0.032, avatarTarget[2]]}
          geometry={TARGET_RING_GEOM}
          material={TARGET_RING_MAT}
          castShadow={false}
          raycast={NOOP_RAYCAST}
        />
      )}

      {/* Ốp lam gỗ dọc Slate Blue (#5E7487 / #4A5E6F) đầu giường + Đèn LED vàng ấm 3000K */}
      <Occluder kind="wall">
        <mesh
          position={[-3.25, 0.72, -d / 2 + 0.06]}
          geometry={HEADBOARD_SLAT_GEOM}
          material={slatMat}
          castShadow={false}
          receiveShadow
        />
        <B p={[-3.25, 1.45, -d / 2 + 0.07]} s={[4.92, 0.04, 0.08]} c="#2B2D2F" rough={0.85} shadow={false} polyOffset />
      </Occluder>

      {/* Dải đèn LED hắt ngang đầu giường (#FFAE52): Click trực tiếp để bật/tắt */}
      <Interact
        zone="interior_f1"
        hint={floor1HeadboardLedOn ? '✨ Tắt đèn LED đầu giường' : '✨ Bật đèn LED đầu giường'}
        onClick={() => useStore.getState().toggleFloor1HeadboardLed()}
      >
        <B
          p={[-3.25, 1.48, -d / 2 + 0.06]}
          s={[4.88, 0.035, 0.04]}
          c={floor1HeadboardLedOn ? '#FFAE52' : '#2B2D2F'}
          emissive={floor1HeadboardLedOn ? '#FFAE52' : '#000000'}
          ei={floor1HeadboardLedOn ? 1.5 : 0}
          shadow={false}
        />
      </Interact>

      {/* Thảm trải sàn họa tiết trung tính (#8E908F phối #B6B7B5, bề mặt lì roughness ~0.85) */}
      {/* 1. Thảm lớn dưới giường ngủ */}
      <Rug p={[-2.6, 0, -3.35]} s={[4.2, 4.5]} c={darkMode ? '#8C8A85' : '#B6B7B5'} onDoubleClick={handleFloorClick} />
      {/* 2. Thảm khu vực thú cưng */}
      <Rug p={[-7.1, 0, 0.35]} s={[3.6, 2.9]} c={darkMode ? '#96938D' : '#E5E4E0'} onDoubleClick={handleFloorClick} />
      {/* 3. Thảm họa tiết trung tính khu vực Sofa & TV phòng khách */}
      <Rug p={[4.35, 0, 2.35]} s={[6.1, 4.4]} c="#8E908F" patterned onDoubleClick={handleFloorClick} />
      {/* 4. Thảm dưới ghế bàn máy tính */}
      <Rug p={[2.85, 0, -4.35]} s={[2.5, 1.8]} c={darkMode ? '#6B6D6E' : '#8E908F'} onDoubleClick={handleFloorClick} />

      {/* Tăng cường Ambient Occlusion (AO) tại các góc tường, gầm giường, gầm sofa và chân cầu thang */}
      <StudioAmbientOcclusion darkMode={darkMode} />
    </group>
  )
}

/** Hệ thống Ambient Occlusion (AO) giúp tách khối 3D rõ nét tại góc tường, gầm sofa, gầm giường & chân cầu thang */
function StudioAmbientOcclusion({ darkMode }: { darkMode: boolean }) {
  const linearAo = useMemo(() => aoLinearFalloff(), [])
  const contactAo = useMemo(() => aoContactShadow(), [])
  const cornerOp = darkMode ? 0.42 : 0.34
  const contactOp = darkMode ? 0.56 : 0.46

  const cornerMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: linearAo,
        transparent: true,
        opacity: cornerOp,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [linearAo, cornerOp],
  )

  const contactMats = useMemo(() => {
    const makeMat = (op: number) =>
      new THREE.MeshBasicMaterial({
        map: contactAo,
        transparent: true,
        opacity: op,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      })
    return {
      full: makeMat(contactOp),
      t72: makeMat(contactOp * 0.72),
      t80: makeMat(contactOp * 0.8),
    }
  }, [contactAo, contactOp])

  useEffect(
    () => () => {
      cornerMat.dispose()
      contactMats.full.dispose()
      contactMats.t72.dispose()
      contactMats.t80.dispose()
    },
    [cornerMat, contactMats],
  )

  const cornerStrip = (
    key: string,
    pos: [number, number, number],
    size: [number, number],
    rotY = 0,
  ) => (
    <mesh
      key={key}
      position={pos}
      rotation={[-Math.PI / 2, 0, rotY]}
      scale={[size[0], size[1], 1]}
      geometry={AO_PLANE_GEOM}
      material={cornerMat}
      renderOrder={1}
      castShadow={false}
      raycast={NOOP_RAYCAST}
    />
  )

  const contactPatch = (
    key: string,
    pos: [number, number, number],
    size: [number, number],
    variant: 'full' | 't72' | 't80' = 'full',
  ) => (
    <mesh
      key={key}
      position={pos}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[size[0], size[1], 1]}
      geometry={AO_PLANE_GEOM}
      material={contactMats[variant]}
      renderOrder={2}
      castShadow={false}
      raycast={NOOP_RAYCAST}
    />
  )

  return (
    <group>
      {/* 1. AO góc chân tường Tầng 1 */}
      {cornerStrip('f1-back', [0.0, 0.005, -5.73], [20.0, 0.54], 0)}
      {cornerStrip('f1-front', [0.0, 0.005, 5.73], [20.0, 0.54], Math.PI)}
      {cornerStrip('f1-bath-back', [-12.82, 0.005, -5.73], [5.45, 0.54], 0)}
      {cornerStrip('f1-bath-front', [-12.82, 0.005, 5.73], [5.45, 0.54], Math.PI)}
      {cornerStrip('f1-right', [9.73, 0.005, 0.0], [12.0, 0.54], -Math.PI / 2)}
      {cornerStrip('f1-bath-left', [-15.29, 0.005, 0.0], [11.9, 0.54], Math.PI / 2)}
      {cornerStrip('f1-part-e1', [-9.63, 0.005, -5.05], [1.9, 0.5], Math.PI / 2)}
      {cornerStrip('f1-part-e2', [-9.63, 0.005, 1.65], [8.7, 0.5], Math.PI / 2)}
      {cornerStrip('f1-part-w1', [-10.37, 0.005, -5.05], [1.9, 0.5], -Math.PI / 2)}
      {cornerStrip('f1-part-w2', [-10.37, 0.005, 1.65], [8.7, 0.5], -Math.PI / 2)}
      {cornerStrip('f1-tv-part-s', [4.25, 0.005, 0.25], [3.6, 0.44], 0)}
      {cornerStrip('f1-tv-part-n', [4.25, 0.005, -0.35], [3.6, 0.44], Math.PI)}

      {/* 2. AO gầm giường Tầng 1, gầm Sofa L, gầm bàn trà & gầm tủ kệ */}
      {contactPatch('ao-f1-bed', [-2.6, 0.038, -4.3], [2.75, 3.45])}
      {contactPatch('ao-f1-sofa-r', [6.35, 0.038, 2.0], [1.6, 3.25])}
      {contactPatch('ao-f1-sofa-f', [4.45, 0.038, 3.65], [3.35, 1.55])}
      {contactPatch('ao-f1-table', [4.15, 0.038, 2.15], [1.95, 1.25], 't72')}
      {contactPatch('ao-f1-tvunit', [4.45, 0.008, -0.35], [2.8, 0.85], 't80')}
      {contactPatch('ao-f1-wardrobe', [-7.7, 0.008, -5.55], [3.9, 1.15], 't80')}

      {/* 3. AO chân cầu thang Tầng 1 */}
      {contactPatch('ao-f1-stair', [-8.85, 0.008, 4.55], [1.6, 1.45])}
    </group>
  )
}

function Rug({
  p,
  s,
  c,
  patterned = false,
  onDoubleClick,
}: {
  p: [number, number, number]
  s: [number, number]
  c: string
  patterned?: boolean
  onDoubleClick: (e: ThreeEvent<MouseEvent>) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const map = useMemo(() => (patterned ? persianTerracottaRug() : rugWeave(c)), [c, patterned])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [map],
  )

  useEffect(() => {
    const el = meshRef.current
    if (!el) return
    return registerOccluderMesh(el, 'slab')
  }, [])

  useEffect(() => () => mat.dispose(), [mat])

  return (
    <mesh
      ref={meshRef}
      position={[p[0], 0.024, p[2]]}
      scale={[s[0], 0.02, s[1]]}
      geometry={RUG_BOX_GEOM}
      material={mat}
      castShadow={false}
      receiveShadow
      onClick={onDoubleClick}
      onDoubleClick={onDoubleClick}
    />
  )
}

export function Lights() {
  const darkMode = useStore((s) => s.darkMode)
  const weather = useStore((s) => s.weather)
  const shadowResolution = 1024

  // Ánh sáng studio ban ngày rõ nét sân vườn khi nhìn từ trong ra & giảm nhẹ AmbientLight ban đêm để nổi bật đèn vàng ấm nội thất qua kính phản quang
  const hemiSky = darkMode
    ? '#6E829B'
    : weather === 'rain'
      ? '#DCE0E4'
      : '#F2EFE9'
  const hemiGround = darkMode
    ? '#413932'
    : '#A49E94'
  const hemiIntensity = darkMode ? 0.34 : weather === 'rain' ? 0.56 : 0.64

  const sunColor = darkMode
    ? '#AFC4DE'
    : weather === 'sunset'
      ? '#FFE7C8'
      : '#FFFDF8'
  const sunIntensity = darkMode
    ? 0.4
    : weather === 'sunset'
      ? 1.52
      : weather === 'rain'
        ? 1.04
        : 1.48
  const sunPos: [number, number, number] = weather === 'sunset' ? [15.5, 17.5, 14.5] : [13.5, 20.5, 13.5]

  const ambientColor = darkMode
    ? '#3D4452'
    : '#F2EFE9'
  const ambientIntensity = darkMode
    ? 0.16
    : 0.3

  return (
    <>
      <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Directional Light chính duy nhất bật castShadow ở độ phân giải 1024px để giữ vững 60 FPS */}
      <directionalLight
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[shadowResolution, shadowResolution]}
        shadow-camera-left={-23}
        shadow-camera-right={19}
        shadow-camera-top={19}
        shadow-camera-bottom={-19}
        shadow-camera-near={3}
        shadow-camera-far={62}
        shadow-radius={3.0}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
      />

      {/* Ánh sáng viền (Rim Light) tách khối kiến trúc & giữ đường nét góc trái ở cả Night & Day Mode */}
      <directionalLight
        position={[-16, 13, -12]}
        intensity={darkMode ? 0.42 : 0.48}
        color={darkMode ? '#9BB0C8' : '#EFECE6'}
      />

      {/* 2 nguồn PointLight đại diện cho không gian Tầng 1 và Tầng 2 / không gian chung (castShadow={false}) */}
      <pointLight
        position={[-1.5, 3.65, 0.2]}
        intensity={darkMode ? 3.2 : 2.3}
        distance={24}
        decay={1.45}
        color={darkMode ? '#FFAE52' : '#FFD59B'}
        castShadow={false}
      />
      <pointLight
        position={[-0.8, 7.6, 0.2]}
        intensity={darkMode ? 3.0 : 2.15}
        distance={22}
        decay={1.45}
        color={darkMode ? '#FFAE52' : '#FFD59B'}
        castShadow={false}
      />
    </>
  )
}
