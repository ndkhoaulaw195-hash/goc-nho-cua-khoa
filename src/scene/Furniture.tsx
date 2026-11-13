import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Interact, Sph, RBB } from './prims'
import { dartboard, loadPhotoTexture, rng, screen, sunflowerArt } from './textures'
import { WALL_PHOTOS, type V3 } from '../data/config'
import { useStore } from '../store'
import { Bathroom } from './Bathroom'
import { SecondFloor } from './SecondFloor'
import { isWallCutByCamera } from './ArchitectureShell'

const DARK = '#2B2D2F'
const WALNUT = '#B7AFA5'
const WALNUT_LIGHT = '#C4AF97'
const OAK = '#D8C7B2'
const SLATE = '#5E7487'
const SLATE_DARK = '#4A5E6F'
const CAMEL = '#C4834E'
const RUST = '#9E6338'

export function Furniture() {
  return (
    <group>
      <Bathroom />
      <SecondFloor />
      <Wardrobe />
      <LeftNightstand />
      <Dartboard />
      <AirCon />
      <Bed />
      <RightNightstand />
      <PhotoFrames />
      <Bookshelf p={[0.25, 0, -5.68]} seed={3} />
      <Desk />
      <Painting />
      <FloatingWallShelves />
      <WaterDispenser />
      <LowCabinet />
      <PanoramicWindow />
      <WindowPlantBench />
      <FloorLamp />
      <DogCorner />
      <SmartTvUnit />
      <Monstera p={[0.55, 0, -0.25]} />
      <Ottoman />
      <CoffeeTable />
      <Sofa />
    </group>
  )
}

