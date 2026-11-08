import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Sph } from './prims'
import { dartboard, loadPhotoTexture, rng, screen, sunflowerArt, windowSky } from './textures'
import { WALL_PHOTOS, type V3 } from '../data/config'
import { useStore } from '../store'
import { Bathroom } from './Bathroom'
import { SecondFloor } from './SecondFloor'

const DARK = '#231c18'
const WALNUT = '#4a3325'
const WALNUT_LIGHT = '#6e4e37'
const OAK = '#c8ad88'

function Interact({
  onClick,
  children,
}: {
  hint?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
    </group>
  )
}

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
    { x: -0.82, c: '#f5f3ef', h: 0.88 },
    { x: -0.58, c: '#e5e0d8', h: 0.82 },
    { x: -0.34, c: '#d6cfc2', h: 0.92 },
    { x: 0.0, c: '#f8fafc', h: 0.84 },
    { x: 0.24, c: '#cbd5e1', h: 0.78 },
    { x: 0.56, c: '#334155', h: 0.88 },
    { x: 0.82, c: '#1e293b', h: 0.82 },
  ]

  return (
    <Interact
      hint="👕 Tủ quần áo"
      onClick={() => useStore.getState().startActivity('wardrobe', true)}
    >
      <G p={[-7.3, 0, -5.45]}>
        {/* Khung tủ gỗ óc chó sẫm */}
        <BB p={[0, 0, -0.42]} s={[2.32, 2.78, 0.06]} c={DARK} rough={0.5} />
        <BB p={[-1.13, 0, 0]} s={[0.06, 2.78, 0.88]} c={DARK} rough={0.5} />
        <BB p={[1.13, 0, 0]} s={[0.06, 2.78, 0.88]} c={DARK} rough={0.5} />
        <BB p={[-0.36, 0.06, -0.02]} s={[0.04, 2.66, 0.8]} c="#2d231e" />
        <BB p={[0.38, 0.06, -0.02]} s={[0.04, 2.66, 0.8]} c="#2d231e" />
        <BB p={[0, 0, 0]} s={[2.32, 0.08, 0.88]} c={DARK} />
        <BB p={[0, 2.7, 0]} s={[2.32, 0.08, 0.88]} c={DARK} />
        <BB p={[0, 0.72, -0.02]} s={[2.2, 0.05, 0.8]} c="#352923" />

        {/* Đèn LED ấm áp bên trong tủ quần áo */}
        <B p={[0, 2.64, 0.1]} s={[2.12, 0.025, 0.04]} c="#fff3d6" emissive="#ffbe5c" ei={2.2} shadow={false} />
        <B p={[0, 2.0, -0.37]} s={[2.12, 1.15, 0.015]} c="#4a392c" emissive="#ffbe5c" ei={0.28} shadow={false} />

        {/* Thanh treo & Quần áo bên trong */}
        <Cyl p={[0, 2.42, 0]} r={[0, 0, Math.PI / 2]} rt={0.018} h={2.15} c="#d4c5b0" metal={0.8} />
        {shirts.map((sh, i) => (
          <BB key={i} p={[sh.x, 2.38 - sh.h, 0]} s={[0.18, sh.h, 0.46]} c={sh.c} rough={0.85} />
        ))}

        {/* Ngăn kéo & Hộp đồ phía dưới */}
        <BB p={[-0.75, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#dfd9ce" />
        <BB p={[0.0, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#cfc7b8" />
        <BB p={[0.75, 0.12, 0]} s={[0.62, 0.26, 0.56]} c="#e2dcd3" />
        <BB p={[-0.75, 0.42, 0]} s={[0.62, 0.22, 0.56]} c="#cbc3b5" />
        <BB p={[0.0, 0.42, 0]} s={[0.62, 0.22, 0.56]} c="#dfd9ce" />

        {/* 3 Cánh cửa kính khói viền gỗ tối */}
        <group ref={leftDoor} position={[-1.1, 0, 0.43]}>
          <BB p={[0.36, 0.05, 0]} s={[0.72, 2.62, 0.035]} c="#1a1412" opacity={0.36} rough={0.15} metal={0.2} shadow={false} />
          <BB p={[0.03, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
          <BB p={[0.69, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
          <B p={[0.65, 1.32, 0.04]} s={[0.02, 0.42, 0.025]} c="#b89d7a" metal={0.7} />
        </group>

        <group ref={midDoor} position={[-0.36, 0, 0.43]}>
          <BB p={[0.37, 0.05, 0]} s={[0.74, 2.62, 0.035]} c="#1a1412" opacity={0.36} rough={0.15} metal={0.2} shadow={false} />
          <BB p={[0.03, 0.05, 0.005]} s={[0.05, 2.62, 0.045]} c={DARK} />
          <BB p={[0.71, 0.05, 0.005]} s={[0.05, 2.62, 0.045]} c={DARK} />
          <B p={[0.66, 1.32, 0.04]} s={[0.02, 0.42, 0.025]} c="#b89d7a" metal={0.7} />
        </group>

        <group ref={rightDoor} position={[1.1, 0, 0.43]}>
          <BB p={[-0.36, 0.05, 0]} s={[0.72, 2.62, 0.035]} c="#1a1412" opacity={0.36} rough={0.15} metal={0.2} shadow={false} />
          <BB p={[-0.03, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
          <BB p={[-0.69, 0.05, 0.005]} s={[0.06, 2.62, 0.045]} c={DARK} />
          <B p={[-0.65, 1.32, 0.04]} s={[0.02, 0.42, 0.025]} c="#b89d7a" metal={0.7} />
        </group>
      </G>
    </Interact>
  )
}

/* ---------- Kệ đầu giường bên trái + Khung tranh + Bình hoa + Đèn tường ---------- */
function LeftNightstand() {
  return (
    <G p={[-4.9, 0, -5.55]}>
      <BB p={[0, 0, 0]} s={[1.35, 0.05, 0.5]} c={DARK} />
      <BB p={[0, 0.32, 0]} s={[1.35, 0.04, 0.5]} c={DARK} />
      <BB p={[0, 0.64, 0]} s={[1.35, 0.05, 0.5]} c={DARK} />
      <BB p={[-0.65, 0, 0]} s={[0.05, 0.68, 0.5]} c={DARK} />
      <BB p={[0.65, 0, 0]} s={[0.05, 0.68, 0.5]} c={DARK} />
      {/* Sách dưới kệ */}
      {[-0.45, -0.36, -0.27, 0.15, 0.25, 0.35].map((x, i) => (
        <BB key={i} p={[x, 0.06, 0]} s={[0.06, 0.22, 0.32]} c={i % 2 ? '#e2dad0' : '#8c7a6b'} />
      ))}
      {/* Khung tranh nhỏ tựa tường trên kệ */}
      <G p={[-0.28, 0.94, -0.1]}>
        <B s={[0.46, 0.56, 0.03]} c="#231c18" />
        <B p={[0, 0, 0.012]} s={[0.38, 0.48, 0.015]} c="#f8f5f0" />
        <Sph p={[0, 0.02, 0.025]} s={[0.08, 0.12, 0.01]} c="#5f7a52" />
      </G>
      {/* Bình hoa nhỏ bên phải kệ */}
      <Cyl p={[0.28, 0.78, 0.04]} rt={0.07} rb={0.09} h={0.18} c="#f3efe8" />
      <Sph p={[0.28, 0.92, 0.04]} s={[0.13, 0.1, 0.13]} c="#f9a8d4" />
      <Sph p={[0.24, 0.96, 0.02]} s={[0.09, 0.08, 0.09]} c="#fde68a" />
      {/* Đèn gắn tường phía trên */}
      <B p={[0.05, 1.62, -0.32]} s={[0.08, 0.14, 0.12]} c="#2b221e" metal={0.6} />
      <Cyl p={[0.05, 1.56, -0.24]} rt={0.05} rb={0.08} h={0.1} c="#fff3d6" emissive="#ffbe5c" ei={1.4} />
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
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.015} rb={0.004} h={0.18} c="#fbbf24" metal={0.7} />
        <B p={[0, 0, 0.08]} s={[0.065, 0.065, 0.012]} c="#ef4444" emissive="#ef4444" ei={0.8} />
      </group>

      <G p={[-4.9, 2.48, -5.94]}>
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.34} rb={0.34} h={0.045} c="#1a1615" seg={36} />
        <mesh position={[0, 0, 0.026]}>
          <circleGeometry args={[0.3, 40]} />
          <meshStandardMaterial map={map} roughness={0.85} />
        </mesh>
        {offsets.slice(0, dartCount).map(([dx, dy], i) => (
          <G key={i} p={[dx, dy, 0.08]}>
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.011} rb={0.003} h={0.13} c="#f59e0b" metal={0.6} />
            <B p={[0, 0, 0.055]} s={[0.045, 0.045, 0.01]} c="#ef4444" />
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
        <B s={[1.55, 0.4, 0.3]} c="#f8f6f2" rough={0.4} />
        <B p={[0, -0.14, 0.15]} r={[acOn ? 0.55 : 0, 0, 0]} s={[1.45, 0.035, 0.04]} c="#e2ddd5" />
        <B p={[0.58, 0.02, 0.155]} s={[0.06, 0.025, 0.01]} c={acOn ? '#34d399' : '#94a3b8'} emissive={acOn ? '#34d399' : '#000'} ei={2} />
        {acOn && (
          <group ref={airRef} position={[0, -0.32, 0.28]}>
            {[-0.42, 0, 0.42].map((x, i) => (
              <B key={i} p={[x, 0, 0]} r={[0.4, 0, 0]} s={[0.24, 0.015, 0.35]} c="#bae6fd" emissive="#7dd3fc" ei={0.8} opacity={0.45} shadow={false} />
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
        {/* Khung giường bọc nệm xám than */}
        <BB p={[0, 0, 0]} s={[2.26, 0.36, 3.05]} c="#363432" rough={0.85} />
        {/* Đệm kem dày êm ái */}
        <BB p={[0, 0.36, 0.04]} s={[2.1, 0.26, 2.88]} c="#e8e2d8" rough={0.92} />
        {/* Chăn phủ màu xám ấm gấp nếp mềm mại (không chồng lấn mặt phẳng với đệm) */}
        <BB p={[0, 0.62, 0.38]} s={[2.14, 0.08, 2.05]} c="#9c968e" rough={0.95} shadow={false} />
        {/* Khăn len đắp ngang chân giường */}
        <BB p={[0, 0.7, 0.88]} s={[2.16, 0.04, 0.72]} c="#78736d" rough={1} shadow={false} />
        <BB p={[0, 0.26, 1.46]} s={[2.14, 0.42, 0.05]} c="#8b857d" rough={0.95} shadow={false} />
        {/* Gối tựa lưng lớn màu kem & trắng + Gối trang trí xám */}
        <BB p={[-0.52, 0.65, -1.12]} r={[0.22, 0, 0]} s={[0.86, 0.22, 0.42]} c="#dfd7cb" rough={0.95} />
        <BB p={[0.52, 0.65, -1.12]} r={[0.22, 0, 0]} s={[0.86, 0.22, 0.42]} c="#dfd7cb" rough={0.95} />
        <BB p={[-0.48, 0.64, -0.82]} r={[0.15, 0, 0]} s={[0.76, 0.16, 0.38]} c="#f5f2ec" rough={0.95} />
        <BB p={[0.48, 0.64, -0.82]} r={[0.15, 0, 0]} s={[0.76, 0.16, 0.38]} c="#f5f2ec" rough={0.95} />
        <BB p={[0, 0.65, -0.58]} r={[0.1, 0, 0]} s={[0.56, 0.15, 0.3]} c="#57534e" rough={0.95} />
      </G>
    </Interact>
  )
}

/* ---------- Tủ đầu giường bên phải + Đèn ngủ ánh vàng ấm ---------- */
function RightNightstand() {
  const lampOn = useStore((s) => s.lampOn)
  return (
    <G p={[-0.65, 0, -5.5]}>
      <BB p={[0, 0, 0]} s={[0.68, 0.56, 0.52]} c={WALNUT} rough={0.6} />
      <BB p={[0, 0.3, 0.265]} s={[0.6, 0.2, 0.02]} c="#362419" />
      <BB p={[0, 0.08, 0.265]} s={[0.6, 0.18, 0.02]} c="#362419" />
      {/* Đèn ngủ đầu giường */}
      <Cyl p={[-0.08, 0.62, 0]} rt={0.07} rb={0.09} h={0.12} c="#d6cfc4" />
      <Cyl p={[-0.08, 0.75, 0]} rt={0.015} h={0.16} c="#b89d7a" metal={0.7} />
      <Cyl
        p={[-0.08, 0.88, 0]}
        rt={0.14}
        rb={0.16}
        h={0.24}
        c={lampOn ? '#fff3d6' : '#dfd8cc'}
        emissive={lampOn ? '#ffbe55' : '#000000'}
        ei={lampOn ? 1.5 : 0}
        seg={24}
      />
      {/* Chậu cây nhỏ cạnh đèn ngủ */}
      <Cyl p={[0.18, 0.61, 0.06]} rt={0.045} rb={0.038} h={0.09} c="#f3efe8" />
      <Sph p={[0.18, 0.69, 0.06]} s={[0.065, 0.055, 0.065]} c="#4d7c3f" />
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
        {/* 2 Chậu cây xanh ở 2 đầu kệ + Đồ decor ở giữa */}
        <Cyl p={[-0.62, 0.09, 0]} rt={0.065} rb={0.05} h={0.13} c="#f3efe8" />
        <Sph p={[-0.62, 0.21, 0]} s={[0.13, 0.1, 0.13]} c="#3f7a38" />
        <Sph p={[-0.56, 0.18, 0.04]} s={[0.09, 0.08, 0.09]} c="#529447" />
        <BB p={[0, 0.03, 0]} s={[0.26, 0.09, 0.12]} c="#d6d3cd" />
        <Cyl p={[0.62, 0.09, 0]} rt={0.065} rb={0.05} h={0.13} c="#f3efe8" />
        <Sph p={[0.62, 0.21, 0]} s={[0.13, 0.1, 0.13]} c="#3f7a38" />
        <Sph p={[0.68, 0.18, -0.03]} s={[0.09, 0.08, 0.09]} c="#529447" />
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
        {/* Đèn rọi tranh bằng đồng ấm áp phía trên */}
        <B p={[0, 0.44, 0.04]} s={[0.1, 0.04, 0.08]} c="#b89758" metal={0.8} />
        <Cyl p={[0, 0.41, 0.1]} r={[0, 0, Math.PI / 2]} rt={0.022} h={0.22} c="#c9a664" metal={0.85} />
        <B p={[0, 0.39, 0.1]} s={[0.18, 0.015, 0.025]} c="#fff3d6" emissive="#ffbe5c" ei={1.8} shadow={false} />

        {/* Khung ảnh gỗ sáng & Bo trắng */}
        <B s={[0.54, 0.66, 0.04]} c="#d8c3a5" rough={0.55} polyOffset />
        <B p={[0, 0, 0.015]} s={[0.46, 0.58, 0.02]} c="#ffffff" polyOffset />
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
  ['#4d7c3f', '#65a30d', '#3f6212', '#84cc16'],
  ['#eab308', '#f59e0b', '#d97706', '#fde047'],
  ['#e11d48', '#f43f5e', '#fb7185', '#be123c'],
  ['#7c3aed', '#6366f1', '#3b82f6', '#a855f7'],
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
        <BB p={[0, 0, -0.18]} s={[1.04, 2.32, 0.04]} c="#1a1412" />
        <BB p={[-0.5, 0, 0]} s={[0.04, 2.32, 0.4]} c={DARK} />
        <BB p={[0.5, 0, 0]} s={[0.04, 2.32, 0.4]} c={DARK} />
        {[0, 0.46, 0.92, 1.38, 1.84, 2.28].map((y) => (
          <BB key={y} p={[0, y, 0]} s={[1.04, 0.04, 0.4]} c={DARK} />
        ))}
        {books.map((b, i) => (
          <BB key={i} p={[b.x, b.y, 0.02]} s={[b.w, b.h, 0.28]} c={b.c} rough={0.65} />
        ))}
        {/* Ngăn trên cùng bày cúp & mô hình nhỏ */}
        <Cyl p={[-0.22, 1.98, 0]} rt={0.05} rb={0.035} h={0.18} c="#eab308" metal={0.8} />
        <BB p={[0.18, 1.88, 0]} s={[0.26, 0.22, 0.22]} c="#334155" />
      </G>
    </Interact>
  )
}

function Monitor({ p, w, h, variant, ry = 0 }: { p: V3; w: number; h: number; variant: number; ry?: number }) {
  const pcState = useStore((s) => s.pcState)
  const map = useMemo(() => screen(variant, pcState === 'rgb'), [variant, pcState])
  return (
    <G p={p} r={[0, ry, 0]}>
      <B p={[0, h / 2 + 0.16, 0]} s={[w + 0.035, h + 0.035, 0.035]} c="#121316" />
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
        <B p={[0, h / 2 + 0.16, 0.019]} s={[w, h, 0.005]} c="#090b10" rough={0.2} />
      )}
      <B p={[0, 0.08, -0.05]} s={[0.045, 0.16, 0.045]} c="#1f2024" />
      <B p={[0, 0.01, -0.02]} s={[0.22, 0.018, 0.16]} c="#1f2024" />
    </G>
  )
}

/* ---------- Bàn máy tính mặt gỗ Óc Chó + 2 Màn hình cong + 2 Loa Kiểm Âm Gỗ + Case PC RGB ---------- */
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
      {/* Mặt bàn gỗ óc chó dày ấm áp */}
      <BB p={[0, 0.74, 0]} s={[2.75, 0.055, 0.92]} c={WALNUT_LIGHT} rough={0.45} />
      {[-1.3, 1.3].map((x) => (
        <BB key={x} p={[x, 0, 0]} s={[0.06, 0.74, 0.84]} c="#18181b" metal={0.5} />
      ))}

      {/* Đèn LED Ambilight ấm áp sau bàn máy tính */}
      {pcState !== 'off' && (
        <B p={[0, 0.78, -0.44]} s={[2.2, 0.03, 0.03]} c="#ffbe5c" emissive="#ff9e2c" ei={1.8} shadow={false} />
      )}

      <Interact
        hint="💻 Bàn máy tính Tầng 1"
        onClick={() => useStore.getState().startActivity('pc', true)}
      >
        {/* Cặp màn hình đôi ghép cong như ảnh mẫu */}
        <Monitor p={[-0.49, 0.79, -0.14]} w={0.95} h={0.5} variant={1} ry={0.16} />
        <Monitor p={[0.49, 0.79, -0.14]} w={0.95} h={0.5} variant={2} ry={-0.16} />

        {/* Cặp loa kiểm âm vỏ gỗ (Studio Monitors) hai bên */}
        {[-1.14, 1.14].map((sx, idx) => (
          <G key={idx} p={[sx, 0.79, -0.08]} r={[0, idx === 0 ? 0.25 : -0.25, 0]}>
            <BB p={[0, 0, 0]} s={[0.22, 0.34, 0.24]} c={WALNUT} rough={0.5} />
            <Cyl p={[0, 0.13, 0.122]} r={[Math.PI / 2, 0, 0]} rt={0.065} h={0.01} c="#18181b" />
            <Cyl p={[0, 0.25, 0.122]} r={[Math.PI / 2, 0, 0]} rt={0.035} h={0.01} c="#27272a" />
          </G>
        ))}

        {/* Thảm trải bàn (Deskmat), Bàn phím cơ RGB & Chuột */}
        <BB p={[0, 0.795, 0.2]} s={[0.92, 0.008, 0.34]} c="#18181b" rough={0.9} />
        <BB p={[-0.06, 0.8, 0.2]} s={[0.42, 0.024, 0.14]} c="#27272a" />
        <B p={[-0.06, 0.805, 0.2]} s={[0.4, 0.018, 0.12]} c="#a855f7" emissive="#a855f7" ei={1.1} />
        <BB p={[0.28, 0.8, 0.2]} s={[0.065, 0.025, 0.1]} c="#27272a" />

        {/* Thùng PC Gaming kính cường lực & Quạt RGB đặt dưới gầm bàn bên phải */}
        <G p={[1.05, 0.02, 0.05]}>
          <BB p={[0, 0, 0]} s={[0.26, 0.56, 0.52]} c="#141417" metal={0.4} rough={0.3} />
          <B
            p={[-0.132, 0.28, 0]}
            s={[0.01, 0.44, 0.42]}
            c="#1e1b4b"
            emissive={pcState === 'off' ? '#000' : '#6366f1'}
            ei={pcState === 'off' ? 0 : 0.9}
            opacity={0.75}
          />
          {[0.14, 0.28, 0.42].map((fy, fi) => (
            <Cyl
              key={fi}
              p={[0, fy, 0.262]}
              r={[Math.PI / 2, 0, 0]}
              rt={0.055}
              h={0.012}
              c={fi === 1 ? '#ec4899' : '#38bdf8'}
              emissive={pcState === 'off' ? '#000' : fi === 1 ? '#ec4899' : '#38bdf8'}
              ei={pcState === 'off' ? 0 : 1.8}
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
            c="#18181b"
          />
        ))}
        <Cyl p={[0, 0.25, 0]} rt={0.028} h={0.38} c="#27272a" metal={0.6} />
        <BB p={[0, 0.44, 0]} s={[0.54, 0.08, 0.5]} c="#27272a" />
        {/* Lưng ghế công thái học + Tựa đầu + Tay vịn */}
        <BB p={[0, 0.52, 0.23]} s={[0.48, 0.64, 0.06]} c="#1f2024" />
        <BB p={[0, 1.18, 0.22]} s={[0.28, 0.14, 0.06]} c="#18181b" />
        <BB p={[-0.27, 0.62, 0.04]} s={[0.045, 0.03, 0.26]} c="#18181b" />
        <BB p={[0.27, 0.62, 0.04]} s={[0.045, 0.03, 0.26]} c="#18181b" />
      </group>
    </Interact>
  )
}

/* ---------- Tranh Hoa Hướng Dương khung vàng ấm + Đèn rọi tranh ---------- */
function Painting() {
  const map = useMemo(() => sunflowerArt(), [])
  return (
    <G p={[2.85, 3.05, -5.92]}>
      {/* Đèn rọi tranh bằng đồng phía trên */}
      <B p={[0, 0.86, 0.05]} s={[0.14, 0.05, 0.1]} c="#b89758" metal={0.85} />
      <Cyl p={[0, 0.82, 0.14]} r={[0, 0, Math.PI / 2]} rt={0.025} h={0.45} c="#c9a664" metal={0.85} />
      <B p={[0, 0.8, 0.14]} s={[0.38, 0.015, 0.03]} c="#fff3d6" emissive="#ffbe5c" ei={1.8} shadow={false} />

      {/* Khung tranh viền vàng gỗ & Bo kem */}
      <B s={[1.36, 1.56, 0.045]} c="#c9a259" rough={0.4} metal={0.3} polyOffset />
      <B p={[0, 0, 0.015]} s={[1.22, 1.42, 0.02]} c="#faf7f0" polyOffset />
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

/* ---------- 3 Kệ gỗ treo tường bên phải có dây đèn Fairy Lights rực rỡ + Sách & Mô hình Gundam ---------- */
function FloatingWallShelves() {
  const fairyColors = ['#fbbf24', '#f472b6', '#38bdf8', '#4ade80', '#a78bfa', '#fb923c']
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
          {/* Dây đèn led Fairy Lights đa sắc lung linh dọc mép kệ */}
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
                ei={2.4}
              />
            )
          })}
        </group>
      ))}

      {/* Sách trên 3 tầng kệ */}
      {shelfBooks.map((b, i) => (
        <BB key={i} p={[b.x, b.sy + 0.025, 0]} s={[b.w, b.h, 0.22]} c={b.c} rough={0.65} />
      ))}

      {/* Mô hình Robot / Gundam ở đầu trái tầng kệ 2 & 3 */}
      {[-0.95, -0.58].map((rx, i) => (
        <G key={i} p={[rx, 2.83, 0.02]}>
          <BB p={[0, 0.12, 0]} s={[0.12, 0.16, 0.08]} c="#f8fafc" />
          <BB p={[0, 0.16, 0.01]} s={[0.09, 0.08, 0.09]} c={i === 0 ? '#ef4444' : '#3b82f6'} />
          <BB p={[-0.04, 0, 0]} s={[0.035, 0.12, 0.04]} c="#e2e8f0" />
          <BB p={[0.04, 0, 0]} s={[0.035, 0.12, 0.04]} c="#e2e8f0" />
          <BB p={[0, 0.29, 0]} s={[0.06, 0.06, 0.06]} c="#f8fafc" />
        </G>
      ))}
      <G p={[-0.92, 3.38, 0.02]}>
        <BB p={[0, 0.14, 0]} s={[0.14, 0.18, 0.09]} c="#f8fafc" />
        <BB p={[0, 0.18, 0.01]} s={[0.24, 0.08, 0.04]} c="#1e293b" />
        <BB p={[-0.045, 0, 0]} s={[0.04, 0.14, 0.04]} c="#cbd5e1" />
        <BB p={[0.045, 0, 0]} s={[0.04, 0.14, 0.04]} c="#cbd5e1" />
      </G>

      {/* Mô hình máy bay & Chậu cây xanh trên kệ trên cùng */}
      <B p={[0.72, 3.44, 0.02]} r={[0, 0.3, 0.1]} s={[0.32, 0.025, 0.18]} c="#e2e8f0" />
      <Cyl p={[1.1, 3.44, 0]} rt={0.075} rb={0.06} h={0.14} c="#27272a" />
      <Sph p={[1.1, 3.58, 0]} s={[0.16, 0.13, 0.16]} c="#3f7a38" />
    </G>
  )
}

/* ---------- Cây nước nóng lạnh (Đi tới rót nước & Uống nước) ---------- */
function WaterDispenser() {
  const streamRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!streamRef.current) return
    const active = Date.now() < useStore.getState().waterPourUntil
    streamRef.current.visible = active
    if (active) {
      streamRef.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 22) * 0.15
    }
  })

  return (
    <Interact
      hint="💧 Cây nước nóng lạnh"
      onClick={() => useStore.getState().startActivity('drink', true)}
    >
      <G p={[5.35, 0, -5.45]}>
        <BB s={[0.44, 1.06, 0.42]} c="#f4f2ed" rough={0.35} />
        <B p={[0, 0.76, 0.215]} s={[0.26, 0.2, 0.02]} c="#27272a" />
        <group ref={streamRef} position={[0, 0.72, 0.21]} visible={false}>
          <Cyl p={[0, 0, 0]} rt={0.012} h={0.14} c="#38bdf8" emissive="#38bdf8" ei={1.8} />
          <Cyl p={[0, -0.05, 0]} rt={0.036} h={0.075} c="#ffffff" />
        </group>
        <Cyl p={[0, 1.28, 0]} rt={0.16} h={0.42} c="#60a5fa" rough={0.12} opacity={0.72} />
      </G>
    </Interact>
  )
}

