import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, RBB, Sph } from './prims'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { useStore } from '../store'

function Interact({
  onClick,
  children,
}: {
  hint?: string
  onClick: () => void
  children: React.ReactNode
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

/** Khu vực Phòng tắm cao cấp & Khu giặt sấy thông minh */
export function Bathroom() {
  const darkMode = useStore((s) => s.darkMode)
  const bathMirrorLightOn = useStore((s) => s.bathMirrorLightOn)
  const bathFullMirrorLightOn = useStore((s) => s.bathFullMirrorLightOn)
  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])

  return (
    <group>
      <BathroomDoorway />
      <Bathtub />
      <ShowerBooth glassMat={glassMat} />
      <VanityAndWasher />
      <SmartToilet />
      <TowelWarmer />
      <MasterBathLounge />

      {/* Ánh sáng phản hồi tương tác khi bật đèn gương phòng tắm (gộp 1 pointLight ban đêm để giữ 60fps; ban ngày dùng emissive) */}
      {darkMode && (bathMirrorLightOn || bathFullMirrorLightOn) && (
        <pointLight
          position={[-12.8, 2.1, -3.6]}
          intensity={2.4}
          distance={6.5}
          decay={2}
          color="#f0d4a8"
          castShadow={false}
        />
      )}
    </group>
  )
}

/* ---------- Cửa thông phòng kết nối phòng ngủ và phòng tắm ---------- */
function BathroomDoorway() {
  return (
    <G p={[-10.0, 0, -3.4]}>
      {/* Khung nẹp cửa Matte Charcoal (#2B2D2F) */}
      <BB p={[0, 0, -0.7]} s={[0.26, 2.58, 0.08]} c="#2B2D2F" rough={0.65} />
      <BB p={[0, 0, 0.7]} s={[0.26, 2.58, 0.08]} c="#2B2D2F" rough={0.65} />
      <BB p={[0, 2.54, 0]} s={[0.26, 0.08, 1.48]} c="#2B2D2F" rough={0.65} />
      {/* Ngưỡng cửa đá (#D6D1C9) ngăn cách sàn gỗ & sàn gạch */}
      <BB p={[0, 0.015, 0]} s={[0.22, 0.02, 1.4]} c="#D6D1C9" rough={0.4} metal={0.1} polyOffset />

      {/* Cánh cửa trượt khung Matte Charcoal & kính mờ */}
      <G p={[-0.04, 0, -0.42]}>
        <BB s={[0.05, 2.5, 0.78]} c="#2B2D2F" rough={0.65} />
        <B p={[0.005, 1.25, 0]} s={[0.015, 2.1, 0.6]} c="#EFECE6" opacity={0.35} rough={0.12} metal={0.15} shadow={false} />
        <B p={[0.038, 1.15, 0.32]} s={[0.02, 0.38, 0.02]} c="#2B2D2F" metal={0.65} rough={0.3} />
      </G>
    </G>
  )
}