/* ---------- Tủ quần áo cánh kính tối màu có đèn LED hắt sáng bên trong ---------- */
function Wardrobe() {
  const open = useStore((s) => s.wardrobeOpen)
  const userRole = useStore((s) => s.userRole)
  const canUseWardrobe = userRole === 'boy'
  const leftDoor = useRef<THREE.Group>(null)
  const midDoor = useRef<THREE.Group>(null)
  const rightDoor = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 8)
    if (leftDoor.current) leftDoor.current.rotation.y = THREE.MathUtils.lerp(leftDoor.current.rotation.y, open ? -1.65 : 0, k)
    if (midDoor.current) midDoor.current.rotation.y = THREE.MathUtils.lerp(midDoor.current.rotation.y, open ? -1.45 : 0, k)
    if (rightDoor.current) rightDoor.current.rotation.y = THREE.MathUtils.lerp(rightDoor.current.rotation.y, open ? 1.65 : 0, k)
  })

  const shirts = [
    { x: -0.82, c: '#EFECE6', h: 0.88 },
    { x: -0.58, c: '#D6D1C9', h: 0.82 },
    { x: -0.34, c: '#B7AFA5', h: 0.92 },
    { x: 0.0, c: '#5E7487', h: 0.84 },
    { x: 0.24, c: '#4A5E6F', h: 0.78 },
    { x: 0.56, c: '#C4834E', h: 0.88 },
    { x: 0.82, c: '#2B2D2F', h: 0.82 },
  ]

  const wardrobeBody = (
    <G p={[-7.3, 0, -5.45]}>
      {/* Khung tủ Warm Taupe/Greige (#B7AFA5) đồng bộ kiến trúc */}
      <RBB p={[0, 0, -0.42]} s={[2.32, 2.78, 0.06]} c={WALNUT} rough={0.62} radius={0.03} shadow />
      <RBB p={[-1.13, 0, 0]} s={[0.06, 2.78, 0.88]} c={WALNUT} rough={0.62} radius={0.02} shadow />
      <RBB p={[1.13, 0, 0]} s={[0.06, 2.78, 0.88]} c={WALNUT} rough={0.62} radius={0.02} shadow />
      <BB p={[-0.36, 0.06, -0.02]} s={[0.04, 2.66, 0.8]} c="#9E968C" />
      <BB p={[0.38, 0.06, -0.02]} s={[0.04, 2.66, 0.8]} c="#9E968C" />
      <BB p={[0, 0, 0]} s={[2.32, 0.08, 0.88]} c={WALNUT} />
      <RBB p={[0, 2.7, 0]} s={[2.32, 0.08, 0.88]} c={WALNUT} radius={0.02} shadow />
      <BB p={[0, 0.72, -0.02]} s={[2.2, 0.05, 0.8]} c="#9E968C" />

      {/* Đèn LED 3000K (#FFD7A3) bên trong tủ */}
      <B p={[0, 2.64, 0.1]} s={[2.12, 0.025, 0.04]} c="#FFD7A3" emissive="#FFD7A3" ei={1.85} shadow={false} />
      <B p={[0, 2.0, -0.37]} s={[2.12, 1.15, 0.015]} c="#B7AFA5" emissive="#FFD7A3" ei={0.22} shadow={false} />

      <Cyl p={[0, 2.42, 0]} r={[0, 0, Math.PI / 2]} rt={0.018} h={2.15} c="#2B2D2F" metal={0.75} />
      {shirts.map((sh, i) => (
        <BB key={i} p={[sh.x, 2.38 - sh.h, 0]} s={[0.18, sh.h, 0.46]} c={sh.c} rough={0.85} />
      ))}

      <BB p={[-0.75, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#EFECE6" />
      <BB p={[0.0, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#D6D1C9" />
      <BB p={[0.75, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#EFECE6" />
      <BB p={[-0.75, 0.42, 0]} s={[0.62, 0.22, 0.56]} c="#D6D1C9" />
      <BB p={[0.0, 0.42, 0]} s={[0.62, 0.22, 0.56]} c="#EFECE6" />

      <group ref={leftDoor} position={[-1.1, 0, 0.43]}>
        <BB p={[0.36, 0.05, 0]} s={[0.72, 2.62, 0.035]} c="#2B2D2F" opacity={0.25} rough={0.1} metal={0.15} shadow={false} />
        <BB p={[0.03, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
        <BB p={[0.69, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
        <B p={[0.65, 1.32, 0.04]} s={[0.02, 0.52, 0.025]} c={DARK} metal={0.5} />
      </group>

      <group ref={midDoor} position={[-0.36, 0, 0.43]}>
        <BB p={[0.37, 0.05, 0]} s={[0.74, 2.62, 0.035]} c="#2B2D2F" opacity={0.25} rough={0.1} metal={0.15} shadow={false} />
        <BB p={[0.03, 0.05, 0.005]} s={[0.05, 2.62, 0.045]} c={DARK} />
        <BB p={[0.71, 0.05, 0.005]} s={[0.05, 2.62, 0.045]} c={DARK} />
        <B p={[0.66, 1.32, 0.04]} s={[0.02, 0.52, 0.025]} c={DARK} metal={0.5} />
      </group>

      <group ref={rightDoor} position={[1.1, 0, 0.43]}>
        <BB p={[-0.36, 0.05, 0]} s={[0.72, 2.62, 0.035]} c="#2B2D2F" opacity={0.25} rough={0.1} metal={0.15} shadow={false} />
        <BB p={[-0.03, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
        <BB p={[-0.69, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
        <B p={[-0.65, 1.32, 0.04]} s={[0.02, 0.52, 0.025]} c={DARK} metal={0.5} />
      </group>
    </G>
  )

  if (!canUseWardrobe) return wardrobeBody

  return (
    <Interact
      hint="👕 Tủ quần áo của Khoa"
      onClick={() => useStore.getState().startActivity('wardrobe', true)}
    >
      {wardrobeBody}
    </Interact>
  )
}

/* ---------- Kệ đầu giường bên trái + Khung tranh + Bình hoa + Đèn tường ---------- */
function LeftNightstand() {
  return (
    <G p={[-4.9, 0, -5.55]}>
      <BB p={[0, 0, 0]} s={[1.35, 0.05, 0.5]} c={DARK} />
      <BB p={[0, 0.32, 0]} s={[1.35, 0.04, 0.5]} c={DARK} />
      <BB p={[0, 0.64, 0]} s={[1.35, 0.05, 0.5]} c={WALNUT} />
      <BB p={[-0.65, 0, 0]} s={[0.05, 0.68, 0.5]} c={DARK} />
      <BB p={[0.65, 0, 0]} s={[0.05, 0.68, 0.5]} c={DARK} />
      {/* Sách dưới kệ */}
      {[-0.45, -0.36, -0.27, 0.15, 0.25, 0.35].map((x, i) => (
        <BB key={i} p={[x, 0.06, 0]} s={[0.06, 0.22, 0.32]} c={i % 2 ? '#EFECE6' : '#C4834E'} />
      ))}
      {/* Khung tranh nhỏ tựa tường trên kệ */}
      <G p={[-0.28, 0.94, -0.1]}>
        <B s={[0.46, 0.56, 0.03]} c={DARK} />
        <B p={[0, 0, 0.012]} s={[0.38, 0.48, 0.015]} c="#EFECE6" />
        <Sph p={[0, 0.02, 0.025]} s={[0.08, 0.12, 0.01]} c="#566E4C" />
      </G>
      {/* Bình hoa nhỏ bên phải kệ */}
      <Cyl p={[0.28, 0.78, 0.04]} rt={0.07} rb={0.09} h={0.18} c="#EFECE6" />
      <Sph p={[0.28, 0.92, 0.04]} s={[0.13, 0.1, 0.13]} c="#6F8763" />
      <Sph p={[0.24, 0.96, 0.02]} s={[0.09, 0.08, 0.09]} c="#566E4C" />
      {/* Đèn gắn tường vàng ấm 3000K (#FFD7A3) */}
      <B p={[0.05, 1.62, -0.32]} s={[0.08, 0.14, 0.12]} c={DARK} metal={0.5} />
      <Cyl p={[0.05, 1.56, -0.24]} rt={0.05} rb={0.08} h={0.1} c="#FFD7A3" emissive="#FFD7A3" ei={1.25} />
    </G>
  )
}

/* ---------- Bảng phi tiêu (Đi tới ngắm & Phóng phi tiêu 3D bay trên không) ---------- */
function Dartboard() {
  const map = useMemo(() => dartboard(), [])
  const dartCount = useStore((s) => s.dartCount)
  const flyingRef = useRef<THREE.Group>(null)

  const offsets: [number, number][] = [
    [0, 0.04],
    [-0.07, 0.09],
    [0.08, -0.02],
    [-0.04, -0.05],
    [0.05, 0.1],
  ]

  useFrame(() => {
    if (!flyingRef.current) return
    const start = useStore.getState().dartFlightStart
    const elapsed = (performance.now() - start) / 1000
    if (start > 0 && elapsed >= 0 && elapsed <= 0.36) {
      const p = elapsed / 0.36
      flyingRef.current.visible = true
      flyingRef.current.position.set(
        -4.9,
        THREE.MathUtils.lerp(1.45, 2.48, p) + Math.sin(p * Math.PI) * 0.26,
        THREE.MathUtils.lerp(-3.25, -5.86, p),
      )
      flyingRef.current.rotation.x = -0.25 + p * 0.4
    } else {
      flyingRef.current.visible = false
    }
  })

  return (
    <Interact
      hint="🎯 Bảng phi tiêu"
      onClick={() => useStore.getState().startActivity('darts', true)}
    >
      <group ref={flyingRef} visible={false}>
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.015} rb={0.004} h={0.18} c="#b8ab96" metal={0.65} />
        <B p={[0, 0, 0.08]} s={[0.065, 0.065, 0.012]} c="#8a6c5d" emissive="#8a6c5d" ei={0.45} />
      </group>

      <G p={[-4.9, 2.48, -5.94]}>
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.34} rb={0.34} h={0.045} c="#1c1a18" seg={36} />
        <mesh position={[0, 0, 0.026]}>
          <circleGeometry args={[0.3, 40]} />
          <meshStandardMaterial map={map} roughness={0.85} />
        </mesh>
        {offsets.slice(0, dartCount).map(([dx, dy], i) => (
          <G key={i} p={[dx, dy, 0.08]}>
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.011} rb={0.003} h={0.13} c="#b8ab96" metal={0.6} />
            <B p={[0, 0, 0.055]} s={[0.045, 0.045, 0.01]} c={i % 2 ? '#8a6c5d' : '#535f52'} />
          </G>
        ))}
      </G>
    </Interact>
  )
}

/* ---------- Máy lạnh Inverter ---------- */
function AirCon() {
  const acOn = useStore((s) => s.acOn)
  const airRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (airRef.current && acOn) {
      airRef.current.position.y = -0.32 - Math.sin(clock.elapsedTime * 3) * 0.06
    }
  })

  return (
    <Interact hint="❄️ Điều hòa" onClick={() => useStore.getState().toggleAc()}>
      <G p={[-2.6, 3.55, -5.82]}>
        <B s={[1.55, 0.4, 0.3]} c="#f2efe9" rough={0.4} />
        <B p={[0, -0.14, 0.15]} r={[acOn ? 0.55 : 0, 0, 0]} s={[1.45, 0.035, 0.04]} c="#dfd9ce" />
        <B p={[0.58, 0.02, 0.155]} s={[0.06, 0.025, 0.01]} c={acOn ? '#7e917b' : '#8d8880'} emissive={acOn ? '#8fa38b' : '#000'} ei={1.4} />
        {acOn && (
          <group ref={airRef} position={[0, -0.32, 0.28]}>
            {[-0.42, 0, 0.42].map((x, i) => (
              <B key={i} p={[x, 0, 0]} r={[0.4, 0, 0]} s={[0.24, 0.015, 0.35]} c="#e2e6e8" emissive="#d0d7db" ei={0.45} opacity={0.4} shadow={false} />
            ))}
          </group>
        )}
      </G>
    </Interact>
  )
}

/* ---------- Giường ngủ êm ái nhiều lớp chăn gối chuẩn ảnh mẫu ---------- */
function Bed() {
  return (
    <Interact
      hint="🛏️ Giường ngủ Tầng 1"
      onClick={() => useStore.getState().startActivity('sleep', true)}
    >
      <G p={[-2.6, 0, -4.3]}>
        {/* Khung giường Matte Charcoal (#2B2D2F) bọc nệm lì */}
        <RBB p={[0, 0, 0]} s={[2.26, 0.36, 3.05]} c={DARK} rough={0.85} radius={0.04} shadow />
        {/* Đệm kem ấm (#EFECE6) bề mặt lì roughness 0.85 */}
        <RBB p={[0, 0.36, 0.04]} s={[2.1, 0.26, 2.88]} c="#EFECE6" rough={0.85} radius={0.05} />
        {/* Chăn phủ Warm Greige (#D6D1C9) + Điểm nhấn Camel (#C4834E) & Rust (#9E6338) */}
        <RBB p={[0, 0.62, 0.38]} s={[2.14, 0.08, 2.05]} c="#D6D1C9" rough={0.85} radius={0.03} shadow={false} />
        {/* Khăn/chăn điểm nhấn cam đất #C4834E & nâu gỉ #9E6338 đắp ngang chân giường */}
        <RBB p={[0, 0.7, 0.88]} s={[2.16, 0.045, 0.72]} c={CAMEL} rough={0.85} radius={0.02} shadow={false} />
        <RBB p={[0, 0.26, 1.46]} s={[2.14, 0.42, 0.05]} c={RUST} rough={0.85} radius={0.02} shadow={false} />
        {/* Gối tựa lưng kem (#EFECE6) & gối nhấn Camel/Slate Blue */}
        <RBB p={[-0.52, 0.65, -1.12]} r={[0.22, 0, 0]} s={[0.86, 0.22, 0.42]} c="#D6D1C9" rough={0.85} radius={0.04} shadow={false} />
        <RBB p={[0.52, 0.65, -1.12]} r={[0.22, 0, 0]} s={[0.86, 0.22, 0.42]} c="#D6D1C9" rough={0.85} radius={0.04} shadow={false} />
        <RBB p={[-0.48, 0.64, -0.82]} r={[0.15, 0, 0]} s={[0.76, 0.16, 0.38]} c="#EFECE6" rough={0.85} radius={0.04} shadow={false} />
        <RBB p={[0.48, 0.64, -0.82]} r={[0.15, 0, 0]} s={[0.76, 0.16, 0.38]} c="#EFECE6" rough={0.85} radius={0.04} shadow={false} />
        <RBB p={[0, 0.65, -0.58]} r={[0.1, 0, 0]} s={[0.56, 0.15, 0.3]} c={CAMEL} rough={0.85} radius={0.04} shadow={false} />
      </G>
    </Interact>
  )
}

/* ---------- Tủ đầu giường bên phải + Đèn ngủ ánh vàng ấm 3000K (#FFD7A3) ---------- */
function RightNightstand() {
  const floor1BedLampOn = useStore((s) => s.floor1BedLampOn)
  return (
    <G p={[-0.65, 0, -5.5]}>
      <BB p={[0, 0, 0]} s={[0.68, 0.56, 0.52]} c={WALNUT} rough={0.62} shadow />
      <BB p={[0, 0.3, 0.265]} s={[0.6, 0.2, 0.02]} c={DARK} />
      <BB p={[0, 0.08, 0.265]} s={[0.6, 0.18, 0.02]} c={DARK} />
      {/* Đèn ngủ đầu giường (#FFD7A3) */}
      <Interact
        hint={floor1BedLampOn ? '💡 Tắt đèn ngủ Tầng 1' : '💡 Bật đèn ngủ Tầng 1'}
        onClick={() => useStore.getState().toggleFloor1BedLamp()}
      >
        <G p={[-0.08, 0, 0]}>
          <Cyl p={[0, 0.62, 0]} rt={0.07} rb={0.09} h={0.12} c={DARK} />
          <Cyl p={[0, 0.75, 0]} rt={0.015} h={0.16} c={DARK} metal={0.6} rough={0.3} />
          <Cyl
            p={[0, 0.88, 0]}
            rt={0.14}
            rb={0.16}
            h={0.24}
            c={floor1BedLampOn ? '#FFD7A3' : '#D6D1C9'}
            emissive={floor1BedLampOn ? '#FFD7A3' : '#000000'}
            ei={floor1BedLampOn ? 1.85 : 0}
            seg={24}
          />
          {floor1BedLampOn && (
            <mesh position={[0, 0.88, 0]}>
              <sphereGeometry args={[0.22, 16, 12]} />
              <meshBasicMaterial color="#FFD7A3" transparent opacity={0.2} depthWrite={false} />
            </mesh>
          )}
        </G>
      </Interact>
      {/* Chậu cây nhỏ cạnh đèn ngủ (#566E4C) */}
      <Cyl p={[0.18, 0.61, 0.06]} rt={0.045} rb={0.038} h={0.09} c="#EFECE6" />
      <Sph p={[0.18, 0.69, 0.06]} s={[0.065, 0.055, 0.065]} c="#566E4C" />
    </G>
  )
}

/* ---------- 3 Khung ảnh kỷ niệm có đèn rọi tranh + Kệ gỗ nổi đặt chậu cây phía dưới ---------- */
function PhotoFrames() {
  return (
    <group>
      {WALL_PHOTOS.map((item) => (
        <WallPhotoFrame key={item.id} item={item} />
      ))}
      {/* Kệ gỗ nổi ngay dưới 3 khung ảnh */}
      <G p={[0.22, 2.58, -5.78]}>
        <B s={[1.72, 0.045, 0.24]} c={WALNUT_LIGHT} rough={0.55} />
        <Cyl p={[-0.62, 0.09, 0]} rt={0.065} rb={0.05} h={0.13} c="#EFECE6" />
        <Sph p={[-0.62, 0.21, 0]} s={[0.13, 0.1, 0.13]} c="#566E4C" />
        <Sph p={[-0.56, 0.18, 0.04]} s={[0.09, 0.08, 0.09]} c="#6F8763" />
        <BB p={[0, 0.03, 0]} s={[0.26, 0.09, 0.12]} c="#D6D1C9" />
        <Cyl p={[0.62, 0.09, 0]} rt={0.065} rb={0.05} h={0.13} c="#EFECE6" />
        <Sph p={[0.62, 0.21, 0]} s={[0.13, 0.1, 0.13]} c="#566E4C" />
        <Sph p={[0.68, 0.18, -0.03]} s={[0.09, 0.08, 0.09]} c="#6F8763" />
      </G>
    </group>
  )
}

function WallPhotoFrame({ item }: { item: (typeof WALL_PHOTOS)[number] }) {
  const tex = useMemo(() => loadPhotoTexture(item.src), [item.src])
  return (
    <Interact
      hint={`🖼️ ${item.title}`}
      onClick={() => {
        const st = useStore.getState()
        st.setActivePhoto(item.id)
        if (st.mode === 'orbit') st.setFocus(item.camera)
      }}
    >
      <G p={item.position}>
        {/* Đèn rọi tranh Matte Charcoal & ánh vàng ấm #FFD7A3 */}
        <B p={[0, 0.44, 0.04]} s={[0.1, 0.04, 0.08]} c={DARK} metal={0.65} />
        <Cyl p={[0, 0.41, 0.1]} r={[0, 0, Math.PI / 2]} rt={0.022} h={0.22} c={DARK} metal={0.65} />
        <B p={[0, 0.39, 0.1]} s={[0.18, 0.015, 0.025]} c="#FFD7A3" emissive="#FFD7A3" ei={1.4} shadow={false} />

        {/* Khung ảnh Matte Charcoal & Bo kem ấm (#EFECE6) */}
        <B s={[0.54, 0.66, 0.04]} c={DARK} rough={0.65} polyOffset />
        <B p={[0, 0, 0.015]} s={[0.46, 0.58, 0.02]} c="#EFECE6" polyOffset />
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.4, 0.5]} />
          <meshBasicMaterial
            map={tex}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      </G>
    </Interact>
  )
}

const SHELF_PALETTES = [
  ['#EFECE6', '#D6D1C9', '#B7AFA5', '#5E7487'],
  ['#566E4C', '#6F8763', '#D6D1C9', '#C4834E'],
  ['#9E6338', '#C4AF97', '#EFECE6', '#B7AFA5'],
  ['#4A5E6F', '#2B2D2F', '#D8C7B2', '#8E908F'],
]

function Bookshelf({ p, seed }: { p: V3; seed: number }) {
  const books = useMemo(() => {
    const r = rng(seed)
    const out: { x: number; y: number; w: number; h: number; c: string }[] = []
    const shelves = [0.08, 0.54, 1.0, 1.46]
    shelves.forEach((y, si) => {
      let x = -0.44
      const palette = SHELF_PALETTES[si % SHELF_PALETTES.length]
      while (x < 0.42) {
        const w = 0.045 + r() * 0.04
        const h = 0.28 + r() * 0.11
        out.push({ x: x + w / 2, y, w, h, c: palette[Math.floor(r() * palette.length)] })
        x += w + 0.006
      }
    })
    return out
  }, [seed])
  return (
    <Interact
      hint="📚 Tủ sách"
      onClick={() => useStore.getState().startActivity('read', true)}
    >
      <G p={p}>
        <BB p={[0, 0, -0.18]} s={[1.04, 2.32, 0.04]} c="#1e1c1a" />
        <BB p={[-0.5, 0, 0]} s={[0.04, 2.32, 0.4]} c={DARK} />
        <BB p={[0.5, 0, 0]} s={[0.04, 2.32, 0.4]} c={DARK} />
        {[0, 0.46, 0.92, 1.38, 1.84, 2.28].map((y) => (
          <BB key={y} p={[0, y, 0]} s={[1.04, 0.04, 0.4]} c={DARK} />
        ))}
        {books.map((b, i) => (
          <BB key={i} p={[b.x, b.y, 0.02]} s={[b.w, b.h, 0.28]} c={b.c} rough={0.65} />
        ))}
        {/* Ngăn trên cùng bày cúp & mô hình trung tính */}
        <Cyl p={[-0.22, 1.98, 0]} rt={0.05} rb={0.035} h={0.18} c="#b8ab96" metal={0.75} />
        <BB p={[0.18, 1.88, 0]} s={[0.26, 0.22, 0.22]} c="#454340" />
      </G>
    </Interact>
  )
}

function Monitor({ p, w, h, variant, ry = 0 }: { p: V3; w: number; h: number; variant: number; ry?: number }) {
  const pcState = useStore((s) => s.pcState)
  const map = useMemo(() => screen(variant, pcState === 'rgb'), [variant, pcState])
  return (
    <G p={p} r={[0, ry, 0]}>
      <B p={[0, h / 2 + 0.16, 0]} s={[w + 0.035, h + 0.035, 0.035]} c={DARK} />
      {pcState !== 'off' ? (
        <mesh position={[0, h / 2 + 0.16, 0.02]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial
            map={map}
            emissive="#ffffff"
            emissiveMap={map}
            emissiveIntensity={pcState === 'rgb' ? 1.15 : 0.95}
          />
        </mesh>
      ) : (
        <B p={[0, h / 2 + 0.16, 0.019]} s={[w, h, 0.005]} c="#1A1C1E" rough={0.2} />
      )}
      <B p={[0, 0.08, -0.05]} s={[0.045, 0.16, 0.045]} c={DARK} />
      <B p={[0, 0.01, -0.02]} s={[0.22, 0.018, 0.16]} c={DARK} />
    </G>
  )
}

/* ---------- Bàn máy tính Warm Taupe/Greige + Ghế Slate Blue + Đèn vàng ấm 3000K ---------- */
function Desk() {
  const pcState = useStore((s) => s.pcState)
  const boyActivity = useStore((s) => s.boyActivity)
  const boyPhase = useStore((s) => s.boyPhase)
  const girlActivity = useStore((s) => s.girlActivity)
  const girlPhase = useStore((s) => s.girlPhase)
  const seatedAtPc =
    (boyActivity === 'pc' && boyPhase !== 'walking') ||
    (girlActivity === 'pc' && girlPhase !== 'walking')

  return (
    <G p={[2.85, 0, -5.2]}>
      {/* Mặt bàn Warm Taupe/Greige (#B7AFA5) + chân Matte Charcoal (#2B2D2F) */}
      <RBB p={[0, 0.74, 0]} s={[2.75, 0.055, 0.92]} c={WALNUT} rough={0.5} radius={0.025} shadow />
      {[-1.3, 1.3].map((x) => (
        <BB key={x} p={[x, 0, 0]} s={[0.06, 0.74, 0.84]} c={DARK} metal={0.45} rough={0.4} shadow />
      ))}

      {/* Đèn LED hắt sau bàn dùng ánh sáng vàng ấm 3000K (#FFD7A3) đồng bộ, không dùng RGB */}
      {pcState !== 'off' && (
        <B p={[0, 0.78, -0.44]} s={[2.2, 0.03, 0.03]} c="#FFD7A3" emissive="#FFD7A3" ei={1.35} shadow={false} />
      )}

      <Interact
        hint="💻 Bàn máy tính Tầng 1"
        onClick={() => useStore.getState().startActivity('pc', true)}
      >
        {/* Cặp màn hình đôi ghép cong */}
        <Monitor p={[-0.49, 0.79, -0.14]} w={0.95} h={0.5} variant={1} ry={0.16} />
        <Monitor p={[0.49, 0.79, -0.14]} w={0.95} h={0.5} variant={2} ry={-0.16} />

        {/* Cặp loa kiểm âm vỏ Matte Charcoal hai bên */}
        {[-1.14, 1.14].map((sx, idx) => (
          <G key={idx} p={[sx, 0.79, -0.08]} r={[0, idx === 0 ? 0.25 : -0.25, 0]}>
            <BB p={[0, 0, 0]} s={[0.22, 0.34, 0.24]} c={DARK} rough={0.55} />
            <Cyl p={[0, 0.13, 0.122]} r={[Math.PI / 2, 0, 0]} rt={0.065} h={0.01} c="#1A1C1E" />
            <Cyl p={[0, 0.25, 0.122]} r={[Math.PI / 2, 0, 0]} rt={0.035} h={0.01} c={SLATE_DARK} />
          </G>
        ))}

        {/* Thảm trải bàn, Bàn phím & Chuột ánh vàng 3000K */}
        <BB p={[0, 0.795, 0.2]} s={[0.92, 0.008, 0.34]} c={DARK} rough={0.85} />
        <BB p={[-0.06, 0.8, 0.2]} s={[0.42, 0.024, 0.14]} c="#3A3D40" />
        <B p={[-0.06, 0.805, 0.2]} s={[0.4, 0.018, 0.12]} c="#EFECE6" emissive="#FFD7A3" ei={0.75} />
        <BB p={[0.28, 0.8, 0.2]} s={[0.065, 0.025, 0.1]} c={DARK} />

        {/* Thùng PC Matte Charcoal & Đèn nội thất vàng ấm 3000K (#FFD7A3, bỏ RGB nhiều màu) */}
        <G p={[1.05, 0.02, 0.05]}>
          <BB p={[0, 0, 0]} s={[0.26, 0.56, 0.52]} c={DARK} metal={0.35} rough={0.4} />
          <B
            p={[-0.132, 0.28, 0]}
            s={[0.01, 0.44, 0.42]}
            c={DARK}
            emissive={pcState === 'off' ? '#000' : '#FFD7A3'}
            ei={pcState === 'off' ? 0 : 0.45}
            opacity={0.72}
          />
          {[0.14, 0.28, 0.42].map((fy, fi) => (
            <Cyl
              key={fi}
              p={[0, fy, 0.262]}
              r={[Math.PI / 2, 0, 0]}
              rt={0.055}
              h={0.012}
              c="#FFD7A3"
              emissive={pcState === 'off' ? '#000' : '#FFD7A3'}
              ei={pcState === 'off' ? 0 : 1.05}
            />
          ))}
        </G>
      </Interact>

      <OfficeChair
        targetZ={seatedAtPc ? 0.56 : 0.92}
        facingDesk={seatedAtPc}
      />
    </G>
  )
}

function OfficeChair({
  targetZ,
  facingDesk,
}: {
  targetZ: number
  facingDesk: boolean
}) {
  const spinTick = useStore((s) => s.chairSpinTick)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    if (!groupRef.current) return
    const k = 1 - Math.exp(-dt * 6)
    const baseYaw = facingDesk ? 0 : Math.PI + 0.35
    const targetRot = baseYaw + spinTick * Math.PI * 2
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, k)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, k)
  })

  return (
    <Interact
      hint="💻 Ghế công thái học"
      onClick={() => useStore.getState().startActivity('pc', true)}
    >
      <group ref={groupRef} position={[0, 0, 0.92]} rotation={[0, Math.PI + 0.35, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <B
            key={i}
            p={[Math.cos((i / 5) * Math.PI * 2) * 0.22, 0.05, Math.sin((i / 5) * Math.PI * 2) * 0.22]}
            r={[0, -(i / 5) * Math.PI * 2, 0]}
            s={[0.44, 0.035, 0.045]}
            c={DARK}
          />
        ))}
        <Cyl p={[0, 0.25, 0]} rt={0.028} h={0.38} c={DARK} metal={0.55} />
        <BB p={[0, 0.44, 0]} s={[0.54, 0.08, 0.5]} c={SLATE_DARK} rough={0.85} />
        {/* Lưng ghế công thái học Slate Blue (#5E7487) + Tựa đầu & Tay vịn Matte Charcoal */}
        <BB p={[0, 0.52, 0.23]} s={[0.48, 0.64, 0.06]} c={SLATE} rough={0.85} />
        <BB p={[0, 1.18, 0.22]} s={[0.28, 0.14, 0.06]} c={SLATE_DARK} rough={0.85} />
        <BB p={[-0.27, 0.62, 0.04]} s={[0.045, 0.03, 0.26]} c={DARK} />
        <BB p={[0.27, 0.62, 0.04]} s={[0.045, 0.03, 0.26]} c={DARK} />
      </group>
    </Interact>
  )
}

/* ---------- Tranh nghệ thuật khung Matte Charcoal & đèn rọi vàng ấm 3000K ---------- */
function Painting() {
  const map = useMemo(() => sunflowerArt(), [])
  return (
    <G p={[2.85, 3.05, -5.92]}>
      <B p={[0, 0.86, 0.05]} s={[0.14, 0.05, 0.1]} c={DARK} metal={0.65} />
      <Cyl p={[0, 0.82, 0.14]} r={[0, 0, Math.PI / 2]} rt={0.025} h={0.45} c={DARK} metal={0.65} />
      <B p={[0, 0.8, 0.14]} s={[0.38, 0.015, 0.03]} c="#FFD7A3" emissive="#FFD7A3" ei={1.4} shadow={false} />

      {/* Khung tranh Matte Charcoal (#2B2D2F) & Bo kem (#EFECE6) */}
      <B s={[1.36, 1.56, 0.045]} c={DARK} rough={0.6} polyOffset />
      <B p={[0, 0, 0.015]} s={[1.22, 1.42, 0.02]} c="#EFECE6" polyOffset />
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[1.04, 1.24]} />
        <meshStandardMaterial
          map={map}
          emissive="#ffffff"
          emissiveMap={map}
          emissiveIntensity={0.28}
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </G>
  )
}

/* ---------- 3 Kệ gỗ treo tường bên phải có dây đèn Champagne ấm + Sách & Mô hình trung tính ---------- */
function FloatingWallShelves() {
  const fairyColors = ['#FFD7A3', '#FFE2B8', '#FFD7A3', '#F5CFA0']
  const shelfBooks = useMemo(() => {
    const r = rng(21)
    const out: { sy: number; x: number; w: number; h: number; c: string }[] = []
    ;[
      { sy: 2.25, startX: 0.1, endX: 1.15 },
      { sy: 2.8, startX: -0.15, endX: 1.05 },
      { sy: 3.35, startX: -0.35, endX: 0.45 },
    ].forEach(({ sy, startX, endX }, idx) => {
      let x = startX
      const palette = SHELF_PALETTES[(idx + 1) % SHELF_PALETTES.length]
      while (x < endX) {
        const w = 0.045 + r() * 0.04
        const h = 0.25 + r() * 0.1
        out.push({ sy, x: x + w / 2, w, h, c: palette[Math.floor(r() * palette.length)] })
        x += w + 0.008
      }
    })
    return out
  }, [])

  return (
    <G p={[6.6, 0, -5.74]}>
      {[2.25, 2.8, 3.35].map((sy, sIdx) => (
        <group key={sy}>
          <B p={[0, sy, 0]} s={[2.68, 0.048, 0.28]} c={WALNUT_LIGHT} rough={0.5} />
          {/* Dây đèn LED Champagne dịu dọc mép kệ */}
          {Array.from({ length: 14 }, (_, li) => {
            const lx = -1.22 + li * 0.188
            const lc = fairyColors[(li + sIdx * 2) % fairyColors.length]
            return (
              <Sph
                key={li}
                p={[lx, sy - 0.03, 0.14]}
                s={[0.018, 0.018, 0.018]}
                c={lc}
                emissive={lc}
                ei={1.65}
              />
            )
          })}
        </group>
      ))}

      {/* Sách trên 3 tầng kệ */}
      {shelfBooks.map((b, i) => (
        <BB key={i} p={[b.x, b.sy + 0.025, 0]} s={[b.w, b.h, 0.22]} c={b.c} rough={0.65} />
      ))}

      {/* Mô hình trang trí trung tính ở đầu trái tầng kệ 2 & 3 */}
      {[-0.95, -0.58].map((rx, i) => (
        <G key={i} p={[rx, 2.83, 0.02]}>
          <BB p={[0, 0.12, 0]} s={[0.12, 0.16, 0.08]} c="#f2ede4" />
          <BB p={[0, 0.16, 0.01]} s={[0.09, 0.08, 0.09]} c={i === 0 ? '#78685c' : '#5b666e'} />
          <BB p={[-0.04, 0, 0]} s={[0.035, 0.12, 0.04]} c="#dbd4c9" />
          <BB p={[0.04, 0, 0]} s={[0.035, 0.12, 0.04]} c="#dbd4c9" />
          <BB p={[0, 0.29, 0]} s={[0.06, 0.06, 0.06]} c="#f2ede4" />
        </G>
      ))}
      <G p={[-0.92, 3.38, 0.02]}>
        <BB p={[0, 0.14, 0]} s={[0.14, 0.18, 0.09]} c="#f2ede4" />
        <BB p={[0, 0.18, 0.01]} s={[0.24, 0.08, 0.04]} c="#35322e" />
        <BB p={[-0.045, 0, 0]} s={[0.04, 0.14, 0.04]} c="#cfc7b9" />
        <BB p={[0.045, 0, 0]} s={[0.04, 0.14, 0.04]} c="#cfc7b9" />
      </G>

      {/* Mô hình & Chậu cây Olive trên kệ trên cùng */}
      <B p={[0.72, 3.44, 0.02]} r={[0, 0.3, 0.1]} s={[0.32, 0.025, 0.18]} c="#D6D1C9" />
      <Cyl p={[1.1, 3.44, 0]} rt={0.075} rb={0.06} h={0.14} c={DARK} />
      <Sph p={[1.1, 3.58, 0]} s={[0.16, 0.13, 0.16]} c="#566E4C" />
    </G>
  )
}

/* ---------- Cây nước nóng lạnh (Đi tới rót nước & Uống nước) ---------- */
function WaterDispenser() {
  const streamRef = useRef<THREE.Group>(null)
  const drinkType = useStore((s) => s.drinkType)

  useFrame(({ clock }) => {
    if (!streamRef.current) return
    const active = Date.now() < useStore.getState().waterPourUntil
    streamRef.current.visible = active
    if (active) {
      streamRef.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 22) * 0.15
    }
  })

  const streamColor = drinkType === 'tea' ? '#C4834E' : drinkType === 'coffee' ? '#9E6338' : '#D6D1C9'
  const drinkLabel = drinkType === 'tea' ? '🌼 Trà hoa cúc' : drinkType === 'coffee' ? '☕ Cà phê nóng' : '💧 Nước tinh khiết'

  return (
    <Interact
      hint={`💧 Cây nước nóng lạnh (${drinkLabel})`}
      onClick={() => useStore.getState().startActivity('drink', true)}
    >
      <G p={[5.35, 0, -5.45]}>
        <BB s={[0.44, 1.06, 0.42]} c="#EFECE6" rough={0.45} />
        <B p={[0, 0.76, 0.215]} s={[0.26, 0.2, 0.02]} c={DARK} />
        <group ref={streamRef} position={[0, 0.72, 0.21]} visible={false}>
          <Cyl p={[0, 0, 0]} rt={0.012} h={0.14} c={streamColor} emissive={streamColor} ei={1.2} />
          <Cyl p={[0, -0.05, 0]} rt={0.036} h={0.075} c="#EFECE6" />
          <Cyl p={[0, -0.03, 0]} rt={0.032} h={0.03} c={streamColor} emissive={streamColor} ei={0.4} />
        </group>
        <Cyl p={[0, 1.28, 0]} rt={0.16} h={0.42} c="#D6D1C9" rough={0.1} opacity={0.38} />
      </G>
    </Interact>
  )
}

