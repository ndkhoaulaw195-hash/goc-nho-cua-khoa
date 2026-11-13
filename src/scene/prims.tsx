import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { V3 } from '../data/config'
import { useStore } from '../store'

// Bộ nhớ đệm dùng chung (Shared Geometry & Material Pool) giảm tối đa Draw Calls và cấp phát VRAM
const boxGeomCache = new Map<string, THREE.BoxGeometry>()
const roundedBoxGeomCache = new Map<string, RoundedBoxGeometry>()
const cylGeomCache = new Map<string, THREE.CylinderGeometry>()
const SHARED_SPHERE_GEOM = new THREE.SphereGeometry(1, 24, 16)
const matCache = new Map<string, THREE.MeshStandardMaterial>()

function getBoxGeom(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}`
  let g = boxGeomCache.get(key)
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d)
    boxGeomCache.set(key, g)
  }
  return g
}

function getRoundedBoxGeom(w: number, h: number, d: number, seg: number, r: number): RoundedBoxGeometry {
  const key = `${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}_${seg}_${r.toFixed(4)}`
  let g = roundedBoxGeomCache.get(key)
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, seg, r)
    roundedBoxGeomCache.set(key, g)
  }
  return g
}

function getCylGeom(rt: number, rb: number, h: number, seg: number): THREE.CylinderGeometry {
  const key = `${rt.toFixed(4)}_${rb.toFixed(4)}_${h.toFixed(4)}_${seg}`
  let g = cylGeomCache.get(key)
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg)
    cylGeomCache.set(key, g)
  }
  return g
}

function getSharedMat(
  c: string,
  rough: number,
  metal: number,
  emissive: string | undefined,
  ei: number,
  opacity: number | undefined,
  polyOffset: boolean,
  depthWrite: boolean | undefined,
  map?: THREE.Texture,
): THREE.MeshStandardMaterial {
  const isTransparent = opacity !== undefined && opacity < 1
  const actualDepthWrite = depthWrite ?? !isTransparent
  const emColor = emissive ?? '#000000'
  const emInt = emissive ? ei : 0
  const key = `${c}_${rough.toFixed(3)}_${metal.toFixed(3)}_${emColor}_${emInt.toFixed(2)}_${(opacity ?? 1).toFixed(3)}_${polyOffset ? 1 : 0}_${actualDepthWrite ? 1 : 0}_${map ? map.uuid : 'nomap'}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: rough,
      metalness: metal,
      map: map ?? null,
      emissive: emColor,
      emissiveIntensity: emInt,
      transparent: isTransparent,
      opacity: opacity ?? 1,
      depthWrite: actualDepthWrite,
      polygonOffset: polyOffset,
      polygonOffsetFactor: polyOffset ? -1 : 0,
      polygonOffsetUnits: polyOffset ? -1 : 0,
    })
    matCache.set(key, m)
  }
  return m
}

interface BoxProps {
  p?: V3
  s?: V3
  c?: string
  r?: V3
  rough?: number
  metal?: number
  map?: THREE.Texture
  emissive?: string
  ei?: number
  shadow?: boolean
  opacity?: number
  polyOffset?: boolean
  depthWrite?: boolean
}

interface RoundedBoxProps extends BoxProps {
  radius?: number
  segments?: number
}

/** Hộp cơ bản (vị trí là tâm hộp) dùng chung bộ nhớ Geometry & Material */
export function B({
  p = [0, 0, 0],
  s = [1, 1, 1],
  c = '#888',
  r = [0, 0, 0],
  rough = 0.8,
  metal = 0,
  map,
  emissive,
  ei = 1,
  shadow = false,
  opacity,
  polyOffset = false,
  depthWrite,
}: BoxProps) {
  const [w, h, d] = s
  const geom = useMemo(() => getBoxGeom(w, h, d), [w, h, d])
  const mat = useMemo(
    () => getSharedMat(c, rough, metal, emissive, ei, opacity, polyOffset, depthWrite, map),
    [c, rough, metal, emissive, ei, opacity, polyOffset, depthWrite, map],
  )
  return <mesh position={p} rotation={r} geometry={geom} material={mat} castShadow={shadow} receiveShadow />
}