/* ---------- Tủ thấp bên phải bàn PC + Chậu cây + Đèn bàn ánh vàng ---------- */
function LowCabinet() {
  const lampOn = useStore((s) => s.lampOn)
  return (
    <G p={[6.95, 0, -5.5]}>
      <BB s={[2.05, 0.58, 0.54]} c={DARK} />
      <BB p={[0, 0.58, 0]} s={[2.08, 0.05, 0.56]} c="#eae4dc" />
      {/* Chậu cây xanh */}
      <G p={[-0.38, 0.63, 0]}>
        <Cyl p={[0, 0.13, 0]} rt={0.12} rb={0.095} h={0.26} c="#e5dfd5" />
        <Sph p={[0, 0.42, 0]} s={[0.24, 0.2, 0.24]} c="#3f7a38" />
        <Sph p={[0.12, 0.36, 0.05]} s={[0.16, 0.14, 0.16]} c="#4d8f44" />
        <Sph p={[-0.12, 0.38, -0.04]} s={[0.16, 0.14, 0.16]} c="#35692f" />
      </G>
      {/* Đèn bàn ấm áp bên phải tủ thấp */}
      <G p={[0.55, 0.63, 0]}>
        <Cyl p={[0, 0.02, 0]} rt={0.1} h={0.03} c="#27272a" />
        <Cyl p={[0, 0.24, 0]} rt={0.018} h={0.42} c="#3f3f46" metal={0.6} />
        <Cyl
          p={[0, 0.48, 0]}
          rt={0.18}
          rb={0.22}
          h={0.28}
          c={lampOn ? '#fff3d6' : '#dfd8cc'}
          emissive={lampOn ? '#ffbe55' : '#000000'}
          ei={lampOn ? 1.5 : 0}
          seg={24}
        />
      </G>
    </G>
  )
}

