import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

type V3 = [number, number, number]

interface CandleItemProps {
  position: V3
  scale?: number
}

function CandleItem({ position, scale = 1 }: CandleItemProps) {
  const candlesLit = useStore((s) => s.candlesLit)
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
      lightRef.current.intensity = 1.35 + lightFlicker
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
      {/* Cốc thủy tinh đựng nến màu hổ phách sang trọng */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.038, 0.08, 16]} />
        <meshPhysicalMaterial
          color="#d97706"
          roughness={0.15}
          transmission={0.65}
          thickness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Sáp nến hương hoa vani màu kem sữa bên trong */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.038, 0.035, 0.065, 16]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
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
            <coneGeometry args={[0.012, 0.032, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>

          {/* Hào quang đỏ cam bên ngoài ngọn lửa */}
          <mesh position={[0, 0.082, 0]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.45} />
          </mesh>

          {/* Nguồn sáng PointLight vàng ấm bập bùng nhẹ */}
          <pointLight
            ref={lightRef}
            position={[0, 0.12, 0]}
            color="#f59e0b"
            intensity={1.35}
            distance={3.2}
            decay={2}
          />
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
      <CandleItem position={[3.85, 0.445, 2.15]} scale={1.1} />

      {/* 2. Cốc nến thơm trên mặt bàn đá Lavabo phòng tắm Tầng 1 */}
      <CandleItem position={[-11.9, 0.87, -5.35]} scale={1.0} />

      {/* 3. Cốc nến thơm trên bàn trang điểm Tầng 2 */}
      <CandleItem position={[4.45, 4.35 + 0.70, -5.1]} scale={1.0} />
    </group>
  )
}