/* ---------- Bồn tắm nằm oval cao cấp có nước ấm & bọt xà phòng bồng bềnh ---------- */
function Bathtub() {
  const bathBubbles = useStore((s) => s.bathBubbles)
  const bubblesRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!bubblesRef.current) return
    const t = clock.elapsedTime
    bubblesRef.current.visible = bathBubbles
    if (bathBubbles) {
      bubblesRef.current.children.forEach((b, i) => {
        b.position.y = 0.52 + Math.sin(t * 2.2 + i * 1.4) * 0.02
        b.scale.setScalar(0.04 + Math.sin(t * 1.8 + i) * 0.012)
      })
    }
  })

  return (
    <Interact
      hint="🛁 Bồn tắm"
      onClick={() => useStore.getState().startActivity('bath', true)}
    >
      <G p={[-13.8, 0, -1.6]}>
        {/* Thảm chùi chân mềm mại dưới sàn (#B6B7B5, lì roughness ~0.85) */}
        <BB p={[1.2, 0.016, 0]} s={[0.72, 0.02, 1.35]} c="#B6B7B5" rough={0.85} polyOffset />

        {/* Thân bồn tắm oval màu trắng kem ấm (#EFECE6) */}
        <Cyl p={[0, 0.35, 0]} rt={0.68} rb={0.58} h={0.65} c="#EFECE6" seg={36} rough={0.25} />
        {/* Lòng bồn tắm khoét rỗng (#E5E4E0) */}
        <Cyl p={[0, 0.38, 0]} rt={0.61} rb={0.51} h={0.62} c="#E5E4E0" seg={36} rough={0.3} />

        {/* Mặt nước ấm trong dịu trung tính */}
        <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.59, 32]} />
          <meshStandardMaterial
            color="#5E7487"
            roughness={0.1}
            metalness={0.08}
            transparent
            opacity={0.42}
          />
        </mesh>

        {/* Bọt xà phòng bồng bềnh phủ đều mặt nước ấm */}
        <group ref={bubblesRef}>
          {Array.from({ length: 22 }, (_, i) => {
            const angle = (i / 22) * Math.PI * 2
            const rX = 0.12 + (i % 4) * 0.09
            const rZ = 0.2 + (i % 5) * 0.12
            return (
              <Sph
                key={i}
                p={[Math.cos(angle) * rX, 0.54 + Math.sin(i * 1.5) * 0.015, Math.sin(angle) * rZ - 0.1]}
                s={[0.06 + (i % 3) * 0.02, 0.04, 0.06 + (i % 3) * 0.02]}
                c="#EFECE6"
                rough={0.15}
              />
            )
          })}
        </group>

        {/* Khay gỗ sồi (#C4AF97) vắt ngang thành bồn tắm */}
        <BB p={[0, 0.67, 0.48]} s={[0.96, 0.025, 0.22]} c="#C4AF97" rough={0.5} />
        {/* Nến thơm mini ánh vàng 3000K (#FFD7A3) */}
        <Cyl p={[-0.26, 0.72, 0.48]} rt={0.035} h={0.06} c="#EFECE6" />
        <Sph p={[-0.26, 0.765, 0.48]} s={[0.012, 0.02, 0.012]} c="#FFD7A3" emissive="#FFD7A3" ei={1.8} />
        {/* Khăn mặt mềm mại cuộn tròn trên khay (#D6D1C9) */}
        <Cyl p={[0.26, 0.71, 0.48]} r={[0, 0, Math.PI / 2]} rt={0.038} h={0.16} c="#D6D1C9" rough={0.85} />
        {/* Ly thủy tinh thư giãn bên cạnh */}
        <Cyl p={[0.05, 0.73, 0.48]} rt={0.025} h={0.08} c="#E5E4E0" rough={0.1} />

        {/* Vòi sen cây đứng Matte Charcoal (#2B2D2F) */}
        <G p={[-0.85, 0, 0]}>
          <Cyl p={[0, 0.02, 0]} rt={0.09} h={0.04} c="#2B2D2F" metal={0.65} rough={0.32} />
          <Cyl p={[0, 0.55, 0]} rt={0.02} h={1.05} c="#2B2D2F" metal={0.65} rough={0.32} />
          <Cyl p={[0.15, 1.05, 0]} r={[0, 0, -Math.PI / 4]} rt={0.018} h={0.35} c="#2B2D2F" metal={0.65} rough={0.32} />
          <Cyl p={[0.02, 0.82, 0.06]} rt={0.014} h={0.22} c="#2B2D2F" metal={0.65} rough={0.32} />
        </G>
      </G>
    </Interact>
  )
}