/* ---------- Cửa sổ Panorama toàn cảnh bên tường phải + Rèm voan trắng & Rèm vải kem dài chạm sàn ---------- */
function PanoramicWindow() {
  const darkMode = useStore((s) => s.darkMode)
  const curtainsOpen = useStore((s) => s.curtainsOpen)
  const cutRight = useStore((s) => s.cutWalls.right)
  const skyMap = useMemo(() => windowSky(darkMode), [darkMode])
  const leftRef = useRef<THREE.Group>(null)
  const rightRef = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 7)
    if (leftRef.current) {
      leftRef.current.position.x = THREE.MathUtils.lerp(leftRef.current.position.x, curtainsOpen ? -2.35 : -1.15, k)
      leftRef.current.scale.x = THREE.MathUtils.lerp(leftRef.current.scale.x, curtainsOpen ? 1 : 2.1, k)
    }
    if (rightRef.current) {
      rightRef.current.position.x = THREE.MathUtils.lerp(rightRef.current.position.x, curtainsOpen ? 2.35 : 1.15, k)
      rightRef.current.scale.x = THREE.MathUtils.lerp(rightRef.current.scale.x, curtainsOpen ? 1 : 2.1, k)
    }
  })

  if (cutRight) return null

  return (
    <Interact
      hint="🪟 Rèm cửa"
      onClick={() => useStore.getState().toggleCurtains()}
    >
      <G p={[9.95, 0, -1.0]} r={[0, -Math.PI / 2, 0]}>
        {/* Tấm bắt click rộng lớn phủ kín toàn bộ diện tích cửa sổ & rèm */}
        <mesh position={[0, 2.25, 0.25]}>
          <planeGeometry args={[6.0, 3.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Mặt kính bầu trời nắng ấm / đêm sao */}
        <mesh position={[0, 2.25, 0.01]}>
          <planeGeometry args={[5.2, 3.1]} />
          <meshStandardMaterial
            map={skyMap}
            emissive="#ffffff"
            emissiveMap={skyMap}
            emissiveIntensity={darkMode ? 0.95 : 1.35}
          />
        </mesh>

        {/* Khung cửa sổ trắng chia ô hiện đại */}
        <B p={[0, 3.82, 0.04]} s={[5.4, 0.09, 0.09]} c="#f4f1ea" />
        <B p={[0, 0.68, 0.04]} s={[5.4, 0.09, 0.14]} c="#f4f1ea" />
        {[-2.65, -0.88, 0.88, 2.65].map((wx, i) => (
          <B key={i} p={[wx, 2.25, 0.04]} s={[0.07, 3.18, 0.08]} c="#f4f1ea" />
        ))}
        <B p={[0, 2.55, 0.04]} s={[5.3, 0.06, 0.07]} c="#f4f1ea" />

        {/* Lớp rèm voan trắng mỏng xuyên sáng hai bên */}
        <BB p={[-1.75, 0.04, 0.1]} s={[1.15, 3.82, 0.03]} c="#ffffff" opacity={0.52} rough={0.9} shadow={false} />
        <BB p={[1.75, 0.04, 0.1]} s={[1.15, 3.82, 0.03]} c="#ffffff" opacity={0.52} rough={0.9} shadow={false} />

        {/* Thanh treo rèm chạy suốt chiều dài cửa sổ */}
        <Cyl p={[0, 3.96, 0.18]} r={[0, 0, Math.PI / 2]} rt={0.025} h={5.8} c="#27201c" metal={0.5} />

        {/* Rèm vải kem ấm áp xếp ly cao kịch trần chạm sàn */}
        <group ref={leftRef} position={[-2.35, 0, 0.2]}>
          {[-0.36, -0.22, -0.08, 0.06, 0.2, 0.34].map((dx, i) => (
            <Cyl
              key={i}
              p={[dx, 1.96, 0]}
              rt={0.085}
              rb={0.095}
              h={3.9}
              c={i % 2 ? '#b8a38c' : '#c7b29b'}
              seg={12}
              rough={0.95}
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
              c={i % 2 ? '#b8a38c' : '#c7b29b'}
              seg={12}
              rough={0.95}
            />
          ))}
        </group>
      </G>
    </Interact>
  )
}

