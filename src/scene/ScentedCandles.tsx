import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

type V3 = [number, number, number]

interface CandleItemProps {
  position: V3
  scale?: number
  castLight?: boolean
}

function CandleItem({ position, scale = 1, castLight = false }: CandleItemProps) {
  const candlesLit = useStore((s) => s.candlesLit)
  const darkMode = useStore((s) => s.darkMode)
  const toggleCandles = useStore((s) => s.toggleCandles)

  const flameRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!candlesLit) return
    const t = clock.elapsedTime
    // Ngọn lửa bập bùng sống động tự nhiên
    if (flameRef.current) {
      const flicker = Math.sin(t * 12) * 0.12 + Math.cos(t * 18) * 0.08
      flameRef.current.scale.set(1 + flicker * 0.5, 1 + flicker, 1 + flicker * 0.5)
      flameRef.current.position.y = 0.085 + flicker * 0.005
    }
    if (lightRef.current) {
      const lightFlicker = Math.sin(t * 14) * 0.15 + Math.cos(t * 22) * 0.1
      lightRef.current.intensity = 1.45 + lightFlicker
    }
  })

  return (
    <group
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation()
        toggleCandles()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        useStore.getState().setHoverHint(candlesLit ? '🕯️ Cốc nến thơm tinh dầu (Click để thổi tắt)' : '🕯️ Cốc nến thơm tinh dầu (Click để thắp nến)')
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }}
    >
      {/* Cốc thủy tinh đựng nến màu hổ phách (không dùng transmission để tránh render scene 2 lần mỗi frame) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.08, 14]} />
        <meshStandardMaterial
          color="#c26308"
          roughness={0.14}
          metalness={0.08}
          transparent
          opacity={0.62}
        />
      </mesh>

      {/* Sáp nến hương hoa vani màu kem sữa bên trong */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.037, 0.034, 0.064, 14]} />
        <meshStandardMaterial
          color="#fef3c7"
          roughness={0.75}
          emissive={candlesLit ? '#f59e0b' : '#000000'}
          emissiveIntensity={candlesLit ? 0.22 : 0}
        />
      </mesh>

      {/* Bấc nến đen nhỏ */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.015, 8]} />
        <meshBasicMaterial color="#1e1e24" />
      </mesh>

      {/* Ngọn lửa nến hình giọt nước ấm áp */}
      {candlesLit && (
        <>
          <mesh ref={flameRef} position={[0, 0.085, 0]}>
            <coneGeometry args={[0.012, 0.032, 10]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>

          {/* Hào quang đỏ cam bên ngoài ngọn lửa */}
          <mesh position={[0, 0.082, 0]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.42} />
          </mesh>

          {/* Nguồn sáng PointLight vàng ấm bập bùng nhẹ (chỉ bật ban đêm ở nến chính để giữ 60fps) */}
          {darkMode && castLight && (
            <pointLight
              ref={lightRef}
              position={[0, 0.14, 0]}
              color="#f59e0b"
              intensity={1.45}
              distance={3.6}
              decay={2}
              castShadow={false}
            />
          )}
        </>
      )}
    </group>
  )
}

/** Hệ thống nến thơm tinh dầu đặt tại phòng khách, phòng tắm và bàn trang điểm Tầng 2 */
export function ScentedCandles() {
  return (
    <group>
      {/* 1. Cốc nến thơm trên bàn trà sofa Tầng 1 */}
      <CandleItem position={[3.85, 0.445, 2.15]} scale={1.1} castLight />

      {/* 2. Cốc nến thơm trên mặt bàn đá Lavabo phòng tắm Tầng 1 */}
      <CandleItem position={[-11.9, 0.87, -5.35]} scale={1.0} />

      {/* 3. Cốc nến thơm trên bàn trang điểm Tầng 2 */}
      <CandleItem position={[4.45, 4.35 + 0.70, -5.1]} scale={1.0} />
    </group>
  )
}
