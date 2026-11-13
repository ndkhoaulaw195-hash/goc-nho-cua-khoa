import { useMemo } from 'react'
import * as THREE from 'three'
import { B } from './prims'
import { useStore } from '../store'
import type { V3 } from '../data/config'

interface GlassCurtainWallProps {
  pos: V3
  size: [number, number] // [length, height]
  orientation?: 'z' | 'x' // 'z': along X axis (back wall), 'x': along Z axis (side walls)
  numPanels?: number
}

const glassMatCache: { light?: THREE.MeshPhysicalMaterial; dark?: THREE.MeshPhysicalMaterial } = {}

/** Vật liệu kính phản quang tối màu nhẹ (tinted architectural glass) PBR dùng chung */
export function getArchitecturalGlassMat(darkMode: boolean): THREE.MeshPhysicalMaterial {
  const key = darkMode ? 'dark' : 'light'
  if (!glassMatCache[key]) {
    glassMatCache[key] = new THREE.MeshPhysicalMaterial({
      color: darkMode ? '#222E3A' : '#2E3D4B',
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      ior: 1.5,
      reflectivity: 0.9,
      envMapIntensity: 1.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }
  return glassMatCache[key]!
}

/**
 * Vách kính kiến trúc hiện đại (Modern Architectural Glass Curtain Wall)
 * Hiển thị thay thế khi các bức tường được cắt lát khi xoay camera,
 * tạo hiệu ứng vách kính phản quang sang trọng cho người ngoài nhìn vào nhà không bị trống trải.
 */
export function GlassCurtainWall({
  pos,
  size,
  orientation = 'z',
}: GlassCurtainWallProps) {
  const darkMode = useStore((s) => s.darkMode)
  const [L, H] = size
  const frameColor = darkMode ? '#1F2123' : '#2B2D2F'

  const glassMat = useMemo(() => getArchitecturalGlassMat(darkMode), [darkMode])

  const isZ = orientation === 'z'

  return (
    <group>
      {/* 1. Tấm kính nguyên khối phẳng mịn liền mạch, không chia ô, nhìn thấu rõ nội thất bên trong */}
      <mesh position={[pos[0], pos[1], pos[2]]} material={glassMat}>
        <boxGeometry args={isZ ? [L, H, 0.025] : [0.025, H, L]} />
      </mesh>

      {/* Vệt phản quang ánh sáng mờ nhẹ chạy chéo trên mặt kính tạo cảm giác mặt kính thật */}
      <mesh
        position={[
          pos[0] + (isZ ? 0 : 0.018),
          pos[1] + H * 0.12,
          pos[2] + (isZ ? 0.018 : 0),
        ]}
        rotation={isZ ? [0, 0, -0.45] : [-0.45, Math.PI / 2, 0]}
      >
        <planeGeometry args={[Math.min(L, H) * 0.95, H * 0.07]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={darkMode ? 0.07 : 0.11}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Khung nhôm nẹp viền mỏng bao quanh 4 mép sàn/trần/tường (không chia ô bên trong) */}
      {/* Nẹp trên */}
      <B
        p={[pos[0], pos[1] + H / 2 - 0.018, pos[2]]}
        s={isZ ? [L, 0.036, 0.045] : [0.045, 0.036, L]}
        c={frameColor}
        rough={0.18}
        metal={0.85}
        shadow={false}
      />
      {/* Nẹp dưới */}
      <B
        p={[pos[0], pos[1] - H / 2 + 0.018, pos[2]]}
        s={isZ ? [L, 0.036, 0.045] : [0.045, 0.036, L]}
        c={frameColor}
        rough={0.18}
        metal={0.85}
        shadow={false}
      />
      {/* Nẹp cạnh trái */}
      <B
        p={isZ ? [pos[0] - L / 2 + 0.018, pos[1], pos[2]] : [pos[0], pos[1], pos[2] - L / 2 + 0.018]}
        s={isZ ? [0.036, H, 0.045] : [0.045, H, 0.036]}
        c={frameColor}
        rough={0.18}
        metal={0.85}
        shadow={false}
      />
      {/* Nẹp cạnh phải */}
      <B
        p={isZ ? [pos[0] + L / 2 - 0.018, pos[1], pos[2]] : [pos[0], pos[1], pos[2] + L / 2 - 0.018]}
        s={isZ ? [0.036, H, 0.045] : [0.045, H, 0.036]}
        c={frameColor}
        rough={0.18}
        metal={0.85}
        shadow={false}
      />
    </group>
  )
}