/* ---------- Kệ gỗ đặt 3 chậu cây xanh đón nắng ngay cạnh cửa sổ ---------- */
function WindowPlantBench() {
  return (
    <G p={[9.05, 0, 0.8]}>
      <BB p={[0, 0.38, 0]} s={[0.52, 0.05, 1.65]} c={WALNUT_LIGHT} rough={0.55} />
      <BB p={[0, 0, -0.76]} s={[0.48, 0.38, 0.05]} c={WALNUT} />
      <BB p={[0, 0, 0.76]} s={[0.48, 0.38, 0.05]} c={WALNUT} />
      <BB p={[0, 0.08, 0]} s={[0.44, 0.04, 1.5]} c={WALNUT} />

      {/* 3 Chậu cây xanh mát đón nắng */}
      {[-0.52, 0, 0.52].map((pz, i) => (
        <G key={i} p={[0, 0.43, pz]}>
          <Cyl p={[0, 0.1, 0]} rt={0.095} rb={0.075} h={0.2} c={i === 1 ? '#d6cfc4' : '#f5f2ec'} />
          <Sph p={[0, 0.3, 0]} s={[0.16, 0.14, 0.16]} c={i % 2 ? '#4d8f44' : '#3f7a38'} />
          <Sph p={[0.06, 0.24, 0.05]} s={[0.11, 0.1, 0.11]} c="#65a30d" />
        </G>
      ))}
    </G>
  )
}

