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

      {/* Ánh sáng phản hồi tương tác khi bật đèn gương trong phòng tắm (castShadow = false để giữ 60fps) */}
      {bathMirrorLightOn && (
        <pointLight
          position={[-12.4, 2.3, -5.0]}
          intensity={darkMode ? 2.8 : 1.4}
          distance={4.5}
          decay={2}
          color="#ffbe54"
          castShadow={false}
        />
      )}
      {bathFullMirrorLightOn && (
        <pointLight
          position={[-15.0, 1.8, 1.4]}
          intensity={darkMode ? 2.8 : 1.4}
          distance={4.5}
          decay={2}
          color="#ffbe54"
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
      {/* Khung nẹp cửa gỗ sẫm sang trọng */}
      <BB p={[0, 0, -0.7]} s={[0.26, 2.58, 0.08]} c="#2b1e16" rough={0.5} />
      <BB p={[0, 0, 0.7]} s={[0.26, 2.58, 0.08]} c="#2b1e16" rough={0.5} />
      <BB p={[0, 2.54, 0]} s={[0.26, 0.08, 1.48]} c="#2b1e16" rough={0.5} />
      {/* Ngưỡng cửa đá cẩm thạch ngăn cách sàn gỗ & sàn đá */}
      <BB p={[0, 0.015, 0]} s={[0.22, 0.02, 1.4]} c="#d6cfc2" rough={0.3} metal={0.2} polyOffset />

      {/* Cánh cửa trượt gỗ kính mờ trượt nhẹ nép vào tường */}
      <G p={[-0.04, 0, -0.42]}>
        <BB s={[0.05, 2.5, 0.78]} c="#241912" rough={0.5} />
        <B p={[0.005, 1.25, 0]} s={[0.015, 2.1, 0.6]} c="#e2e8f0" opacity={0.65} rough={0.15} metal={0.3} shadow={false} />
        <B p={[0.038, 1.15, 0.32]} s={[0.02, 0.38, 0.02]} c="#d4af37" metal={0.85} rough={0.25} />
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
        {/* Thảm chùi chân mềm mại dưới sàn trước bồn tắm (nâng cao y >= 0.022 + polyOffset) */}
        <BB p={[1.2, 0.016, 0]} s={[0.72, 0.02, 1.35]} c="#e8e2d8" rough={0.95} polyOffset />

        {/* Thân bồn tắm oval màu trắng sứ mềm mại */}
        <Cyl p={[0, 0.35, 0]} rt={0.68} rb={0.58} h={0.65} c="#fcfbf9" seg={36} rough={0.25} />
        {/* Lòng bồn tắm khoét rỗng */}
        <Cyl p={[0, 0.38, 0]} rt={0.61} rb={0.51} h={0.62} c="#edebe6" seg={36} rough={0.3} />

        {/* Mặt nước ấm xanh trong vắt */}
        <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.59, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.82}
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
                c="#ffffff"
                rough={0.08}
              />
            )
          })}
        </group>

        {/* Khay gỗ vắt ngang thành bồn tắm ở phía chân */}
        <BB p={[0, 0.67, 0.48]} s={[0.96, 0.025, 0.22]} c="#8a6345" rough={0.6} />
        {/* Nến thơm mini thắp sáng lung linh */}
        <Cyl p={[-0.26, 0.72, 0.48]} rt={0.035} h={0.06} c="#f5f2eb" />
        <Sph p={[-0.26, 0.765, 0.48]} s={[0.012, 0.02, 0.012]} c="#fbbf24" emissive="#f59e0b" ei={2} />
        {/* Khăn mặt mềm mại cuộn tròn trên khay */}
        <Cyl p={[0.26, 0.71, 0.48]} r={[0, 0, Math.PI / 2]} rt={0.038} h={0.16} c="#f8fafc" />
        {/* Ly rượu vang thư giãn bên cạnh */}
        <Cyl p={[0.05, 0.73, 0.48]} rt={0.025} h={0.08} c="#f1f5f9" rough={0.1} />

        {/* Vòi sen cây đứng độc lập mạ vàng sang trọng */}
        <G p={[-0.85, 0, 0]}>
          <Cyl p={[0, 0.02, 0]} rt={0.09} h={0.04} c="#d4af37" metal={0.85} rough={0.2} />
          <Cyl p={[0, 0.55, 0]} rt={0.02} h={1.05} c="#d4af37" metal={0.85} rough={0.2} />
          {/* Cổ ngỗng uốn cong xả nước vào bồn */}
          <Cyl p={[0.15, 1.05, 0]} r={[0, 0, -Math.PI / 4]} rt={0.018} h={0.35} c="#d4af37" metal={0.85} rough={0.2} />
          {/* Tay sen cầm tay */}
          <Cyl p={[0.02, 0.82, 0.06]} rt={0.014} h={0.22} c="#d4af37" metal={0.85} rough={0.2} />
        </G>
      </G>
    </Interact>
  )
}