/* ---------- Tủ thấp Warm Taupe (#B7AFA5) + Cây Olive + Đèn bàn ánh 3000K (#FFD7A3) ---------- */
function LowCabinet() {
  const floor1DeskLampOn = useStore((s) => s.floor1DeskLampOn)
  return (
    <G p={[6.95, 0, -5.5]}>
      <BB s={[2.05, 0.58, 0.54]} c={WALNUT} />
      <BB p={[0, 0.58, 0]} s={[2.08, 0.05, 0.56]} c="#EFECE6" />
      {/* Chậu cây xanh Olive (#566E4C & #6F8763) */}
      <G p={[-0.38, 0.63, 0]}>
        <Cyl p={[0, 0.13, 0]} rt={0.12} rb={0.095} h={0.26} c="#D6D1C9" />
        <Sph p={[0, 0.42, 0]} s={[0.24, 0.2, 0.24]} c="#566E4C" />
        <Sph p={[0.12, 0.36, 0.05]} s={[0.16, 0.14, 0.16]} c="#6F8763" />
        <Sph p={[-0.12, 0.38, -0.04]} s={[0.16, 0.14, 0.16]} c="#566E4C" />
      </G>
      {/* Đèn bàn ánh vàng 3000K (#FFD7A3) */}
      <Interact
        hint={floor1DeskLampOn ? '💡 Tắt đèn bàn PC' : '💡 Bật đèn bàn PC'}
        onClick={() => useStore.getState().toggleFloor1DeskLamp()}
      >
        <G p={[0.55, 0.63, 0]}>
          <Cyl p={[0, 0.02, 0]} rt={0.1} h={0.03} c={DARK} />
          <Cyl p={[0, 0.24, 0]} rt={0.018} h={0.42} c={DARK} metal={0.65} rough={0.3} />
          <Cyl
            p={[0, 0.48, 0]}
            rt={0.18}
            rb={0.22}
            h={0.28}
            c={floor1DeskLampOn ? '#FFD7A3' : '#D6D1C9'}
            emissive={floor1DeskLampOn ? '#FFD7A3' : '#000000'}
            ei={floor1DeskLampOn ? 1.85 : 0}
            seg={24}
          />
          {floor1DeskLampOn && (
            <mesh position={[0, 0.48, 0]}>
              <sphereGeometry args={[0.26, 16, 12]} />
              <meshBasicMaterial color="#FFD7A3" transparent opacity={0.2} depthWrite={false} />
            </mesh>
          )}
        </G>
      </Interact>
    </G>
  )
}

