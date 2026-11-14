import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B, BB, Cyl, G, Interact, RBB, Sph } from './prims'
import { WallAttached } from './ArchitectureShell'
import { getArchitecturalGlassMat } from './GlassCurtainWall'
import { useStore } from '../store'

const SNAKE_LEAF_GEOM = new THREE.ConeGeometry(0.08, 0.85, 4)
const SNAKE_LEAF_MAT_A = new THREE.MeshStandardMaterial({ color: '#566E4C', roughness: 0.65 })
const SNAKE_LEAF_MAT_B = new THREE.MeshStandardMaterial({ color: '#6F8763', roughness: 0.65 })

/** Khu vực Phòng tắm cao cấp & Khu giặt sấy thông minh */
export function Bathroom() {
  const darkMode = useStore((s) => s.darkMode)
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
    </group>
  )
}

/* ---------- Cửa thông phòng kết nối phòng ngủ và phòng tắm ---------- */
function BathroomDoorway() {
  return (
    <G p={[-10.0, 0, -3.4]}>
      {/* Khuôn bao cửa thông phòng liền mạch Matte Charcoal (#2B2D2F) ôm khít vách ngăn dày 0.22 */}
      <BB p={[0, 0, -0.665]} s={[0.25, 2.56, 0.07]} c="#2B2D2F" rough={0.62} shadow />
      <BB p={[0, 0, 0.665]} s={[0.25, 2.56, 0.07]} c="#2B2D2F" rough={0.62} shadow />
      <BB p={[0, 2.53, 0]} s={[0.25, 0.07, 1.4]} c="#2B2D2F" rough={0.62} shadow />

      {/* Nẹp viền khuôn cửa đối xứng 2 mặt (phía phòng sinh hoạt +0.12 & phía phòng tắm -0.12) */}
      {[0.12, -0.12].map((fx, i) => (
        <group key={i} position={[fx, 0, 0]}>
          <BB p={[0, 0, -0.71]} s={[0.025, 2.6, 0.08]} c="#2B2D2F" rough={0.6} polyOffset />
          <BB p={[0, 0, 0.71]} s={[0.025, 2.6, 0.08]} c="#2B2D2F" rough={0.6} polyOffset />
          <BB p={[0, 2.56, 0]} s={[0.025, 0.08, 1.5]} c="#2B2D2F" rough={0.6} polyOffset />
        </group>
      ))}

      {/* Ngưỡng cửa đá (#C8C0B4) chuyển tiếp liền mạch giữa sàn gỗ & sàn gạch phòng tắm */}
      <BB p={[0, 0.014, 0]} s={[0.23, 0.022, 1.32]} c="#C8C0B4" rough={0.38} metal={0.08} polyOffset />

      {/* Thanh ray trượt cửa âm trần phía phòng tắm */}
      <B p={[-0.145, 2.61, -0.16]} s={[0.055, 0.045, 2.1]} c="#2B2D2F" metal={0.55} rough={0.35} />
      <B p={[-0.145, 2.55, -0.66]} s={[0.03, 0.09, 0.05]} c="#2B2D2F" metal={0.6} rough={0.3} />
      <B p={[-0.145, 2.55, -0.16]} s={[0.03, 0.09, 0.05]} c="#2B2D2F" metal={0.6} rough={0.3} />

      {/* Cánh cửa trượt khung Matte Charcoal & kính mờ */}
      <G p={[-0.145, 0, -0.41]}>
        <BB s={[0.048, 2.52, 0.8]} c="#2B2D2F" rough={0.62} shadow />
        <B p={[0, 1.26, 0]} s={[0.016, 2.14, 0.62]} c="#EFECE6" opacity={0.36} rough={0.12} metal={0.12} shadow={false} />
        <B p={[0.036, 1.15, 0.33]} s={[0.02, 0.38, 0.02]} c="#2B2D2F" metal={0.65} rough={0.3} />
        <B p={[-0.036, 1.15, 0.33]} s={[0.02, 0.38, 0.02]} c="#2B2D2F" metal={0.65} rough={0.3} />
      </G>
    </G>
  )
}

