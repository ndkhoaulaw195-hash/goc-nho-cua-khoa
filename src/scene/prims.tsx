import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { LIVE_ACTORS, type V3 } from '../data/config'
import { useStore, type Activity } from '../store'
import {
  handleInteractClickOrQueue,
  refreshInteractableBounds,
  registerInteractableArchetype,
  type CustomSitAnchor,
  type InteractionCategory,
  type InteractionMeta,
} from './interactionEngine'
import {
  isHouseClosedOverview,
  isOccluderHit,
  isOrbitDragging,
  isValidClick,
  isZoneInteractive,
  MAX_FP_INTERACT_DIST,
  registerInteractableGroup,
  registerOccluderMesh,
  type InteractZone,
  type OccluderKind,
} from './raycastRegistry'

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

const _tmpFpOrigin = new THREE.Vector3()

function isObjectInside(obj: THREE.Object3D | null | undefined, root: THREE.Object3D | null): boolean {
  let cur: THREE.Object3D | null | undefined = obj
  while (cur) {
    if (cur === root) return true
    cur = cur.parent
  }
  return false
}

function isGhostTransparentOccluder(
  st: ReturnType<typeof useStore.getState>,
  obj: THREE.Object3D,
): boolean {
  if (st.mode !== 'orbit' || st.wallMode !== 'ghost') return false
  const kind = obj.userData?.occluderKind as OccluderKind | undefined
  return kind === 'wall' || kind === 'roof' || kind === 'glass'
}

function getFpInteractionDistance(
  st: ReturnType<typeof useStore.getState>,
  camera: THREE.Camera,
  point: THREE.Vector3,
): number {
  if (st.fpPerspective === 'third') {
    const activeChar = st.userRole || st.activeChar || 'boy'
    const pos = activeChar === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
    _tmpFpOrigin.set(pos[0], pos[1] + 1.35, pos[2])
    return _tmpFpOrigin.distanceTo(point)
  }
  return camera.position.distanceTo(point)
}

/** Component bọc khối kiến trúc (tường, sàn, mái, vách kính mặt tiền) để tự động đăng ký & gỡ vật cản raycast */
export function Occluder({
  kind,
  visible = true,
  children,
}: {
  kind: OccluderKind
  visible?: boolean
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const el = groupRef.current
    if (!el) return
    return registerOccluderMesh(el, kind)
  }, [kind])

  return (
    <group ref={groupRef} visible={visible}>
      {children}
    </group>
  )
}

const FP_CLICK_QUEUE_DIST = Math.max(MAX_FP_INTERACT_DIST, 14.0)