/* ---------- Rèm voan trắng & Rèm vải kem dài chạm sàn khớp Cửa sổ Panorama tường phải ---------- */
function PanoramicWindow() {
  const curtainsFloor1Open = useStore((s) => s.curtainsFloor1Open)
  const groupRef = useRef<THREE.Group>(null)
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)

  useFrame(({ camera }, dt) => {
    const st = useStore.getState()
    if (groupRef.current) {
      const rightCut =
        st.mode === 'orbit' &&
        st.wallMode === 'ghost' &&
        !(st.viewPreset === 'overview' && st.roofVisible) &&
        isWallCutByCamera(camera.position, [1, 0, 0])
      groupRef.current.visible = !rightCut
    }
    const k = 1 - Math.exp(-dt * 7)
    if (leftRef.current) {
      leftRef.current.position.x = THREE.MathUtils.lerp(leftRef.current.position.x, curtainsFloor1Open ? -2.35 : -1.15, k)
      leftRef.current.scale.x = THREE.MathUtils.lerp(leftRef.current.scale.x, curtainsFloor1Open ? 1 : 2.1, k)
    }
    if (rightRef.current) {
      rightRef.current.position.x = THREE.MathUtils.lerp(rightRef.current.position.x, curtainsFloor1Open ? 2.35 : 1.15, k)
      rightRef.current.scale.x = THREE.MathUtils.lerp(rightRef.current.scale.x, curtainsFloor1Open ? 1 : 2.1, k)
    }
  })

  return (
    <group ref={groupRef}>
      <Interact
        hint="🪟 Rèm cửa Tầng 1"
        onClick={() => useStore.getState().toggleCurtainsFloor1()}
      >
        <G p={[9.95, 0, -1.0]} r={[0, -Math.PI / 2, 0]}>
          {/* Tấm bắt click rộng lớn phủ kín toàn bộ diện tích cửa sổ & rèm */}
          <mesh position={[0, 2.25, 0.25]}>
            <planeGeometry args={[6.0, 3.8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Lớp rèm voan mỏng xuyên sáng không sương mù */}
        <BB p={[-1.75, 0.04, 0.1]} s={[1.15, 3.82, 0.03]} c="#EFECE6" opacity={0.35} rough={0.85} shadow={false} />
        <BB p={[1.75, 0.04, 0.1]} s={[1.15, 3.82, 0.03]} c="#EFECE6" opacity={0.35} rough={0.85} shadow={false} />

        {/* Thanh treo rèm Matte Charcoal (#2B2D2F) */}
        <Cyl p={[0, 3.96, 0.18]} r={[0, 0, Math.PI / 2]} rt={0.025} h={5.8} c={DARK} metal={0.5} />

        {/* Rèm vải Linen Greige (#D6D1C9 / #B7AFA5) bề mặt lì roughness 0.85 */}
        <group ref={leftRef} position={[-2.35, 0, 0.2]}>
          {[-0.36, -0.22, -0.08, 0.06, 0.2, 0.34].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.96, 0]}
              rt={0.085}
              rb={0.095}
              h={3.9}
              c={i % 2 ? '#B7AFA5' : '#D6D1C9'}
              seg={12}
              rough={0.85}
            />
          ))}
        </group>
        <group ref={rightRef} position={[2.35, 0, 0.2]}>
          {[-0.34, -0.2, -0.06, 0.08, 0.22, 0.36].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.96, 0]}
              rt={0.085}
              rb={0.095}
              h={3.9}
              c={i % 2 ? '#B7AFA5' : '#D6D1C9'}
              seg={12}
              rough={0.85}
            />
          ))}
        </group>
      </G>
    </Interact>
    </group>
  )
}

