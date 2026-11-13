import * as THREE from 'three'
import { useStore } from '../store'

export type InteractZone = 'exterior' | 'interior_f1' | 'interior_f2'
export type OccluderKind = 'wall' | 'slab' | 'roof' | 'glass'

export const MAX_FP_INTERACT_DIST = 5.8

export interface InteractionGateState {
  mode: string
  viewPreset: string
  wallMode: string
  nearInteriorOpen: boolean
}

const SPRING_ARM_KINDS = new Set<OccluderKind>(['wall', 'slab', 'roof'])

let pointerDownX = 0
let pointerDownY = 0
let pointerDownTime = 0
let hasPointerDown = false
let orbitDragging = false

const occluderEntries = new Map<THREE.Object3D, OccluderKind>()
const interactableEntries = new Map<THREE.Object3D, InteractZone>()

function isHierarchyVisible(obj: THREE.Object3D | null | undefined): boolean {
  let cur: THREE.Object3D | null | undefined = obj
  while (cur) {
    if (!cur.visible) return false
    cur = cur.parent
  }
  return true
}

function hasOccluderAncestor(obj: THREE.Object3D): boolean {
  let cur = obj.parent
  while (cur) {
    if (occluderEntries.has(cur)) return true
    cur = cur.parent
  }
  return false
}

function findNearestOccluderEntryKind(obj: THREE.Object3D): OccluderKind | null {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    if (cur !== obj && (cur.userData?.isInteractableRoot === true || interactableEntries.has(cur))) {
      return null
    }
    const kind = occluderEntries.get(cur)
    if (kind) return kind
    cur = cur.parent
  }
  return null
}

function applyOccluderMetadata(
  node: THREE.Object3D,
  rootObj: THREE.Object3D,
  kind: OccluderKind,
  touched: THREE.Object3D[],
): void {
  if (node !== rootObj) {
    if (node.userData?.isInteractableRoot === true || interactableEntries.has(node)) {
      return
    }
    if (occluderEntries.has(node)) {
      return
    }
  }
  node.userData.isOccluder = true
  node.userData.occluderKind = kind
  touched.push(node)

  const children = node.children
  for (let i = 0; i < children.length; i++) {
    applyOccluderMetadata(children[i], rootObj, kind, touched)
  }
}

function applyInteractZoneMetadata(
  node: THREE.Object3D,
  rootObj: THREE.Object3D,
  zone: InteractZone,
  touched: THREE.Object3D[],
): void {
  if (node !== rootObj && (interactableEntries.has(node) || node.userData?.isInteractableRoot === true)) {
    return
  }
  node.userData.interactZone = zone
  touched.push(node)

  const children = node.children
  for (let i = 0; i < children.length; i++) {
    applyInteractZoneMetadata(children[i], rootObj, zone, touched)
  }
}

function collectOccluderMeshes(
  node: THREE.Object3D,
  inheritedKind: OccluderKind,
  springArmOnly: boolean,
  out: Set<THREE.Object3D>,
): void {
  if (!node.visible) return
  if (node.userData?.isInteractableRoot === true || interactableEntries.has(node)) {
    return
  }
  const ownKind = occluderEntries.get(node)
  const effectiveKind = ownKind ?? inheritedKind

  if ((node as THREE.Mesh).isMesh) {
    if (node.userData.isOccluder !== true || node.userData.occluderKind !== effectiveKind) {
      node.userData.isOccluder = true
      node.userData.occluderKind = effectiveKind
    }
    if (!springArmOnly || SPRING_ARM_KINDS.has(effectiveKind)) {
      out.add(node)
    }
  }

  const children = node.children
  for (let i = 0; i < children.length; i++) {
    collectOccluderMeshes(children[i], effectiveKind, springArmOnly, out)
  }
}