/* ---------- Vách tắm đứng kính cường lực & Sen tắm mưa trần ---------- */
function ShowerBooth({ glassMat }: { glassMat: THREE.Material }) {
  return (
    <G p={[-14.1, 0, -4.8]}>
      {/* Vách kính cường lực trong suốt phân chia khu vực tắm */}
      <mesh position={[1.25, 1.3, 0]} material={glassMat}>
        <boxGeometry args={[0.03, 2.5, 2.1]} />
      </mesh>
      {/* Nẹp kính & Tay nắm Matte Charcoal (#2B2D2F) */}
      <BB p={[1.25, 0.02, 0]} s={[0.05, 0.04, 2.1]} c="#2B2D2F" metal={0.65} rough={0.3} />
      <B p={[1.25, 2.52, 0]} s={[0.05, 0.04, 2.1]} c="#2B2D2F" metal={0.65} rough={0.3} />
      <B p={[1.28, 1.25, 0.55]} s={[0.02, 0.35, 0.025]} c="#2B2D2F" metal={0.65} rough={0.3} />

      {/* Ga thoát sàn Matte Charcoal */}
      <BB p={[-0.8, 0.016, 0]} s={[0.1, 0.012, 1.2]} c="#2B2D2F" metal={0.65} rough={0.3} polyOffset />

      {/* Cây sen tắm đứng trên tường sau */}
      <G p={[0, 0, -1.18]}>
        <Cyl p={[0, 1.35, 0.05]} rt={0.016} h={1.6} c="#2B2D2F" metal={0.65} rough={0.3} />
        <Cyl p={[0, 2.18, 0.28]} r={[Math.PI / 2, 0, 0]} rt={0.018} h={0.46} c="#2B2D2F" metal={0.65} rough={0.3} />
        <Cyl p={[0, 2.15, 0.5]} rt={0.16} h={0.025} c="#2B2D2F" metal={0.65} rough={0.3} />
        <BB p={[0, 1.05, 0.05]} s={[0.14, 0.28, 0.06]} c="#2B2D2F" metal={0.65} rough={0.3} />
      </G>

      {/* Hốc âm tường để dầu gội & sữa tắm có đèn LED 3000K (#FFD7A3) */}
      <G p={[-1.48, 1.45, 0]}>
        <B s={[0.06, 0.55, 0.75]} c="#2B2D2F" />
        <B p={[0.01, 0.24, 0]} s={[0.04, 0.03, 0.72]} c="#FFD7A3" emissive="#FFD7A3" ei={1.6} shadow={false} />
        {/* Chai sữa tắm & dầu gội trung tính */}
        <Cyl p={[0.02, -0.12, -0.2]} rt={0.038} h={0.16} c="#4A5E6F" rough={0.28} />
        <Cyl p={[0.02, -0.12, 0.02]} rt={0.038} h={0.18} c="#B7AFA5" rough={0.28} />
        <Cyl p={[0.02, -0.12, 0.22]} rt={0.034} h={0.14} c="#2B2D2F" rough={0.35} />
      </G>
    </G>
  )
}

