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

/**
 * Vách kính kiến trúc hiện đại (Modern Architectural Glass Curtain Wall)
 * Hiển thị thay thế khi các bức tường được cắt lát khi xoay camera,
 * tạo hiệu ứng vách kính phản quang sang trọng cho người ngoài nhìn vào nhà không bị trống trải.
 */
export function GlassCurtainWall({
  pos,
  size,
  orientation = 'z',
  numPanels = 4,
}: GlassCurtainWallProps) {
  const darkMode = useStore((s) => s.darkMode)
  const [L, H] = size
  const frameColor = darkMode ? '#181b20' : '#232830'
  const transomY = pos[1] - H / 2 + H * 0.42

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: darkMode ? '#1e2b3a' : '#d2e9f8',
        transparent: true,
        opacity: darkMode ? 0.32 : 0.22,
        roughness: 0.08,
        metalness: 0.18,
        depthWrite: false,
      }),
    [darkMode],
  )

  const isZ = orientation === 'z'

  return (
    <group>
      {/* 1. Tấm kính phản chiếu trong suốt phủ toàn bộ diện tích vách */}
      <mesh position={[pos[0], pos[1], pos[2]]} material={glassMat}>
        <boxGeometry args={isZ ? [L, H, 0.02] : [0.02, H, L]} />
      </mesh>

      {/* 2. Khung nhôm định hình viền trên và dưới */}
      <B
        p={[pos[0], pos[1] + H / 2 - 0.025, pos[2]]}
        s={isZ ? [L, 0.05, 0.06] : [0.06, 0.05, L]}
        c={frameColor}
        rough={0.35}
        metal={0.8}
        shadow={false}
      />
      <B
        p={[pos[0], pos[1] - H / 2 + 0.025, pos[2]]}
        s={isZ ? [L, 0.05, 0.06] : [0.06, 0.05, L]}
        c={frameColor}
        rough={0.35}
        metal={0.8}
        shadow={false}
      />

      {/* 3. Khung viền 2 bên sườn */}
      <B
        p={isZ ? [pos[0] - L / 2 + 0.025, pos[1], pos[2]] : [pos[0], pos[1], pos[2] - L / 2 + 0.025]}
        s={isZ ? [0.05, H, 0.06] : [0.06, H, 0.05]}
        c={frameColor}
        rough={0.35}
        metal={0.8}
        shadow={false}
      />
      <B
        p={isZ ? [pos[0] + L / 2 - 0.025, pos[1], pos[2]] : [pos[0], pos[1], pos[2] + L / 2 - 0.025]}
        s={isZ ? [0.05, H, 0.06] : [0.06, H, 0.05]}
        c={frameColor}
        rough={0.35}
        metal={0.8}
        shadow={false}
      />

      {/* 4. Thanh giằng ngang phân vị (Transom rail) ngang tầm ngực / ban công */}
      <B
        p={[pos[0], transomY, pos[2]]}
        s={isZ ? [L, 0.04, 0.055] : [0.055, 0.04, L]}
        c={frameColor}
        rough={0.35}
        metal={0.8}
        shadow={false}
      />

      {/* 5. Hệ đố nhôm đứng (Vertical Mullions) chia đều các khoang vách kính */}
      {Array.from({ length: numPanels - 1 }, (_, i) => {
        const offset = -L / 2 + ((i + 1) / numPanels) * L
        const px = isZ ? pos[0] + offset : pos[0]
        const pz = isZ ? pos[2] : pos[2] + offset
        return (
          <B
            key={i}
            p={[px, pos[1], pz]}
            s={isZ ? [0.035, H, 0.05] : [0.05, H, 0.035]}
            c={frameColor}
            rough={0.35}
            metal={0.8}
            shadow={false}
          />
        )
      })}
    </group>
  )
}
