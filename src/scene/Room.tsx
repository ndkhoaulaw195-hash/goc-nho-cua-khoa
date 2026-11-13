import { useMemo } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ArchitectureShell } from './ArchitectureShell'
import { B, Interact } from './prims'
import {
  aoContactShadow,
  aoLinearFalloff,
  persianTerracottaRug,
  rugWeave,
  woodSlats,
} from './textures'
import { useStore } from '../store'

export const ROOM = { w: 20, d: 12, h: 4.35 }

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

  const { d } = ROOM

  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const st = useStore.getState()
    if (st.mode !== 'orbit') return
    const p = e.point
    const x = THREE.MathUtils.clamp(p.x, -14.8, 9.1)
    const z = THREE.MathUtils.clamp(p.z, -5.1, 5.2)
    st.setAvatarTarget([x, 0, z])
  }

  return (
    <group>
      {/* Hệ thống Khung Kiến trúc Khối đặc (Sàn 0.3, Tường bao 0.28 + CutawayWall, Vách ngăn, Mái bằng & Sân vườn) */}
      <ArchitectureShell onFloorClick={handleFloorClick} />

      {avatarTarget && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[avatarTarget[0], avatarTarget[1] + 0.032, avatarTarget[2]]}>
          <ringGeometry args={[0.16, 0.24, 24]} />
          <meshBasicMaterial color="#EFECE6" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Ốp lam gỗ dọc Slate Blue (#5E7487 / #4A5E6F) đầu giường + Đèn LED vàng ấm 3000K */}
      <mesh position={[-3.25, 0.72, -d / 2 + 0.06]} receiveShadow>
        <boxGeometry args={[4.9, 1.44, 0.06]} />
        <meshStandardMaterial
          map={slatMap}
          roughness={0.82}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      <B p={[-3.25, 1.45, -d / 2 + 0.07]} s={[4.92, 0.04, 0.08]} c="#2B2D2F" rough={0.85} shadow={false} polyOffset />

      {/* Dải đèn LED hắt ngang đầu giường (#FFD7A3): Click trực tiếp để bật/tắt */}
      <Interact
        hint={floor1HeadboardLedOn ? '✨ Tắt đèn LED đầu giường' : '✨ Bật đèn LED đầu giường'}
        onClick={() => useStore.getState().toggleFloor1HeadboardLed()}
      >
        <B
          p={[-3.25, 1.48, -d / 2 + 0.06]}
          s={[4.88, 0.035, 0.04]}
          c={floor1HeadboardLedOn ? '#F5C98B' : '#2B2D2F'}
          emissive={floor1HeadboardLedOn ? '#F5C98B' : '#000000'}
          ei={floor1HeadboardLedOn ? (darkMode ? 1.25 : 1.3) : 0}
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
      renderOrder={1}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={linearAo}
        transparent
        opacity={cornerOp}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )

  const contactPatch = (key: string, pos: [number, number, number], size: [number, number], op = contactOp) => (
    <mesh key={key} position={pos} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={contactAo}
        transparent
        opacity={op}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
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
      {contactPatch('ao-f1-table', [4.15, 0.038, 2.15], [1.95, 1.25], contactOp * 0.72)}
      {contactPatch('ao-f1-tvunit', [4.45, 0.008, -0.35], [2.8, 0.85], contactOp * 0.8)}
      {contactPatch('ao-f1-wardrobe', [-7.7, 0.008, -5.55], [3.9, 1.15], contactOp * 0.8)}

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
  const map = useMemo(() => (patterned ? persianTerracottaRug() : rugWeave(c)), [c, patterned])
  return (
    <mesh position={[p[0], 0.024, p[2]]} receiveShadow onClick={onDoubleClick} onDoubleClick={onDoubleClick}>
      <boxGeometry args={[s[0], 0.02, s[1]]} />
      <meshStandardMaterial
        map={map}
        roughness={0.85}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}

export function Lights() {
  const darkMode = useStore((s) => s.darkMode)
  const weather = useStore((s) => s.weather)
  const graphicMode = useStore((s) => s.graphicMode)
  const lampOn = useStore((s) => s.lampOn)
  const floor1HeadboardLedOn = useStore((s) => s.floor1HeadboardLedOn)
  const tvOn = useStore((s) => s.tvOn)
  const pcState = useStore((s) => s.pcState)
  const shadowResolution = graphicMode === 'hd' ? 2048 : 1024

  // Ánh sáng studio đồng đều (không tia nắng hay sương mù che cửa sổ), giữ khối 3D hài hòa
  const hemiSky = darkMode
    ? '#7C8FA6'
    : weather === 'rain'
      ? '#DCE0E4'
      : '#EFECE6'
  const hemiGround = darkMode
    ? '#594E43'
    : '#9C968D'
  const hemiIntensity = darkMode ? 0.56 : weather === 'rain' ? 0.52 : 0.6

  const sunColor = darkMode
    ? '#C9D8E8'
    : '#FFFDF8'
  const sunIntensity = darkMode
    ? 0.62
    : weather === 'sunset'
      ? 1.42
      : weather === 'rain'
        ? 0.96
        : 1.38
  const sunPos: [number, number, number] = weather === 'sunset' ? [15.5, 17.5, 14.5] : [13.5, 20.5, 13.5]

  const ambientColor = darkMode
    ? '#5B606B'
    : '#EFECE6'
  const ambientIntensity = darkMode
    ? 0.36
    : 0.28

  return (
    <>
      <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Directional Light chính chiếu xiên nhẹ tạo bóng đổ mềm rõ nét cho cả kiến trúc & sân vườn */}
      <directionalLight
        position={sunPos}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[shadowResolution, shadowResolution]}
        shadow-camera-left={-22}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-17}
        shadow-camera-near={3}
        shadow-camera-far={58}
        shadow-radius={3.8}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
      />

      {/* Ánh sáng viền (Rim Light) tách khối kiến trúc & giữ đường nét góc trái ở cả Night & Day Mode */}
      <directionalLight
        position={[-16, 13, -12]}
        intensity={darkMode ? 0.52 : 0.46}
        color={darkMode ? '#9BB0C8' : '#EFECE6'}
      />

      {/* PointLight phân vùng kiến trúc (castShadow = false để tối ưu hiệu năng) */}
      <pointLight
        position={[-1.2, 3.3, -0.5]}
        intensity={darkMode ? 0.92 : 0.72}
        distance={16}
        decay={2}
        color={darkMode ? '#FFE0B8' : '#FFF4E6'}
        castShadow={false}
      />
      <pointLight
        position={[0.2, 7.6, -1.0]}
        intensity={darkMode ? 0.95 : 0.72}
        distance={16}
        decay={2}
        color={darkMode ? '#FFE0B8' : '#FFF4E6'}
        castShadow={false}
      />
      <pointLight
        position={[-12.8, 3.3, -0.5]}
        intensity={darkMode ? 0.88 : 0.76}
        distance={12}
        decay={2}
        color={darkMode ? '#FFE2BF' : '#FAF8F4'}
        castShadow={false}
      />
      {darkMode && (
        <pointLight
          position={[-8.85, 2.75, 2.5]}
          intensity={0.78}
          distance={10.5}
          decay={2}
          color="#FFE0B8"
          castShadow={false}
        />
      )}

      {/* Đèn trang trí vàng ấm 3000K (#FFD7A3) đồng bộ cho cả Tầng 1 */}
      {darkMode && lampOn && (
        <pointLight
          position={[8.75, 1.85, 0.95]}
          intensity={4.8}
          distance={6.5}
          decay={2}
          color="#FFD7A3"
          castShadow={false}
        />
      )}
      {darkMode && floor1HeadboardLedOn && (
        <pointLight
          position={[-3.25, 1.75, -5.2]}
          intensity={3.0}
          distance={5.2}
          decay={2}
          color="#FFD7A3"
          castShadow={false}
        />
      )}
      {darkMode && tvOn && graphicMode === 'hd' && (
        <pointLight
          position={[8.9, 1.65, 2.35]}
          intensity={1.5}
          distance={4.2}
          decay={2}
          color="#D6D1C9"
          castShadow={false}
        />
      )}
      {darkMode && pcState !== 'off' && graphicMode === 'hd' && (
        <pointLight
          position={[2.85, 1.35, -5.1]}
          intensity={1.4}
          distance={3.2}
          decay={2}
          color="#FFD7A3"
          castShadow={false}
        />
      )}
    </>
  )
}