/* ---------- Bàn Lavabo đá cẩm thạch tích hợp Máy giặt quần áo thông minh ---------- */
function VanityAndWasher() {
  const sinkWaterUntil = useStore((s) => s.sinkWaterUntil)
  const laundryRunning = useStore((s) => s.laundryRunning)
  const bathMirrorLightOn = useStore((s) => s.bathMirrorLightOn)
  const streamRef = useRef<THREE.Group>(null)
  const drumRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (streamRef.current) {
      const active = Date.now() < sinkWaterUntil
      streamRef.current.visible = active
      if (active) {
        streamRef.current.scale.y = 0.85 + Math.sin(t * 24) * 0.15
      }
    }
    if (drumRef.current && laundryRunning) {
      drumRef.current.rotation.z += 0.18
    }
  })

  return (
    <group>
      {/* 1. Khu vực Bàn Lavabo & Gương LED cảm ứng */}
      <Interact
        hint="🪞 Bàn Lavabo"
        onClick={() => useStore.getState().startActivity('wash', true)}
      >
        <G p={[-12.4, 0, -5.5]}>
          {/* Tủ Lavabo Warm Taupe/Greige (#B7AFA5) */}
          <RBB p={[0, 0.28, 0]} s={[1.4, 0.54, 0.62]} c="#B7AFA5" rough={0.6} radius={0.03} shadow />
          {/* Mặt bàn đá sáng (#EFECE6) */}
          <RBB p={[0, 0.82, 0]} s={[1.44, 0.06, 0.66]} c="#EFECE6" rough={0.35} radius={0.02} shadow />

          {/* Chậu rửa mặt Lavabo sứ tròn nổi */}
          <Cyl p={[0, 0.94, 0.02]} rt={0.25} rb={0.22} h={0.14} c="#EFECE6" rough={0.22} />
          {/* Vòi nước Matte Charcoal (#2B2D2F) */}
          <Cyl p={[0, 0.95, -0.19]} rt={0.022} h={0.26} c="#2B2D2F" metal={0.65} rough={0.3} />
          <Cyl p={[0, 1.16, -0.12]} r={[Math.PI / 2, 0, 0]} rt={0.018} h={0.18} c="#2B2D2F" metal={0.65} rough={0.3} />

          {/* Dòng nước xả từ vòi xuống chậu */}
          <group ref={streamRef} position={[0, 1.02, -0.04]} visible={false}>
            <Cyl p={[0, 0, 0]} rt={0.012} h={0.16} c="#B6B7B5" emissive="#D6D1C9" ei={1.1} />
          </group>

          {/* Bình nước rửa tay & Cốc cắm bàn chải */}
          <Cyl p={[-0.52, 0.93, 0.08]} rt={0.04} h={0.12} c="#D6D1C9" />
          <Cyl p={[0.52, 0.93, 0.08]} rt={0.045} h={0.13} c="#2B2D2F" metal={0.55} />
          {/* Khăn mặt gấp gọn bên cạnh (#EFECE6) */}
          <BB p={[0.52, 0.88, -0.12]} s={[0.18, 0.06, 0.16]} c="#EFECE6" rough={0.85} />

          {/* Gương tròn đèn LED Halo cảm ứng 3000K (#FFD7A3) */}
          <Interact
            hint={bathMirrorLightOn ? '✨ Tắt đèn gương Halo' : '✨ Bật đèn gương Halo'}
            onClick={() => {
              useStore.getState().toggleBathMirrorLight()
            }}
          >
            <G p={[0, 2.3, -0.44]}>
              {bathMirrorLightOn && (
                <mesh position={[0, 0, -0.015]}>
                  <circleGeometry args={[0.75, 36]} />
                  <meshBasicMaterial color="#FFD7A3" transparent opacity={0.3} depthWrite={false} />
                </mesh>
              )}
              <mesh position={[0, 0, -0.008]}>
                <ringGeometry args={[0.55, 0.64, 40]} />
                <meshStandardMaterial
                  color="#FFD7A3"
                  emissive="#FFD7A3"
                  emissiveIntensity={bathMirrorLightOn ? 3.2 : 0.05}
                />
              </mesh>
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.58} h={0.025} c="#2B2D2F" metal={0.75} rough={0.25} />
              <mesh position={[0, 0, 0.015]}>
                <circleGeometry args={[0.55, 40]} />
                <meshStandardMaterial color="#D6D1C9" metalness={0.95} roughness={0.06} />
              </mesh>
            </G>
          </Interact>
        </G>
      </Interact>

      {/* 2. Máy giặt quần áo cửa trước thông minh (Smart Front-Load Washer) */}
      <Interact
        hint="🧺 Máy giặt"
        onClick={() => {
          const st = useStore.getState()
          const curAct = st.activeChar === 'girl' ? st.girlActivity : st.boyActivity
          if (curAct !== 'laundry') {
            st.startActivity('laundry', true)
          } else {
            st.toggleLaundry()
          }
        }}
      >
        <G p={[-10.8, 0, -5.45]}>
          {/* Thân máy giặt kim loại Matte Charcoal (#2B2D2F) */}
          <RBB p={[0, 0, 0]} s={[0.72, 0.88, 0.64]} c="#2B2D2F" metal={0.55} rough={0.4} radius={0.03} shadow />
          {/* Mặt trên bàn đá nối tiếp lavabo (#EFECE6) */}
          <RBB p={[0, 0.88, 0]} s={[0.74, 0.06, 0.66]} c="#EFECE6" rough={0.35} radius={0.02} />

          {/* Bảng điều khiển cảm ứng LED hiển thị thời gian & chế độ giặt */}
          <B p={[0, 0.78, 0.325]} s={[0.62, 0.12, 0.02]} c="#2B2D2F" />
          {/* Màn hình hiển thị số LED (#FFD7A3) */}
          <B p={[-0.14, 0.78, 0.336]} s={[0.16, 0.05, 0.005]} c="#FFD7A3" emissive="#FFD7A3" ei={laundryRunning ? 1.8 : 0.55} />
          {/* Núm xoay điều chỉnh chế độ */}
          <Cyl p={[0.14, 0.78, 0.34]} r={[Math.PI / 2, 0, 0]} rt={0.035} h={0.025} c="#D6D1C9" metal={0.75} />

          {/* Cửa tròn phía trước viền kim loại kép */}
          <G p={[0, 0.42, 0.325]}>
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.27} h={0.03} c="#2B2D2F" metal={0.75} />
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.24} h={0.035} c="#4A5E6F" metal={0.75} rough={0.25} />
            <mesh position={[0, 0, 0.02]}>
              <circleGeometry args={[0.2, 32]} />
              <meshStandardMaterial
                color="#2B2D2F"
                roughness={0.1}
                metalness={0.45}
                transparent
                opacity={0.72}
              />
            </mesh>

            {/* Lồng giặt kim loại xoay tròn */}
            <group ref={drumRef} position={[0, 0, -0.06]}>
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.18} h={0.18} c="#8E908F" metal={0.85} rough={0.18} />
              {/* Quần áo nhấp nhô trung tính bên trong lồng */}
              {laundryRunning && (
                <>
                  <B p={[0.06, 0.05, 0]} s={[0.1, 0.08, 0.08]} c="#EFECE6" emissive="#D6D1C9" ei={0.6} />
                  <B p={[-0.05, -0.04, 0]} s={[0.09, 0.09, 0.08]} c="#5E7487" emissive="#4A5E6F" ei={0.6} />
                  <B p={[0.02, -0.06, 0]} s={[0.08, 0.07, 0.08]} c="#C4834E" emissive="#9E6338" ei={0.6} />
                </>
              )}
            </group>
          </G>

          {/* Kệ trên máy giặt: Chai nước giặt xả & Giỏ đan #B7AFA5 */}
          <G p={[0, 0.94, 0]}>
            <BB p={[-0.22, 0, -0.05]} s={[0.11, 0.22, 0.08]} c="#5E7487" rough={0.35} />
            <Cyl p={[-0.22, 0.24, -0.05]} rt={0.022} h={0.04} c="#EFECE6" />
            <BB p={[-0.08, 0, -0.05]} s={[0.09, 0.19, 0.07]} c="#C4834E" rough={0.35} />
            <Cyl p={[-0.08, 0.21, -0.05]} rt={0.02} h={0.035} c="#EFECE6" />
            <Cyl p={[0.18, 0.12, 0]} rt={0.15} rb={0.12} h={0.24} c="#B7AFA5" rough={0.85} />
            <Sph p={[0.18, 0.23, 0]} s={[0.13, 0.06, 0.13]} c="#EFECE6" />
          </G>
        </G>
      </Interact>
    </group>
  )
}