/** Hộp đặt theo đáy: y là mặt dưới */
export function BB(props: BoxProps) {
  const [x, y, z] = props.p ?? [0, 0, 0]
  const h = (props.s ?? [1, 1, 1])[1]
  return <B {...props} p={[x, y + h / 2, z]} />
}

/** Hộp bo tròn góc mềm mại (RoundedBox) bắt sáng cao cấp, dùng chung bộ nhớ */
export function RB({
  p = [0, 0, 0],
  s = [1, 1, 1],
  c = '#888',
  r = [0, 0, 0],
  rough = 0.8,
  metal = 0,
  map,
  emissive,
  ei = 1,
  shadow = false,
  opacity,
  polyOffset = false,
  depthWrite,
  radius = 0.04,
  segments = 3,
}: RoundedBoxProps) {
  const [w, h, d] = s
  const maxRadius = Math.min(w, h, d) / 2 - 0.001
  const safeRadius = Math.max(0.001, Math.min(radius, maxRadius > 0 ? maxRadius : 0.005))
  const geom = useMemo(
    () => getRoundedBoxGeom(w, h, d, segments, safeRadius),
    [w, h, d, segments, safeRadius],
  )
  const mat = useMemo(
    () => getSharedMat(c, rough, metal, emissive, ei, opacity, polyOffset, depthWrite, map),
    [c, rough, metal, emissive, ei, opacity, polyOffset, depthWrite, map],
  )

  return <mesh position={p} rotation={r} geometry={geom} material={mat} castShadow={shadow} receiveShadow />
}

/** Hộp bo tròn góc đặt theo đáy: y là mặt dưới */
export function RBB(props: RoundedBoxProps) {
  const [x, y, z] = props.p ?? [0, 0, 0]
  const h = (props.s ?? [1, 1, 1])[1]
  return <RB {...props} p={[x, y + h / 2, z]} />
}

interface CylProps {
  p?: V3
  r?: V3
  rt: number
  rb?: number
  h: number
  c?: string
  seg?: number
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
  opacity?: number
  shadow?: boolean
}
export function Cyl({
  p = [0, 0, 0],
  r = [0, 0, 0],
  rt,
  rb,
  h,
  c = '#888',
  seg = 24,
  rough = 0.8,
  metal = 0,
  emissive,
  ei = 1,
  opacity,
  shadow = false,
}: CylProps) {
  const actualRb = rb ?? rt
  const geom = useMemo(() => getCylGeom(rt, actualRb, h, seg), [rt, actualRb, h, seg])
  const mat = useMemo(
    () => getSharedMat(c, rough, metal, emissive, ei, opacity, false, undefined),
    [c, rough, metal, emissive, ei, opacity],
  )
  return <mesh position={p} rotation={r} geometry={geom} material={mat} castShadow={shadow} receiveShadow />
}

export function Sph({
  p = [0, 0, 0],
  s = [1, 1, 1],
  r = [0, 0, 0],
  c = '#888',
  rough = 0.8,
  metal = 0,
  emissive,
  ei = 1,
  shadow = false,
}: {
  p?: V3
  s?: V3
  r?: V3
  c?: string
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
  shadow?: boolean
}) {
  const mat = useMemo(
    () => getSharedMat(c, rough, metal, emissive, ei, undefined, false, undefined),
    [c, rough, metal, emissive, ei],
  )
  return (
    <mesh
      position={p}
      rotation={r}
      scale={s}
      geometry={SHARED_SPHERE_GEOM}
      material={mat}
      castShadow={shadow}
      receiveShadow
    />
  )
}

export function G({ p = [0, 0, 0], r = [0, 0, 0], s = 1, children }: { p?: V3; r?: V3; s?: number; children: ReactNode }) {
  return (
    <group position={p} rotation={r} scale={s}>
      {children}
    </group>
  )
}

