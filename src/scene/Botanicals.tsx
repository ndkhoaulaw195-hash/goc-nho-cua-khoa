import { useMemo } from 'react'
import * as THREE from 'three'
import { B, Cyl, G, Sph } from './prims'
import type { V3 } from '../data/config'

const FOLIAGE_ICO = new THREE.IcosahedronGeometry(1, 1)
const FOLIAGE_ICO_CRISP = new THREE.IcosahedronGeometry(1, 0)
const ROCK_DODEC = new THREE.DodecahedronGeometry(1, 0)
const GRASS_BLADE = new THREE.ConeGeometry(0.028, 1, 4)

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
            c="#FFAE52"
            emissive="#FFAE52"
            ei={darkMode ? 2.6 : 1.65}
          />
          <pointLight
            position={[0, 0.65, 0]}
            intensity={darkMode ? 1.55 : 0.75}
            distance={4.8}
            decay={2}
            color="#FFAE52"
            castShadow={false}
          />
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

/** Cụm cây cảnh tự nhiên bất đối xứng: cây lá xòe, bụi cây nhiều tầng, bụi cỏ dài & đá tảng cảnh quan */
export function NaturalPlantCluster({
  pos,
  scale = 1,
  rotationY = 0,
  variant = 0,
  darkMode,
  showBoulders = true,
}: {
  pos: V3
  scale?: number
  rotationY?: number
  variant?: number
  darkMode: boolean
  showBoulders?: boolean
}) {
  const leafDeep = darkMode ? '#293D26' : '#385233'
  const leafMid = darkMode ? '#395234' : '#4D6D44'
  const leafBright = darkMode ? '#4E6B42' : '#668757'
  const leafBroad = darkMode ? '#3E5E39' : '#537A48'
  const grassTone = darkMode ? '#526537' : '#748B4B'
  const rockMain = darkMode ? '#5C5B57' : '#85827C'
  const rockLight = darkMode ? '#6D6B66' : '#9A968F'

  const matDeep = useMemo(() => new THREE.MeshStandardMaterial({ color: leafDeep, roughness: 0.84, flatShading: true }), [leafDeep])
  const matMid = useMemo(() => new THREE.MeshStandardMaterial({ color: leafMid, roughness: 0.8, flatShading: true }), [leafMid])
  const matBright = useMemo(() => new THREE.MeshStandardMaterial({ color: leafBright, roughness: 0.76, flatShading: true }), [leafBright])
  const matBroad = useMemo(() => new THREE.MeshStandardMaterial({ color: leafBroad, roughness: 0.68, flatShading: true }), [leafBroad])
  const matGrass = useMemo(() => new THREE.MeshStandardMaterial({ color: grassTone, roughness: 0.78 }), [grassTone])
  const matRockA = useMemo(() => new THREE.MeshStandardMaterial({ color: rockMain, roughness: 0.92, flatShading: true }), [rockMain])
  const matRockB = useMemo(() => new THREE.MeshStandardMaterial({ color: rockLight, roughness: 0.9, flatShading: true }), [rockLight])

  const flip = variant % 2 === 0 ? 1 : -1
  const twist = ((variant % 5) - 2) * 0.24

  // Bụi cây nhiều tầng cao thấp bất đối xứng (dùng đa diện kéo dãn, KHÔNG hình cầu đều)
  const shrubTiers: { p: V3; s: V3; r: V3; mat: THREE.Material; crisp?: boolean }[] = [
    { p: [-0.26 * flip, 0.16, 0.14], s: [0.36, 0.18, 0.28], r: [0.12, 0.4 + twist, -0.15], mat: matDeep },
    { p: [0.22 * flip, 0.21, -0.16], s: [0.32, 0.22, 0.26], r: [-0.1, 1.3 + twist, 0.14], mat: matMid, crisp: true },
    { p: [0.04 * flip, 0.3, 0.08], s: [0.29, 0.26, 0.24], r: [0.15, 0.9, -0.08], mat: matMid },
    { p: [-0.14 * flip, 0.42, -0.08], s: [0.22, 0.24, 0.21], r: [-0.18, 1.9 + twist, 0.12], mat: matBright, crisp: true },
    { p: [0.34 * flip, 0.12, 0.19], s: [0.24, 0.13, 0.22], r: [0.08, 2.4, 0.06], mat: matBright },
  ]

  // Tán lá xòe (Bird of Paradise / Tropical Broad-leaf) lệch tâm tự nhiên
  const broadLeaves: { yaw: number; pitch: number; roll: number; len: number; y: number }[] = [
    { yaw: 0.25 * flip, pitch: 0.45, roll: 0.12, len: 0.48, y: 0.34 },
    { yaw: 1.15 * flip, pitch: 0.68, roll: -0.18, len: 0.44, y: 0.38 },
    { yaw: -0.75 * flip, pitch: 0.56, roll: 0.22, len: 0.46, y: 0.42 },
    { yaw: 2.25 * flip, pitch: 0.72, roll: -0.1, len: 0.4, y: 0.36 },
    { yaw: -1.95 * flip, pitch: 0.48, roll: 0.14, len: 0.5, y: 0.46 },
    { yaw: 3.05 * flip, pitch: 0.62, roll: -0.15, len: 0.38, y: 0.32 },
  ]

  // Cụm lá cỏ dài mảnh vươn nghiêng bất đối xứng
  const grassTufts: { p: V3; h: number; rx: number; rz: number }[] = [
    { p: [-0.36 * flip, 0, -0.05], h: 0.48, rx: 0.22, rz: 0.38 * flip },
    { p: [-0.31 * flip, 0, 0.04], h: 0.42, rx: -0.28, rz: 0.26 * flip },
    { p: [-0.4 * flip, 0, 0.02], h: 0.36, rx: 0.14, rz: 0.52 * flip },
    { p: [0.28 * flip, 0, 0.25], h: 0.44, rx: 0.34, rz: -0.22 * flip },
    { p: [0.33 * flip, 0, 0.19], h: 0.37, rx: 0.18, rz: -0.42 * flip },
    { p: [0.23 * flip, 0, 0.29], h: 0.32, rx: 0.45, rz: -0.12 * flip },
  ]

  return (
    <G p={pos} r={[0, rotationY + twist, 0]} s={scale}>
      {/* Bụi cây nhiều tầng không đối xứng */}
      {shrubTiers.map((tier, idx) => (
        <mesh
          key={`shrub-${idx}`}
          position={tier.p}
          rotation={tier.r}
          scale={tier.s}
          geometry={tier.crisp ? FOLIAGE_ICO_CRISP : FOLIAGE_ICO}
          material={tier.mat}
          castShadow
          receiveShadow
        />
      ))}

      {/* Cây lá xòe nhiệt đới lệch tâm */}
      <G p={[-0.12 * flip, 0, -0.06]}>
        {broadLeaves.map((leaf, idx) => (
          <G key={`leaf-${idx}`} p={[0, leaf.y, 0]} r={[0, leaf.yaw, 0]}>
            <Cyl p={[0, -0.14, 0.04]} r={[0.25, 0, 0]} rt={0.012} rb={0.02} h={0.34} c={leafDeep} rough={0.85} />
            <G r={[leaf.pitch, 0, leaf.roll]}>
              <mesh
                position={[0, 0, leaf.len * 0.55]}
                scale={[0.11, 0.02, leaf.len]}
                geometry={FOLIAGE_ICO}
                material={matBroad}
                castShadow
                receiveShadow
              />
            </G>
          </G>
        ))}
      </G>

      {/* Bụi cỏ dài mảnh */}
      {grassTufts.map((blade, idx) => (
        <mesh
          key={`grass-${idx}`}
          position={[blade.p[0], blade.h * 0.44, blade.p[2]]}
          rotation={[blade.rx, idx * 0.7, blade.rz]}
          scale={[1, blade.h, 1]}
          geometry={GRASS_BLADE}
          material={matGrass}
          castShadow
        />
      ))}

      {/* Khối đá tảng cảnh quan nhỏ tự nhiên xám ấm */}
      {showBoulders && (
        <>
          <mesh
            position={[0.14 * flip, 0.08, 0.22]}
            rotation={[0.35, 0.8 + twist, -0.25]}
            scale={[0.21, 0.13, 0.17]}
            geometry={ROCK_DODEC}
            material={matRockA}
            castShadow
            receiveShadow
          />
          <mesh
            position={[-0.18 * flip, 0.06, 0.25]}
            rotation={[-0.22, 1.9, 0.4]}
            scale={[0.14, 0.095, 0.12]}
            geometry={FOLIAGE_ICO_CRISP}
            material={matRockB}
            castShadow
            receiveShadow
          />
          <mesh
            position={[0.33 * flip, 0.045, 0.04]}
            rotation={[0.5, 0.3, 0.2]}
            scale={[0.1, 0.07, 0.09]}
            geometry={ROCK_DODEC}
            material={matRockB}
            castShadow
            receiveShadow
          />
        </>
      )}
    </G>
  )
}