/* ---------- Kệ gỗ đặt 3 chậu cây xanh đón nắng cạnh cửa sổ ---------- */
function WindowPlantBench() {
  return (
    <G p={[9.05, 0, 0.8]}>
      <BB p={[0, 0.38, 0]} s={[0.52, 0.05, 1.65]} c={OAK} rough={0.5} />
      <BB p={[0, 0, -0.76]} s={[0.48, 0.38, 0.05]} c={WALNUT} />
      <BB p={[0, 0, 0.76]} s={[0.48, 0.38, 0.05]} c={WALNUT} />
      <BB p={[0, 0.08, 0]} s={[0.44, 0.04, 1.5]} c={DARK} />

      {/* 3 Chậu cây xanh Olive/Sage (#566E4C & #6F8763) */}
      {[-0.52, 0, 0.52].map((pz, i) => (
        <G key={i} p={[0, 0.43, pz]}>
          <Cyl p={[0, 0.1, 0]} rt={0.095} rb={0.075} h={0.2} c={i === 1 ? '#D6D1C9' : '#EFECE6'} />
          <Sph p={[0, 0.3, 0]} s={[0.16, 0.14, 0.16]} c={i % 2 ? '#6F8763' : '#566E4C'} />
          <Sph p={[0.06, 0.24, 0.05]} s={[0.11, 0.1, 0.11]} c="#6F8763" />
        </G>
      ))}
    </G>
  )
}

/* ---------- Đèn cây đứng Matte Charcoal ánh vàng 3000K (#FFD7A3) ---------- */
function FloorLamp() {
  const lampOn = useStore((s) => s.lampOn)
  return (
    <Interact
      hint="💡 Đèn cây"
      onClick={() => useStore.getState().toggleLamp()}
    >
      <G p={[8.75, 0, 3.45]}>
        <Cyl p={[0, 0.025, 0]} rt={0.26} h={0.05} c={DARK} metal={0.5} />
        <Cyl p={[0, 1.05, 0]} rt={0.022} h={2.05} c={DARK} metal={0.5} />
        <Cyl
          p={[0, 2.12, 0]}
          rt={0.32}
          rb={0.38}
          h={0.48}
          c={lampOn ? '#FFD7A3' : '#D6D1C9'}
          emissive={lampOn ? '#FFD7A3' : '#000000'}
          ei={lampOn ? 1.35 : 0}
          seg={32}
        />
      </G>
    </Interact>
  )
}