/* ---------- Vách tắm đứng kính cường lực & Sen tắm mưa trần ---------- */
function ShowerBooth({ glassMat }: { glassMat: THREE.Material }) {
  return (
    <G p={[-14.1, 0, -4.8]}>
      {/* Vách kính cường lực trong suốt phân chia khu vực tắm (không làm mờ đồ vật phía sau) */}
      <mesh position={[1.25, 1.3, 0]} material={glassMat}>
        <boxGeometry args={[0.03, 2.5, 2.1]} />
      </mesh>
      {/* Nẹp kính & Tay nắm mạ vàng */}
      <BB p={[1.25, 0.02, 0]} s={[0.05, 0.04, 2.1]} c="#d4af37" metal={0.85} rough={0.18} />
      <B p={[1.25, 2.52, 0]} s={[0.05, 0.04, 2.1]} c="#d4af37" metal={0.85} rough={0.18} />
      <B p={[1.28, 1.25, 0.55]} s={[0.02, 0.35, 0.025]} c="#d4af37" metal={0.85} rough={0.18} />

      {/* Ga thoát sàn inox dài mạ vàng */}
      <BB p={[-0.8, 0.016, 0]} s={[0.1, 0.012, 1.2]} c="#d4af37" metal={0.85} rough={0.18} polyOffset />

      {/* Cây sen tắm đứng mạ vàng trên tường sau */}
      <G p={[0, 0, -1.18]}>
        <Cyl p={[0, 1.35, 0.05]} rt={0.016} h={1.6} c="#d4af37" metal={0.85} rough={0.18} />
        {/* Cần sen vươn ra phía trước */}
        <Cyl p={[0, 2.18, 0.28]} r={[Math.PI / 2, 0, 0]} rt={0.018} h={0.46} c="#d4af37" metal={0.85} rough={0.18} />
        {/* Bát sen tắm mưa bản lớn */}
        <Cyl p={[0, 2.15, 0.5]} rt={0.16} h={0.025} c="#d4af37" metal={0.85} rough={0.18} />
        {/* Van điều áp & núm xoay nóng lạnh */}
        <BB p={[0, 1.05, 0.05]} s={[0.14, 0.28, 0.06]} c="#d4af37" metal={0.85} rough={0.18} />
      </G>

      {/* Hốc âm tường để dầu gội & sữa tắm có đèn LED */}
      <G p={[-1.48, 1.45, 0]}>
        <B s={[0.06, 0.55, 0.75]} c="#27272a" />
        <B p={[0.01, 0.24, 0]} s={[0.04, 0.03, 0.72]} c="#ffeed4" emissive="#ffb854" ei={1.8} shadow={false} />
        {/* Chai sữa tắm & dầu gội thủy tinh hổ phách */}
        <Cyl p={[0.02, -0.12, -0.2]} rt={0.038} h={0.16} c="#78350f" rough={0.2} />
        <Cyl p={[0.02, -0.12, 0.02]} rt={0.038} h={0.18} c="#92400e" rough={0.2} />
        <Cyl p={[0.02, -0.12, 0.22]} rt={0.034} h={0.14} c="#1e293b" rough={0.3} />
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
          {/* Tủ Lavabo treo tường ốp nan gỗ sẫm */}
          <RBB p={[0, 0.28, 0]} s={[1.4, 0.54, 0.62]} c="#36251b" rough={0.6} radius={0.03} shadow />
          {/* Mặt bàn đá cẩm thạch trắng Carrara */}
          <RBB p={[0, 0.82, 0]} s={[1.44, 0.06, 0.66]} c="#f5f2ec" rough={0.35} radius={0.02} shadow />

          {/* Chậu rửa mặt Lavabo sứ tròn nổi */}
          <Cyl p={[0, 0.94, 0.02]} rt={0.25} rb={0.22} h={0.14} c="#ffffff" rough={0.2} />
          {/* Vòi nước nóng lạnh mạ vàng */}
          <Cyl p={[0, 0.95, -0.19]} rt={0.022} h={0.26} c="#d4af37" metal={0.85} rough={0.2} />
          <Cyl p={[0, 1.16, -0.12]} r={[Math.PI / 2, 0, 0]} rt={0.018} h={0.18} c="#d4af37" metal={0.85} rough={0.2} />

          {/* Dòng nước xả từ vòi xuống chậu */}
          <group ref={streamRef} position={[0, 1.02, -0.04]} visible={false}>
            <Cyl p={[0, 0, 0]} rt={0.012} h={0.16} c="#38bdf8" emissive="#38bdf8" ei={1.8} />
          </group>

          {/* Bình nước rửa tay & Cốc cắm bàn chải */}
          <Cyl p={[-0.52, 0.93, 0.08]} rt={0.04} h={0.12} c="#e2e8f0" />
          <Cyl p={[0.52, 0.93, 0.08]} rt={0.045} h={0.13} c="#d4af37" metal={0.8} />
          {/* Khăn mặt gấp gọn bên cạnh */}
          <BB p={[0.52, 0.88, -0.12]} s={[0.18, 0.06, 0.16]} c="#f8fafc" />

          {/* Gương tròn đèn LED Halo cảm ứng: Click trực tiếp để bật/tắt riêng biệt */}
          <Interact
            hint={bathMirrorLightOn ? '✨ Tắt đèn gương Halo' : '✨ Bật đèn gương Halo'}
            onClick={() => {
              useStore.getState().toggleBathMirrorLight()
            }}
          >
            <G p={[0, 2.3, -0.44]}>
              {/* Quầng sáng LED tỏa mờ sau gương */}
              {bathMirrorLightOn && (
                <mesh position={[0, 0, -0.015]}>
                  <circleGeometry args={[0.75, 36]} />
                  <meshBasicMaterial color="#ffbe54" transparent opacity={0.32} depthWrite={false} />
                </mesh>
              )}
              {/* Vòng hào quang đèn LED sau gương */}
              <mesh position={[0, 0, -0.008]}>
                <ringGeometry args={[0.55, 0.64, 40]} />
                <meshStandardMaterial
                  color="#fff4dc"
                  emissive="#ffb854"
                  emissiveIntensity={bathMirrorLightOn ? 3.8 : 0.05}
                />
              </mesh>
              {/* Viền kim loại & Mặt gương tròn */}
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.58} h={0.025} c="#1e1e24" metal={0.85} rough={0.18} />
              <mesh position={[0, 0, 0.015]}>
                <circleGeometry args={[0.55, 40]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.05} />
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
          {/* Thân máy giặt kim loại màu than chì cao cấp */}
          <RBB p={[0, 0, 0]} s={[0.72, 0.88, 0.64]} c="#24262b" metal={0.65} rough={0.35} radius={0.03} shadow />
          {/* Mặt trên bàn đá nối tiếp lavabo */}
          <RBB p={[0, 0.88, 0]} s={[0.74, 0.06, 0.66]} c="#f5f2ec" rough={0.35} radius={0.02} />

          {/* Bảng điều khiển cảm ứng LED hiển thị thời gian & chế độ giặt */}
          <B p={[0, 0.78, 0.325]} s={[0.62, 0.12, 0.02]} c="#181a1f" />
          {/* Màn hình hiển thị số LED */}
          <B p={[-0.14, 0.78, 0.336]} s={[0.16, 0.05, 0.005]} c="#38bdf8" emissive="#38bdf8" ei={laundryRunning ? 2.5 : 0.8} />
          {/* Núm xoay điều chỉnh chế độ mạ chrome */}
          <Cyl p={[0.14, 0.78, 0.34]} r={[Math.PI / 2, 0, 0]} rt={0.035} h={0.025} c="#d4d4d8" metal={0.9} />

          {/* Cửa tròn phía trước viền kim loại kép */}
          <G p={[0, 0.42, 0.325]}>
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.27} h={0.03} c="#111216" metal={0.8} />
            <Cyl r={[Math.PI / 2, 0, 0]} rt={0.24} h={0.035} c="#3f3f46" metal={0.9} rough={0.2} />
            {/* Kính cửa máy giặt màu khói */}
            <mesh position={[0, 0, 0.02]}>
              <circleGeometry args={[0.2, 32]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.1}
                metalness={0.5}
                transparent
                opacity={0.75}
              />
            </mesh>

            {/* Lồng giặt kim loại xoay tròn khi máy giặt hoạt động */}
            <group ref={drumRef} position={[0, 0, -0.06]}>
              <Cyl r={[Math.PI / 2, 0, 0]} rt={0.18} h={0.18} c="#71717a" metal={0.85} rough={0.18} />
              {/* Quần áo nhấp nhô bên trong lồng khi giặt */}
              {laundryRunning && (
                <>
                  <B p={[0.06, 0.05, 0]} s={[0.1, 0.08, 0.08]} c="#38bdf8" emissive="#38bdf8" ei={1.5} />
                  <B p={[-0.05, -0.04, 0]} s={[0.09, 0.09, 0.08]} c="#f43f5e" emissive="#f43f5e" ei={1.5} />
                  <B p={[0.02, -0.06, 0]} s={[0.08, 0.07, 0.08]} c="#fde047" emissive="#fde047" ei={1.5} />
                </>
              )}
            </group>
          </G>

          {/* Kệ trên máy giặt: Chai nước giặt xả & Giỏ mây đựng đồ */}
          <G p={[0, 0.94, 0]}>
            {/* Chai nước giặt màu xanh mát */}
            <BB p={[-0.22, 0, -0.05]} s={[0.11, 0.22, 0.08]} c="#0284c7" rough={0.3} />
            <Cyl p={[-0.22, 0.24, -0.05]} rt={0.022} h={0.04} c="#ffffff" />
            {/* Chai nước xả vải màu hồng */}
            <BB p={[-0.08, 0, -0.05]} s={[0.09, 0.19, 0.07]} c="#f472b6" rough={0.3} />
            <Cyl p={[-0.08, 0.21, -0.05]} rt={0.02} h={0.035} c="#ffffff" />
            {/* Giỏ mây đựng quần áo */}
            <Cyl p={[0.18, 0.12, 0]} rt={0.15} rb={0.12} h={0.24} c="#c49a6c" rough={0.9} />
            {/* Vải trắng lót trên miệng giỏ */}
            <Sph p={[0.18, 0.23, 0]} s={[0.13, 0.06, 0.13]} c="#f8fafc" />
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
      {/* Thân bồn cầu sứ trắng treo tường */}
      <RBB p={[0, 0.18, 0.24]} s={[0.42, 0.36, 0.58]} c="#ffffff" rough={0.2} radius={0.04} shadow />
      {/* Nắp đóng êm cong nhẹ */}
      <RBB p={[0, 0.54, 0.26]} s={[0.4, 0.04, 0.54]} c="#f8fafc" rough={0.2} radius={0.02} />

      {/* Tường giấu két nước & Nút xả kép mạ vàng */}
      <B p={[0, 0.92, -0.04]} s={[0.18, 0.12, 0.015]} c="#d4af37" metal={0.85} rough={0.2} />
      <B p={[-0.04, 0.92, -0.03]} s={[0.045, 0.06, 0.01]} c="#fef08a" />
      <B p={[0.04, 0.92, -0.03]} s={[0.055, 0.07, 0.01]} c="#fef08a" />

      {/* Hộp giấy vệ sinh gắn tường mạ vàng */}
      <G p={[0.42, 0.65, 0.25]}>
        <B s={[0.03, 0.12, 0.16]} c="#d4af37" metal={0.85} />
        <Cyl r={[Math.PI / 2, 0, 0]} rt={0.055} h={0.12} c="#ffffff" rough={0.9} />
      </G>
    </G>
  )
}