/* ---------- Bồn cầu thông minh treo tường hiện đại ---------- */
function SmartToilet() {
  return (
    <G p={[-11.2, 0, -0.6]} r={[0, -Math.PI / 2, 0]}>
      <RBB p={[0, 0.18, 0.24]} s={[0.42, 0.36, 0.58]} c="#f7f5f0" rough={0.22} radius={0.04} shadow />
      <RBB p={[0, 0.54, 0.26]} s={[0.4, 0.04, 0.54]} c="#f2efe9" rough={0.22} radius={0.02} />

      {/* Tường giấu két nước & Nút xả kép Champagne Pewter */}
      <B p={[0, 0.92, -0.04]} s={[0.18, 0.12, 0.015]} c="#9a9389" metal={0.85} rough={0.22} />
      <B p={[-0.04, 0.92, -0.03]} s={[0.045, 0.06, 0.01]} c="#e5dfd5" />
      <B p={[0.04, 0.92, -0.03]} s={[0.055, 0.07, 0.01]} c="#e5dfd5" />

      {/* Hộp giấy vệ sinh gắn tường */}
      <G p={[0.42, 0.65, 0.25]}>
        <B s={[0.03, 0.12, 0.16]} c="#9a9389" metal={0.85} />
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.12} c="#f7f5f0" rough={0.9} />
      </G>
    </G>
  )
}

/* ---------- Giàn sấy khăn Matte Charcoal (#2B2D2F) treo tường ---------- */
function TowelWarmer() {
  return (
    <G p={[-15.54, 1.4, -2.1]}>
      <Cyl p={[0, 0, -0.32]} rt={0.016} h={1.4} c="#2B2D2F" metal={0.65} rough={0.3} />
      <Cyl p={[0, 0, 0.32]} rt={0.016} h={1.4} c="#2B2D2F" metal={0.65} rough={0.3} />
      {[-0.5, -0.2, 0.1, 0.4, 0.6].map((ty, i) => (
        <Cyl key={i} p={[0, ty, 0]} r={[Math.PI / 2, 0, 0]} rt={0.014} h={0.64} c="#2B2D2F" metal={0.65} rough={0.3} />
      ))}
      <BB p={[0.04, 0.02, 0]} s={[0.06, 0.48, 0.42]} c="#EFECE6" rough={0.85} />
      <BB p={[0.04, -0.3, 0]} s={[0.06, 0.45, 0.46]} c="#D6D1C9" rough={0.85} />
    </G>
  )
}