/* ---------- Góc Thú Cưng: Tháp trụ leo 3 tầng + Chuồng gỗ có nệm ngủ bên trong + Nệm tròn + Máy cho ăn ---------- */
function DogCorner() {
  const feedingUntil = useStore((s) => s.feedingUntil)
  const pelletsRef = useRef<THREE.Group>(null)
  const foodMoundRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const active = Date.now() < feedingUntil
    const t = clock.elapsedTime
    if (pelletsRef.current) {
      pelletsRef.current.visible = active
      if (active) {
        pelletsRef.current.children.forEach((child, idx) => {
          const phase = (t * 3.5 + idx * 0.22) % 1
          child.position.y = 0.55 - phase * 0.45
          child.position.x = -7.25 + phase * 0.3 + Math.sin(idx) * 0.03
        })
      }
    }
    if (foodMoundRef.current) {
      foodMoundRef.current.visible = feedingUntil > 0
      const scale = active ? 0.6 + Math.sin(t * 6) * 0.15 : 1
      foodMoundRef.current.scale.set(0.14, 0.065 * scale, 0.14)
    }
  })

  return (
    <group>
      {/* 1. Tháp trụ thú cưng nhiều tầng (Multi-tier Pet Tower) ở góc trái phía trước */}
      <G p={[-8.75, 0, 2.2]}>
        {/* Đế gỗ dày */}
        <BB p={[0, 0, 0]} s={[1.15, 0.08, 1.15]} c={OAK} rough={0.8} />
        {/* 4 Trụ quấn dây thừng tầng 1 */}
        {[
          [-0.4, -0.4],
          [0.4, -0.4],
          [-0.4, 0.4],
          [0.4, 0.4],
        ].map(([px, pz], i) => (
          <Cyl key={i} p={[px, 0.42, pz]} rt={0.055} h={0.68} c="#cec5b8" rough={0.95} />
        ))}
        {/* Mặt sàn tầng 2 + Cầu thang nhỏ */}
        <BB p={[0, 0.76, 0]} s={[1.08, 0.07, 1.08]} c={OAK} rough={0.8} />
        <BB p={[0.35, 0.38, 0.65]} r={[0.65, 0, 0]} s={[0.28, 0.05, 0.85]} c={OAK} />
        {/* Trụ tầng 2 + Hộp nhà vuông tầng 3 */}
        <Cyl p={[-0.36, 1.12, -0.36]} rt={0.055} h={0.65} c="#cec5b8" rough={0.95} />
        <Cyl p={[0.36, 1.12, -0.36]} rt={0.055} h={0.65} c="#cec5b8" rough={0.95} />
        <Cyl p={[-0.36, 1.12, 0.36]} rt={0.055} h={0.65} c="#cec5b8" rough={0.95} />
        <BB p={[0.08, 1.38, 0.05]} s={[0.88, 0.62, 0.88]} c="#dcd5c9" rough={0.85} />
        <Cyl p={[0.53, 1.68, 0.05]} r={[0, 0, Math.PI / 2]} rt={0.18} h={0.02} c="#36322d" />
        <Cyl p={[0.08, 1.68, 0.5]} r={[Math.PI / 2, 0, 0]} rt={0.18} h={0.02} c="#36322d" />
        {/* 2 Đài quan sát tròn êm ái trên đỉnh tháp */}
        <Cyl p={[-0.22, 2.15, -0.18]} rt={0.055} h={0.42} c="#cec5b8" />
        <Cyl p={[-0.22, 2.38, -0.18]} rt={0.34} rb={0.32} h={0.12} c="#eae5dc" />
        <Cyl p={[0.24, 2.28, -0.18]} rt={0.055} h={0.65} c="#cec5b8" />
        <Cyl p={[0.24, 2.62, -0.18]} rt={0.34} rb={0.32} h={0.12} c="#eae5dc" />
      </G>

      {/* 2. Đệm nằm chần bông chữ nhật & Máy ăn phụ phía trước tháp */}
      <G p={[-7.35, 0, 3.65]}>
        <BB p={[0, 0, 0]} s={[0.92, 0.1, 0.68]} c="#c4bcb0" rough={0.9} />
        <BB p={[0, 0.08, 0]} s={[0.8, 0.06, 0.56]} c="#efebe3" rough={0.95} />
      </G>
      <G p={[-8.75, 0, 3.85]}>
        <Cyl p={[0, 0.22, -0.12]} rt={0.14} h={0.44} c="#f2efe9" />
        <BB p={[0, 0, 0.06]} s={[0.36, 0.1, 0.48]} c="#e4dfd7" />
        <Cyl p={[0, 0.1, 0.16]} rt={0.11} h={0.03} c="#7a6450" />
      </G>

      {/* 3. Chuồng gỗ thú cưng rỗng bên trong có nệm êm & đèn ấm (Nơi Mochi & Bơ đi vào ngủ ngon lành) */}
      <G p={[-7.6, 0, -0.3]}>
        {/* Vách sau & Vách trái */}
        <BB p={[0, 0, -0.71]} s={[1.95, 1.15, 0.08]} c="#c8bfb2" rough={0.85} />
        <BB p={[-0.935, 0, 0]} s={[0.08, 1.15, 1.5]} c="#c8bfb2" rough={0.85} />
        {/* Vách trước có ô cửa lớn mở thông thoáng */}
        <BB p={[-0.72, 0, 0.71]} s={[0.5, 1.15, 0.08]} c="#c8bfb2" rough={0.85} />
        <BB p={[0.72, 0, 0.71]} s={[0.5, 1.15, 0.08]} c="#c8bfb2" rough={0.85} />
        <BB p={[0, 0.78, 0.71]} s={[1.95, 0.37, 0.08]} c="#c8bfb2" rough={0.85} />
        {/* Vách phải có cửa sổ/cửa phụ mở thông thoáng */}
        <BB p={[0.935, 0, -0.48]} s={[0.08, 1.15, 0.54]} c="#c8bfb2" rough={0.85} />
        <BB p={[0.935, 0, 0.48]} s={[0.08, 1.15, 0.54]} c="#c8bfb2" rough={0.85} />
        <BB p={[0.935, 0.78, 0]} s={[0.08, 0.37, 1.5]} c="#c8bfb2" rough={0.85} />
        {/* Mái gỗ & Đệm olive trầm trên nóc chuồng (#566E4C) */}
        <BB p={[0, 1.15, 0]} s={[2.02, 0.08, 1.56]} c={WALNUT} />
        <BB p={[0.02, 1.23, 0.02]} s={[1.64, 0.1, 1.24]} c="#566E4C" rough={0.85} />
        {/* Nệm ấm bên trong chuồng gỗ + Ánh đèn 3000K (#FFD7A3) */}
        <BB p={[0, 0.02, 0]} s={[1.72, 0.06, 1.28]} c="#EFECE6" rough={0.85} />
        <B p={[0, 1.1, 0]} s={[0.8, 0.02, 0.5]} c="#FFD7A3" emissive="#FFD7A3" ei={1.15} shadow={false} />
      </G>

      {/* 4. Nệm tròn Donut êm ái trên thảm */}
      <G p={[-6.0, 0, 0.85]}>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.46, 0.13, 16, 40]} />
          <meshStandardMaterial color="#ece7de" roughness={0.95} />
        </mesh>
        <Cyl p={[0, 0.05, 0]} rt={0.46} h={0.08} c="#ddd6ca" seg={32} />
      </G>

      {/* 5. Máy cho ăn tự động & Bát ăn + Hoạt ảnh hạt thức ăn rơi xuống bát */}
      <Interact
        hint="🦴 Máy cho ăn"
        onClick={() => useStore.getState().startActivity('feed', true)}
      >
        <G p={[-7.7, 0, 1.25]}>
          <BB s={[0.56, 0.76, 0.48]} c="#f2efe9" rough={0.35} />
          <BB p={[0, 0.76, 0]} s={[0.58, 0.1, 0.5]} c="#282624" />
          <BB p={[0.38, 0, 0.05]} s={[0.28, 0.12, 0.28]} c="#dcd7cf" />
        </G>
        <Cyl p={[-6.95, 0.05, 1.45]} rt={0.18} rb={0.14} h={0.1} c="#b8ab9a" />
        <mesh ref={foodMoundRef} position={[-6.95, 0.11, 1.45]} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#6e5742" roughness={0.9} />
        </mesh>
        <group ref={pelletsRef} visible={false}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[-7.1, 0.4, 1.44 + (i % 2) * 0.04]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#846b53" />
            </mesh>
          ))}
        </group>
      </Interact>
    </group>
  )
}

/* ---------- Kệ TV Gỗ Óc Chó & Smart TV 75 inch + Máy PS5 trắng ---------- */
function SmartTvUnit() {
  const tvOn = useStore((s) => s.tvOn)
  const tvChannel = useStore((s) => s.tvChannel)

  const handleTvClick = () => {
    useStore.getState().startActivity('tv', true)
  }

  return (
    <G p={[4.15, 0, 0.35]}>
      <Interact hint="📺 Smart TV" onClick={handleTvClick}>
        {/* Kệ TV Warm Taupe/Greige (#B7AFA5) & mặt gỗ sồi sáng (#D8C7B2) */}
        <BB p={[0, 0, 0]} s={[2.85, 0.44, 0.56]} c={WALNUT} rough={0.55} />
        <BB p={[0, 0.44, 0]} s={[2.89, 0.04, 0.58]} c={OAK} rough={0.48} />
        {[-0.92, 0, 0.92].map((x, i) => (
          <B key={i} p={[x, 0.22, 0.285]} s={[0.86, 0.32, 0.02]} c={DARK} />
        ))}
        {/* Loa Soundbar & Thiết bị console Matte Charcoal */}
        <BB p={[0, 0.48, 0.14]} s={[1.05, 0.065, 0.11]} c={DARK} metal={0.45} rough={0.35} />
        <BB p={[1.18, 0.48, 0.02]} s={[0.12, 0.42, 0.24]} c="#EFECE6" />
        <BB p={[1.18, 0.48, 0.02]} s={[0.07, 0.41, 0.25]} c={DARK} />
        <BB p={[-1.12, 0.48, 0.04]} s={[0.2, 0.24, 0.2]} c={DARK} />
        <BB p={[0, 0.48, -0.04]} s={[0.68, 0.03, 0.26]} c={DARK} metal={0.55} />
        <BB p={[0, 0.51, -0.08]} s={[0.12, 0.24, 0.08]} c={DARK} metal={0.5} />

        {/* Khung màn hình Smart TV 75 inch Matte Charcoal (#2B2D2F) */}
        <B p={[0, 1.32, -0.04]} s={[2.16, 1.24, 0.045]} c={DARK} metal={0.45} rough={0.3} />
        {tvOn && (
          <B
            p={[0, 1.32, -0.075]}
            s={[2.22, 1.28, 0.01]}
            c="#FFD7A3"
            emissive="#FFD7A3"
            ei={0.75}
            opacity={0.3}
            shadow={false}
          />
        )}
      </Interact>

      <SmartTvScreen tvOn={tvOn} tvChannel={tvChannel} onClick={handleTvClick} />
    </G>
  )
}