/* ---------- Đèn cây đứng cao tỏa sáng ấm áp ở góc phải phía trước ---------- */
function FloorLamp() {
  const lampOn = useStore((s) => s.lampOn)
  return (
    <Interact
      hint="💡 Đèn cây"
      onClick={() => useStore.getState().toggleLamp()}
    >
      <G p={[8.75, 0, 3.45]}>
        <Cyl p={[0, 0.025, 0]} rt={0.26} h={0.05} c="#1c1917" metal={0.5} />
        <Cyl p={[0, 1.05, 0]} rt={0.022} h={2.05} c="#1c1917" metal={0.5} />
        <Cyl
          p={[0, 2.12, 0]}
          rt={0.32}
          rb={0.38}
          h={0.48}
          c={lampOn ? '#fff4d9' : '#d6cfc2'}
          emissive={lampOn ? '#ffbe55' : '#000000'}
          ei={lampOn ? 1.4 : 0}
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
          <Cyl key={i} p={[px, 0.42, pz]} rt={0.055} h={0.68} c="#d6c29f" rough={0.95} />
        ))}
        {/* Mặt sàn tầng 2 + Cầu thang nhỏ */}
        <BB p={[0, 0.76, 0]} s={[1.08, 0.07, 1.08]} c={OAK} rough={0.8} />
        <BB p={[0.35, 0.38, 0.65]} r={[0.65, 0, 0]} s={[0.28, 0.05, 0.85]} c={OAK} />
        {/* Trụ tầng 2 + Hộp nhà vuông tầng 3 */}
        <Cyl p={[-0.36, 1.12, -0.36]} rt={0.055} h={0.65} c="#d6c29f" rough={0.95} />
        <Cyl p={[0.36, 1.12, -0.36]} rt={0.055} h={0.65} c="#d6c29f" rough={0.95} />
        <Cyl p={[-0.36, 1.12, 0.36]} rt={0.055} h={0.65} c="#d6c29f" rough={0.95} />
        <BB p={[0.08, 1.38, 0.05]} s={[0.88, 0.62, 0.88]} c="#dfd3be" rough={0.85} />
        <Cyl p={[0.53, 1.68, 0.05]} r={[0, 0, Math.PI / 2]} rt={0.18} h={0.02} c="#3a2e26" />
        <Cyl p={[0.08, 1.68, 0.5]} r={[Math.PI / 2, 0, 0]} rt={0.18} h={0.02} c="#3a2e26" />
        {/* 2 Đài quan sát tròn êm ái trên đỉnh tháp */}
        <Cyl p={[-0.22, 2.15, -0.18]} rt={0.055} h={0.42} c="#d6c29f" />
        <Cyl p={[-0.22, 2.38, -0.18]} rt={0.34} rb={0.32} h={0.12} c="#e8decb" />
        <Cyl p={[0.24, 2.28, -0.18]} rt={0.055} h={0.65} c="#d6c29f" />
        <Cyl p={[0.24, 2.62, -0.18]} rt={0.34} rb={0.32} h={0.12} c="#e8decb" />
      </G>

      {/* 2. Đệm nằm chần bông chữ nhật & Máy ăn phụ phía trước tháp */}
      <G p={[-7.35, 0, 3.65]}>
        <BB p={[0, 0, 0]} s={[0.92, 0.1, 0.68]} c="#c8b496" rough={0.9} />
        <BB p={[0, 0.08, 0]} s={[0.8, 0.06, 0.56]} c="#efe8dc" rough={0.95} />
      </G>
      <G p={[-8.75, 0, 3.85]}>
        <Cyl p={[0, 0.22, -0.12]} rt={0.14} h={0.44} c="#f5f3ef" />
        <BB p={[0, 0, 0.06]} s={[0.36, 0.1, 0.48]} c="#e7e4de" />
        <Cyl p={[0, 0.1, 0.16]} rt={0.11} h={0.03} c="#92400e" />
      </G>

      {/* 3. Chuồng gỗ thú cưng rỗng bên trong có nệm êm & đèn ấm (Nơi Mochi & Bơ đi vào ngủ ngon lành) */}
      <G p={[-7.6, 0, -0.3]}>
        {/* Vách sau & Vách trái */}
        <BB p={[0, 0, -0.71]} s={[1.95, 1.15, 0.08]} c="#d9c3a2" rough={0.85} />
        <BB p={[-0.935, 0, 0]} s={[0.08, 1.15, 1.5]} c="#d9c3a2" rough={0.85} />
        {/* Vách trước có ô cửa lớn mở thông thoáng */}
        <BB p={[-0.72, 0, 0.71]} s={[0.5, 1.15, 0.08]} c="#d9c3a2" rough={0.85} />
        <BB p={[0.72, 0, 0.71]} s={[0.5, 1.15, 0.08]} c="#d9c3a2" rough={0.85} />
        <BB p={[0, 0.78, 0.71]} s={[1.95, 0.37, 0.08]} c="#d9c3a2" rough={0.85} />
        {/* Vách phải có cửa sổ/cửa phụ mở thông thoáng */}
        <BB p={[0.935, 0, -0.48]} s={[0.08, 1.15, 0.54]} c="#d9c3a2" rough={0.85} />
        <BB p={[0.935, 0, 0.48]} s={[0.08, 1.15, 0.54]} c="#d9c3a2" rough={0.85} />
        <BB p={[0.935, 0.78, 0]} s={[0.08, 0.37, 1.5]} c="#d9c3a2" rough={0.85} />
        {/* Mái gỗ & Đệm xanh lá êm ái trên nóc chuồng */}
        <BB p={[0, 1.15, 0]} s={[2.02, 0.08, 1.56]} c="#c5ab86" />
        <BB p={[0.02, 1.23, 0.02]} s={[1.64, 0.1, 1.24]} c="#8fa876" rough={0.95} />
        {/* Nệm ấm bên trong chuồng gỗ + Ánh đèn vàng dịu trong chuồng */}
        <BB p={[0, 0.02, 0]} s={[1.72, 0.06, 1.28]} c="#efe6d8" rough={0.95} />
        <B p={[0, 1.1, 0]} s={[0.8, 0.02, 0.5]} c="#fff3d6" emissive="#ffbe5c" ei={1.4} shadow={false} />
      </G>

      {/* 4. Nệm tròn Donut êm ái trên thảm */}
      <G p={[-6.0, 0, 0.85]}>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[0.46, 0.13, 16, 40]} />
          <meshStandardMaterial color="#ede6dc" roughness={0.95} />
        </mesh>
        <Cyl p={[0, 0.05, 0]} rt={0.46} h={0.08} c="#dfd6c9" seg={32} />
      </G>

      {/* 5. Máy cho ăn tự động & Bát ăn + Hoạt ảnh hạt thức ăn rơi xuống bát */}
      <Interact
        hint="🦴 Máy cho ăn"
        onClick={() => useStore.getState().startActivity('feed', true)}
      >
        <G p={[-7.7, 0, 1.25]}>
          <BB s={[0.56, 0.76, 0.48]} c="#f5f3ef" rough={0.35} />
          <BB p={[0, 0.76, 0]} s={[0.58, 0.1, 0.5]} c="#262626" />
          <BB p={[0.38, 0, 0.05]} s={[0.28, 0.12, 0.28]} c="#dcd7cf" />
        </G>
        <Cyl p={[-6.95, 0.05, 1.45]} rt={0.18} rb={0.14} h={0.1} c="#c8a27a" />
        <mesh ref={foodMoundRef} position={[-6.95, 0.11, 1.45]} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#854d0e" roughness={0.9} />
        </mesh>
        <group ref={pelletsRef} visible={false}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[-7.1, 0.4, 1.44 + (i % 2) * 0.04]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#a16207" />
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
        {/* Kệ gỗ óc chó thấp */}
        <BB p={[0, 0, 0]} s={[2.85, 0.44, 0.56]} c={WALNUT} rough={0.5} />
        <BB p={[0, 0.44, 0]} s={[2.89, 0.04, 0.58]} c={WALNUT_LIGHT} rough={0.42} />
        {[-0.92, 0, 0.92].map((x, i) => (
          <B key={i} p={[x, 0.22, 0.285]} s={[0.86, 0.32, 0.02]} c="#2d1e16" />
        ))}
        {/* Loa Soundbar & Máy PS5 trắng đặt bên phải kệ */}
        <BB p={[0, 0.48, 0.14]} s={[1.05, 0.065, 0.11]} c="#18181b" metal={0.5} rough={0.3} />
        <BB p={[1.18, 0.48, 0.02]} s={[0.12, 0.42, 0.24]} c="#f8fafc" />
        <BB p={[1.18, 0.48, 0.02]} s={[0.07, 0.41, 0.25]} c="#111113" />
        <BB p={[-1.12, 0.48, 0.04]} s={[0.2, 0.24, 0.2]} c="#18181b" />
        <BB p={[0, 0.48, -0.04]} s={[0.68, 0.03, 0.26]} c="#18181b" metal={0.7} />
        <BB p={[0, 0.51, -0.08]} s={[0.12, 0.24, 0.08]} c="#222" metal={0.6} />

        {/* Khung màn hình Smart TV 75 inch */}
        <B p={[0, 1.32, -0.04]} s={[2.16, 1.24, 0.045]} c="#0f1014" metal={0.5} rough={0.25} />
        {tvOn && (
          <B
            p={[0, 1.32, -0.075]}
            s={[2.22, 1.28, 0.01]}
            c="#a855f7"
            emissive="#a855f7"
            ei={1.25}
            opacity={0.45}
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
      // Kênh 0: Bầu trời mây tím hoàng hôn mộng mơ giống hệt ảnh mẫu
      const grd = g.createLinearGradient(0, 0, 0, h)
      grd.addColorStop(0, '#1e1b4b')
      grd.addColorStop(0.5, '#4c1d95')
      grd.addColorStop(0.85, '#7e22ce')
      grd.addColorStop(1, '#f59e0b')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)

      // Những vì sao lấp lánh
      g.fillStyle = 'rgba(255,255,255,0.85)'
      for (let s = 0; s < 22; s++) {
        const sx = ((s * 73) % (w - 40)) + 20
        const sy = ((s * 41) % (h * 0.55)) + 12
        const r = 1 + (Math.sin(t * 2.5 + s) + 1) * 0.9
        g.beginPath()
        g.arc(sx, sy, r, 0, Math.PI * 2)
        g.fill()
      }

      // Mặt trời vàng rực tỏa hào quang ở trung tâm
      const sunGlow = g.createRadialGradient(w / 2, h * 0.56, 12, w / 2, h * 0.56, 115)
      sunGlow.addColorStop(0, '#fef08a')
      sunGlow.addColorStop(0.35, '#fbbf24')
      sunGlow.addColorStop(0.7, 'rgba(244,114,182,0.45)')
      sunGlow.addColorStop(1, 'rgba(126,34,206,0)')
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
      g.fillStyle = '#f3e8ff'
      cloudPositions.forEach(([cx, cy, cr], idx) => {
        const dx = Math.sin(t * 0.8 + idx) * 8
        g.beginPath()
        g.arc(cx + dx, cy, cr, 0, Math.PI * 2)
        g.fill()
      })

      g.fillStyle = '#2e1065'
      g.fillRect(0, h * 0.78, w, h * 0.22)
      for (let i = 0; i < 32; i++) {
        const barH = 6 + Math.abs(Math.sin(t * 4 + i * 0.45)) * 26
        g.fillStyle = i % 2 ? '#fde047' : '#f472b6'
        g.fillRect(36 + i * 14, h * 0.78 - barH, 8, barH)
      }
      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 13px sans-serif'
      g.fillText('✦ CH1 · DREAMY SUNSET LOFI', 22, 28)
    } else if (tvChannel === 1) {
      // Kênh 1: Thủy cung 3D
      const grd = g.createLinearGradient(0, 0, 0, h)
      grd.addColorStop(0, '#0284c7')
      grd.addColorStop(0.6, '#0369a1')
      grd.addColorStop(1, '#0c4a6e')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)

      g.strokeStyle = 'rgba(224,242,254,0.65)'
      g.lineWidth = 2
      for (let b = 0; b < 14; b++) {
        const bx = 35 + ((b * 37) % (w - 70)) + Math.sin(t * 2 + b) * 8
        const by = h - ((t * 45 + b * 29) % h)
        g.beginPath()
        g.arc(bx, by, 4 + (b % 4) * 2, 0, Math.PI * 2)
        g.stroke()
      }

      const fishColors = ['#fb923c', '#facc15', '#f472b6', '#4ade80', '#38bdf8']
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
      // Kênh 2: Vũ trụ & Sao băng
      g.fillStyle = '#050814'
      g.fillRect(0, 0, w, h)
      for (let s = 0; s < 35; s++) {
        const sx = (s * 97 + Math.floor(t * 12)) % w
        const sy = (s * 53) % h
        g.fillStyle = s % 3 === 0 ? '#93c5fd' : '#ffffff'
        g.fillRect(sx, sy, 2, 2)
      }
      const px = w / 2 + Math.sin(t * 0.7) * 35
      const py = h / 2
      const pGrad = g.createRadialGradient(px - 15, py - 15, 8, px, py, 52)
      pGrad.addColorStop(0, '#c084fc')
      pGrad.addColorStop(1, '#3b0764')
      g.fillStyle = pGrad
      g.beginPath()
      g.arc(px, py, 50, 0, Math.PI * 2)
      g.fill()

      g.strokeStyle = 'rgba(244,114,182,0.8)'
      g.lineWidth = 6
      g.beginPath()
      g.ellipse(px, py, 92, 20, -0.25, 0, Math.PI * 2)
      g.stroke()

      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.font = '600 13px sans-serif'
      g.fillText('✦ CH3 · COSMOS & NEBULA', 22, 28)
    } else {
      // Kênh 3: Trận cầu đỉnh cao
      g.fillStyle = '#15803d'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = 'rgba(255,255,255,0.75)'
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
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.arc(bx, by, 7, 0, Math.PI * 2)
      g.fill()

      for (let p = 0; p < 6; p++) {
        const teamRed = p < 3
        const tx = (teamRed ? w * 0.3 : w * 0.7) + Math.sin(t * 2 + p * 1.4) * 65
        const ty = 65 + (p % 3) * 75 + Math.cos(t * 2.5 + p) * 20
        g.fillStyle = teamRed ? '#ef4444' : '#38bdf8'
        g.beginPath()
        g.arc(tx, ty, 9, 0, Math.PI * 2)
        g.fill()
      }
      g.fillStyle = 'rgba(15,23,42,0.85)'
      g.fillRect(22, 14, 195, 24)
      g.fillStyle = '#ffffff'
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
          emissiveIntensity={0.95}
          roughness={0.2}
        />
      ) : (
        <meshStandardMaterial color="#07080a" roughness={0.2} />
      )}
    </mesh>
  )
}