/* ---------- Không gian Master Spa & Kệ tủ đồ Warm Taupe (#B7AFA5) ---------- */
function MasterBathLounge() {
  const bathFullMirrorLightOn = useStore((s) => s.bathFullMirrorLightOn)
  return (
    <group>
      {/* 1. Tủ kệ đồ Master Spa Warm Taupe/Greige (#B7AFA5) */}
      <G p={[-15.26, 0, 3.65]} r={[0, Math.PI / 2, 0]}>
        <RBB p={[0, 0, 0]} s={[1.6, 2.15, 0.52]} c="#B7AFA5" rough={0.65} radius={0.03} shadow />
        {[-0.45, 0.45].map((kx, i) => (
          <group key={i}>
            <Cyl p={[kx, 0.35, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#EFECE6" rough={0.85} />
            <Cyl p={[kx, 0.85, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#EFECE6" rough={0.85} />
            <Cyl p={[kx, 1.35, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#D6D1C9" rough={0.85} />
          </group>
        ))}
        <Cyl p={[0, 0.28, 0]} rt={0.22} rb={0.18} h={0.34} c="#C4AF97" rough={0.85} />
        <Cyl p={[-0.35, 2.22, 0]} rt={0.045} h={0.1} c="#EFECE6" />
        <Cyl p={[0.35, 2.24, 0]} rt={0.04} h={0.14} c="#2B2D2F" />
      </G>

      {/* 2. Gương soi toàn thân viền Matte Charcoal (#2B2D2F) & LED 3000K (#FFD7A3) */}
      <Interact
        hint={bathFullMirrorLightOn ? '✨ Tắt đèn gương toàn thân' : '✨ Bật đèn gương toàn thân'}
        onClick={() => useStore.getState().toggleBathFullMirrorLight()}
      >
        <G p={[-15.52, 1.6, 1.4]}>
          <B
            p={[0.01, 0, 0]}
            s={[0.02, 2.24, 0.94]}
            c="#FFD7A3"
            emissive="#FFD7A3"
            ei={bathFullMirrorLightOn ? 2.4 : 0.05}
            shadow={false}
            polyOffset
          />
          <B p={[0.02, 0, 0]} s={[0.02, 2.18, 0.88]} c="#2B2D2F" polyOffset />
          <mesh position={[0.035, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.82, 2.12]} />
            <meshStandardMaterial
              color="#D6D1C9"
              metalness={0.95}
              roughness={0.05}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          </mesh>
          {bathFullMirrorLightOn && (
            <mesh position={[0.015, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.96, 2.26]} />
              <meshBasicMaterial color="#FFD7A3" transparent opacity={0.24} depthWrite={false} />
            </mesh>
          )}
        </G>
      </Interact>

      {/* 3. Thảm đá thấm nước Diatomite (#D6D1C9) */}
      <BB p={[-13.8, 0.016, 2.4]} s={[1.4, 0.02, 0.95]} c="#D6D1C9" rough={0.85} polyOffset />

      {/* 4. Chậu cây Lưỡi hổ Muted Sage/Olive (#566E4C & #6F8763) */}
      <G p={[-11.2, 0, 4.6]}>
        <Cyl p={[0, 0.28, 0]} rt={0.22} rb={0.16} h={0.56} c="#B7AFA5" rough={0.65} />
        {[0, 1, 2, 3, 4].map((i) => {
          const ang = (i / 5) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 0.08, 0.52 + i * 0.06, Math.sin(ang) * 0.08]}
              rotation={[0.12, ang, 0]}
            >
              <coneGeometry args={[0.08, 0.85, 4]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#566E4C' : '#6F8763'} roughness={0.65} />
            </mesh>
          )
        })}
      </G>
    </group>
  )
}