function SmartTvScreen({
  tvOn,
  tvChannel,
  onClick,
}: {
  tvOn: boolean
  tvChannel: number
  onClick: () => void
}) {
  const lastDrawRef = useRef(0)

  const { liveCanvas, liveCtx, liveTex } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 288
    const ctx = c.getContext('2d')!
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return { liveCanvas: c, liveCtx: ctx, liveTex: t }
  }, [])

  useFrame(({ clock }) => {
    if (!tvOn) return
    const t = clock.elapsedTime
    if (t - lastDrawRef.current < 0.075) return
    lastDrawRef.current = t

    const w = liveCanvas.width
    const h = liveCanvas.height
    const g = liveCtx

    if (tvChannel === 0) {
      // Kênh 0: Hoàng hôn trung tính Lofi
      const grd = g.createLinearGradient(0, 0, 0, h)
      grd.addColorStop(0, '#222428')
      grd.addColorStop(0.5, '#3d3f44')
      grd.addColorStop(0.85, '#686259')
      grd.addColorStop(1, '#a8967e')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)

      // Những vì sao dịu nhẹ
      g.fillStyle = 'rgba(246,242,235,0.8)'
      for (let s = 0; s < 22; s++) {
        const sx = ((s * 73) % (w - 40)) + 20
        const sy = ((s * 41) % (h * 0.55)) + 12
        const r = 1 + (Math.sin(t * 2.5 + s) + 1) * 0.9
        g.beginPath()
        g.arc(sx, sy, r, 0, Math.PI * 2)
        g.fill()
      }

      // Vầng trăng / Mặt trời champagne dịu ở trung tâm
      const sunGlow = g.createRadialGradient(w / 2, h * 0.56, 12, w / 2, h * 0.56, 115)
      sunGlow.addColorStop(0, '#f7f1e5')
      sunGlow.addColorStop(0.35, '#dfd0b8')
      sunGlow.addColorStop(0.7, 'rgba(176,162,142,0.35)')
      sunGlow.addColorStop(1, 'rgba(56,54,50,0)')
      g.fillStyle = sunGlow
      g.beginPath()
      g.arc(w / 2, h * 0.56, 115, 0, Math.PI * 2)
      g.fill()

      // Tầng mây bồng bềnh trôi nhẹ
      const cloudPositions = [
        [w * 0.18, h * 0.74, 46],
        [w * 0.34, h * 0.7, 56],
        [w * 0.5, h * 0.72, 64],
        [w * 0.66, h * 0.7, 56],
        [w * 0.82, h * 0.74, 46],
      ]
      g.fillStyle = '#ece6dc'
      cloudPositions.forEach(([cx, cy, cr], idx) => {
        const dx = Math.sin(t * 0.8 + idx) * 8
        g.beginPath()
        g.arc(cx + dx, cy, cr, 0, Math.PI * 2)
        g.fill()
      })

      g.fillStyle = '#252422'
      g.fillRect(0, h * 0.78, w, h * 0.22)
      for (let i = 0; i < 32; i++) {
        const barH = 6 + Math.abs(Math.sin(t * 4 + i * 0.45)) * 26
        g.fillStyle = i % 2 ? '#e5dbc9' : '#9c9284'
        g.fillRect(36 + i * 14, h * 0.78 - barH, 8, barH)
      }
      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 13px sans-serif'
      g.fillText('✦ CH1 · DREAMY SUNSET LOFI', 22, 28)
    } else if (tvChannel === 1) {
      // Kênh 1: Thủy cung Slate dịu mắt
      const grd = g.createLinearGradient(0, 0, 0, h)
      grd.addColorStop(0, '#36454b')
      grd.addColorStop(0.6, '#27343a')
      grd.addColorStop(1, '#1a2328')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)

      g.strokeStyle = 'rgba(224,230,234,0.55)'
      g.lineWidth = 2
      for (let b = 0; b < 14; b++) {
        const bx = 35 + ((b * 37) % (w - 70)) + Math.sin(t * 2 + b) * 8
        const by = h - ((t * 45 + b * 29) % h)
        g.beginPath()
        g.arc(bx, by, 4 + (b % 4) * 2, 0, Math.PI * 2)
        g.stroke()
      }

      const fishColors = ['#c9bba7', '#e8e2d7', '#9aa6aa', '#849488', '#b8a58f']
      for (let f = 0; f < 7; f++) {
        const dir = f % 2 === 0 ? 1 : -1
        const speed = 42 + f * 8
        const rawX = (t * speed + f * 95) % (w + 80)
        const fx = dir === 1 ? rawX - 40 : w + 40 - rawX
        const fy = 55 + f * 30 + Math.sin(t * 3 + f) * 10
        g.fillStyle = fishColors[f % fishColors.length]
        g.beginPath()
        g.ellipse(fx, fy, 18, 9, 0, 0, Math.PI * 2)
        g.fill()
        g.beginPath()
        g.moveTo(fx - dir * 16, fy)
        g.lineTo(fx - dir * 28, fy - 9)
        g.lineTo(fx - dir * 28, fy + 9)
        g.closePath()
        g.fill()
      }
      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 13px sans-serif'
      g.fillText('✦ CH2 · OCEAN AQUARIUM 4K', 22, 28)
    } else if (tvChannel === 2) {
      // Kênh 2: Vũ trụ & Sao băng tối giản
      g.fillStyle = '#141518'
      g.fillRect(0, 0, w, h)
      for (let s = 0; s < 35; s++) {
        const sx = (s * 97 + Math.floor(t * 12)) % w
        const sy = (s * 53) % h
        g.fillStyle = s % 3 === 0 ? '#cfc8bc' : '#f4f1ea'
        g.fillRect(sx, sy, 2, 2)
      }
      const px = w / 2 + Math.sin(t * 0.7) * 35
      const py = h / 2
      const pGrad = g.createRadialGradient(px - 15, py - 15, 8, px, py, 52)
      pGrad.addColorStop(0, '#cfc4b4')
      pGrad.addColorStop(1, '#343230')
      g.fillStyle = pGrad
      g.beginPath()
      g.arc(px, py, 50, 0, Math.PI * 2)
      g.fill()

      g.strokeStyle = 'rgba(220,208,188,0.7)'
      g.lineWidth = 6
      g.beginPath()
      g.ellipse(px, py, 92, 20, -0.25, 0, Math.PI * 2)
      g.stroke()

      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 13px sans-serif'
      g.fillText('✦ CH3 · COSMOS & NEBULA', 22, 28)
    } else {
      // Kênh 3: Trận cầu đỉnh cao (tông xám-olive dịu hài hòa)
      g.fillStyle = '#3f5041'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = 'rgba(244,240,234,0.68)'
      g.lineWidth = 3
      g.strokeRect(26, 24, w - 52, h - 48)
      g.beginPath()
      g.moveTo(w / 2, 24)
      g.lineTo(w / 2, h - 24)
      g.stroke()
      g.beginPath()
      g.arc(w / 2, h / 2, 38, 0, Math.PI * 2)
      g.stroke()

      const bx = w / 2 + Math.sin(t * 2.6) * 145
      const by = h / 2 + Math.cos(t * 3.4) * 75
      g.fillStyle = '#f5f2ec'
      g.beginPath()
      g.arc(bx, by, 7, 0, Math.PI * 2)
      g.fill()

      for (let p = 0; p < 6; p++) {
        const teamRed = p < 3
        const tx = (teamRed ? w * 0.3 : w * 0.7) + Math.sin(t * 2 + p * 1.4) * 65
        const ty = 65 + (p % 3) * 75 + Math.cos(t * 2.5 + p) * 20
        g.fillStyle = teamRed ? '#a8786d' : '#7b92a1'
        g.beginPath()
        g.arc(tx, ty, 9, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = 'rgba(24,24,26,0.86)'
      g.fillRect(22, 14, 195, 24)
      g.fillStyle = '#f6f3ee'
      g.font = '600 13px sans-serif'
      g.fillText('CH4 · LIVE: KHOA FC 3 - 1', 30, 30)
    }

    liveTex.needsUpdate = true
  })

  return (
    <mesh
      position={[0, 1.32, -0.015]}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <planeGeometry args={[2.06, 1.16]} />
      {tvOn ? (
        <meshStandardMaterial
          map={liveTex}
          emissive="#ffffff"
          emissiveMap={liveTex}
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      ) : (
        <meshStandardMaterial color="#121315" roughness={0.22} />
      )}
    </mesh>
  )
}

/* ---------- Đôn nệm vuông trung tính + Chăn camel (#C4834E) ---------- */
function Ottoman() {
  return (
    <G p={[2.05, 0, 2.15]}>
      <RBB s={[1.06, 0.36, 1.06]} c="#8E908F" rough={0.85} radius={0.04} shadow />
      <RBB p={[0, 0.36, 0]} s={[1.02, 0.1, 1.02]} c="#B6B7B5" rough={0.85} radius={0.03} shadow={false} />
      <RBB p={[0.18, 0.45, 0.1]} r={[0, 0.15, 0]} s={[0.52, 0.06, 0.72]} c={CAMEL} rough={0.85} radius={0.025} shadow={false} />
      <BB p={[0, 0, 0]} s={[0.98, 0.04, 0.98]} c={DARK} />
    </G>
  )
}

/* ---------- Bàn trà gỗ sồi (#D8C7B2 / #C4AF97) chân Matte Charcoal (#2B2D2F) ---------- */
function CoffeeTable() {
  return (
    <Interact hint="📺 Đổi kênh TV" onClick={() => useStore.getState().cycleTvChannel()}>
      <G p={[4.15, 0, 2.15]}>
        <RBB p={[0, 0.4, 0]} s={[1.65, 0.055, 0.92]} c={OAK} rough={0.48} metal={0.04} radius={0.03} shadow />
        <BB p={[0, 0.06, 0]} s={[1.55, 0.045, 0.84]} c={WALNUT_LIGHT} rough={0.5} />
        {[-0.74, 0.74].map((x) => (
          <BB key={x} p={[x, 0, 0]} s={[0.06, 0.4, 0.84]} c={DARK} shadow />
        ))}
        {/* Sách tạp chí mở, tách cà phê & điều khiển TV trên bàn trà */}
        <BB p={[-0.22, 0.455, 0.04]} r={[0, 0.18, 0]} s={[0.42, 0.025, 0.3]} c="#EFECE6" shadow={false} />
        <Cyl p={[0.32, 0.52, -0.08]} rt={0.05} rb={0.07} h={0.22} c="#D6D1C9" />
        <BB p={[0.35, 0.455, 0.2]} r={[0, -0.25, 0]} s={[0.065, 0.02, 0.18]} c={DARK} shadow={false} />
      </G>
    </Interact>
  )
}

const LEATHER = SLATE_DARK
const LEATHER_2 = SLATE

/* ---------- Bộ Sofa Slate Blue (#5E7487 / #4A5E6F) lì roughness 0.85 + Gối & Chăn Camel/Rust ---------- */
function Sofa() {
  return (
    <Interact
      hint="🛋️ Ghế sofa"
      onClick={() => useStore.getState().startActivity('tv', true)}
    >
      <group>
        {/* Nhánh dọc bên phải */}
        <G p={[6.35, 0, 2.0]}>
          <RBB s={[1.12, 0.4, 2.85]} c={LEATHER} rough={0.85} radius={0.04} shadow />
          <RBB p={[-0.06, 0.4, -0.68]} s={[0.96, 0.15, 1.32]} c={LEATHER_2} rough={0.85} radius={0.03} />
          <RBB p={[-0.06, 0.4, 0.68]} s={[0.96, 0.15, 1.32]} c={LEATHER_2} rough={0.85} radius={0.03} />
          <RBB p={[0.44, 0.4, 0]} s={[0.24, 0.52, 2.85]} c={LEATHER} rough={0.85} radius={0.03} shadow />
          <RBB p={[-0.04, 0.4, -1.32]} s={[1.06, 0.26, 0.2]} c={LEATHER} rough={0.85} radius={0.03} />
          <RBB p={[0.22, 0.56, -0.75]} s={[0.14, 0.38, 0.48]} r={[0, 0, 0.2]} c={CAMEL} rough={0.85} radius={0.03} />
          <RBB p={[0.22, 0.56, 0.65]} s={[0.14, 0.36, 0.44]} r={[0, 0, 0.18]} c={RUST} rough={0.85} radius={0.03} />
        </G>
        {/* Nhánh ngang phía trước (Khoa ngồi xem TV tại đây) */}
        <G p={[4.45, 0, 3.65]}>
          <RBB s={[2.95, 0.4, 1.1]} c={LEATHER} rough={0.85} radius={0.04} shadow />
          <RBB p={[-0.72, 0.4, -0.06]} s={[1.38, 0.15, 0.94]} c={LEATHER_2} rough={0.85} radius={0.03} />
          <RBB p={[0.72, 0.4, -0.06]} s={[1.38, 0.15, 0.94]} c={LEATHER_2} rough={0.85} radius={0.03} />
          <RBB p={[0, 0.4, 0.42]} s={[2.95, 0.44, 0.24]} c={LEATHER} rough={0.85} radius={0.03} shadow />
          <RBB p={[-1.36, 0.4, -0.04]} s={[0.22, 0.26, 1.04]} c={LEATHER} rough={0.85} radius={0.03} />
          <RBB p={[-0.85, 0.54, 0.2]} s={[0.48, 0.34, 0.14]} r={[0.2, 0, 0]} c={CAMEL} rough={0.85} radius={0.03} />
          {/* Chăn mỏng cam đất #C4834E vắt qua thành ghế sofa */}
          <RBB p={[0.62, 0.68, 0.36]} s={[0.78, 0.44, 0.3]} c={CAMEL} rough={0.85} radius={0.04} shadow={false} />
        </G>
      </group>
    </Interact>
  )
}