/** Khung viền sáng vàng ấm 3000K (#FFD7A3) khi di chuột qua vật thể tương tác */
function HoverOutline({ targetRef, pad = 0.04 }: { targetRef: RefObject<THREE.Group | null>; pad?: number }) {
  const [bounds, setBounds] = useState<{ center: [number, number, number]; size: [number, number, number] } | null>(null)

  useLayoutEffect(() => {
    const content = targetRef.current
    if (!content) return
    content.updateWorldMatrix(true, true)
    const invRoot = content.matrixWorld.clone().invert()
    const localBox = new THREE.Box3()
    const tmpBox = new THREE.Box3()
    const tmpMat = new THREE.Matrix4()

    content.traverse((child) => {
      if (!child.visible) return
      if (child instanceof THREE.Mesh && child.geometry) {
        const mat = Array.isArray(child.material) ? child.material[0] : child.material
        if (mat && mat.transparent && mat.opacity === 0) return
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox()
        if (child.geometry.boundingBox) {
          tmpMat.multiplyMatrices(invRoot, child.matrixWorld)
          tmpBox.copy(child.geometry.boundingBox).applyMatrix4(tmpMat)
          localBox.union(tmpBox)
        }
      }
    })

    if (localBox.isEmpty()) return
    const sizeVec = new THREE.Vector3()
    const centerVec = new THREE.Vector3()
    localBox.getSize(sizeVec)
    localBox.getCenter(centerVec)
    setBounds({
      center: [centerVec.x, centerVec.y, centerVec.z],
      size: [sizeVec.x + pad * 2, sizeVec.y + pad * 2, sizeVec.z + pad * 2],
    })
  }, [targetRef, pad])

  const geoms = useMemo(() => {
    if (!bounds) return null
    const box = new THREE.BoxGeometry(bounds.size[0], bounds.size[1], bounds.size[2])
    const edges = new THREE.EdgesGeometry(box)
    return { box, edges }
  }, [bounds])

  useEffect(() => {
    return () => {
      geoms?.box.dispose()
      geoms?.edges.dispose()
    }
  }, [geoms])

  if (!bounds || !geoms) return null

  return (
    <group position={bounds.center}>
      <lineSegments geometry={geoms.edges} renderOrder={20}>
        <lineBasicMaterial color="#FFD7A3" transparent opacity={0.85} depthTest />
      </lineSegments>
      <mesh geometry={geoms.box} renderOrder={19}>
        <meshBasicMaterial color="#FFD7A3" transparent opacity={0.045} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Vòng hào quang sáng nhẹ dưới chân nhân vật / thú cưng khi di chuột vào */
export function CharacterHoverHalo({
  active,
  radius = 0.42,
  height = 1.65,
}: {
  active: boolean
  radius?: number
  height?: number
}) {
  if (!active) return null
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.032, 0]} renderOrder={18}>
        <ringGeometry args={[radius * 0.84, radius, 36]} />
        <meshBasicMaterial color="#FFD7A3" transparent opacity={0.92} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]} renderOrder={17}>
        <circleGeometry args={[radius * 0.84, 36]} />
        <meshBasicMaterial color="#FFD7A3" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2, 0]} renderOrder={16}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.92, height, 28, 1, true]} />
        <meshBasicMaterial color="#FFD7A3" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Component tương tác dùng chung: tự động đổi con trỏ, hiển thị tooltip & viền sáng nhẹ */
export function Interact({
  hint,
  onClick,
  children,
}: {
  hint?: string
  onClick?: (e: ThreeEvent<MouseEvent>) => void
  children: ReactNode
}) {
  const contentRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const interactive = Boolean(onClick)

  useEffect(() => {
    return () => {
      if (hovered) {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }
    }
  }, [hovered])

  return (
    <group
      onClick={
        onClick
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              onClick(e)
            }
          : undefined
      }
      onPointerOver={
        interactive
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
              setHovered(true)
              if (hint) useStore.getState().setHoverHint(hint)
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              document.body.style.cursor = 'auto'
              setHovered(false)
              if (hint) useStore.getState().setHoverHint(null)
            }
          : undefined
      }
    >
      <group ref={contentRef}>{children}</group>
      {hovered && interactive && <HoverOutline targetRef={contentRef} />}
    </group>
  )
}