/* ---------- Bồn tắm nằm oval cao cấp có nước ấm & bọt xà phòng bồng bềnh ---------- */
function Bathtub() {
  const bathBubbles = useStore((s) => s.bathBubbles)
  const bubblesRef = useRef<THREE.Group>(null)
  const waterSurfaceRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (waterSurfaceRef.current) {
      if (bathBubbles) {
        waterSurfaceRef.current.position.y = 0.525 + Math.sin(t * 2.4) * 0.008
        waterSurfaceRef.current.scale.setScalar(1 + Math.sin(t * 3.1) * 0.014)
      } else {
        waterSurfaceRef.current.position.y = 0.5
        waterSurfaceRef.current.scale.setScalar(0.98)
      }
    }
    if (!bubblesRef.current) return
    bubblesRef.current.visible = bathBubbles
    if (bathBubbles) {
      bubblesRef.current.children.forEach((b, i) => {
        b.position.y = 0.53 + Math.sin(t * 2.2 + i * 1.4) * 0.025
        b.scale.setScalar(0.042 + Math.sin(t * 1.8 + i) * 0.014)
      })
    }
  })

  return (
    <Interact
      id="bathtub"
      zone="interior_f1"
      category="CONTAINER_INFO"
      label="Bồn tắm Thư giãn"
      infoTitle="Bồn tắm Sứ Ấm áp & Muối Khoáng"
      infoBody="Xả nước ấm cùng lớp bọt xà phòng bồng bềnh và muối khoáng thư giãn."
      customStandOffset={[-12.4, 0, -1.6]}
      userData={{ customStandOffset: [-12.4, 0, -1.6] }}
      hint={bathBubbles ? '🛁 Bồn tắm · Tắt bọt nước' : '🛁 Bồn tắm · Xả nước & bọt'}
      onClick={() => {
        const st = useStore.getState()
        const curAct = st.activeChar === 'girl' ? st.girlActivity : st.boyActivity
        if (curAct === 'bath') {
          st.toggleBathBubbles()
        } else {
          if (!st.bathBubbles) st.toggleBathBubbles()
          st.startActivity('bath', true)
        }
      }}
    >
      <G p={[-13.8, 0, -1.6]}>
        {/* Thảm chùi chân mềm mại dưới sàn (#B6B7B5, lì roughness ~0.85) */}
        <BB p={[1.2, 0.016, 0]} s={[0.72, 0.02, 1.35]} c="#B6B7B5" rough={0.85} polyOffset />

        {/* Thân bồn tắm oval sứ trắng sáng (#F7F5F0) nổi bật trên nền đá xám ấm */}
        <Cyl p={[0, 0.35, 0]} rt={0.68} rb={0.58} h={0.65} c="#F7F5F0" seg={36} rough={0.22} shadow />
        {/* Lòng bồn tắm khoét rỗng (#EAE7E0) */}
        <Cyl p={[0, 0.38, 0]} rt={0.61} rb={0.51} h={0.62} c="#EAE7E0" seg={36} rough={0.28} />

        {/* Mặt nước ấm trong dịu trung tính có hiệu ứng sóng nhẹ khi bật bọt */}
        <mesh ref={waterSurfaceRef} position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.59, 32]} />
          <meshStandardMaterial
            color="#5E7487"
            emissive={bathBubbles ? '#38B2AC' : '#000000'}
            emissiveIntensity={bathBubbles ? 0.18 : 0}
            roughness={0.1}
            metalness={0.08}
            transparent
            opacity={bathBubbles ? 0.48 : 0.32}
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
        {/* Hũ gốm đựng muối tắm bên trái khay */}
        <Cyl p={[-0.26, 0.72, 0.48]} rt={0.04} rb={0.036} h={0.07} c="#EFECE6" rough={0.55} />
        <Cyl p={[-0.26, 0.76, 0.48]} rt={0.038} h={0.015} c="#C4AF97" rough={0.5} />
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

      {/* Hốc âm tường để dầu gội & sữa tắm có đèn LED 3000K (#FFAE52) — ẩn cùng tường trái khi cắt */}
      <WallAttached normal={[-1, 0, 0]} floor={1}>
        <G p={[-1.48, 1.45, 0]}>
          <B s={[0.06, 0.55, 0.75]} c="#2B2D2F" />
          <B p={[0.01, 0.24, 0]} s={[0.04, 0.03, 0.72]} c="#FFAE52" emissive="#FFAE52" ei={1.5} shadow={false} />
          {/* Chai sữa tắm & dầu gội trung tính */}
          <Cyl p={[0.02, -0.12, -0.2]} rt={0.038} h={0.16} c="#4A5E6F" rough={0.28} />
          <Cyl p={[0.02, -0.12, 0.02]} rt={0.038} h={0.18} c="#B7AFA5" rough={0.28} />
          <Cyl p={[0.02, -0.12, 0.22]} rt={0.034} h={0.14} c="#2B2D2F" rough={0.35} />
        </G>
      </WallAttached>
    </G>
  )
}