/* ---------- Đôn nệm vuông (Ottoman) bên trái bàn trà ---------- */
function Ottoman() {
  return (
    <G p={[2.05, 0, 2.15]}>
      <BB s={[1.06, 0.36, 1.06]} c="#7d6c5d" rough={0.9} />
      <BB p={[0, 0.36, 0]} s={[1.02, 0.1, 1.02]} c="#948272" rough={0.9} />
      <BB p={[0, 0, 0]} s={[0.98, 0.04, 0.98]} c="#2b211b" />
    </G>
  )
}

/* ---------- Bàn trà gỗ Óc Chó (Bấm để đổi kênh TV) ---------- */
function CoffeeTable() {
  return (
    <Interact hint="📺 Đổi kênh TV" onClick={() => useStore.getState().cycleTvChannel()}>
      <G p={[4.15, 0, 2.15]}>
        <BB p={[0, 0.4, 0]} s={[1.65, 0.055, 0.92]} c={WALNUT_LIGHT} rough={0.45} />
        <BB p={[0, 0.06, 0]} s={[1.55, 0.045, 0.84]} c={WALNUT} />
        {[-0.74, 0.74].map((x) => (
          <BB key={x} p={[x, 0, 0]} s={[0.06, 0.4, 0.84]} c="#231c18" />
        ))}
        {/* Sách tạp chí mở, tách cà phê & lọ hoa trên bàn trà */}
        <BB p={[-0.22, 0.455, 0.04]} r={[0, 0.18, 0]} s={[0.42, 0.025, 0.3]} c="#f5f2ec" />
        <Cyl p={[0.32, 0.52, -0.08]} rt={0.05} rb={0.07} h={0.22} c="#d6cfc2" />
        <BB p={[0.35, 0.455, 0.2]} r={[0, -0.25, 0]} s={[0.065, 0.02, 0.18]} c="#18181b" />
      </G>
    </Interact>
  )
}