export function Monstera({ p }: { p: V3 }) {
  const leaves = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 13 }, (_, i) => {
      const a = (i / 13) * Math.PI * 2 + r() * 0.4
      const len = 0.42 + r() * 0.4
      const h = 0.78 + r() * 0.75
      return { a, len, h, tilt: 0.3 + r() * 0.5 }
    })
  }, [])
  return (
    <G p={p}>
      <Cyl p={[0, 0.28, 0]} rt={0.3} rb={0.22} h={0.56} c={DARK} />
      <Cyl p={[0, 0.54, 0]} rt={0.27} h={0.04} c="#4A3F35" />
      {leaves.map((l, i) => {
        const x = Math.cos(l.a) * l.len
        const z = Math.sin(l.a) * l.len
        return (
          <group key={i}>
            <mesh
              position={[x / 2, 0.55 + l.h / 2, z / 2]}
              rotation={[Math.sin(l.a) * 0.5, 0, -Math.cos(l.a) * 0.5]}
            >
              <cylinderGeometry args={[0.012, 0.018, Math.hypot(l.len, l.h), 6]} />
              <meshStandardMaterial color="#566E4C" />
            </mesh>
            <mesh
              position={[x, 0.55 + l.h, z]}
              rotation={[0, -l.a, l.tilt]}
              scale={[0.32, 0.025, 0.24]}
            >
              <sphereGeometry args={[1, 16, 10]} />
              <meshStandardMaterial color={i % 2 ? '#566E4C' : '#6F8763'} roughness={0.62} />
            </mesh>
          </group>
        )
      })}
    </G>
  )
}

export const COLLIDERS: [number, number, number, number][] = [
  // Đồ nội thất phòng ngủ & phòng khách
  [-8.5, -6, -6.1, -5.0],
  [-5.6, -6, -4.2, -5.2],
  [-3.7, -6, -1.5, -2.85],
  [-1.0, -6, 0.8, -5.2],
  [1.45, -6, 4.25, -4.4],
  [5.05, -6, 8.1, -5.1],
  [8.6, 0.0, 9.6, 1.6],
  [8.4, 3.1, 9.1, 3.8],
  [-8.1, 1.5, -6.4, 4.2],
  [-8.1, -1.1, -6.4, 1.6],
  [-9.65, 0.35, -8.05, 4.58], // Gầm cầu thang (chỉ vào cầu thang từ chiếu nghỉ z = 4.92)
  [0.2, -0.6, 0.9, 0.1],
  [2.7, 0.0, 5.6, 0.7],
  [1.55, 1.65, 2.55, 2.55], // Đôn ottoman
  [3.35, 1.7, 4.95, 2.5],   // Bàn trà phòng khách (để thoáng khoảng z: 2.55 .. 3.2 cho lối đi sofa)
  [5.85, 0.55, 6.95, 3.45],  // Nhánh sofa dọc bên phải
  [3.1, 3.25, 5.9, 4.25],   // Thân đệm ghế sofa chính (chừa mép trước z = 2.85 làm điểm ngồi)

  // Đồ nội thất phòng tắm & giặt ủi
  [-14.8, -2.4, -12.8, -0.8], // Bồn tắm oval
  [-15.4, -5.8, -12.8, -4.0], // Vách tắm kính đứng
  [-13.2, -5.8, -10.3, -4.8], // Bàn Lavabo & Máy giặt
  [-11.6, -1.2, -10.3, -0.1], // Bồn cầu thông minh
  [-15.6, 2.75, -14.9, 4.55], // Kệ tủ Master Bath Lounge áp sát tường trái
]

// Tường bao Tầng 1 & Phòng tắm (chừa trống Cửa Chính x: -2.05..-0.95 và Cửa Phòng Tắm z: -3.95..-2.85)
export const HOUSE_WALL_COLLIDERS: [number, number, number, number][] = [
  [-15.88, -6.28, 10.28, -5.60],   // Tường sau Tầng 1 & Phòng tắm
  [-15.88, -6.28, -15.45, 6.32],   // Tường trái Phòng tắm
  [9.45, -6.28, 10.28, 6.32],      // Tường phải Phòng khách
  [-15.88, 5.55, -2.05, 6.32],     // Tường mặt tiền bên trái Cửa Chính
  [-0.95, 5.55, 10.28, 6.32],      // Tường mặt tiền bên phải Cửa Chính
  [-10.15, -6.28, -9.75, -3.95],   // Vách ngăn Phòng tắm đoạn Bắc
  [-10.15, -2.85, -9.75, 6.32],    // Vách ngăn Phòng tắm đoạn Nam
]

// Vật cản ngoài sân vườn khớp tọa độ LuxuryLandscaping.tsx
export const OUTDOOR_COLLIDERS: [number, number, number, number][] = [
  // Lòng hồ bơi vô cực mini (x: +5.75..+14.85, z: +7.1..+13.95 + thành/rãnh tràn)
  [5.65, 7.12, 15.05, 14.08],

  // Phần mặt nước hồ cạn 2 bên lối đá bước dạo (vẫn đi dọc các phiến đá ở giữa x: -2.55..-0.25)
  [-2.96, 7.85, -2.55, 13.10],
  [-0.25, 7.85, 0.16, 12.60],
  [-2.96, 14.75, 0.16, 15.55], // Mép nước phía Nam trước phiến đá bước dạo cuối

  // 2 Ghế tắm nắng & Bàn trà nhỏ trên Sundeck
  [2.75, 7.98, 3.66, 12.48],

  // Bộ sofa chữ L & Bàn lửa Firepit Lounge
  [-13.55, 8.78, -8.95, 9.72],    // Nhánh sofa Bắc
  [-13.54, 9.70, -12.62, 13.00],  // Nhánh sofa Tây
  [-11.81, 10.58, -10.09, 11.82], // Bàn lửa Firepit

  // Bồn cây mặt tiền cánh trái
  [-15.70, 6.30, -5.10, 7.14],

  // Thân cây to kiến trúc (ArchitecturalTree)
  [-20.12, 10.88, -19.08, 11.92],
  [-19.86, -5.06, -18.94, -4.14],
  [14.80, 3.70, 15.80, 4.70],
  [14.66, -6.84, 15.54, -5.96],
  [-7.24, -8.64, -6.36, -7.76],
  [4.72, -8.88, 5.68, -7.92],

  // Đèn trụ sân vườn (BollardLight)
  [-3.40, 9.12, -3.24, 9.28],
  [0.44, 9.12, 0.60, 9.28],
  [-3.40, 12.02, -3.24, 12.18],
  [0.44, 12.02, 0.60, 12.18],
  [-3.40, 14.82, -3.24, 14.98],
  [0.44, 14.82, 0.60, 14.98],
  [-6.28, 13.72, -6.12, 13.88],
  [-16.18, 13.72, -16.02, 13.88],
  [1.72, 13.52, 1.88, 13.68],
]

export function isBlocked(x: number, z: number, r = 0.35) {
  // Phạm vi tường rào khuôn viên sân vườn
  if (x < -21.2 + r || x > 16.2 - r || z < -9.2 + r || z > 15.1 - r) return true

  for (const [x1, z1, x2, z2] of HOUSE_WALL_COLLIDERS) {
    if (x + r > x1 && x - r < x2 && z + r > z1 && z - r < z2) return true
  }

  for (const [x1, z1, x2, z2] of COLLIDERS) {
    if (x + r > x1 && x - r < x2 && z + r > z1 && z - r < z2) return true
  }

  for (const [x1, z1, x2, z2] of OUTDOOR_COLLIDERS) {
    if (x + r > x1 && x - r < x2 && z + r > z1 && z - r < z2) return true
  }
  return false
}

export function isBlockedTier2(x: number, z: number, r = 0.35) {
  // Tường bao quanh Tầng 2
  if (x < -9.75 + r || x > 9.75 - r || z < -5.7 + r) return true

  // Ô cầu thang & lan can kính bảo vệ cầu thang (x < -7.65, z > 0.22): chỉ lên/xuống tại đỉnh thang [-8.85, -0.35]
  if (x - r < -7.62 && z + r > 0.22) return true

  // Ô giếng trời thông tầng (Atrium void): chỉ có sàn ở x < -1.2 khi z > 0.16
  if (z > 0.14 - r) {
    if (x > -1.25 - r) return true // Rơi xuống giếng trời
    if (z > 4.65 - r) return true // Mép trước cánh phòng ngủ Tầng 2
  }

  // Đồ nội thất chính trên Tầng 2:
  // Giường ngủ đôi
  if (x + r > -6.4 && x - r < -3.6 && z + r > -5.7 && z - r < -2.3) return true
  // Cụm bàn trà & ghế lười tròn trước giường
  if (x + r > -4.35 && x - r < -2.75 && z + r > 0.65 && z - r < 1.65) return true
  // Ghế băng dài bọc nệm kem áp sát tường trái
  if (x + r > -9.9 && x - r < -9.15 && z + r > -3.7 && z - r < -1.7) return true
  // Chậu cây lớn, kệ treo váy chữ A & kệ trưng bày thấp giữa phòng
  if (x + r > -2.35 && x - r < 0.35 && z + r > -5.8 && z - r < -3.15) return true
  // Cụm Đàn Piano & Giá vẽ tranh gỗ ở khoảng giữa phòng
  if (x + r > -1.35 && x - r < 1.15 && z + r > -2.05 && z - r < -1.05) return true
  // Bàn PC đồ họa
  if (x + r > 1.4 && x - r < 3.1 && z + r > -5.7 && z - r < -4.5) return true
  // Bàn trang điểm mở rộng 25%
  if (x + r > 4.05 && x - r < 5.85 && z + r > -5.7 && z - r < -4.45) return true
  // Tủ quần áo
  if (x + r > 6.5 && x - r < 8.8 && z + r > -5.7 && z - r < -4.5) return true

  return false
}