/* ---------- Bàn Lavabo đá cẩm thạch tích hợp Máy giặt quần áo thông minh ---------- */
function VanityAndWasher() {
  const sinkWaterUntil = useStore((s) => s.sinkWaterUntil)
  const laundryRunning = useStore((s) => s.laundryRunning)
  const bathMirrorLightOn = useStore((s) => s.bathMirrorLightOn)
  const streamRef = useRef<THREE.Group>(null)
  const basinRippleRef = useRef<THREE.Mesh>(null)
  const drumRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const sinkActive = Date.now() < sinkWaterUntil
    if (streamRef.current) {
      streamRef.current.visible = sinkActive
      if (sinkActive) {
        streamRef.current.scale.set(
          1 + Math.sin(t * 28) * 0.08,
          0.88 + Math.sin(t * 24) * 0.14,
          1 + Math.cos(t * 28) * 0.08,
        )
      }
    }
    if (basinRippleRef.current) {
      basinRippleRef.current.visible = sinkActive
      if (sinkActive) {
        const s = 0.72 + ((t * 1.8) % 1) * 0.38
        basinRippleRef.current.scale.setScalar(s)
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
        id="lavabo"
        zone="interior_f1"
        category="CONTAINER_INFO"
        label="Bàn Lavabo"
        infoTitle="Bàn Lavabo & Vòi Rửa Cảm Ứng"
        infoBody="Mặt đá sứ trắng sạch sẽ kèm vòi xả nước chảy tự động và gương LED Halo."
        customStandOffset={[-12.4, 0, -4.4]}
        userData={{ customStandOffset: [-12.4, 0, -4.4] }}
        hint="🪞 Bàn Lavabo · Xả nước rửa tay"
        onClick={() => {
          const st = useStore.getState()
          st.triggerSinkWater()
          st.startActivity('wash', true)
        }}
      >
        <G p={[-12.4, 0, -5.5]}>
          {/* Tủ Lavabo Warm Taupe/Greige (#B7AFA5) */}
          <RBB p={[0, 0.28, 0]} s={[1.4, 0.54, 0.62]} c="#B7AFA5" rough={0.6} radius={0.03} shadow />
          {/* Mặt bàn đá sứ trắng sáng (#F7F5F0) */}
          <RBB p={[0, 0.82, 0]} s={[1.44, 0.06, 0.66]} c="#F7F5F0" rough={0.3} radius={0.02} shadow />

          {/* Chậu rửa mặt Lavabo sứ trắng nổi bật (#F7F5F0) */}
          <Cyl p={[0, 0.94, 0.02]} rt={0.25} rb={0.22} h={0.14} c="#F7F5F0" rough={0.18} shadow />
          {/* Vòi nước Matte Charcoal (#2B2D2F) */}
          <Cyl p={[0, 0.95, -0.19]} rt={0.022} h={0.26} c="#2B2D2F" metal={0.65} rough={0.3} />
          <Cyl p={[0, 1.16, -0.12]} r={[Math.PI / 2, 0, 0]} rt={0.018} h={0.18} c="#2B2D2F" metal={0.65} rough={0.3} />

          {/* Dòng nước xả từ vòi xuống chậu & gợn sóng mặt nước */}
          <group ref={streamRef} position={[0, 1.02, -0.04]} visible={false}>
            <Cyl p={[0, 0, 0]} rt={0.013} h={0.17} c="#9AEBFF" emissive="#7FE8E0" ei={1.15} opacity={0.78} />
          </group>
          <mesh ref={basinRippleRef} position={[0, 0.955, 0.01]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
            <ringGeometry args={[0.08, 0.14, 24]} />
            <meshBasicMaterial color="#9AEBFF" transparent opacity={0.55} depthWrite={false} />
          </mesh>

          {/* Bình nước rửa tay & Cốc cắm bàn chải */}
          <Cyl p={[-0.52, 0.93, 0.08]} rt={0.04} h={0.12} c="#D6D1C9" />
          <Cyl p={[0.52, 0.93, 0.08]} rt={0.045} h={0.13} c="#2B2D2F" metal={0.55} />
          {/* Khăn mặt gấp gọn bên cạnh (#EFECE6) */}
          <BB p={[0.52, 0.88, -0.12]} s={[0.18, 0.06, 0.16]} c="#EFECE6" rough={0.85} />

          {/* Gương tròn đèn LED Halo cảm ứng 3000K (#FFAE52) */}
          <Interact
            id="bath_mirror_light"
            zone="interior_f1"
            category="ELECTRONIC"
            label="Đèn gương Halo"
            customStandOffset={[-12.4, 0, -4.4]}
            userData={{ customStandOffset: [-12.4, 0, -4.4] }}
            hint={bathMirrorLightOn ? '✨ Tắt đèn gương Halo' : '✨ Bật đèn gương Halo'}
            onClick={() => {
              useStore.getState().toggleBathMirrorLight()
            }}
          >
            <G p={[0, 2.3, -0.44]}>
              {bathMirrorLightOn && (
                <mesh position={[0, 0, -0.015]}>
                  <circleGeometry args={[0.75, 36]} />
                  <meshBasicMaterial color="#FFAE52" transparent opacity={0.32} depthWrite={false} />
                </mesh>
              )}
              <mesh position={[0, 0, -0.008]}>
                <ringGeometry args={[0.55, 0.64, 40]} />
                <meshStandardMaterial
                  color={bathMirrorLightOn ? '#FFAE52' : '#2B2D2F'}
                  emissive={bathMirrorLightOn ? '#FFAE52' : '#000000'}
                  emissiveIntensity={bathMirrorLightOn ? 1.65 : 0}
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
        id="laundry"
        zone="interior_f1"
        category="ELECTRONIC"
        label="Máy giặt Thông minh"
        customStandOffset={[-10.8, 0, -4.4]}
        userData={{ customStandOffset: [-10.8, 0, -4.4] }}
        hint={laundryRunning ? '🧺 Tắt máy giặt' : '🧺 Bật máy giặt'}
        onClick={() => {
          const st = useStore.getState()
          const next = !st.laundryRunning
          st.setLaundryRunning(next)
          st.notify(next ? '🧺 Khởi động chu trình giặt thông minh' : '🧺 Đã dừng máy giặt')
          const curAct = st.activeChar === 'girl' ? st.girlActivity : st.boyActivity
          if (next && curAct !== 'laundry') {
            st.startActivity('laundry', true)
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
          {/* Màn hình hiển thị số LED (#FFD7A3) & đèn báo trạng thái */}
          <B
            p={[-0.14, 0.78, 0.336]}
            s={[0.16, 0.05, 0.005]}
            c={laundryRunning ? '#FFD7A3' : '#2B2D2F'}
            emissive={laundryRunning ? '#FFD7A3' : '#000000'}
            ei={laundryRunning ? 1.85 : 0}
          />
          <B
            p={[0.02, 0.78, 0.337]}
            s={[0.022, 0.022, 0.006]}
            c={laundryRunning ? '#5EEAD4' : '#3A3A3A'}
            emissive={laundryRunning ? '#5EEAD4' : '#000000'}
            ei={laundryRunning ? 1.8 : 0}
          />
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
    <WallAttached normal={[-1, 0, 0]} floor={1}>
      <G p={[-15.54, 1.4, -2.1]}>
        <Cyl p={[0, 0, -0.32]} rt={0.016} h={1.4} c="#2B2D2F" metal={0.65} rough={0.3} />
        <Cyl p={[0, 0, 0.32]} rt={0.016} h={1.4} c="#2B2D2F" metal={0.65} rough={0.3} />
        {[-0.5, -0.2, 0.1, 0.4, 0.6].map((ty, i) => (
          <Cyl key={i} p={[0, ty, 0]} r={[Math.PI / 2, 0, 0]} rt={0.014} h={0.64} c="#2B2D2F" metal={0.65} rough={0.3} />
        ))}
        <BB p={[0.04, 0.02, 0]} s={[0.06, 0.48, 0.42]} c="#EFECE6" rough={0.85} />
        <BB p={[0.04, -0.3, 0]} s={[0.06, 0.45, 0.46]} c="#D6D1C9" rough={0.85} />
      </G>
    </WallAttached>
  )
}

/* ---------- Không gian Master Spa & Kệ tủ đồ Warm Taupe (#B7AFA5) ---------- */
function MasterBathLounge() {
  const bathFullMirrorLightOn = useStore((s) => s.bathFullMirrorLightOn)
  return (
    <group>
      {/* 1. Tủ kệ đồ Master Spa & Gương soi toàn thân (ẩn cùng tường trái khi cắt để không lộ mặt lưng) */}
      <WallAttached normal={[-1, 0, 0]} floor={1}>
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

        {/* 2. Gương soi toàn thân viền Matte Charcoal (#2B2D2F) & LED 3000K (#FFAE52) */}
        <Interact
          id="bath_full_mirror_light"
          zone="interior_f1"
          category="ELECTRONIC"
          label="Đèn gương toàn thân"
          customStandOffset={[-14.7, 0, 1.4]}
          userData={{ customStandOffset: [-14.7, 0, 1.4] }}
          hint={bathFullMirrorLightOn ? '✨ Tắt đèn gương toàn thân' : '✨ Bật đèn gương toàn thân'}
          onClick={() => useStore.getState().toggleBathFullMirrorLight()}
        >
          <G p={[-15.52, 1.6, 1.4]}>
            <B
              p={[0.01, 0, 0]}
              s={[0.02, 2.24, 0.94]}
              c={bathFullMirrorLightOn ? '#FFAE52' : '#2B2D2F'}
              emissive={bathFullMirrorLightOn ? '#FFAE52' : '#000000'}
              ei={bathFullMirrorLightOn ? 1.65 : 0}
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
                <meshBasicMaterial color="#FFAE52" transparent opacity={0.26} depthWrite={false} />
              </mesh>
            )}
          </G>
        </Interact>
      </WallAttached>

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
              geometry={SNAKE_LEAF_GEOM}
              material={i % 2 === 0 ? SNAKE_LEAF_MAT_A : SNAKE_LEAF_MAT_B}
              castShadow={false}
            />
          )
        })}
      </G>
    </group>
  )
}