/* ---------- Giàn sấy khăn mạ vàng treo tường ---------- */
function TowelWarmer() {
  return (
    <G p={[-15.54, 1.4, -2.1]}>
      {/* Khung thang kim loại mạ vàng */}
      <Cyl p={[0, 0, -0.32]} rt={0.016} h={1.4} c="#d4af37" metal={0.85} rough={0.2} />
      <Cyl p={[0, 0, 0.32]} rt={0.016} h={1.4} c="#d4af37" metal={0.85} rough={0.2} />
      {[-0.5, -0.2, 0.1, 0.4, 0.6].map((ty, i) => (
        <Cyl key={i} p={[0, ty, 0]} r={[Math.PI / 2, 0, 0]} rt={0.014} h={0.64} c="#d4af37" metal={0.85} rough={0.2} />
      ))}
      {/* Khăn tắm trắng gấp vắt ngang giàn */}
      <BB p={[0.04, 0.02, 0]} s={[0.06, 0.48, 0.42]} c="#f8fafc" rough={0.95} />
      <BB p={[0.04, -0.3, 0]} s={[0.06, 0.45, 0.46]} c="#dfd9ce" rough={0.95} />
    </G>
  )
}

/* ---------- Không gian Master Spa & Kệ tủ đồ cao cấp nửa trước Phòng tắm (Full 12m) ---------- */
function MasterBathLounge() {
  const bathFullMirrorLightOn = useStore((s) => s.bathFullMirrorLightOn)
  return (
    <group>
      {/* 1. Tủ kệ đồ Master Spa 4 tầng áp sát vào bức tường bên trái để lộ rõ hoàn toàn bồn tắm phía sau */}
      <G p={[-15.26, 0, 3.65]} r={[0, Math.PI / 2, 0]}>
        <RBB p={[0, 0, 0]} s={[1.6, 2.15, 0.52]} c="#2e1f14" rough={0.65} radius={0.03} shadow />
        {/* Các tầng kệ để khăn cuộn tròn & đồ skincare */}
        {[-0.45, 0.45].map((kx, i) => (
          <group key={i}>
            {/* Khăn tắm trắng cuộn tròn */}
            <Cyl p={[kx, 0.35, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#ffffff" />
            <Cyl p={[kx, 0.85, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#ffffff" />
            <Cyl p={[kx, 1.35, 0]} r={[0, 0, Math.PI / 2]} rt={0.065} h={0.28} c="#f1f5f9" />
          </group>
        ))}
        {/* Giỏ mây đan đựng áo choàng tắm ở tầng dưới */}
        <Cyl p={[0, 0.28, 0]} rt={0.22} rb={0.18} h={0.34} c="#c49a6c" rough={0.9} />
        {/* Nến thơm & Lọ tinh dầu thơm phòng trên nóc kệ */}
        <Cyl p={[-0.35, 2.22, 0]} rt={0.045} h={0.1} c="#fef08a" />
        <Cyl p={[0.35, 2.24, 0]} rt={0.04} h={0.14} c="#1e293b" />
      </G>

      {/* 2. Gương soi toàn thân viền đèn LED âm tường sang trọng: Click trực tiếp để bật/tắt */}
      <Interact
        hint={bathFullMirrorLightOn ? '✨ Tắt đèn gương toàn thân' : '✨ Bật đèn gương toàn thân'}
        onClick={() => useStore.getState().toggleBathFullMirrorLight()}
      >
        <G p={[-15.52, 1.6, 1.4]}>
          {/* Viền đèn LED ấm phía sau gương */}
          <B
            p={[0.01, 0, 0]}
            s={[0.02, 2.24, 0.94]}
            c="#fff4dc"
            emissive="#ffb854"
            ei={bathFullMirrorLightOn ? 2.5 : 0.05}
            shadow={false}
            polyOffset
          />
          <B p={[0.02, 0, 0]} s={[0.02, 2.18, 0.88]} c="#18181b" polyOffset />
          <mesh position={[0.035, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.82, 2.12]} />
            <meshStandardMaterial
              color="#cbd5e1"
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
              <meshBasicMaterial color="#ffbe54" transparent opacity={0.25} depthWrite={false} />
            </mesh>
          )}
        </G>
      </Interact>

      {/* 3. Thảm đá thấm nước siêu nhanh Diatomite trước gương và kệ (y >= 0.022 + polyOffset) */}
      <BB p={[-13.8, 0.016, 2.4]} s={[1.4, 0.02, 0.95]} c="#e2ddd5" rough={0.95} polyOffset />

      {/* 4. Chậu cây Lưỡi hổ thanh lọc không khí trong góc phòng tắm */}
      <G p={[-11.2, 0, 4.6]}>
        <Cyl p={[0, 0.28, 0]} rt={0.22} rb={0.16} h={0.56} c="#ffffff" rough={0.3} />
        {[0, 1, 2, 3, 4].map((i) => {
          const ang = (i / 5) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(ang) * 0.08, 0.52 + i * 0.06, Math.sin(ang) * 0.08]}
              rotation={[0.12, ang, 0]}
            >
              <coneGeometry args={[0.08, 0.85, 4]} />
              <meshStandardMaterial color="#166534" roughness={0.6} />
            </mesh>
          )
        })}
      </G>
    </group>
  )
}
