import { useMemo } from 'react'
import * as THREE from 'three'
import { B, Cyl, G, Sph } from './prims'
import type { V3 } from '../data/config'

const FOLIAGE_ICO = new THREE.IcosahedronGeometry(1, 1)

/** Cây xanh kiến trúc tán đa tầng bất đối xứng (2-3 sắc độ xanh + cụm khối đa giác hữu cơ) */
export function ArchitecturalTree({
  pos,
  scale = 1,
  rotationY = 0,
  darkMode,
  uplight = false,
}: {
  pos: V3
  scale?: number
  rotationY?: number
  darkMode: boolean
  uplight?: boolean
}) {
  const leafDark = darkMode ? '#2F402A' : '#3E5637'
  const leafMid = darkMode ? '#3D5236' : '#566E4C'
  const leafLight = darkMode ? '#4F6947' : '#6F8763'
  const bark = darkMode ? '#4A3B2E' : '#5C4938'

  const matDark = useMemo(() => new THREE.MeshStandardMaterial({ color: leafDark, roughness: 0.82, flatShading: true }), [leafDark])
  const matMid = useMemo(() => new THREE.MeshStandardMaterial({ color: leafMid, roughness: 0.78, flatShading: true }), [leafMid])
  const matLight = useMemo(() => new THREE.MeshStandardMaterial({ color: leafLight, roughness: 0.75, flatShading: true }), [leafLight])

  const clusters: { p: V3; s: V3; r: V3; mat: THREE.Material }[] = [
    // Tầng tán thấp lệch trái-trước
    { p: [-0.72, 2.38, 0.36], s: [0.92, 0.56, 0.85], r: [0.1, 0.4, -0.15], mat: matDark },
    { p: [0.68, 2.52, -0.34], s: [0.88, 0.54, 0.82], r: [-0.1, 1.1, 0.12], mat: matDark },
    { p: [0.12, 2.68, 0.62], s: [0.76, 0.5, 0.74], r: [0.15, 0.8, 0.08], mat: matMid },
    // Tầng tán chính giữa lệch phải-sau
    { p: [-0.22, 3.02, -0.24], s: [1.12, 0.68, 1.05], r: [0.05, 0.2, 0.1], mat: matMid },
    { p: [0.52, 3.12, 0.22], s: [0.86, 0.56, 0.84], r: [-0.08, 1.7, -0.05], mat: matLight },
    { p: [-0.66, 2.95, -0.28], s: [0.72, 0.48, 0.72], r: [0.12, 2.2, 0.15], mat: matMid },
    // Tầng ngọn cao vươn sáng bất đối xứng
    { p: [0.06, 3.68, 0.05], s: [0.82, 0.52, 0.78], r: [0.08, 0.9, -0.08], mat: matLight },
    { p: [0.34, 3.48, -0.22], s: [0.58, 0.42, 0.56], r: [-0.12, 1.4, 0.1], mat: matLight },
  ]

  return (
    <G p={pos} r={[0, rotationY, 0]} s={scale}>
      {/* Bệ đất gốc cây & cụm sỏi bảo vệ */}
      <Cyl p={[0, 0.04, 0]} rt={0.44} rb={0.48} h={0.08} c={darkMode ? '#2B2D2F' : '#3E4249'} rough={0.85} />
      <Cyl p={[0, 0.09, 0]} rt={0.36} rb={0.4} h={0.03} c="#3D342C" rough={0.95} />

      {/* Thân cây chính uốn nhẹ + 3 nhánh vươn đa hướng */}
      <Cyl p={[0, 1.15, 0]} r={[0.04, 0, -0.06]} rt={0.14} rb={0.23} h={2.3} c={bark} rough={0.88} shadow />
      <Cyl p={[-0.36, 2.02, 0.18]} r={[0.24, 0, 0.52]} rt={0.065} rb={0.11} h={1.08} c={bark} rough={0.88} shadow />
      <Cyl p={[0.38, 2.15, -0.16]} r={[-0.22, 0, -0.5]} rt={0.065} rb={0.11} h={1.12} c={bark} rough={0.88} shadow />
      <Cyl p={[0.08, 2.45, 0.25]} r={[0.36, 0.2, -0.12]} rt={0.05} rb={0.085} h={0.85} c={bark} rough={0.88} />

      {/* Cụm tán lá đa giác bất đối xứng 3 sắc độ xanh */}
      {clusters.map((cl, i) => (
        <mesh
          key={i}
          position={cl.p}
          rotation={cl.r}
          scale={cl.s}
          geometry={FOLIAGE_ICO}
          material={cl.mat}
          castShadow
          receiveShadow
        />
      ))}

      {/* Đèn hắt gốc cây (Tree Uplight) chiếu ngược vào tán lá vào ban đêm */}
      {uplight && (
        <G p={[0.42, 0.06, 0.42]}>
          <Cyl rt={0.075} rb={0.085} h={0.06} c="#1E2024" metal={0.6} rough={0.35} />
          <Cyl
            p={[0, 0.032, 0]}
            rt={0.055}
            rb={0.055}
            h={0.014}
            c={darkMode ? '#FFD7A3' : '#DCD8CF'}
            emissive="#FFD7A3"
            ei={darkMode ? 2.4 : 0.05}
          />
          {darkMode && (
            <pointLight
              position={[0, 0.65, 0]}
              intensity={1.55}
              distance={4.8}
              decay={2}
              color="#FFE2B8"
              castShadow={false}
            />
          )}
        </G>
      )}
    </G>
  )
}