function collectInteractableMeshes(
  node: THREE.Object3D,
  rootObj: THREE.Object3D,
  zone: InteractZone,
  out: Set<THREE.Object3D>,
): void {
  if (!node.visible) return
  if (node !== rootObj && (interactableEntries.has(node) || node.userData?.isInteractableRoot === true)) {
    return
  }
  if ((node as THREE.Mesh).isMesh) {
    if (node.userData.interactZone !== zone) {
      node.userData.interactZone = zone
    }
    out.add(node)
  }

  const children = node.children
  for (let i = 0; i < children.length; i++) {
    collectInteractableMeshes(children[i], rootObj, zone, out)
  }
}

/** Kiểm tra xem ngôi nhà có đang ở trạng thái Toàn cảnh đóng kín (không cho bấm xuyên vào nội thất) hay không */
export function isHouseClosedOverview(s?: InteractionGateState): boolean {
  const state = s ?? useStore.getState()
  return (
    state.mode === 'orbit' &&
    state.viewPreset === 'overview' &&
    state.wallMode === 'full' &&
    !state.nearInteriorOpen
  )
}

/** Kiểm tra phân vùng tương tác có được phép kích hoạt ở trạng thái camera/tầng hiện tại hay không */
export function isZoneInteractive(zone: InteractZone, s?: InteractionGateState): boolean {
  if (zone === 'exterior') return true
  const state = s ?? useStore.getState()
  if (isHouseClosedOverview(state)) return false
  if (state.mode === 'orbit' && state.viewPreset === 'floor1') {
    return zone === 'interior_f1'
  }
  return true
}

/** Ghi nhận vị trí và thời điểm pointerdown để phân biệt click thật với thao tác kéo xoay camera */
export function recordPointerDown(clientX: number, clientY: number): void {
  pointerDownX = clientX
  pointerDownY = clientY
  pointerDownTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  hasPointerDown = true
}

/** Xác nhận click hợp lệ (di chuyển <= 5px và giữ chuột <= 250ms mặc định) */
export function isValidClick(
  clientX: number,
  clientY: number,
  maxDistPx = 5,
  maxDurationMs = 250,
): boolean {
  if (!hasPointerDown) return true
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const dist = Math.hypot(clientX - pointerDownX, clientY - pointerDownY)
  const duration = now - pointerDownTime
  return dist <= maxDistPx && duration <= maxDurationMs
}

export function setOrbitDragging(dragging: boolean): void {
  orbitDragging = dragging
}

export function isOrbitDragging(): boolean {
  return orbitDragging
}

/** Đăng ký một khối kiến trúc (tường, sàn, mái, vách kính mặt tiền) làm vật cản raycast & camera */
export function registerOccluderMesh(obj: THREE.Object3D, kind: OccluderKind): () => void {
  occluderEntries.set(obj, kind)
  const touched: THREE.Object3D[] = []
  applyOccluderMetadata(obj, obj, kind, touched)

  return () => {
    if (occluderEntries.get(obj) === kind) {
      occluderEntries.delete(obj)
    }
    for (let i = 0; i < touched.length; i++) {
      const node = touched[i]
      if (occluderEntries.has(node)) continue
      const ancestorKind = node.parent ? findNearestOccluderEntryKind(node.parent) : null
      if (ancestorKind) {
        node.userData.isOccluder = true
        node.userData.occluderKind = ancestorKind
      } else {
        delete node.userData.isOccluder
        delete node.userData.occluderKind
      }
    }
  }
}

/** Đăng ký nhóm vật thể tương tác kèm phân vùng (exterior / interior_f1 / interior_f2) */
export function registerInteractableGroup(obj: THREE.Object3D, zone: InteractZone): () => void {
  interactableEntries.set(obj, zone)
  obj.userData.isInteractableRoot = true
  const touched: THREE.Object3D[] = []
  applyInteractZoneMetadata(obj, obj, zone, touched)

  return () => {
    if (interactableEntries.get(obj) === zone) {
      interactableEntries.delete(obj)
    }
    if (!interactableEntries.has(obj)) {
      delete obj.userData.isInteractableRoot
    }
    for (let i = 0; i < touched.length; i++) {
      const node = touched[i]
      if (interactableEntries.has(node)) continue
      const parentZone = node.parent ? findInteractZoneOfObject(node.parent) : null
      if (parentZone) {
        node.userData.interactZone = parentZone
      } else {
        delete node.userData.interactZone
      }
    }
  }
}

