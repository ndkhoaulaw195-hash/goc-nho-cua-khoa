import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { LIVE_ACTORS } from '../data/config'

type V3 = [number, number, number]

/* =========================================================================
   1. DRIVABLE VEHICLE: XE ROBOT HÚT BỤI TỐC ĐỘ CAO (WASD + NITRO + DRIFT)
   ========================================================================= */
export function DrivableVehicle() {
  const isDriving = useStore((s) => s.isDrivingVacuum)
  const setVacuumTransform = useStore((s) => s.setVacuumTransform)
  const addWantedStar = useStore((s) => s.addWantedStar)
  const stopDrivingVacuum = useStore((s) => s.stopDrivingVacuum)

  const groupRef = useRef<THREE.Group>(null)
  const nitroFlamesRef = useRef<THREE.Group>(null)

  // Vật lý xe
  const pos = useRef<V3>([-1.5, 0.05, 0.8])
  const yaw = useRef(0)
  const speed = useRef(0)
  const isNitro = useRef(false)
  const isDrifting = useRef(false)
  const keys = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true

      if (e.code === 'KeyF' && isDriving) {
        stopDrivingVacuum()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isDriving, stopDrivingVacuum])

  useFrame((_, dt) => {
    if (!groupRef.current) return
    const delta = Math.min(dt, 0.05)
    const kb = keys.current

    if (isDriving) {
      // 1. Nhận input điều khiển
      const forward = (kb.KeyW || kb.ArrowUp ? 1 : 0) - (kb.KeyS || kb.ArrowDown ? 1 : 0)
      const turn = (kb.KeyA || kb.ArrowLeft ? 1 : 0) - (kb.KeyD || kb.ArrowRight ? 1 : 0)
      isNitro.current = Boolean(kb.ShiftLeft || kb.ShiftRight)
      isDrifting.current = Boolean(kb.Space)

      // 2. Gia tốc & tốc độ tối đa
      const maxSpeed = isNitro.current ? 9.5 : 4.8
      const accel = isNitro.current ? 16.0 : 9.0
      const friction = isDrifting.current ? 0.94 : 0.86

      if (forward !== 0) {
        speed.current += forward * accel * delta
      } else {
        speed.current *= Math.pow(friction, delta * 60)
      }

      // Giới hạn tốc độ
      speed.current = THREE.MathUtils.clamp(speed.current, -maxSpeed * 0.45, maxSpeed)

      // 3. Đánh lái bẻ cua
      const turnFactor = isDrifting.current ? 3.4 : 2.5
      if (Math.abs(speed.current) > 0.1) {
        yaw.current += turn * turnFactor * delta * (speed.current > 0 ? 1 : -1)
      }

      // 4. Cập nhật vị trí
      pos.current[0] += Math.sin(yaw.current) * speed.current * delta
      pos.current[2] += Math.cos(yaw.current) * speed.current * delta

      // Giới hạn trong sàn nhà Tầng 1
      pos.current[0] = THREE.MathUtils.clamp(pos.current[0], -8.5, 7.8)
      pos.current[2] = THREE.MathUtils.clamp(pos.current[2], -5.2, 4.6)

      // 5. Kiểm tra va chạm quậy phá với chú cún hoặc đồ đạc
      if (Math.abs(speed.current) > 2.5) {
        const distMochi = Math.hypot(pos.current[0] - LIVE_ACTORS.dogs.mochi.pos[0], pos.current[2] - LIVE_ACTORS.dogs.mochi.pos[2])
        const distBo = Math.hypot(pos.current[0] - LIVE_ACTORS.dogs.bo.pos[0], pos.current[2] - LIVE_ACTORS.dogs.bo.pos[2])
        if (distMochi < 0.65 || distBo < 0.65) {
          addWantedStar(1)
          useStore.getState().notify('🚨 Tông trúng cún cưng! Cảnh cáo quậy phá!')
        }
      }

      // Đồng bộ thông số xe lên store
      setVacuumTransform([pos.current[0], pos.current[1], pos.current[2]], yaw.current, speed.current)

      // Đồng bộ vị trí nhân vật đang chọn đứng/ngồi trên xe
      const activeChar = useStore.getState().activeChar
      if (activeChar === 'boy') {
        LIVE_ACTORS.khoaPos = [pos.current[0], pos.current[2]]
        LIVE_ACTORS.khoaYaw = yaw.current
      } else {
        LIVE_ACTORS.girlPos = [pos.current[0], 0, pos.current[2]]
        LIVE_ACTORS.girlYaw = yaw.current
      }

      // Hiệu ứng ngọn lửa Nitro
      if (nitroFlamesRef.current) {
        nitroFlamesRef.current.visible = isNitro.current && Math.abs(speed.current) > 3.0
        if (nitroFlamesRef.current.visible) {
          nitroFlamesRef.current.scale.z = 0.8 + Math.random() * 0.6
        }
      }

      // Cập nhật vị trí & góc quay 3D
      groupRef.current.position.set(pos.current[0], pos.current[1], pos.current[2])
      groupRef.current.rotation.y = yaw.current
      // Nghiêng xe khi cua gấp
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -turn * 0.12, 0.2)
    } else {
      // Khi không có người lái: tự động hút bụi tuần tra nhẹ nhàng
      const t = performance.now() * 0.0006
      const autoX = Math.sin(t) * 2.8 - 0.5
      const autoZ = Math.cos(t * 1.3) * 2.2 + 0.2
      groupRef.current.position.set(autoX, 0.05, autoZ)
      groupRef.current.rotation.y = t * 1.5
      pos.current = [autoX, 0.05, autoZ]
    }
  })

  return (
    <group
      ref={groupRef}
      position={pos.current}
      onClick={(e) => {
        e.stopPropagation()
        if (!isDriving) useStore.getState().startDrivingVacuum()
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
        useStore.getState().setHoverHint('🏎️ Xe Robot Hút Bụi (Click để Lên xe đua quanh nhà!)')
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }}
    >
      {/* Thân xe Robot đĩa tròn bọc giáp carbon siêu ngầu */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.11, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Nắp capo viền LED Neon Xanh/Cam phát sáng */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.02, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive={isDriving ? '#0284c7' : '#0ea5e9'}
          emissiveIntensity={isDriving ? 2.5 : 1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Cảm biến Radar LiDAR xoay trên mui */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>

      {/* Đèn pha LED chiếu sáng đường đi phía trước */}
      <mesh position={[0.12, 0.01, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.12, 0.01, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Đèn hậu đỏ thể thao phía sau */}
      <mesh position={[0, 0.02, -0.34]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.32, 0.02, 0.01]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.0} />
      </mesh>

      {/* Ống xả phụt lửa Nitro Boost phía sau đuôi xe */}
      <group ref={nitroFlamesRef} position={[0, 0.02, -0.42]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.45, 12]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
          <coneGeometry args={[0.07, 0.35, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
        </mesh>
      </group>
    </group>
  )
}

/* =========================================================================
   2. HỆ THỐNG VŨ KHÍ GTA: SÚNG NƯỚC, GỐI ĐẬP, SÚNG NERF
   ========================================================================= */
export function GtaWeaponsAction() {
  const currentWeapon = useStore((s) => s.currentWeapon)
  const activeChar = useStore((s) => s.activeChar)
  const addWantedStar = useStore((s) => s.addWantedStar)

  const waterParticlesRef = useRef<THREE.Points>(null)
  const feathersRef = useRef<THREE.Points>(null)
  const isShooting = useRef(false)
  const shootTimer = useRef(0)

  // Vị trí hạt nước
  const waterCount = 80
  const [waterPos, waterVel] = useRef([
    new Float32Array(waterCount * 3),
    new Float32Array(waterCount * 3),
  ]).current

  // Vị trí lông vũ khi đập gối
  const featherCount = 60
  const [featherPos, featherVel] = useRef([
    new Float32Array(featherCount * 3),
    new Float32Array(featherCount * 3),
  ]).current

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // Chỉ kích hoạt khi click chuột trái và không bấm vào các UI modal
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('.cozy-modal-backdrop') || target.closest('.glass-dock') || target.closest('.weapon-wheel-overlay')) return

      if (currentWeapon === 'water_gun') {
        isShooting.current = true
        shootTimer.current = 0.6 // Bắn trong 0.6s
        // Bắn tia nước từ vị trí nhân vật
        const originX = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[0] : LIVE_ACTORS.girlPos[0]
        const originZ = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[1] : LIVE_ACTORS.girlPos[2]
        const yaw = activeChar === 'boy' ? LIVE_ACTORS.khoaYaw : LIVE_ACTORS.girlYaw

        for (let i = 0; i < waterCount; i++) {
          waterPos[i * 3] = originX + Math.sin(yaw) * 0.4
          waterPos[i * 3 + 1] = 1.15
          waterPos[i * 3 + 2] = originZ + Math.cos(yaw) * 0.4

          const spread = (Math.random() - 0.5) * 0.45
          const spd = 7.5 + Math.random() * 4.0
          waterVel[i * 3] = Math.sin(yaw + spread) * spd
          waterVel[i * 3 + 1] = 0.5 + Math.random() * 0.8
          waterVel[i * 3 + 2] = Math.cos(yaw + spread) * spd
        }

        addWantedStar(1)
        useStore.getState().notify('💦 Phụt nước trêu chọc! Tăng sao truy nã ⭐!')
      } else if (currentWeapon === 'pillow') {
        // Đập gối bôm bốp: nổ tung chùm lông vũ trắng
        const originX = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[0] : LIVE_ACTORS.girlPos[0]
        const originZ = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[1] : LIVE_ACTORS.girlPos[2]

        for (let i = 0; i < featherCount; i++) {
          featherPos[i * 3] = originX + (Math.random() - 0.5) * 0.6
          featherPos[i * 3 + 1] = 1.1 + Math.random() * 0.4
          featherPos[i * 3 + 2] = originZ + (Math.random() - 0.5) * 0.6

          featherVel[i * 3] = (Math.random() - 0.5) * 3.5
          featherVel[i * 3 + 1] = 1.5 + Math.random() * 2.0
          featherVel[i * 3 + 2] = (Math.random() - 0.5) * 3.5
        }

        addWantedStar(1)
        useStore.getState().notify('🥊 ĐẬP GỐI BÔM BỐP! Lông vũ bay tung tóe!')
      }
    }

    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [currentWeapon, activeChar, addWantedStar, waterPos, waterVel, featherPos, featherVel])

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05)

    // Cập nhật hạt nước bay
    if (waterParticlesRef.current) {
      const posAttr = waterParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array

      for (let i = 0; i < waterCount; i++) {
        arr[i * 3] += waterVel[i * 3] * delta
        arr[i * 3 + 1] += waterVel[i * 3 + 1] * delta
        waterVel[i * 3 + 1] -= 9.8 * delta // Trọng lực nước rơi
        arr[i * 3 + 2] += waterVel[i * 3 + 2] * delta

        if (arr[i * 3 + 1] < 0.02) {
          arr[i * 3 + 1] = -5 // Ẩn xuống dưới sàn
        }
      }
      posAttr.needsUpdate = true
    }

    // Cập nhật lông vũ rơi lơ lửng
    if (feathersRef.current) {
      const posAttr = feathersRef.current.geometry.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array

      for (let i = 0; i < featherCount; i++) {
        arr[i * 3] += featherVel[i * 3] * delta
        arr[i * 3 + 1] += featherVel[i * 3 + 1] * delta
        featherVel[i * 3 + 1] -= 1.8 * delta // Rơi chậm nhẹ nhàng
        arr[i * 3 + 2] += featherVel[i * 3 + 2] * delta

        if (arr[i * 3 + 1] < 0.05) {
          arr[i * 3 + 1] = 0.05
          featherVel[i * 3] = 0
          featherVel[i * 3 + 2] = 0
        }
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Tia nước Super Soaker */}
      <points ref={waterParticlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[waterPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#38bdf8" size={0.06} transparent opacity={0.8} />
      </points>

      {/* Chùm lông vũ bay khi đập gối */}
      <points ref={feathersRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[featherPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.09} transparent opacity={0.9} />
      </points>
    </group>
  )
}

/* =========================================================================
   3. POLICE CHASE AI & KÍCH HOẠT WASTED
   ========================================================================= */
export function PoliceChaseManager() {
  const wantedStars = useStore((s) => s.wantedStars)
  const isWasted = useStore((s) => s.isWasted)
  const triggerWasted = useStore((s) => s.triggerWasted)
  const activeChar = useStore((s) => s.activeChar)

  useFrame(() => {
    // Chỉ kích hoạt rượt đuổi khi có từ 3 sao truy nã trở lên và chưa bị WASTED
    if (wantedStars < 3 || isWasted) return

    const playerX = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[0] : LIVE_ACTORS.girlPos[0]
    const playerZ = activeChar === 'boy' ? LIVE_ACTORS.khoaPos[1] : LIVE_ACTORS.girlPos[2]

    // Khoảng cách tới 2 bé cún (đang hóa thân thành cảnh sát hình sự)
    const distMochi = Math.hypot(LIVE_ACTORS.dogs.mochi.pos[0] - playerX, LIVE_ACTORS.dogs.mochi.pos[2] - playerZ)
    const distBo = Math.hypot(LIVE_ACTORS.dogs.bo.pos[0] - playerX, LIVE_ACTORS.dogs.bo.pos[2] - playerZ)

    // Nếu bị áp sát trong cự ly < 0.6m -> BỊ BẮT (WASTED)
    if (distMochi < 0.55 || distBo < 0.55) {
      triggerWasted('BỊ CẢNH SÁT CÚN TÓM GỌN')
    }
  })

  return null
}