/** Hàng bụi cây cắt tỉa sát chân tường / bồn cây cảnh quan */
export function HedgeRow({
  pos,
  length,
  orientation = 'x',
  height = 0.56,
  darkMode,
}: {
  pos: V3
  length: number
  orientation?: 'x' | 'z'
  height?: number
  darkMode: boolean
}) {
  const c1 = darkMode ? '#33462E' : '#4E6545'
  const c2 = darkMode ? '#3F5537' : '#5E7753'
  const c3 = darkMode ? '#4C6443' : '#6F8763'
  const count = Math.max(3, Math.round(length / 0.68))
  const isX = orientation === 'x'

  return (
    <group position={pos}>
      {/* Lõi bụi cây cắt tỉa gọn gàng làm nền khối xanh liên tục */}
      <B
        p={[0, height * 0.44, 0]}
        s={isX ? [length - 0.15, height * 0.72, 0.48] : [0.48, height * 0.72, length - 0.15]}
        c={c1}
        rough={0.86}
        shadow
      />
      {/* Các cụm lá nổi tạo nhịp điệu tự nhiên */}
      {Array.from({ length: count }, (_, i) => {
        const offset = -length / 2 + 0.34 + (i / Math.max(1, count - 1)) * (length - 0.68)
        const sx = 0.28 + ((i * 7) % 3) * 0.045
        const sy = height * (0.42 + ((i * 3) % 3) * 0.07)
        const sz = 0.26 + ((i * 5) % 3) * 0.04
        const tint = i % 3 === 0 ? c3 : i % 2 === 0 ? c2 : c1
        return (
          <Sph
            key={i}
            p={isX ? [offset, height * 0.58 + (i % 2) * 0.05, (i % 2 ? 0.04 : -0.04)] : [(i % 2 ? 0.04 : -0.04), height * 0.58 + (i % 2) * 0.05, offset]}
            s={[sx, sy, sz]}
            c={tint}
            rough={0.8}
            shadow
          />
        )
      })}
    </group>
  )
}

/** Chậu cây Ô-liu / Bàng cảnh vuông cao cấp cho Sân thượng & Sảnh ngoài trời */
export function PottedVillaTree({ pos, scale = 1, darkMode }: { pos: V3; scale?: number; darkMode: boolean }) {
  const leafMid = darkMode ? '#405639' : '#566E4C'
  const leafLight = darkMode ? '#526B49' : '#6F8763'
  const matMid = useMemo(() => new THREE.MeshStandardMaterial({ color: leafMid, roughness: 0.78, flatShading: true }), [leafMid])
  const matLight = useMemo(() => new THREE.MeshStandardMaterial({ color: leafLight, roughness: 0.74, flatShading: true }), [leafLight])

  return (
    <G p={pos} s={scale}>
      <B p={[0, 0.24, 0]} s={[0.56, 0.48, 0.56]} c="#2B303A" rough={0.55} shadow />
      <B p={[0, 0.485, 0]} s={[0.5, 0.03, 0.5]} c="#4A3F35" rough={0.92} />
      <Cyl p={[0, 0.92, 0]} rt={0.045} rb={0.065} h={0.88} c="#5C4938" rough={0.86} shadow />
      <Cyl p={[-0.14, 1.18, 0.08]} r={[0.25, 0, 0.45]} rt={0.025} rb={0.038} h={0.42} c="#5C4938" rough={0.86} />
      <mesh position={[0, 1.48, 0]} scale={[0.42, 0.34, 0.42]} geometry={FOLIAGE_ICO} material={matMid} castShadow receiveShadow />
      <mesh position={[-0.22, 1.36, 0.14]} scale={[0.28, 0.24, 0.28]} geometry={FOLIAGE_ICO} material={matLight} castShadow receiveShadow />
      <mesh position={[0.18, 1.62, -0.08]} scale={[0.3, 0.26, 0.3]} geometry={FOLIAGE_ICO} material={matLight} castShadow receiveShadow />
    </G>
  )
}
