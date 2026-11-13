import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { B, Cyl, G } from './prims'
import type { V3 } from '../data/config'

const FOLIAGE_ICO = new THREE.IcosahedronGeometry(1, 1)
const ROCK_DODEC = new THREE.DodecahedronGeometry(1, 0)
const GRASS_BLADE = new THREE.ConeGeometry(0.028, 1, 4)
const STEM_CYL = new THREE.CylinderGeometry(0.012, 0.02, 0.34, 6)
const HEDGE_SPHERE = new THREE.SphereGeometry(1, 14, 10)

// Pool vật liệu dùng chung cấp module (tránh khởi tạo MeshStandardMaterial trong component/loop)
const botanicalMatPool = new Map<string, THREE.MeshStandardMaterial>()
function getBotanicalMat(color: string, roughness: number, flatShading = true): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness.toFixed(2)}_${flatShading ? 1 : 0}`
  let mat = botanicalMatPool.get(key)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color, roughness, flatShading })
    botanicalMatPool.set(key, mat)
  }
  return mat
}

const INST_FOLIAGE_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, flatShading: true })
const INST_HEDGE_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 })
const INST_ROCK_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.91, flatShading: true })
const INST_GRASS_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78 })
const INST_STEM_MAT = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 })

const _tmpColor = new THREE.Color()
const _obj0 = new THREE.Object3D()
const _obj1 = new THREE.Object3D()
const _obj2 = new THREE.Object3D()
const _obj3 = new THREE.Object3D()
const _mat4A = new THREE.Matrix4()
const _mat4B = new THREE.Matrix4()

const TREE_CLUSTERS: { p: V3; s: V3; r: V3; tone: 'dark' | 'mid' | 'light' }[] = [
  // Tầng tán thấp lệch trái-trước
  { p: [-0.72, 2.38, 0.36], s: [0.92, 0.56, 0.85], r: [0.1, 0.4, -0.15], tone: 'dark' },
  { p: [0.68, 2.52, -0.34], s: [0.88, 0.54, 0.82], r: [-0.1, 1.1, 0.12], tone: 'dark' },
  { p: [0.12, 2.68, 0.62], s: [0.76, 0.5, 0.74], r: [0.15, 0.8, 0.08], tone: 'mid' },
  // Tầng tán chính giữa lệch phải-sau
  { p: [-0.22, 3.02, -0.24], s: [1.12, 0.68, 1.05], r: [0.05, 0.2, 0.1], tone: 'mid' },
  { p: [0.52, 3.12, 0.22], s: [0.86, 0.56, 0.84], r: [-0.08, 1.7, -0.05], tone: 'light' },
  { p: [-0.66, 2.95, -0.28], s: [0.72, 0.48, 0.72], r: [0.12, 2.2, 0.15], tone: 'mid' },
  // Tầng ngọn cao vươn sáng bất đối xứng
  { p: [0.06, 3.68, 0.05], s: [0.82, 0.52, 0.78], r: [0.08, 0.9, -0.08], tone: 'light' },
  { p: [0.34, 3.48, -0.22], s: [0.58, 0.42, 0.56], r: [-0.12, 1.4, 0.1], tone: 'light' },
]

/** Cây xanh kiến trúc tán đa tầng bất đối xứng (2-3 sắc độ xanh + InstancedMesh tán lá) */
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

  const foliageInstRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = foliageInstRef.current
    if (!mesh) return
    const toneColors = { dark: leafDark, mid: leafMid, light: leafLight }
    for (let i = 0; i < TREE_CLUSTERS.length; i++) {
      const cl = TREE_CLUSTERS[i]
      _obj0.position.set(cl.p[0], cl.p[1], cl.p[2])
      _obj0.rotation.set(cl.r[0], cl.r[1], cl.r[2])
      _obj0.scale.set(cl.s[0], cl.s[1], cl.s[2])
      _obj0.updateMatrix()
      mesh.setMatrixAt(i, _obj0.matrix)
      mesh.setColorAt(i, _tmpColor.set(toneColors[cl.tone]))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [leafDark, leafMid, leafLight])

  return (
    <G p={pos} r={[0, rotationY, 0]} s={scale}>
      {/* Bệ đất gốc cây & cụm sỏi bảo vệ */}
      <Cyl p={[0, 0.04, 0]} rt={0.44} rb={0.48} h={0.08} c={darkMode ? '#2B2D2F' : '#3E4249'} rough={0.85} shadow={false} />
      <Cyl p={[0, 0.09, 0]} rt={0.36} rb={0.4} h={0.03} c="#3D342C" rough={0.95} shadow={false} />

      {/* Thân cây chính uốn nhẹ + 3 nhánh vươn đa hướng */}
      <Cyl p={[0, 1.15, 0]} r={[0.04, 0, -0.06]} rt={0.14} rb={0.23} h={2.3} c={bark} rough={0.88} shadow />
      <Cyl p={[-0.36, 2.02, 0.18]} r={[0.24, 0, 0.52]} rt={0.065} rb={0.11} h={1.08} c={bark} rough={0.88} shadow={false} />
      <Cyl p={[0.38, 2.15, -0.16]} r={[-0.22, 0, -0.5]} rt={0.065} rb={0.11} h={1.12} c={bark} rough={0.88} shadow={false} />
      <Cyl p={[0.08, 2.45, 0.25]} r={[0.36, 0.2, -0.12]} rt={0.05} rb={0.085} h={0.85} c={bark} rough={0.88} shadow={false} />

      {/* Cụm tán lá đa giác bất đối xứng 3 sắc độ xanh dùng chung InstancedMesh (castShadow=false) */}
      <instancedMesh
        ref={foliageInstRef}
        args={[FOLIAGE_ICO, INST_FOLIAGE_MAT, TREE_CLUSTERS.length]}
        castShadow={false}
        receiveShadow
      />

      {/* Đèn hắt gốc cây (Tree Uplight) dùng vật liệu tự phát sáng ấm #FFAE52 (không dùng pointLight) */}
      {uplight && (
        <G p={[0.42, 0.06, 0.42]}>
          <Cyl rt={0.075} rb={0.085} h={0.06} c="#1E2024" metal={0.6} rough={0.35} shadow={false} />
          <Cyl
            p={[0, 0.032, 0]}
            rt={0.055}
            rb={0.055}
            h={0.014}
            c="#FFAE52"
            emissive="#FFAE52"
            ei={darkMode ? 2.6 : 1.65}
            shadow={false}
          />
        </G>
      )}
    </G>
  )
}

/** Hàng bụi cây cắt tỉa sát chân tường / bồn cây cảnh quan (InstancedMesh + castShadow=false) */
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
  const puffsRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = puffsRef.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      const offset = -length / 2 + 0.34 + (i / Math.max(1, count - 1)) * (length - 0.68)
      const sx = 0.28 + ((i * 7) % 3) * 0.045
      const sy = height * (0.42 + ((i * 3) % 3) * 0.07)
      const sz = 0.26 + ((i * 5) % 3) * 0.04
      const py = height * 0.58 + (i % 2) * 0.05
      const px = isX ? offset : i % 2 ? 0.04 : -0.04
      const pz = isX ? (i % 2 ? 0.04 : -0.04) : offset
      const tint = i % 3 === 0 ? c3 : i % 2 === 0 ? c2 : c1

      _obj0.position.set(px, py, pz)
      _obj0.rotation.set(0, 0, 0)
      _obj0.scale.set(sx, sy, sz)
      _obj0.updateMatrix()
      mesh.setMatrixAt(i, _obj0.matrix)
      mesh.setColorAt(i, _tmpColor.set(tint))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count, length, height, isX, c1, c2, c3])

  return (
    <group position={pos}>
      {/* Lõi bụi cây cắt tỉa gọn gàng làm nền khối xanh liên tục */}
      <B
        p={[0, height * 0.44, 0]}
        s={isX ? [length - 0.15, height * 0.72, 0.48] : [0.48, height * 0.72, length - 0.15]}
        c={c1}
        rough={0.86}
        shadow={false}
      />
      {/* Các cụm lá nổi gộp chung thành 1 InstancedMesh */}
      <instancedMesh
        key={count}
        ref={puffsRef}
        args={[HEDGE_SPHERE, INST_HEDGE_MAT, count]}
        castShadow={false}
        receiveShadow
      />
    </group>
  )
}

/** Cụm cây cảnh tự nhiên bất đối xứng: cây lá xòe, bụi cây nhiều tầng, bụi cỏ dài & đá tảng cảnh quan (InstancedMesh) */
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

  const flip = variant % 2 === 0 ? 1 : -1
  const twist = ((variant % 5) - 2) * 0.24

  const data = useMemo(() => {
    const shrubTiers: { p: V3; s: V3; r: V3; tone: 'deep' | 'mid' | 'bright' }[] = [
      { p: [-0.26 * flip, 0.16, 0.14], s: [0.36, 0.18, 0.28], r: [0.12, 0.4 + twist, -0.15], tone: 'deep' },
      { p: [0.22 * flip, 0.21, -0.16], s: [0.32, 0.22, 0.26], r: [-0.1, 1.3 + twist, 0.14], tone: 'mid' },
      { p: [0.04 * flip, 0.3, 0.08], s: [0.29, 0.26, 0.24], r: [0.15, 0.9, -0.08], tone: 'mid' },
      { p: [-0.14 * flip, 0.42, -0.08], s: [0.22, 0.24, 0.21], r: [-0.18, 1.9 + twist, 0.12], tone: 'bright' },
      { p: [0.34 * flip, 0.12, 0.19], s: [0.24, 0.13, 0.22], r: [0.08, 2.4, 0.06], tone: 'bright' },
    ]
    const broadLeaves: { yaw: number; pitch: number; roll: number; len: number; y: number }[] = [
      { yaw: 0.25 * flip, pitch: 0.45, roll: 0.12, len: 0.48, y: 0.34 },
      { yaw: 1.15 * flip, pitch: 0.68, roll: -0.18, len: 0.44, y: 0.38 },
      { yaw: -0.75 * flip, pitch: 0.56, roll: 0.22, len: 0.46, y: 0.42 },
      { yaw: 2.25 * flip, pitch: 0.72, roll: -0.1, len: 0.4, y: 0.36 },
      { yaw: -1.95 * flip, pitch: 0.48, roll: 0.14, len: 0.5, y: 0.46 },
      { yaw: 3.05 * flip, pitch: 0.62, roll: -0.15, len: 0.38, y: 0.32 },
    ]
    const grassTufts: { p: V3; h: number; rx: number; rz: number }[] = [
      { p: [-0.36 * flip, 0, -0.05], h: 0.48, rx: 0.22, rz: 0.38 * flip },
      { p: [-0.31 * flip, 0, 0.04], h: 0.42, rx: -0.28, rz: 0.26 * flip },
      { p: [-0.4 * flip, 0, 0.02], h: 0.36, rx: 0.14, rz: 0.52 * flip },
      { p: [0.28 * flip, 0, 0.25], h: 0.44, rx: 0.34, rz: -0.22 * flip },
      { p: [0.33 * flip, 0, 0.19], h: 0.37, rx: 0.18, rz: -0.42 * flip },
      { p: [0.23 * flip, 0, 0.29], h: 0.32, rx: 0.45, rz: -0.12 * flip },
    ]
    return { shrubTiers, broadLeaves, grassTufts }
  }, [flip, twist])

  const foliageRef = useRef<THREE.InstancedMesh>(null)
  const stemRef = useRef<THREE.InstancedMesh>(null)
  const grassRef = useRef<THREE.InstancedMesh>(null)
  const rockRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const toneMap = { deep: leafDeep, mid: leafMid, bright: leafBright }
    const fMesh = foliageRef.current
    const sMesh = stemRef.current
    if (fMesh && sMesh) {
      let fIdx = 0
      for (const tier of data.shrubTiers) {
        _obj0.position.set(tier.p[0], tier.p[1], tier.p[2])
        _obj0.rotation.set(tier.r[0], tier.r[1], tier.r[2])
        _obj0.scale.set(tier.s[0], tier.s[1], tier.s[2])
        _obj0.updateMatrix()
        fMesh.setMatrixAt(fIdx, _obj0.matrix)
        fMesh.setColorAt(fIdx, _tmpColor.set(toneMap[tier.tone]))
        fIdx++
      }

      _obj0.position.set(-0.12 * flip, 0, -0.06)
      _obj0.rotation.set(0, 0, 0)
      _obj0.scale.set(1, 1, 1)
      _obj0.updateMatrix()

      for (let i = 0; i < data.broadLeaves.length; i++) {
        const leaf = data.broadLeaves[i]
        _obj1.position.set(0, leaf.y, 0)
        _obj1.rotation.set(0, leaf.yaw, 0)
        _obj1.scale.set(1, 1, 1)
        _obj1.updateMatrix()
        _mat4A.multiplyMatrices(_obj0.matrix, _obj1.matrix)

        // Cuống lá
        _obj2.position.set(0, -0.14, 0.04)
        _obj2.rotation.set(0.25, 0, 0)
        _obj2.scale.set(1, 1, 1)
        _obj2.updateMatrix()
        _mat4B.multiplyMatrices(_mat4A, _obj2.matrix)
        sMesh.setMatrixAt(i, _mat4B)
        sMesh.setColorAt(i, _tmpColor.set(leafDeep))

        // Phiến lá xòe
        _obj2.position.set(0, 0, 0)
        _obj2.rotation.set(leaf.pitch, 0, leaf.roll)
        _obj2.scale.set(1, 1, 1)
        _obj2.updateMatrix()
        _mat4B.multiplyMatrices(_mat4A, _obj2.matrix)

        _obj3.position.set(0, 0, leaf.len * 0.55)
        _obj3.rotation.set(0, 0, 0)
        _obj3.scale.set(0.11, 0.02, leaf.len)
        _obj3.updateMatrix()
        _mat4B.multiply(_obj3.matrix)

        fMesh.setMatrixAt(fIdx, _mat4B)
        fMesh.setColorAt(fIdx, _tmpColor.set(leafBroad))
        fIdx++
      }

      fMesh.instanceMatrix.needsUpdate = true
      if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true
      fMesh.computeBoundingSphere()

      sMesh.instanceMatrix.needsUpdate = true
      if (sMesh.instanceColor) sMesh.instanceColor.needsUpdate = true
      sMesh.computeBoundingSphere()
    }

    const gMesh = grassRef.current
    if (gMesh) {
      for (let i = 0; i < data.grassTufts.length; i++) {
        const blade = data.grassTufts[i]
        _obj0.position.set(blade.p[0], blade.h * 0.44, blade.p[2])
        _obj0.rotation.set(blade.rx, i * 0.7, blade.rz)
        _obj0.scale.set(1, blade.h, 1)
        _obj0.updateMatrix()
        gMesh.setMatrixAt(i, _obj0.matrix)
        gMesh.setColorAt(i, _tmpColor.set(grassTone))
      }
      gMesh.instanceMatrix.needsUpdate = true
      if (gMesh.instanceColor) gMesh.instanceColor.needsUpdate = true
      gMesh.computeBoundingSphere()
    }

    const rMesh = rockRef.current
    if (rMesh && showBoulders) {
      const rocks: { p: V3; r: V3; s: V3; c: string }[] = [
        { p: [0.14 * flip, 0.08, 0.22], r: [0.35, 0.8 + twist, -0.25], s: [0.21, 0.13, 0.17], c: rockMain },
        { p: [-0.18 * flip, 0.06, 0.25], r: [-0.22, 1.9, 0.4], s: [0.14, 0.095, 0.12], c: rockLight },
        { p: [0.33 * flip, 0.045, 0.04], r: [0.5, 0.3, 0.2], s: [0.1, 0.07, 0.09], c: rockLight },
      ]
      for (let i = 0; i < rocks.length; i++) {
        const rk = rocks[i]
        _obj0.position.set(rk.p[0], rk.p[1], rk.p[2])
        _obj0.rotation.set(rk.r[0], rk.r[1], rk.r[2])
        _obj0.scale.set(rk.s[0], rk.s[1], rk.s[2])
        _obj0.updateMatrix()
        rMesh.setMatrixAt(i, _obj0.matrix)
        rMesh.setColorAt(i, _tmpColor.set(rk.c))
      }
      rMesh.instanceMatrix.needsUpdate = true
      if (rMesh.instanceColor) rMesh.instanceColor.needsUpdate = true
      rMesh.computeBoundingSphere()
    }
  }, [data, flip, twist, showBoulders, leafDeep, leafMid, leafBright, leafBroad, grassTone, rockMain, rockLight])

  return (
    <G p={pos} r={[0, rotationY + twist, 0]} s={scale}>
      <instancedMesh
        ref={foliageRef}
        args={[FOLIAGE_ICO, INST_FOLIAGE_MAT, data.shrubTiers.length + data.broadLeaves.length]}
        castShadow={false}
        receiveShadow
      />
      <instancedMesh
        ref={stemRef}
        args={[STEM_CYL, INST_STEM_MAT, data.broadLeaves.length]}
        castShadow={false}
      />
      <instancedMesh
        ref={grassRef}
        args={[GRASS_BLADE, INST_GRASS_MAT, data.grassTufts.length]}
        castShadow={false}
      />
      {showBoulders && (
        <instancedMesh
          ref={rockRef}
          args={[ROCK_DODEC, INST_ROCK_MAT, 3]}
          castShadow={false}
          receiveShadow
        />
      )}
    </G>
  )
}

/** Chậu cây Ô-liu / Bàng cảnh vuông Travertine chân đen mờ cho Sân thượng & Sảnh ngoài trời */
export function PottedVillaTree({ pos, scale = 1, darkMode }: { pos: V3; scale?: number; darkMode: boolean }) {
  const leafMid = darkMode ? '#405639' : '#566E4C'
  const leafLight = darkMode ? '#526B49' : '#6F8763'
  const travertine = darkMode ? '#EBE6DC' : '#F5F2EB'
  const matMid = getBotanicalMat(leafMid, 0.78, true)
  const matLight = getBotanicalMat(leafLight, 0.74, true)

  return (
    <G p={pos} s={scale}>
      {/* Chân đế đen mờ & thân chậu đá Travertine trắng kem sang trọng */}
      <B p={[0, 0.035, 0]} s={[0.48, 0.07, 0.48]} c="#1E2229" rough={0.55} metal={0.25} shadow={false} />
      <B p={[0, 0.285, 0]} s={[0.58, 0.43, 0.58]} c={travertine} rough={0.4} shadow />
      <B p={[0, 0.505, 0]} s={[0.6, 0.025, 0.6]} c="#1E2229" rough={0.55} metal={0.25} shadow={false} />
      <B p={[0, 0.52, 0]} s={[0.5, 0.02, 0.5]} c="#4A3F35" rough={0.92} shadow={false} />
      <Cyl p={[0, 0.94, 0]} rt={0.045} rb={0.065} h={0.86} c="#5C4938" rough={0.86} shadow={false} />
      <Cyl p={[-0.14, 1.2, 0.08]} r={[0.25, 0, 0.45]} rt={0.025} rb={0.038} h={0.42} c="#5C4938" rough={0.86} shadow={false} />
      <mesh position={[0, 1.5, 0]} scale={[0.42, 0.34, 0.42]} geometry={FOLIAGE_ICO} material={matMid} castShadow={false} receiveShadow />
      <mesh position={[-0.22, 1.38, 0.14]} scale={[0.28, 0.24, 0.28]} geometry={FOLIAGE_ICO} material={matLight} castShadow={false} receiveShadow />
      <mesh position={[0.18, 1.64, -0.08]} scale={[0.3, 0.26, 0.3]} geometry={FOLIAGE_ICO} material={matLight} castShadow={false} receiveShadow />
    </G>
  )
}
