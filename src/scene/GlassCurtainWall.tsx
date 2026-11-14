import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { B } from './prims'
import { registerOccluderMesh } from './raycastRegistry'
import { useStore } from '../store'
import type { V3 } from '../data/config'

interface GlassCurtainWallProps {
  pos: V3
  size: [number, number] // [length, height]
  orientation?: 'z' | 'x' // 'z': along X axis (back wall), 'x': along Z axis (side walls)
  numPanels?: number
}

const glassMatCache: { light?: THREE.MeshStandardMaterial; dark?: THREE.MeshStandardMaterial } = {}
const streakMatCache: { light?: THREE.MeshBasicMaterial; dark?: THREE.MeshBasicMaterial } = {}
const STREAK_UNIT_PLANE = new THREE.PlaneGeometry(1, 1)
const noopRaycast = () => null

/** Vật liệu kính phản quang tối màu nhẹ (tinted architectural glass) MeshStandardMaterial tối ưu dùng chung */
export function getArchitecturalGlassMat(darkMode: boolean): THREE.MeshStandardMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!glassMatCache[key]) {
    glassMatCache[key] = new THREE.MeshStandardMaterial({
      color: darkMode ? '#1E2934' : '#283644',
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.8,
      envMapIntensity: darkMode ? 1.05 : 1.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }
  return glassMatCache[key]!
}

function getStreakMat(darkMode: boolean): THREE.MeshBasicMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!streakMatCache[key]) {
    streakMatCache[key] = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: darkMode ? 0.07 : 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }
  return streakMatCache[key]!
}

/**
 * Vách kính kiến trúc hiện đại (Modern Architectural Glass Curtain Wall)
 * Tạo độ tương phản sắc nét giữa kính phản quang tối màu + nẹp đen mờ #1E2229 với tường Travertine #F5F2EB,
 * đồng thời giữ độ xuyên thấu để ánh vàng nội thất hắt ấm qua kính.
 */
export function GlassCurtainWall({
  pos,
  size,
  orientation = 'z',
}: GlassCurtainWallProps) {
  const darkMode = useStore((s) => s.darkMode)
  const glassRef = useRef<THREE.Mesh>(null)
  const [L, H] = size
  const frameColor = '#1E2229'

  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])
  const streakMat = useMemo(() => getStreakMat(darkMode), [darkMode])

  useEffect(() => {
    const mesh = glassRef.current
    if (!mesh) return
    return registerOccluderMesh(mesh, 'glass')
  }, [])

  const isZ = orientation === 'z'

  return (
    <group>
      {/* 1. Tấm kính nguyên khối phẳng mịn liền mạch, đăng ký Occluder ('glass') */}
      <mesh ref={glassRef} position={[pos[0], pos[1], pos[2]]} material={glassMat}>
        <boxGeometry args={isZ ? [L, H, 0.025] : [0.025, H, L]} />
      </mesh>

      {/* Vệt phản quang ánh sáng mờ nhẹ chạy chéo trên mặt kính (không chặn raycast) */}
      <mesh
        position={[
          pos[0] + (isZ ? 0 : 0.018),
          pos[1] + H * 0.12,
          pos[2] + (isZ ? 0.018 : 0),
        ]}
        rotation={isZ ? [0, 0, -0.45] : [-0.45, Math.PI / 2, 0]}
        scale={[Math.min(L, H) * 0.95, H * 0.07, 1]}
        geometry={STREAK_UNIT_PLANE}
        material={streakMat}
        raycast={noopRaycast}
      />

      {/* 2. Khung nhôm đen mờ #1E2229 nẹp viền mỏng bao quanh 4 mép sàn/trần/tường (castShadow=false) */}
      <B
        p={[pos[0], pos[1] + H / 2 - 0.018, pos[2]]}
        s={isZ ? [L, 0.036, 0.045] : [0.045, 0.036, L]}
        c={frameColor}
        rough={0.26}
        metal={0.78}
        shadow={false}
      />
      <B
        p={[pos[0], pos[1] - H / 2 + 0.018, pos[2]]}
        s={isZ ? [L, 0.036, 0.045] : [0.045, 0.036, L]}
        c={frameColor}
        rough={0.26}
        metal={0.78}
        shadow={false}
      />
      <B
        p={isZ ? [pos[0] - L / 2 + 0.018, pos[1], pos[2]] : [pos[0], pos[1], pos[2] - L / 2 + 0.018]}
        s={isZ ? [0.036, H - 0.072, 0.045] : [0.045, H - 0.072, 0.036]}
        c={frameColor}
        rough={0.26}
        metal={0.78}
        shadow={false}
      />
      <B
        p={isZ ? [pos[0] + L / 2 - 0.018, pos[1], pos[2]] : [pos[0], pos[1], pos[2] + L / 2 - 0.018]}
        s={isZ ? [0.036, H - 0.072, 0.045] : [0.045, H - 0.072, 0.036]}
        c={frameColor}
        rough={0.26}
        metal={0.78}
        shadow={false}
      />
    </group>
  )
}