/** Chậu cây Ô-liu / Bàng cảnh vuông Travertine chân đen mờ cho Sân thượng & Sảnh ngoài trời */
export function PottedVillaTree({ pos, scale = 1, darkMode }: { pos: V3; scale?: number; darkMode: boolean }) {
  const leafMid = darkMode ? '#405639' : '#566E4C'
  const leafLight = darkMode ? '#526B49' : '#6F8763'
  const travertine = darkMode ? '#EBE6DC' : '#F5F2EB'
  const matMid = useMemo(() => new THREE.MeshStandardMaterial({ color: leafMid, roughness: 0.78, flatShading: true }), [leafMid])
  const matLight = useMemo(() => new THREE.MeshStandardMaterial({ color: leafLight, roughness: 0.74, flatShading: true }), [leafLight])

  return (
    <G p={pos} s={scale}>
      {/* Chân đế đen mờ & thân chậu đá Travertine trắng kem sang trọng */}
      <B p={[0, 0.035, 0]} s={[0.48, 0.07, 0.48]} c="#1E2229" rough={0.55} metal={0.25} shadow />
      <B p={[0, 0.285, 0]} s={[0.58, 0.43, 0.58]} c={travertine} rough={0.4} shadow />
      <B p={[0, 0.505, 0]} s={[0.6, 0.025, 0.6]} c="#1E2229" rough={0.55} metal={0.25} />
      <B p={[0, 0.52, 0]} s={[0.5, 0.02, 0.5]} c="#4A3F35" rough={0.92} />
      <Cyl p={[0, 0.94, 0]} rt={0.045} rb={0.065} h={0.86} c="#5C4938" rough={0.86} shadow />
      <Cyl p={[-0.14, 1.2, 0.08]} r={[0.25, 0, 0.45]} rt={0.025} rb={0.038} h={0.42} c="#5C4938" rough={0.86} />
      <mesh position={[0, 1.5, 0]} scale={[0.42, 0.34, 0.42]} geometry={FOLIAGE_ICO} material={matMid} castShadow receiveShadow />
      <mesh position={[-0.22, 1.38, 0.14]} scale={[0.28, 0.24, 0.28]} geometry={FOLIAGE_ICO} material={matLight} castShadow receiveShadow />
      <mesh position={[0.18, 1.64, -0.08]} scale={[0.3, 0.26, 0.3]} geometry={FOLIAGE_ICO} material={matLight} castShadow receiveShadow />
    </G>
  )
}