function queryVisibleOccluders(springArmOnly: boolean): THREE.Object3D[] {
  if (occluderEntries.size === 0) return []
  const out = new Set<THREE.Object3D>()

  for (const [root, kind] of occluderEntries) {
    if (hasOccluderAncestor(root)) continue
    if (!isHierarchyVisible(root)) continue
    collectOccluderMeshes(root, kind, springArmOnly, out)
  }

  return Array.from(out)
}

/** Trả về danh sách Mesh vật cản kiến trúc đang hiển thị (visible === true suốt chuỗi ancestor) */
export function getVisibleOccluderMeshes(): THREE.Object3D[] {
  return queryVisibleOccluders(false)
}

/** Trả về danh sách Mesh vật cản vững chắc (wall/slab/roof) cho GTA Spring Arm camera */
export function getSpringArmOccluders(): THREE.Object3D[] {
  return queryVisibleOccluders(true)
}

/** Trả về danh sách Mesh tương tác thuộc vùng đang mở khóa và đang hiển thị */
export function getActiveInteractableMeshes(): THREE.Object3D[] {
  if (interactableEntries.size === 0) return []
  const state = useStore.getState()
  const zoneAllowed: Record<InteractZone, boolean> = {
    exterior: isZoneInteractive('exterior', state),
    interior_f1: isZoneInteractive('interior_f1', state),
    interior_f2: isZoneInteractive('interior_f2', state),
  }

  const out = new Set<THREE.Object3D>()
  for (const [root, zone] of interactableEntries) {
    if (!zoneAllowed[zone]) continue
    if (!isHierarchyVisible(root)) continue
    collectInteractableMeshes(root, root, zone, out)
  }

  return Array.from(out)
}

/** Kiểm tra object bị hit (hoặc ancestor gần hơn isInteractableRoot) có phải vật cản kiến trúc hay không */
export function isOccluderHit(obj: THREE.Object3D | null | undefined): boolean {
  let cur: THREE.Object3D | null | undefined = obj
  while (cur) {
    if (cur.userData?.isInteractableRoot === true || interactableEntries.has(cur)) {
      return false
    }
    if (cur.userData?.isOccluder === true || occluderEntries.has(cur)) {
      return true
    }
    cur = cur.parent
  }
  return false
}

/** Tìm phân vùng tương tác của một Object3D bất kỳ bằng cách dò ngược cây cha */
export function findInteractZoneOfObject(obj: THREE.Object3D | null | undefined): InteractZone | null {
  let cur: THREE.Object3D | null | undefined = obj
  while (cur) {
    const z = cur.userData?.interactZone as InteractZone | undefined
    if (z === 'exterior' || z === 'interior_f1' || z === 'interior_f2') {
      return z
    }
    const registeredZone = interactableEntries.get(cur)
    if (registeredZone) return registeredZone
    cur = cur.parent
  }
  return null
}

/** Lấy giao cắt đầu tiên đang hiển thị trong danh sách targets (tối ưu bỏ qua object ẩn / Points / Line) */
export function getFirstRaycastHit(
  raycaster: THREE.Raycaster,
  targets: THREE.Object3D[],
  maxDistance?: number,
): THREE.Intersection | null {
  if (targets.length === 0) return null
  const prevFar = raycaster.far
  if (maxDistance !== undefined) {
    raycaster.far = maxDistance
  }
  try {
    const hits = raycaster.intersectObjects(targets, true)
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i]
      if (maxDistance !== undefined && hit.distance > maxDistance) break
      const obj = hit.object
      if (
        obj instanceof THREE.Points ||
        obj instanceof THREE.Line ||
        obj instanceof THREE.LineSegments
      ) {
        continue
      }
      if (!isHierarchyVisible(obj)) continue
      return hit
    }
    return null
  } finally {
    if (maxDistance !== undefined) {
      raycaster.far = prevFar
    }
  }
}
