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
      {/* Cốc thủy tinh đựng nến màu khói trung tính */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.08, 14]} />
        <meshStandardMaterial
          color="#6e5f50"
          roughness={0.16}
          metalness={0.08}
          transparent
          opacity={0.62}
        />
      </mesh>

      {/* Sáp nến hương hoa vani màu kem sữa bên trong */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.037, 0.034, 0.064, 14]} />
        <meshStandardMaterial
          color="#f2ece1"
          roughness={0.75}
          emissive={candlesLit ? '#e5cc9c' : '#000000'}
          emissiveIntensity={candlesLit ? 0.2 : 0}
        />
      </mesh>

      {/* Bấc nến đen nhỏ */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.015, 8]} />
        <meshBasicMaterial color="#1f1e1c" />
      </mesh>

      {/* Ngọn lửa nến hình giọt nước dịu nhẹ 3000K */}
      {candlesLit && (
        <>
          <mesh ref={flameRef} position={[0, 0.085, 0]}>
            <coneGeometry args={[0.012, 0.032, 10]} />
            <meshBasicMaterial color="#FFD7A3" />
          </mesh>

          {/* Hào quang vàng ấm 3000K bên ngoài ngọn lửa */}
          <mesh position={[0, 0.082, 0]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshBasicMaterial color="#FFD7A3" transparent opacity={0.38} />
          </mesh>

          {/* Nguồn sáng PointLight vàng ấm 3000K dịu nhẹ ban đêm */}
          {darkMode && castLight && (
            <pointLight
              ref={lightRef}
              position={[0, 0.14, 0]}
              color="#FFD7A3"
              intensity={1.35}
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
