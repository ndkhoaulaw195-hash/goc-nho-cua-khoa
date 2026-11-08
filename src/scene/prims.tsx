import type { ReactNode } from 'react'
import type * as THREE from 'three'
import type { V3 } from '../data/config'

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

/** Hộp cơ bản (vị trí là tâm hộp) */
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
  shadow = true,
  opacity,
  polyOffset = false,
  depthWrite,
}: BoxProps) {
  const isTransparent = opacity !== undefined && opacity < 1
  return (
    <mesh position={p} rotation={r} castShadow={shadow && !isTransparent} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        map={map}
        emissive={emissive ?? '#000'}
        emissiveIntensity={emissive ? ei : 0}
        transparent={isTransparent}
        opacity={opacity ?? 1}
        depthWrite={depthWrite ?? !isTransparent}
        polygonOffset={polyOffset}
        polygonOffsetFactor={polyOffset ? -1 : 0}
        polygonOffsetUnits={polyOffset ? -1 : 0}
      />
    </mesh>
  )
}

/** Hộp đặt theo đáy: y là mặt dưới */
export function BB(props: BoxProps) {
  const [x, y, z] = props.p ?? [0, 0, 0]
  const h = (props.s ?? [1, 1, 1])[1]
  return <B {...props} p={[x, y + h / 2, z]} />
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
}
export function Cyl({ p = [0, 0, 0], r = [0, 0, 0], rt, rb, h, c = '#888', seg = 24, rough = 0.8, metal = 0, emissive, ei = 1, opacity }: CylProps) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <cylinderGeometry args={[rt, rb ?? rt, h, seg]} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? '#000'}
        emissiveIntensity={emissive ? ei : 0}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  )
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
}: {
  p?: V3
  s?: V3
  r?: V3
  c?: string
  rough?: number
  metal?: number
  emissive?: string
  ei?: number
}) {
  return (
    <mesh position={p} rotation={r} scale={s} castShadow receiveShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial
        color={c}
        roughness={rough}
        metalness={metal}
        emissive={emissive ?? '#000'}
        emissiveIntensity={emissive ? ei : 0}
      />
    </mesh>
  )
}

export function G({ p = [0, 0, 0], r = [0, 0, 0], s = 1, children }: { p?: V3; r?: V3; s?: number; children: ReactNode }) {
  return (
    <group position={p} rotation={r} scale={s}>
      {children}
    </group>
  )
}