const LEATHER = '#3d2a20'
const LEATHER_2 = '#4d362a'

/* ---------- Bộ Sofa Da Nâu chữ L sang trọng ---------- */
function Sofa() {
  return (
    <Interact
      hint="🛋️ Ghế sofa"
      onClick={() => useStore.getState().startActivity('tv', true)}
    >
      <group>
        {/* Nhánh dọc bên phải */}
        <G p={[6.35, 0, 2.0]}>
          <BB s={[1.12, 0.4, 2.85]} c={LEATHER} rough={0.5} />
          <BB p={[-0.06, 0.4, -0.68]} s={[0.96, 0.15, 1.32]} c={LEATHER_2} rough={0.45} />
          <BB p={[-0.06, 0.4, 0.68]} s={[0.96, 0.15, 1.32]} c={LEATHER_2} rough={0.45} />
          <BB p={[0.44, 0.4, 0]} s={[0.24, 0.52, 2.85]} c={LEATHER} rough={0.5} />
          <BB p={[-0.04, 0.4, -1.32]} s={[1.06, 0.26, 0.2]} c={LEATHER} rough={0.5} />
          <BB p={[0.22, 0.56, -0.75]} s={[0.14, 0.38, 0.48]} r={[0, 0, 0.2]} c="#2b1d16" />
        </G>
        {/* Nhánh ngang phía trước (Khoa ngồi xem TV tại đây) */}
        <G p={[4.45, 0, 3.65]}>
          <BB s={[2.95, 0.4, 1.1]} c={LEATHER} rough={0.5} />
          <BB p={[-0.72, 0.4, -0.06]} s={[1.38, 0.15, 0.94]} c={LEATHER_2} rough={0.45} />
          <BB p={[0.72, 0.4, -0.06]} s={[1.38, 0.15, 0.94]} c={LEATHER_2} rough={0.45} />
          <BB p={[0, 0.4, 0.42]} s={[2.95, 0.44, 0.24]} c={LEATHER} rough={0.5} />
          <BB p={[-1.36, 0.4, -0.04]} s={[0.22, 0.26, 1.04]} c={LEATHER} rough={0.5} />
          <BB p={[-0.85, 0.54, 0.2]} s={[0.48, 0.34, 0.14]} r={[0.2, 0, 0]} c="#2b1d16" />
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
      <Cyl p={[0, 0.28, 0]} rt={0.3} rb={0.22} h={0.56} c="#231f1d" />
      <Cyl p={[0, 0.54, 0]} rt={0.27} h={0.04} c="#3b2d22" />
      {leaves.map((l, i) => {
        const x = Math.cos(l.a) * l.len
        const z = Math.sin(l.a) * l.len
        return (
          <group key={i}>
            <mesh
              position={[x / 2, 0.55 + l.h / 2, z / 2]}
              rotation={[Math.sin(l.a) * 0.5, 0, -Math.cos(l.a) * 0.5]}
              castShadow
            >
              <cylinderGeometry args={[0.012, 0.018, Math.hypot(l.len, l.h), 6]} />
              <meshStandardMaterial color="#3f6b2b" />
            </mesh>
            <mesh
              position={[x, 0.55 + l.h, z]}
              rotation={[0, -l.a, l.tilt]}
              scale={[0.32, 0.025, 0.24]}
              castShadow
              receiveShadow
            >
              <sphereGeometry args={[1, 16, 10]} />
              <meshStandardMaterial color={i % 2 ? '#367d39' : '#459348'} roughness={0.55} />
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
  [1.5, 1.6, 2.6, 2.7],
  [3.3, 1.65, 5.0, 2.65],
  [5.75, 0.55, 6.95, 3.45],
  [2.95, 3.1, 5.95, 4.25],

  // Đồ nội thất phòng tắm & giặt ủi
  [-14.8, -2.4, -12.8, -0.8], // Bồn tắm oval
  [-15.4, -5.8, -12.8, -4.0], // Vách tắm kính đứng
  [-13.2, -5.8, -10.3, -4.8], // Bàn Lavabo & Máy giặt
  [-11.6, -1.2, -10.3, -0.1], // Bồn cầu thông minh
  [-15.6, 2.75, -14.9, 4.55], // Kệ tủ Master Bath Lounge áp sát tường trái
]

export function isBlocked(x: number, z: number, r = 0.35) {
  // Khoảng thông phòng tại cửa kết nối phòng ngủ và phòng tắm (x = -10, z từ -4.1 đến -2.7)
  const inDoorway = Math.abs(x - -10.0) < 0.72 && z > -3.95 && z < -2.85
  if (inDoorway) {
    return false
  }

  // Nếu đang ở trong phòng tắm (x < -10.0):
  if (x < -10.0) {
    if (x < -15.45 + r || x > -10.05 - r || z < -5.7 + r || z > 5.6 - r) return true
  } else {
    // Nếu đang ở trong phòng ngủ & phòng khách Tầng 1:
    if (x < -9.75 + r || x > 9.35 - r || z < -5.6 + r || z > 5.55 - r) return true
    // Vách ngăn bên trái phòng ngủ chạy suốt chiều dài (ngoại trừ ô cửa)
    if (Math.abs(x - -10.0) < 0.18 + r && (z <= -3.95 || z >= -2.85)) return true
  }

  for (const [x1, z1, x2, z2] of COLLIDERS) {
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