/** Component tương tác dùng chung: kiểm tra zone, vật cản, khoảng cách, ngưỡng kéo chuột & hiển thị tooltip */
export function Interact({
  id,
  hint,
  onClick,
  zone = 'interior_f1',
  maxDistance,
  category,
  label,
  standOffset,
  customStandOffset,
  customSitAnchor,
  infoTitle,
  infoBody,
  icon,
  linkedStation,
  userData: extraUserData,
  children,
}: {
  id?: string
  hint?: string
  onClick?: (e: ThreeEvent<MouseEvent>) => void
  zone?: InteractZone
  maxDistance?: number
  category?: InteractionCategory
  label?: string
  standOffset?: V3
  customStandOffset?: V3
  customSitAnchor?: CustomSitAnchor
  infoTitle?: string
  infoBody?: string
  icon?: string
  linkedStation?: Activity
  userData?: Record<string, unknown>
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const hoveredRef = useRef(false)
  const hintRef = useRef(hint)
  hintRef.current = hint
  const interactive = Boolean(onClick || category || infoTitle || label)

  const resolvedStand =
    customStandOffset ??
    standOffset ??
    (Array.isArray(extraUserData?.customStandOffset)
      ? (extraUserData.customStandOffset as V3)
      : undefined)
  const resolvedSitAnchor =
    customSitAnchor ??
    (extraUserData?.customSitAnchor && typeof extraUserData.customSitAnchor === 'object'
      ? (extraUserData.customSitAnchor as CustomSitAnchor)
      : undefined)

  const latestPropsRef = useRef({
    id,
    hint,
    onClick,
    zone,
    category,
    label,
    standOffset: resolvedStand,
    customStandOffset: resolvedStand,
    customSitAnchor: resolvedSitAnchor,
    infoTitle,
    infoBody,
    icon,
    linkedStation,
    extraUserData,
  })
  latestPropsRef.current = {
    id,
    hint,
    onClick,
    zone,
    category,
    label,
    standOffset: resolvedStand,
    customStandOffset: resolvedStand,
    customSitAnchor: resolvedSitAnchor,
    infoTitle,
    infoBody,
    icon,
    linkedStation,
    extraUserData,
  }

  useEffect(() => {
    const el = groupRef.current
    if (!el) return
    const p = latestPropsRef.current
    if (p.extraUserData) {
      Object.assign(el.userData, p.extraUserData)
    }
    el.userData.interactHint = p.hint
    el.userData.interactZone = zone
    el.userData.onInteractClick = p.onClick
    el.userData.isInteractableRoot = true

    const unregisterGroup = registerInteractableGroup(el, zone)
    const unregisterArchetype = registerInteractableArchetype(el, {
      id: p.id ?? id,
      hint: p.hint,
      zone,
      onClick: p.onClick,
      category: p.category,
      label: p.label,
      standOffset: p.standOffset,
      customStandOffset: p.customStandOffset,
      customSitAnchor: p.customSitAnchor,
      infoTitle: p.infoTitle,
      infoBody: p.infoBody,
      icon: p.icon,
      linkedStation: p.linkedStation,
    })

    let rafId = 0
    let timerId: ReturnType<typeof setTimeout> | undefined
    const refreshBounds = () => {
      const meta = el.userData?.interaction as InteractionMeta | undefined
      if (meta) refreshInteractableBounds(meta)
    }
    if (typeof requestAnimationFrame !== 'undefined') {
      rafId = requestAnimationFrame(refreshBounds)
    }
    timerId = setTimeout(refreshBounds, 90)

    return () => {
      if (rafId && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId)
      }
      if (timerId !== undefined) clearTimeout(timerId)
      unregisterArchetype?.()
      unregisterGroup()
    }
  }, [id, zone])

  useEffect(() => {
    const el = groupRef.current
    if (!el) return
    if (extraUserData) {
      Object.assign(el.userData, extraUserData)
    }
    el.userData.interactHint = hint
    el.userData.interactZone = zone
    el.userData.onInteractClick = onClick

    const meta = el.userData?.interaction as InteractionMeta | undefined
    if (meta) {
      meta.originalOnClick = onClick
      if (hint) meta.rawHint = hint
      if (label) meta.label = label
      if (infoTitle) meta.infoTitle = infoTitle
      if (infoBody) meta.infoBody = infoBody
      if (icon) meta.icon = icon
      if (linkedStation) meta.linkedStation = linkedStation
      if (resolvedSitAnchor) {
        meta.customSitAnchor = resolvedSitAnchor
        if (resolvedSitAnchor.pose) meta.pose = resolvedSitAnchor.pose
      }
      if (resolvedStand) {
        meta.standOffset = [resolvedStand[0], resolvedStand[1], resolvedStand[2]]
      }
    }
  })

  useEffect(() => {
    if (hoveredRef.current && hint) {
      const st = useStore.getState()
      if (st.hoverHint !== hint) st.setHoverHint(hint)
    }
  }, [hint])

  useEffect(() => {
    return () => {
      if (hoveredRef.current) {
        hoveredRef.current = false
        document.body.style.cursor = 'auto'
        const curHint = hintRef.current
        if (curHint && useStore.getState().hoverHint === curHint) {
          useStore.getState().setHoverHint(null)
        }
      }
    }
  }, [])

  const clearHover = () => {
    if (!hoveredRef.current) return
    hoveredRef.current = false
    if (document.body.style.cursor !== 'auto') {
      document.body.style.cursor = 'auto'
    }
    const curHint = hintRef.current
    if (curHint && useStore.getState().hoverHint === curHint) {
      useStore.getState().setHoverHint(null)
    }
  }

  const handlePointerHover = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    if (isOrbitDragging()) {
      clearHover()
      return
    }
    const st = useStore.getState()
    if (!isZoneInteractive(zone, st)) {
      clearHover()
      return
    }
    if (st.mode === 'fp' && e.point) {
      const limit = maxDistance ?? FP_CLICK_QUEUE_DIST
      if (getFpInteractionDistance(st, e.camera, e.point) > limit) {
        clearHover()
        return
      }
    }
    const first = e.intersections?.[0]
    if (
      first &&
      !isObjectInside(first.object, groupRef.current) &&
      isOccluderHit(first.object) &&
      !isGhostTransparentOccluder(st, first.object)
    ) {
      clearHover()
      if (document.body.style.cursor !== 'auto') {
        document.body.style.cursor = 'auto'
      }
      return
    }
    e.stopPropagation()
    hoveredRef.current = true
    if (document.body.style.cursor !== 'pointer') {
      document.body.style.cursor = 'pointer'
    }
    if (hint && st.hoverHint !== hint) {
      st.setHoverHint(hint)
    }
  }

  return (
    <group
      ref={groupRef}
      onClick={
        interactive
          ? (e: ThreeEvent<MouseEvent>) => {
              if (!isValidClick(e.clientX, e.clientY)) return
              const st = useStore.getState()
              if (!isZoneInteractive(zone, st)) return
              if (st.mode === 'fp' && e.point) {
                const limit = maxDistance ?? FP_CLICK_QUEUE_DIST
                if (getFpInteractionDistance(st, e.camera, e.point) > limit) return
              }
              const first = e.intersections?.[0]
              if (
                first &&
                !isObjectInside(first.object, groupRef.current) &&
                isOccluderHit(first.object) &&
                !isGhostTransparentOccluder(st, first.object)
              ) {
                return
              }
              e.stopPropagation()

              const meta = groupRef.current?.userData?.interaction as InteractionMeta | undefined
              const closedOverview = isHouseClosedOverview(st)
              if (
                !meta ||
                (closedOverview && meta.id === 'main_door') ||
                (closedOverview && meta.zone !== 'exterior')
              ) {
                onClick?.(e)
                return
              }
              if (!handleInteractClickOrQueue(meta, e)) {
                onClick?.(e)
              }
            }
          : undefined
      }
      onPointerOver={interactive ? handlePointerHover : undefined}
      onPointerMove={interactive ? handlePointerHover : undefined}
      onPointerOut={interactive ? clearHover : undefined}
    >
      {children}
    </group>
  )
}
