import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, HIDDEN_MEMORIES_DATA } from '../store'
import { LIVE_ACTORS } from '../data/config'

type V3 = [number, number, number]

interface CollectibleItemProps {
  id: string
  position: V3
  rotation?: [number, number, number]
  children: React.ReactNode
}

function CollectibleItem({ id, position, rotation = [0, 0, 0], children }: CollectibleItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const isFound = useStore((s) => s.foundMemories.includes(id))

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (haloRef.current) {
      const s = 1 + Math.sin(t * 3.5 + position[0]) * 0.18
      haloRef.current.scale.setScalar(s)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    useStore.getState().collectMemory(id)
  }

  const mem = HIDDEN_MEMORIES_DATA[id]

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        useStore.getState().setHoverHint(isFound ? `✨ Đã thu thập: ${mem.title}` : `✨ Tìm thấy món đồ bí mật: ${mem.title}`)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }}
    >
      {/* Vầng sáng hào quang lấp lánh mời gọi */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshBasicMaterial
          color={isFound ? '#94a3b8' : '#fbbf24'}
          transparent
          opacity={isFound ? 0.25 : 0.65}
          wireframe
        />
      </mesh>
      {children}
    </group>
  )
}

/** 5 Ký ức ẩn giấu quanh 2 tầng nhà của Khoa & Bạn Gái */
export function MemoryCollectibles() {
  return (
    <group>
      {/* 1. Bức thư tay: Trên hộc tủ bàn làm việc Tầng 1 */}
      <CollectibleItem id="letter_desk" position={[-0.15, 0.74, -4.68]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <mesh>
          <planeGeometry args={[0.09, 0.06]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.6} />
        </mesh>
        {/* Nút sáp đỏ niêm phong thư */}
        <mesh position={[0, 0, 0.003]}>
          <circleGeometry args={[0.012, 16]} />
          <meshStandardMaterial color="#e11d48" roughness={0.3} />
        </mesh>
      </CollectibleItem>

      {/* 2. Chiếc chìa khóa bí mật: Giấu ở chậu cây ban công Tầng 2 */}
      <CollectibleItem id="key_plant" position={[4.85, 4.48, -0.22]} rotation={[0, 0.6, 0]}>
        <mesh>
          <cylinderGeometry args={[0.006, 0.006, 0.05, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <torusGeometry args={[0.014, 0.004, 8, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>
      </CollectibleItem>

      {/* 3. Chú gấu bông len mini: Góc gối giường Tầng 1 */}
      <CollectibleItem id="doll_bed" position={[-3.72, 0.72, -4.5]} rotation={[0, 0.5, 0]}>
        {/* Đầu & thân gấu */}
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#d97706" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.015, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#b45309" roughness={0.9} />
        </mesh>
        {/* 2 tai gấu */}
        <mesh position={[-0.024, 0.065, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh position={[0.024, 0.065, 0]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
      </CollectibleItem>

      {/* 4. Mảnh nhạc phổ: Cạnh phím đàn Piano Tầng 2 */}
      <CollectibleItem id="note_piano" position={[0.18, 4.35 + 0.86, -1.02]} rotation={[-0.25, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.08, 0.06]} />
          <meshStandardMaterial color="#fffbeb" roughness={0.7} />
        </mesh>
      </CollectibleItem>

      {/* 5. Hộp quà thắt nơ nhung đỏ: Kệ phòng tắm Tầng 1 */}
      <CollectibleItem id="gift_bath" position={[-11.2, 1.45, -4.75]}>
        <mesh>
          <boxGeometry args={[0.07, 0.07, 0.07]} />
          <meshStandardMaterial color="#059669" roughness={0.4} />
        </mesh>
        {/* Nơ ruy băng đỏ */}
        <mesh position={[0, 0.038, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} />
        </mesh>
      </CollectibleItem>
    </group>
  )
}

/** Quả bóng Tennis ném cho cún nhặt (Fetch Game) */
export function TennisBall() {
  const meshRef = useRef<THREE.Mesh>(null)
  const tennisBall = useStore((s) => s.tennisBall)
  const flightTimer = useRef(0)
  const originPos = useRef<V3>(tennisBall.pos)

  useFrame((_, dt) => {
    if (!meshRef.current) return
    const delta = Math.min(dt, 0.05)

    if (tennisBall.inFlight) {
      flightTimer.current += delta * 2.2
      const t = Math.min(1, flightTimer.current)
      // Đường cong parabol bay trong không gian
      const curX = THREE.MathUtils.lerp(originPos.current[0], tennisBall.targetPos[0], t)
      const curZ = THREE.MathUtils.lerp(originPos.current[2], tennisBall.targetPos[2], t)
      const arcH = Math.sin(t * Math.PI) * 1.6
      const curY = THREE.MathUtils.lerp(originPos.current[1], tennisBall.targetPos[1], t) + arcH

      meshRef.current.position.set(curX, curY, curZ)
      meshRef.current.rotation.x += delta * 12
      meshRef.current.rotation.z += delta * 14

      if (t >= 1) {
        // Bóng đã tiếp đất
        originPos.current = tennisBall.targetPos
        flightTimer.current = 0
        useStore.setState({
          tennisBall: {
            ...tennisBall,
            pos: tennisBall.targetPos,
            inFlight: false,
          },
        })

        // Kích hoạt cún chạy tới nhặt bóng
        const distMochi = Math.hypot(LIVE_ACTORS.dogs.mochi.pos[0] - tennisBall.targetPos[0], LIVE_ACTORS.dogs.mochi.pos[2] - tennisBall.targetPos[2])
        const distBo = Math.hypot(LIVE_ACTORS.dogs.bo.pos[0] - tennisBall.targetPos[0], LIVE_ACTORS.dogs.bo.pos[2] - tennisBall.targetPos[2])
        const chasingDog = distMochi < distBo ? 'mochi' : 'bo'

        useStore.getState().notify(`🐶 Bé ${chasingDog === 'mochi' ? 'Mochi' : 'Bơ'} chạy đi nhặt bóng!`)

        // Sau 3 giây bé cún tha bóng về chân người chơi
        setTimeout(() => {
          useStore.getState().retrieveTennisBall()
          originPos.current = [0.6, 0.05, 0.8]
          if (meshRef.current) meshRef.current.position.set(0.6, 0.05, 0.8)
        }, 3200)
      }
    } else {
      meshRef.current.position.set(tennisBall.pos[0], tennisBall.pos[1], tennisBall.pos[2])
    }
  })

  const handleThrow = (e: any) => {
    e.stopPropagation()
    if (tennisBall.inFlight) return
    originPos.current = [meshRef.current?.position.x || 0.6, 0.05, meshRef.current?.position.z || 0.8]
    // Ném bóng ngẫu nhiên ra sàn phòng khách
    const rx = -1.5 + Math.random() * 3.5
    const rz = 0.5 + Math.random() * 3.0
    useStore.getState().throwTennisBall([rx, 0.05, rz])
  }

  return (
    <mesh
      ref={meshRef}
      position={tennisBall.pos}
      castShadow
      onClick={handleThrow}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        useStore.getState().setHoverHint('🎾 Quả bóng Tennis của Mochi & Bo (Click để ném)')
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }}
    >
      <sphereGeometry args={[0.045, 16, 16]} />
      {/* Màu vàng dạ quang chuẩn bóng tennis có độ nhám nỉ */}
      <meshStandardMaterial color="#ccff00" roughness={0.85} emissive="#a3e635" emissiveIntensity={0.2} />
    </mesh>
  )
}
