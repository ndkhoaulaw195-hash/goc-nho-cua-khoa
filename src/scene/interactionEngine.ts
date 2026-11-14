import { type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { LIVE_ACTORS, STATIONS, type V3 } from '../data/config'
import { setPendingClearCallback, useStore, type ActiveChar, type Activity } from '../store'
import {
  getAllInteractableEntries,
  isHierarchyVisible,
  isHouseClosedOverview,
  isZoneInteractive,
  type InteractZone,
} from './raycastRegistry'

export type InteractionCategory =
  | 'SEAT'
  | 'ELECTRONIC'
  | 'DOOR_STAIR'
  | 'CONTAINER_INFO'
  | 'PET'

export interface CustomSitAnchor {
  pos: V3
  yaw: number
  pose?: 'sit' | 'lie' | 'recline'
}

export interface InteractionMeta {
  id: string
  category: InteractionCategory
  label: string
  rawHint: string
  standOffset: V3
  center: V3
  boxMin: V3
  boxMax: V3
  size: V3
  floorY: number
  isActive: boolean
  zone: InteractZone
  root: THREE.Object3D
  originalOnClick?: (e: ThreeEvent<MouseEvent>) => void
  linkedStation?: Activity
  infoTitle?: string
  infoBody?: string
  icon: string
  customSitAnchor?: CustomSitAnchor
  pose?: 'sit' | 'lie' | 'recline'
}

export interface InteractableRegistrationOptions {
  id?: string
  hint?: string
  zone?: InteractZone
  onClick?: (e: ThreeEvent<MouseEvent>) => void
  category?: InteractionCategory
  label?: string
  standOffset?: V3
  infoTitle?: string
  infoBody?: string
  icon?: string
  linkedStation?: Activity
  customStandOffset?: V3
  customSitAnchor?: CustomSitAnchor
}

export interface ExecuteInteractionOptions {
  forChar?: ActiveChar
  fromAuto?: boolean
}

export interface PetProximityDirectives {
  isNearby: boolean
  shouldBounce: boolean
  bounceOffsetY: number
  lookAtYaw: number
  followTarget: V3 | null
  distSq: number
}

export interface ProjectedUiState {
  pillVisible: boolean
  pillX: number
  pillY: number
  pillLabel: string
  cardVisible: boolean
  cardX: number
  cardY: number
  boyIntentVisible: boolean
  boyIntentX: number
  boyIntentY: number
  boyIntentIcon: string
  boyIntentLabel: string
  girlIntentVisible: boolean
  girlIntentX: number
  girlIntentY: number
  girlIntentIcon: string
  girlIntentLabel: string
}

export const PROJECTED_UI_STATE: ProjectedUiState = {
  pillVisible: false,
  pillX: 0,
  pillY: 0,
  pillLabel: '',
  cardVisible: false,
  cardX: 0,
  cardY: 0,
  boyIntentVisible: false,
  boyIntentX: 0,
  boyIntentY: 0,
  boyIntentIcon: '',
  boyIntentLabel: '',
  girlIntentVisible: false,
  girlIntentX: 0,
  girlIntentY: 0,
  girlIntentIcon: '',
  girlIntentLabel: '',
}

const INTERACT_RANGE = 1.6
const INTERACT_RANGE_SQ = INTERACT_RANGE * INTERACT_RANGE
const QUEUE_ARRIVE_STAND_DIST_SQ = 0.85 * 0.85
const QUEUE_ARRIVE_BOX_DIST_SQ = 1.4 * 1.4
const CONTAINER_CARD_CLOSE_DIST_SQ = 2.0 * 2.0
const PET_PROXIMITY_SQ = 2.2 * 2.2
const PET_FOLLOW_DIST = 1.2
const FLOOR2_Y = 4.35
const EXTERIOR_Y = -0.15

const registryByRoot = new Map<THREE.Object3D, InteractionMeta>()
const registryById = new Map<string, InteractionMeta>()
const doorHysteresisState = new Map<string, boolean>()

let activeTargetMeta: InteractionMeta | null = null
let pendingInteractionTarget: InteractionMeta | null = null

let externalF1Blocked: ((x: number, z: number, r?: number) => boolean) | null = null
let externalF2Blocked: ((x: number, z: number, r?: number) => boolean) | null = null

export function registerWalkabilityCheckers(
  f1Blocked: (x: number, z: number, r?: number) => boolean,
  f2Blocked?: (x: number, z: number, r?: number) => boolean,
): void {
  externalF1Blocked = f1Blocked
  if (f2Blocked) externalF2Blocked = f2Blocked
}

// Pre-allocated scratch math objects (zero-GC inside useFrame hot paths)
const _box = new THREE.Box3()
const _nodeBox = new THREE.Box3()
const _vecCenter = new THREE.Vector3()
const _vecSize = new THREE.Vector3()
const _vecWorld = new THREE.Vector3()
const _vecLocal = new THREE.Vector3()
const _projVec = new THREE.Vector3()

interface MeshHighlightRecord {
  baseMat: THREE.Material | THREE.Material[]
  highlightMat: THREE.Material | THREE.Material[]
}
const meshHighlightCache = new WeakMap<THREE.Mesh, MeshHighlightRecord>()
let highlightedRoot: THREE.Object3D | null = null
let bounceRoot: THREE.Object3D | null = null
let bounceProgress = 1
const bounceAnchorLocal = new THREE.Vector3()
const bounceColorScratch = new THREE.Color(0xffcf7d)

function makeSyntheticClickEvent(): ThreeEvent<MouseEvent> {
  return {
    stopPropagation: () => {},
    preventDefault: () => {},
    nativeEvent: {} as MouseEvent,
  } as unknown as ThreeEvent<MouseEvent>
}

function shouldSkipCharacterHint(hint: string): boolean {
  const lower = hint.toLowerCase()
  return (
    lower.includes('click để điều khiển') ||
    lower.startsWith('🧑 khoa') ||
    lower.startsWith('👩 linh') ||
    lower.includes('bạn gái (click')
  )
}

function cleanHintLabel(raw: string): string {
  return raw
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s✨🎯💡🛋️🛏️🛁🪞🧺👕👗🎹🎨📚📖🥣🐶🐕🖥️💻📺❄️🚪🪜🪟🔥🏊🍹🌊🐟🏮🍳☕]+/gu, '')
    .replace(/\s*\(click[^)]*\)\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLeadingIcon(raw: string, category: InteractionCategory): string {
  const m = raw.trim().match(/^([\p{Extended_Pictographic}\uFE0F\u200D✨💡🔥🌊🏮🐟🍹]+)/u)
  if (m && m[1]) return m[1]
  switch (category) {
    case 'SEAT':
      return '🛋️'
    case 'ELECTRONIC':
      return '💡'
    case 'DOOR_STAIR':
      return '🚪'
    case 'PET':
      return '🐶'
    case 'CONTAINER_INFO':
      return '📦'
  }
}

function computeVisibleBox3(root: THREE.Object3D, out: THREE.Box3): THREE.Box3 {
  root.updateWorldMatrix(true, true)
  out.makeEmpty()
  const stack: THREE.Object3D[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node !== root && !node.visible) continue
    if (node !== root && node.userData?.isInteractableRoot === true) {
      // Allow nested structural meshes only if root itself has no direct meshes yet;
      // still inspect children unless it's another distinct interactable item if root already has geometry
    }
    const mesh = node as THREE.Mesh
    if (mesh.isMesh && mesh.geometry) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
      if (mesh.geometry.boundingBox) {
        _nodeBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
        out.union(_nodeBox)
      }
    }
    const children = node.children
    for (let i = 0; i < children.length; i++) {
      stack.push(children[i])
    }
  }
  if (out.isEmpty()) {
    root.getWorldPosition(_vecWorld)
    out.setFromCenterAndSize(_vecWorld, _vecSize.set(0.6, 0.8, 0.6))
  }
  return out
}

function resolveFloorY(zone: InteractZone, boxMinY: number, centerY: number, centerZ: number): number {
  if (zone === 'interior_f2') return FLOOR2_Y
  if (zone === 'interior_f1') return 0
  if (zone === 'exterior') {
    return centerY >= 2.5 ? FLOOR2_Y : EXTERIOR_Y
  }
  if (boxMinY >= 3.2) return FLOOR2_Y
  return centerZ > 6.5 ? EXTERIOR_Y : 0
}

function isWalkablePoint(x: number, z: number, floorY: number): boolean {
  if (floorY >= 3.2) {
    if (x < -15.2 || x > 9.7 || z < -5.8 || z > 7.1) return false
    if (externalF2Blocked && externalF2Blocked(x, z, 0.25)) return false
    // Avoid F2 staircase opening roughly x in [4.8..9.6], z in [-5.8..-2.2]
    if (x > 5.0 && z < -2.3) return false
    return true
  }
  if (floorY < -0.05) {
    if (x < -21.8 || x > 16.5 || z < -9.5 || z > 15.3) return false
    // Outside must not spawn stand position inside house walls
    if (x > -15.7 && x < 10.1 && z > -6.1 && z < 6.05) return false
    // Avoid infinity pool water basin
    if (x > 5.5 && x < 15.15 && z > 6.65 && z < 14.15) return false
    // Avoid entrance Koi pond water zone
    if (x > -2.3 && x < 1.6 && z > 6.4 && z < 15.5) return false
    if (externalF1Blocked && externalF1Blocked(x, z, 0.25)) return false
    return true
  }
  // Floor 1 interior
  if (x < -15.0 || x > 9.5 || z < -5.5 || z > 5.65) return false
  if (externalF1Blocked && externalF1Blocked(x, z, 0.25)) return false
  // Bathroom wall partition except doorway
  if (x > -10.35 && x < -9.75 && (z < -1.4 || z > 1.0)) return false
  return true
}

/** Kiểm tra và chọn tọa độ đứng hợp lệ gần vật thể trên cùng mặt sàn tầng */
export function snapStandPosToWalkable(
  cx: number,
  cz: number,
  floorY: number,
  candidates: V3[],
): V3 {
  for (let i = 0; i < candidates.length; i++) {
    const [x, , z] = candidates[i]
    if (isWalkablePoint(x, z, floorY)) {
      return [x, floorY, z]
    }
  }
  if (candidates.length > 0) {
    const [fx, , fz] = candidates[0]
    if (floorY >= 3.2) {
      return [THREE.MathUtils.clamp(fx, -14.8, 9.2), floorY, THREE.MathUtils.clamp(fz, -5.3, 6.7)]
    }
    if (floorY < -0.05) {
      return [THREE.MathUtils.clamp(fx, -21.0, 15.8), floorY, THREE.MathUtils.clamp(fz, -9.0, 14.8)]
    }
    return [THREE.MathUtils.clamp(fx, -14.8, 9.1), floorY, THREE.MathUtils.clamp(fz, -5.2, 5.3)]
  }
  return [cx, floorY, cz]
}

interface ArchetypeMatch {
  baseId: string
  category: InteractionCategory
  label: string
  icon: string
  linkedStation?: Activity
  infoTitle?: string
  infoBody?: string
  pose?: 'sit' | 'lie' | 'recline'
}

function classifyArchetype(
  rawHint: string,
  zone: InteractZone,
  floorY: number,
  override?: InteractableRegistrationOptions,
): ArchetypeMatch {
  const lower = rawHint.toLowerCase()
  const fallbackClean = cleanHintLabel(rawHint) || 'Tương tác'
  const overrideCat = override?.category

  // 1. Pets
  if (lower.includes('mochi')) {
    return {
      baseId: 'mochi',
      category: overrideCat ?? 'PET',
      label: override?.label ?? 'Chơi với Mochi',
      icon: override?.icon ?? '🐶',
      linkedStation: override?.linkedStation ?? 'pet',
    }
  }
  if (lower.includes('bơ') || /\bbo\b/.test(lower)) {
    return {
      baseId: 'bo',
      category: overrideCat ?? 'PET',
      label: override?.label ?? 'Chơi với Bơ',
      icon: override?.icon ?? '🐕',
      linkedStation: override?.linkedStation ?? 'pet',
    }
  }

  // 2. Doors, Curtains & Stairs
  if (lower.includes('cửa chính') || lower.includes('cửa ra vào')) {
    return {
      baseId: 'main_door',
      category: overrideCat ?? 'DOOR_STAIR',
      label: override?.label ?? 'Mở/Đóng Cửa chính',
      icon: override?.icon ?? '🚪',
    }
  }
  if (lower.includes('cửa lùa') || lower.includes('sân hiên')) {
    return {
      baseId: 'terrace_door',
      category: overrideCat ?? 'DOOR_STAIR',
      label: override?.label ?? 'Mở/Đóng Cửa sân hiên',
      icon: override?.icon ?? '🚪',
    }
  }
  if (lower.includes('cầu thang')) {
    return {
      baseId: 'stairs',
      category: overrideCat ?? 'DOOR_STAIR',
      label: override?.label ?? 'Đi Cầu thang',
      icon: override?.icon ?? '🪜',
    }
  }
  if (lower.includes('rèm')) {
    return {
      baseId: floorY >= 3.2 || zone === 'interior_f2' ? 'curtains_f2' : 'curtains_f1',
      category: overrideCat ?? 'DOOR_STAIR',
      label: override?.label ?? 'Đóng/Mở Rèm cửa',
      icon: override?.icon ?? '🪟',
    }
  }

  // 3. Electronics
  if (/\btv\b/.test(lower) || lower.includes('tivi') || lower.includes('màn hình tv')) {
    return {
      baseId: 'tv',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt TV',
      icon: override?.icon ?? '📺',
    }
  }
  if (lower.includes('điều hòa') || lower.includes('máy lạnh')) {
    return {
      baseId: 'ac',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Điều hòa',
      icon: override?.icon ?? '❄️',
    }
  }
  if (lower.includes('máy giặt')) {
    return {
      baseId: 'laundry',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Máy giặt',
      icon: override?.icon ?? '🧺',
      linkedStation: override?.linkedStation ?? 'laundry',
    }
  }
  if (lower.includes('firepit') || lower.includes('lò sưởi')) {
    if (lower.includes('sofa') || lower.includes('ghế')) {
      return {
        baseId: 'outdoor_firepit_sofa',
        category: overrideCat ?? 'SEAT',
        label: override?.label ?? 'Ngồi Sofa sưởi ấm ngoài trời',
        icon: override?.icon ?? '🛋️',
        pose: 'sit',
      }
    }
    return {
      baseId: 'firepit',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Lửa Firepit',
      icon: override?.icon ?? '🔥',
    }
  }
  if (lower.includes('đèn sân vườn')) {
    return {
      baseId: 'yard_lights',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn sân vườn',
      icon: override?.icon ?? '💡',
    }
  }
  if (lower.includes('thác nước')) {
    return {
      baseId: 'waterfall',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Thác nước tràn',
      icon: override?.icon ?? '🌊',
    }
  }
  if (lower.includes('đèn lồng')) {
    return {
      baseId: 'rooftop_lantern',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Thắp/Tắt Đèn lồng Sân thượng',
      icon: override?.icon ?? '🏮',
    }
  }
  if (lower.includes('gương toàn thân')) {
    return {
      baseId: 'bath_full_mirror_light',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn gương toàn thân',
      icon: override?.icon ?? '✨',
    }
  }
  if (lower.includes('gương halo')) {
    return {
      baseId: zone === 'interior_f2' || floorY >= 3.2 ? 'girl_vanity_light' : 'bath_mirror_light',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn gương Halo',
      icon: override?.icon ?? '✨',
    }
  }
  if (lower.includes('led kệ sách')) {
    return {
      baseId: 'girl_shelf_led',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt LED kệ sách',
      icon: override?.icon ?? '✨',
    }
  }
  if (lower.includes('led đầu giường')) {
    return {
      baseId: 'floor1_headboard_led',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt LED đầu giường',
      icon: override?.icon ?? '✨',
    }
  }
  if (lower.includes('đèn vòm')) {
    return {
      baseId: 'floor2_arch_light',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn vòm nghệ thuật',
      icon: override?.icon ?? '✨',
    }
  }
  if (lower.includes('đèn cây đọc sách')) {
    return {
      baseId: 'floor2_reading_lamp',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn cây đọc sách',
      icon: override?.icon ?? '💡',
    }
  }
  if (lower.includes('đèn cây')) {
    return {
      baseId: 'floor1_floor_lamp',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn cây phòng khách',
      icon: override?.icon ?? '💡',
    }
  }
  if (lower.includes('đèn bàn')) {
    return {
      baseId: 'floor1_desk_lamp',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? 'Bật/Tắt Đèn bàn làm việc',
      icon: override?.icon ?? '💡',
    }
  }
  if (lower.includes('đèn ngủ')) {
    const isF2 = zone === 'interior_f2' || floorY >= 3.2
    return {
      baseId: isF2 ? 'girl_lamp' : 'floor1_bed_lamp',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? (isF2 ? 'Bật/Tắt Đèn ngủ Tầng 2' : 'Bật/Tắt Đèn ngủ Tầng 1'),
      icon: override?.icon ?? '💡',
    }
  }
  if (lower.includes('màn hình pc') || lower.includes('công tắc đèn')) {
    const isF2 = zone === 'interior_f2' || floorY >= 3.2
    return {
      baseId: isF2 ? 'girl_pc' : 'pc',
      category: overrideCat ?? 'ELECTRONIC',
      label: override?.label ?? fallbackClean,
      icon: override?.icon ?? '💻',
    }
  }

  // 4. Seats & Beds & Desks
  if (lower.includes('sofa') && (zone === 'exterior' || lower.includes('ngoài trời') || lower.includes('sưởi'))) {
    return {
      baseId: 'outdoor_firepit_sofa',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi Sofa sưởi ấm ngoài trời',
      icon: override?.icon ?? '🛋️',
      pose: 'sit',
    }
  }
  if (lower.includes('sofa')) {
    return {
      baseId: 'living_sofa',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi Sofa',
      icon: override?.icon ?? '🛋️',
      linkedStation: override?.linkedStation ?? 'tv',
      pose: 'sit',
    }
  }
  if (lower.includes('tắm nắng') || lower.includes('sundeck') && lower.includes('ghế')) {
    return {
      baseId: 'sun_lounger',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Nghỉ ghế tắm nắng',
      icon: override?.icon ?? '🛋️',
      pose: override?.customSitAnchor?.pose ?? 'recline',
    }
  }
  if (lower.includes('lounge sân thượng')) {
    return {
      baseId: 'rooftop_lounge',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi ghế Lounge Sân thượng',
      icon: override?.icon ?? '🪑',
      pose: 'sit',
    }
  }
  if (lower.includes('giường')) {
    const isF2 = zone === 'interior_f2' || floorY >= 3.2
    return {
      baseId: isF2 ? 'girl_bed' : 'floor1_bed',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? (isF2 ? 'Nằm Giường Tầng 2' : 'Nằm Giường Tầng 1'),
      icon: override?.icon ?? '🛏️',
      linkedStation: override?.linkedStation ?? (isF2 ? 'girl_sleep' : 'sleep'),
      pose: 'lie',
    }
  }
  if (lower.includes('bàn máy tính tầng 2') || (lower.includes('pc') && (zone === 'interior_f2' || floorY >= 3.2))) {
    return {
      baseId: 'girl_pc_desk',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi bàn PC Tầng 2',
      icon: override?.icon ?? '💻',
      linkedStation: override?.linkedStation ?? 'girl_pc',
      pose: 'sit',
    }
  }
  if (lower.includes('bàn làm việc') || lower.includes('công thái học') || lower.includes('pc')) {
    return {
      baseId: 'pc_desk',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi bàn làm việc PC',
      icon: override?.icon ?? '💻',
      linkedStation: override?.linkedStation ?? 'pc',
      pose: 'sit',
    }
  }
  if (lower.includes('ghế đọc sách')) {
    return {
      baseId: 'girl_nook',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi đọc sách',
      icon: override?.icon ?? '📚',
      linkedStation: override?.linkedStation ?? 'girl_nook',
      pose: 'sit',
    }
  }
  if (lower.includes('ghế lười') || lower.includes('bouclé') || lower.includes('boucle')) {
    return {
      baseId: 'girl_lounge',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi ghế lười thư giãn',
      icon: override?.icon ?? '🪑',
      linkedStation: override?.linkedStation ?? 'girl_lounge',
      pose: 'sit',
    }
  }
  if (lower.includes('trang điểm')) {
    return {
      baseId: 'girl_vanity',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Ngồi bàn trang điểm',
      icon: override?.icon ?? '💄',
      linkedStation: override?.linkedStation ?? 'girl_vanity',
      pose: 'sit',
    }
  }
  if (lower.includes('piano') || lower.includes('đàn')) {
    return {
      baseId: 'piano',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? 'Chơi Piano',
      icon: override?.icon ?? '🎹',
      linkedStation: override?.linkedStation ?? 'piano',
      pose: 'sit',
    }
  }
  if (lower.includes('ghế') || lower.includes('đệm')) {
    return {
      baseId: 'seat_generic',
      category: overrideCat ?? 'SEAT',
      label: override?.label ?? fallbackClean,
      icon: override?.icon ?? '🪑',
      linkedStation: override?.linkedStation,
      pose: override?.customSitAnchor?.pose ?? 'sit',
    }
  }

  // 5. Containers & Info Objects
  if (lower.includes('tủ quần áo') && (lower.includes('bạn gái') || lower.includes('linh') || zone === 'interior_f2')) {
    return {
      baseId: 'girl_wardrobe',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Mở tủ đồ Bạn Gái',
      icon: override?.icon ?? '👗',
      linkedStation: override?.linkedStation ?? 'girl_wardrobe',
      infoTitle: override?.infoTitle ?? 'Tủ quần áo của Linh',
      infoBody: override?.infoBody ?? 'Bộ sưu tập váy áo tinh tế với cửa kính và đèn LED âm tủ.',
    }
  }
  if (lower.includes('tủ quần áo') || lower.includes('tủ đồ')) {
    return {
      baseId: 'wardrobe',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Mở tủ đồ',
      icon: override?.icon ?? '👕',
      linkedStation: override?.linkedStation ?? 'wardrobe',
      infoTitle: override?.infoTitle ?? 'Tủ quần áo của Khoa',
      infoBody: override?.infoBody ?? 'Các bộ trang phục thường ngày và đồ mặc nhà gọn gàng.',
    }
  }
  if (lower.includes('giá treo')) {
    return {
      baseId: 'coat_rack',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Xem giá treo trang phục',
      icon: override?.icon ?? '🧥',
      infoTitle: override?.infoTitle ?? 'Giá treo trang phục',
      infoBody: override?.infoBody ?? 'Áo khoác len nhẹ, túi xách và mũ cói sẵn sàng cho chuyến dạo chơi.',
    }
  }
  if (lower.includes('bồn tắm')) {
    return {
      baseId: 'bathtub',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Thư giãn bồn tắm',
      icon: override?.icon ?? '🛁',
      linkedStation: override?.linkedStation ?? 'bath',
      infoTitle: override?.infoTitle ?? 'Bồn tắm Terrazzo Ấm áp',
      infoBody: override?.infoBody ?? 'Nước ấm cùng lớp bọt xà phòng bồng bềnh giúp giải tỏa mệt mỏi.',
    }
  }
  if (lower.includes('lavabo') || lower.includes('rửa tay')) {
    return {
      baseId: 'lavabo',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Rửa tay Lavabo',
      icon: override?.icon ?? '🪞',
      linkedStation: override?.linkedStation ?? 'wash',
      infoTitle: override?.infoTitle ?? 'Bồn rửa Lavabo & Gương Halo',
      infoBody: override?.infoBody ?? 'Nước mát sạch sẽ cùng ánh sáng gương dịu mắt để khởi đầu ngày mới.',
    }
  }
  if (lower.includes('cá koi')) {
    return {
      baseId: 'koi_pond',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Cho đàn cá Koi ăn',
      icon: override?.icon ?? '🐟',
      infoTitle: override?.infoTitle ?? 'Hồ Cá Koi Lối Vào',
      infoBody: override?.infoBody ?? 'Đàn cá Koi Nhật Bản đầy màu sắc đang tung tăng bơi lội quanh bậc đá.',
    }
  }
  if (lower.includes('nước ép')) {
    return {
      baseId: 'sundeck_juice',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Thưởng thức nước ép bên hồ bơi',
      icon: override?.icon ?? '🍹',
      infoTitle: override?.infoTitle ?? 'Bàn trà Sundeck & Nước ép',
      infoBody: override?.infoBody ?? 'Ly nước ép trái cây mát lạnh bên thềm gỗ hướng nhìn hồ bơi vô cực.',
    }
  }
  if (lower.includes('hồ bơi')) {
    return {
      baseId: 'infinity_pool',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Ngắm hồ bơi vô cực',
      icon: override?.icon ?? '🏊',
      infoTitle: override?.infoTitle ?? 'Hồ Bơi Vô Cực Muối Khoáng',
      infoBody: override?.infoBody ?? 'Mặt nước xanh ngọc phản chiếu bầu trời cùng dòng thác tràn dịu êm.',
    }
  }
  if (lower.includes('bếp') || lower.includes('bàn ăn') || lower.includes('tủ lạnh')) {
    return {
      baseId: 'kitchen_bar',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Quầy bếp & Pha chế',
      icon: override?.icon ?? '🍳',
      linkedStation: override?.linkedStation ?? 'drink',
      infoTitle: override?.infoTitle ?? 'Quầy Bếp & Đảo Đá Marble',
      infoBody: override?.infoBody ?? 'Không gian pha trà, cà phê và chuẩn bị những bữa ăn ấm cúng trong nhà.',
    }
  }
  if (lower.includes('cây nước') || lower.includes('pha trà')) {
    return {
      baseId: 'water_dispenser',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Rót nước & Pha trà',
      icon: override?.icon ?? '☕',
      linkedStation: override?.linkedStation ?? 'drink',
      infoTitle: override?.infoTitle ?? 'Cây Nước & Trà Hoa Cúc',
      infoBody: override?.infoBody ?? 'Lấy một ly nước mát, trà hoa cúc mật ong hoặc cà phê sữa thơm nồng.',
    }
  }
  if (lower.includes('bát ăn') || lower.includes('thức ăn')) {
    return {
      baseId: 'pet_feeder',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Cho Mochi & Bơ ăn',
      icon: override?.icon ?? '🥣',
      linkedStation: override?.linkedStation ?? 'feed',
      infoTitle: override?.infoTitle ?? 'Máy Cho Thú Cưng Ăn',
      infoBody: override?.infoBody ?? 'Thức ăn hạt thơm ngon và nước uống tự động cho hai bé Mochi và Bơ.',
    }
  }
  if (lower.includes('tủ sách') || lower.includes('đọc sách')) {
    return {
      baseId: 'bookshelf',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Đọc sách thư giãn',
      icon: override?.icon ?? '📖',
      linkedStation: override?.linkedStation ?? 'read',
      infoTitle: override?.infoTitle ?? 'Kệ Sách Kiến Trúc & Văn Học',
      infoBody: override?.infoBody ?? 'Tuyển tập sách nghệ thuật, kiến trúc tối giản và tản văn chữa lành.',
    }
  }
  if (lower.includes('phi tiêu')) {
    return {
      baseId: 'dartboard',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Chơi Phi tiêu',
      icon: override?.icon ?? '🎯',
      linkedStation: override?.linkedStation ?? 'darts',
      infoTitle: override?.infoTitle ?? 'Bảng Phi Tiêu Giải Trí',
      infoBody: override?.infoBody ?? 'Ngắm hồng tâm và thử độ chuẩn xác cùng 5 lượt phóng phi tiêu.',
    }
  }
  if (lower.includes('vẽ tranh') || lower.includes('canvas')) {
    return {
      baseId: 'easel_paint',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Vẽ tranh Canvas',
      icon: override?.icon ?? '🎨',
      linkedStation: override?.linkedStation ?? 'paint',
      infoTitle: override?.infoTitle ?? 'Góc Sáng Tạo Mỹ Thuật',
      infoBody: override?.infoBody ?? 'Khung toan cùng cọ vẽ màu nước và ánh sáng tự nhiên dịu nhẹ.',
    }
  }
  if (lower.includes('ảnh') || lower.includes('khung hình')) {
    return {
      baseId: 'wall_photo',
      category: overrideCat ?? 'CONTAINER_INFO',
      label: override?.label ?? 'Xem khung ảnh kỷ niệm',
      icon: override?.icon ?? '🖼️',
      infoTitle: override?.infoTitle ?? 'Khung Ảnh Kỷ Niệm',
      infoBody: override?.infoBody ?? 'Lưu giữ những khoảnh khắc ngọt ngào tại Tổ Ấm Chữa Lành.',
    }
  }

  const finalCategory = overrideCat ?? 'CONTAINER_INFO'
  return {
    baseId:
      fallbackClean
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'item',
    category: finalCategory,
    label: override?.label ?? fallbackClean,
    icon: override?.icon ?? extractLeadingIcon(rawHint, finalCategory),
    linkedStation: override?.linkedStation,
    infoTitle: override?.infoTitle ?? fallbackClean,
    infoBody: override?.infoBody ?? `Khu vực ${fallbackClean} trong ngôi nhà.`,
  }
}

function readInitialActiveState(id: string): boolean {
  const st = useStore.getState()
  if (id in st.electronicStates) return st.electronicStates[id]
  if (id === 'tv') return st.tvOn
  if (id === 'ac') return st.acOn
  if (id === 'pc') return st.pcState !== 'off'
  if (id === 'girl_pc') return st.girlPcState !== 'off'
  if (id.startsWith('floor1_floor_lamp')) return st.floor1FloorLampOn
  if (id.startsWith('floor1_bed_lamp')) return st.floor1BedLampOn
  if (id.startsWith('floor1_desk_lamp')) return st.floor1DeskLampOn
  if (id.startsWith('floor1_headboard_led')) return st.floor1HeadboardLedOn
  if (id.startsWith('bath_mirror_light')) return st.bathMirrorLightOn
  if (id.startsWith('bath_full_mirror_light')) return st.bathFullMirrorLightOn
  if (id.startsWith('laundry')) return st.laundryRunning
  if (id.startsWith('firepit')) return st.firepitLit
  if (id.startsWith('floor2_reading_lamp')) return st.floor2ReadingLampOn
  if (id.startsWith('floor2_arch_light')) return st.floor2ArchLightOn
  if (id.startsWith('girl_lamp')) return st.girlLampOn
  if (id.startsWith('girl_vanity_light')) return st.girlVanityLightOn
  if (id.startsWith('girl_shelf_led')) return st.girlShelfLedOn
  if (id.startsWith('yard_lights') || id.startsWith('waterfall') || id.startsWith('rooftop_lantern')) {
    return true
  }
  return false
}

function computeStandOffset(
  center: V3,
  size: V3,
  floorY: number,
  zone: InteractZone,
  linkedStation?: Activity,
  explicitStand?: V3,
): V3 {
  if (explicitStand) {
    return [explicitStand[0], explicitStand[1], explicitStand[2]]
  }
  if (linkedStation && linkedStation !== 'idle') {
    const stationCfg = STATIONS[linkedStation]
    if (stationCfg?.entryPos) {
      const ep = stationCfg.entryPos
      return [ep[0], floorY, ep[1]]
    }
  }

  const halfX = Math.max(0.35, size[0] * 0.5)
  const halfZ = Math.max(0.35, size[2] * 0.5)
  const roomCenterX = zone === 'exterior' ? -3.0 : -3.0
  const roomCenterZ = zone === 'exterior' ? 10.5 : 0.0
  const dirToCenterX = roomCenterX - center[0]
  const dirToCenterZ = roomCenterZ - center[2]

  const candidates: V3[] = []
  // Prioritize direction facing room center, then +Z, -Z, +X, -X
  if (Math.abs(dirToCenterZ) >= Math.abs(dirToCenterX)) {
    const signZ = dirToCenterZ >= 0 ? 1 : -1
    const signX = dirToCenterX >= 0 ? 1 : -1
    candidates.push(
      [center[0], floorY, center[2] + signZ * (halfZ + 0.6)],
      [center[0] + signX * (halfX + 0.6), floorY, center[2]],
      [center[0], floorY, center[2] - signZ * (halfZ + 0.6)],
      [center[0] - signX * (halfX + 0.6), floorY, center[2]],
    )
  } else {
    const signX = dirToCenterX >= 0 ? 1 : -1
    const signZ = dirToCenterZ >= 0 ? 1 : -1
    candidates.push(
      [center[0] + signX * (halfX + 0.6), floorY, center[2]],
      [center[0], floorY, center[2] + signZ * (halfZ + 0.6)],
      [center[0] - signX * (halfX + 0.6), floorY, center[2]],
      [center[0], floorY, center[2] - signZ * (halfZ + 0.6)],
    )
  }

  return snapStandPosToWalkable(center[0], center[2], floorY, candidates)
}

function makeUniqueMetaId(baseId: string, root: THREE.Object3D): string {
  const existing = registryByRoot.get(root)
  if (existing && (existing.id === baseId || existing.id.startsWith(`${baseId}_`))) {
    return existing.id
  }
  if (!registryById.has(baseId) || registryById.get(baseId)?.root === root) {
    return baseId
  }
  let idx = 2
  while (registryById.has(`${baseId}_${idx}`) && registryById.get(`${baseId}_${idx}`)?.root !== root) {
    idx++
  }
  return `${baseId}_${idx}`
}

/** Cập nhật lại bounding Box3 và standOffset sau khi mesh con gắn đầy đủ vào scene */
export function refreshInteractableBounds(meta: InteractionMeta): void {
  computeVisibleBox3(meta.root, _box)
  _box.getCenter(_vecCenter)
  _box.getSize(_vecSize)
  const cx = _vecCenter.x
  const cy = _vecCenter.y
  const cz = _vecCenter.z

  meta.center = [cx, cy, cz]
  meta.boxMin = [_box.min.x, _box.min.y, _box.min.z]
  meta.boxMax = [_box.max.x, _box.max.y, _box.max.z]
  meta.size = [_vecSize.x, _vecSize.y, _vecSize.z]
  meta.floorY = resolveFloorY(meta.zone, _box.min.y, cy, cz)

  const ud = meta.root.userData
  const customStand = Array.isArray(ud?.customStandOffset)
    ? (ud.customStandOffset as V3)
    : undefined
  meta.standOffset = computeStandOffset(
    meta.center,
    meta.size,
    meta.floorY,
    meta.zone,
    meta.linkedStation,
    customStand,
  )
}

/** Đăng ký & tự động gắn `userData.interaction` cho một root <Interact> */
export function registerInteractableArchetype(
  root: THREE.Object3D,
  options: InteractableRegistrationOptions = {},
): (() => void) | undefined {
  const ud = root.userData || (root.userData = {})
  const rawHint = String(
    options.hint ?? ud.interactHint ?? ud.interactLabel ?? root.name ?? '',
  ).trim()

  if (!rawHint || shouldSkipCharacterHint(rawHint)) {
    return undefined
  }

  const zone: InteractZone = options.zone ?? (ud.interactZone as InteractZone) ?? 'interior_f1'

  computeVisibleBox3(root, _box)
  _box.getCenter(_vecCenter)
  _box.getSize(_vecSize)

  const center: V3 = [_vecCenter.x, _vecCenter.y, _vecCenter.z]
  const boxMin: V3 = [_box.min.x, _box.min.y, _box.min.z]
  const boxMax: V3 = [_box.max.x, _box.max.y, _box.max.z]
  const size: V3 = [_vecSize.x, _vecSize.y, _vecSize.z]
  const floorY = resolveFloorY(zone, _box.min.y, _vecCenter.y, _vecCenter.z)

  const matched = classifyArchetype(rawHint, zone, floorY, options)
  const id = options.id ?? makeUniqueMetaId(matched.baseId, root)

  const customStand =
    options.customStandOffset ??
    options.standOffset ??
    (Array.isArray(ud.customStandOffset) ? (ud.customStandOffset as V3) : undefined)
  const customSit =
    options.customSitAnchor ??
    (ud.customSitAnchor && typeof ud.customSitAnchor === 'object'
      ? (ud.customSitAnchor as CustomSitAnchor)
      : undefined)

  const standOffset = computeStandOffset(
    center,
    size,
    floorY,
    zone,
    matched.linkedStation,
    customStand,
  )

  const prevMeta = registryByRoot.get(root)
  if (prevMeta && prevMeta.id !== id && registryById.get(prevMeta.id) === prevMeta) {
    registryById.delete(prevMeta.id)
  }

  const onClick = options.onClick ?? (ud.onInteractClick as ((e: ThreeEvent<MouseEvent>) => void) | undefined)
  const meta: InteractionMeta = {
    id,
    category: matched.category,
    label: matched.label,
    rawHint,
    standOffset,
    center,
    boxMin,
    boxMax,
    size,
    floorY,
    isActive: readInitialActiveState(id),
    zone,
    root,
    originalOnClick: onClick,
    linkedStation: matched.linkedStation,
    infoTitle: matched.infoTitle,
    infoBody: matched.infoBody,
    icon: matched.icon,
    customSitAnchor: customSit,
    pose: matched.pose ?? customSit?.pose,
  }

  ud.interactHint = rawHint
  ud.interactZone = zone
  if (onClick) ud.onInteractClick = onClick
  ud.interaction = meta

  registryByRoot.set(root, meta)
  registryById.set(id, meta)

  return () => {
    if (registryByRoot.get(root) === meta) {
      registryByRoot.delete(root)
    }
    if (registryById.get(id) === meta) {
      registryById.delete(id)
    }
    if (activeTargetMeta === meta) {
      activeTargetMeta = null
      useStore.getState().setActiveTargetUi(null)
    }
    if (pendingInteractionTarget === meta) {
      pendingInteractionTarget = null
    }
    if (highlightedRoot === root) {
      restoreRootHighlight(root)
      highlightedRoot = null
    }
    if (bounceRoot === root) {
      resetBounceTransform(root)
      bounceRoot = null
      bounceProgress = 1
    }
  }
}

/** Duyệt toàn bộ vật thể đã đăng ký trong raycastRegistry để gắn/làm mới metadata Box3 */
export function autoTagInteractionObjects(): InteractionMeta[] {
  const entries = getAllInteractableEntries()
  const out: InteractionMeta[] = []
  for (let i = 0; i < entries.length; i++) {
    const { root, zone } = entries[i]
    const existing = registryByRoot.get(root)
    if (existing) {
      existing.zone = zone
      const ud = root.userData
      if (ud?.interactHint && ud.interactHint !== existing.rawHint) {
        registerInteractableArchetype(root, { zone })
        const updated = registryByRoot.get(root)
        if (updated) out.push(updated)
      } else {
        if (ud?.onInteractClick) existing.originalOnClick = ud.onInteractClick
        if (ud?.customSitAnchor) existing.customSitAnchor = ud.customSitAnchor as CustomSitAnchor
        refreshInteractableBounds(existing)
        ud.interaction = existing
        out.push(existing)
      }
    } else {
      registerInteractableArchetype(root, { zone })
      const created = registryByRoot.get(root)
      if (created) out.push(created)
    }
  }
  return out
}

export function getAllInteractionMetas(): InteractionMeta[] {
  return Array.from(registryByRoot.values())
}

export function getActiveTargetMeta(): InteractionMeta | null {
  return activeTargetMeta
}

export function getPendingInteractionTarget(): InteractionMeta | null {
  return pendingInteractionTarget
}

export function setPendingInteractionTarget(meta: InteractionMeta | null): void {
  pendingInteractionTarget = meta
}

export function clearPendingInteractionTarget(): void {
  pendingInteractionTarget = null
}

// Liên kết không circular dependency tới store.ts
setPendingClearCallback(clearPendingInteractionTarget)

function getLiveMetaCenter(meta: InteractionMeta, out: [number, number, number]): void {
  if (meta.category === 'PET') {
    const petKey = meta.id === 'bo' ? 'bo' : 'mochi'
    const livePos = LIVE_ACTORS.dogs[petKey]?.pos
    if (livePos) {
      out[0] = livePos[0]
      out[1] = livePos[1]
      out[2] = livePos[2]
      return
    }
    meta.root.getWorldPosition(_vecWorld)
    out[0] = _vecWorld.x
    out[1] = _vecWorld.y
    out[2] = _vecWorld.z
    return
  }
  out[0] = meta.center[0]
  out[1] = meta.center[1]
  out[2] = meta.center[2]
}

const _liveCenterScratch: [number, number, number] = [0, 0, 0]

function computeHorizBoxDistSq(px: number, pz: number, meta: InteractionMeta): number {
  if (meta.category === 'PET') {
    getLiveMetaCenter(meta, _liveCenterScratch)
    const dx = px - _liveCenterScratch[0]
    const dz = pz - _liveCenterScratch[2]
    return dx * dx + dz * dz
  }
  const cx = px < meta.boxMin[0] ? meta.boxMin[0] : px > meta.boxMax[0] ? meta.boxMax[0] : px
  const cz = pz < meta.boxMin[2] ? meta.boxMin[2] : pz > meta.boxMax[2] ? meta.boxMax[2] : pz
  const dx = px - cx
  const dz = pz - cz
  return dx * dx + dz * dz
}

function triggerBounce(root: THREE.Object3D): void {
  if (bounceRoot && bounceRoot !== root) {
    resetBounceTransform(bounceRoot)
  }
  const meta = registryByRoot.get(root)
  if (!meta || meta.category === 'DOOR_STAIR' || meta.category === 'PET') return

  if (root.parent) {
    _vecLocal.set(meta.center[0], meta.boxMin[1], meta.center[2])
    root.parent.updateWorldMatrix(true, false)
    root.parent.worldToLocal(_vecLocal)
    bounceAnchorLocal.copy(_vecLocal)
  } else {
    bounceAnchorLocal.set(meta.center[0], meta.boxMin[1], meta.center[2])
  }
  bounceRoot = root
  bounceProgress = 0
}

function resetBounceTransform(root: THREE.Object3D): void {
  root.scale.setScalar(1)
  root.position.set(0, 0, 0)
}

function isHighlightableMesh(mesh: THREE.Mesh): boolean {
  if (!mesh.isMesh || !mesh.visible || !mesh.material) return false
  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  if (!mat) return false
  if (mat.depthWrite === false) return false
  if (mat.transparent && mat.opacity < 0.25) return false
  return true
}

function cloneMaterialWithEmissive(mat: THREE.Material): THREE.Material {
  if (mat instanceof THREE.MeshStandardMaterial) {
    if (mat.map instanceof THREE.CanvasTexture) return mat
    const cloned = mat.clone()
    const baseIntensity = cloned.emissiveIntensity ?? 0
    if (cloned.emissive.r + cloned.emissive.g + cloned.emissive.b < 0.05) {
      cloned.emissive.copy(bounceColorScratch)
    } else {
      cloned.emissive.lerp(bounceColorScratch, 0.35)
    }
    cloned.emissiveIntensity = Math.min(0.65, baseIntensity + 0.22)
    cloned.userData.__origHighlightBaseEi = baseIntensity
    return cloned
  }
  return mat
}

function disposeHighlightMaterial(mat: THREE.Material | THREE.Material[], base: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(mat)) {
    const baseArr = Array.isArray(base) ? base : []
    for (let i = 0; i < mat.length; i++) {
      if (mat[i] && mat[i] !== baseArr[i]) mat[i].dispose()
    }
  } else if (mat && mat !== base) {
    mat.dispose()
  }
}

function applyRootHighlight(root: THREE.Object3D): void {
  const stack: THREE.Object3D[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node !== root && node.userData?.isInteractableRoot === true) continue
    const mesh = node as THREE.Mesh
    if (isHighlightableMesh(mesh)) {
      const existing = meshHighlightCache.get(mesh)
      if (!existing || mesh.material !== existing.highlightMat) {
        if (existing) {
          disposeHighlightMaterial(existing.highlightMat, existing.baseMat)
        }
        const baseMat = mesh.material
        const highlightMat = Array.isArray(baseMat)
          ? baseMat.map((m) => cloneMaterialWithEmissive(m))
          : cloneMaterialWithEmissive(baseMat)
        if (highlightMat !== baseMat) {
          meshHighlightCache.set(mesh, { baseMat, highlightMat })
          mesh.material = highlightMat
        }
      }
    }
    const children = node.children
    for (let i = 0; i < children.length; i++) {
      stack.push(children[i])
    }
  }
}

function restoreRootHighlight(root: THREE.Object3D): void {
  const stack: THREE.Object3D[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node !== root && node.userData?.isInteractableRoot === true) continue
    const mesh = node as THREE.Mesh
    if (mesh.isMesh) {
      const rec = meshHighlightCache.get(mesh)
      if (rec) {
        if (mesh.material === rec.highlightMat) {
          mesh.material = rec.baseMat
        }
        disposeHighlightMaterial(rec.highlightMat, rec.baseMat)
        meshHighlightCache.delete(mesh)
      }
    }
    const children = node.children
    for (let i = 0; i < children.length; i++) {
      stack.push(children[i])
    }
  }
}

function updateHighlightPulse(root: THREE.Object3D, elapsedTime: number): void {
  const pulse = 0.2 + Math.sin(elapsedTime * 5) * 0.08
  const stack: THREE.Object3D[] = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (node !== root && node.userData?.isInteractableRoot === true) continue
    const mesh = node as THREE.Mesh
    if (mesh.isMesh) {
      const rec = meshHighlightCache.get(mesh)
      if (rec) {
        if (mesh.material !== rec.highlightMat) {
          // React đã đổi vật liệu khi trạng thái đèn/màn hình thay đổi -> clone lại trên vật liệu mới
          disposeHighlightMaterial(rec.highlightMat, rec.baseMat)
          const nextBase = mesh.material
          const nextHighlight = Array.isArray(nextBase)
            ? nextBase.map((m) => cloneMaterialWithEmissive(m))
            : cloneMaterialWithEmissive(nextBase)
          if (nextHighlight !== nextBase) {
            meshHighlightCache.set(mesh, { baseMat: nextBase, highlightMat: nextHighlight })
            mesh.material = nextHighlight
          } else {
            meshHighlightCache.delete(mesh)
          }
          continue
        }
        const h = rec.highlightMat
        if (h instanceof THREE.MeshStandardMaterial) {
          const baseEi = (h.userData.__origHighlightBaseEi as number) ?? 0
          h.emissiveIntensity = Math.min(0.7, baseEi + pulse)
        }
      }
    }
    const children = node.children
    for (let i = 0; i < children.length; i++) {
      stack.push(children[i])
    }
  }
}

/** Vòng lặp hiệu ứng hình ảnh mỗi frame: Scale Bounce (1.0 -> 1.04 -> 1.0) & Emissive Highlight cô lập */
export function stepInteractionVisualEffects(delta: number, elapsedTime: number): void {
  if (bounceRoot) {
    bounceProgress = Math.min(1, bounceProgress + delta / 0.28)
    const s = 1 + 0.04 * Math.sin(bounceProgress * Math.PI)
    bounceRoot.scale.setScalar(s)
    const inv = 1 - s
    bounceRoot.position.set(
      bounceAnchorLocal.x * inv,
      bounceAnchorLocal.y * inv,
      bounceAnchorLocal.z * inv,
    )
    if (bounceProgress >= 1) {
      resetBounceTransform(bounceRoot)
      bounceRoot = null
    }
  }

  const targetRoot = activeTargetMeta?.root ?? null
  if (highlightedRoot && highlightedRoot !== targetRoot) {
    restoreRootHighlight(highlightedRoot)
    highlightedRoot = null
  }
  if (targetRoot) {
    if (highlightedRoot !== targetRoot) {
      applyRootHighlight(targetRoot)
      highlightedRoot = targetRoot
      if (!bounceRoot) {
        triggerBounce(targetRoot)
      }
    }
    updateHighlightPulse(targetRoot, elapsedTime)
  }
}

/** Vòng lặp quét lân cận 10Hz (100ms): activeTarget (< 1.6), đóng containerCard (> 2.0), khớp hàng đợi Click-to-Walk */
export function stepProximityScan10Hz(
  activeCharPos?: V3,
  _otherCharPos?: V3,
): InteractionMeta | null {
  const st = useStore.getState()
  const activeChar = st.userRole || st.activeChar || 'boy'
  const charPos: V3 =
    activeCharPos ??
    (activeChar === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos)

  // 1. Check pending Click-to-Walk target arrival
  if (pendingInteractionTarget) {
    const pending = pendingInteractionTarget
    const sameFloorPending = Math.abs(charPos[1] - pending.floorY) < 1.5
    if (sameFloorPending) {
      const dxS = charPos[0] - pending.standOffset[0]
      const dzS = charPos[2] - pending.standOffset[2]
      const distStandSq = dxS * dxS + dzS * dzS
      const distBoxSq = computeHorizBoxDistSq(charPos[0], charPos[2], pending)
      if (distStandSq < QUEUE_ARRIVE_STAND_DIST_SQ || distBoxSq < QUEUE_ARRIVE_BOX_DIST_SQ) {
        pendingInteractionTarget = null
        st.setAvatarTarget(null)
        executeInteraction(pending)
      }
    }
  }

  // 2. Auto-close open Container Info Card when walking away > 2.0 units
  if (st.containerCard) {
    const cardMeta = registryById.get(st.containerCard.id)
    let cardFar = false
    if (cardMeta) {
      const sameFloorCard = Math.abs(charPos[1] - cardMeta.floorY) < 1.5
      const boxSq = computeHorizBoxDistSq(charPos[0], charPos[2], cardMeta)
      const dxS = charPos[0] - cardMeta.standOffset[0]
      const dzS = charPos[2] - cardMeta.standOffset[2]
      const standSq = dxS * dxS + dzS * dzS
      cardFar = !sameFloorCard || Math.min(boxSq, standSq) > CONTAINER_CARD_CLOSE_DIST_SQ
    } else {
      const a = st.containerCard.anchor
      const dx = charPos[0] - a[0]
      const dz = charPos[2] - a[2]
      const dy = Math.abs(charPos[1] - a[1])
      cardFar = dy > 2.2 || dx * dx + dz * dz > CONTAINER_CARD_CLOSE_DIST_SQ
    }
    if (cardFar) {
      st.setContainerCard(null)
    }
  }

  // 3. Find nearest valid interactable within < 1.6 units on the same floor
  let bestMeta: InteractionMeta | null = null
  let bestScore = Infinity

  registryByRoot.forEach((meta) => {
    if (!isHierarchyVisible(meta.root)) return
    if (!isZoneInteractive(meta.zone, st)) return

    if (meta.category === 'PET') {
      getLiveMetaCenter(meta, _liveCenterScratch)
      meta.center[0] = _liveCenterScratch[0]
      meta.center[1] = _liveCenterScratch[1]
      meta.center[2] = _liveCenterScratch[2]
      meta.floorY = Math.abs(meta.center[1] - FLOOR2_Y) < 1.5 ? FLOOR2_Y : meta.center[2] > 6.3 ? EXTERIOR_Y : 0
    }

    const sameFloor = Math.abs(charPos[1] - meta.floorY) < 1.5
    if (!sameFloor) return

    const boxSq = computeHorizBoxDistSq(charPos[0], charPos[2], meta)
    const dxS = charPos[0] - meta.standOffset[0]
    const dzS = charPos[2] - meta.standOffset[2]
    const standSq = dxS * dxS + dzS * dzS
    const effDistSq = Math.min(boxSq, standSq)

    if (effDistSq >= INTERACT_RANGE_SQ) return

    const dxC = charPos[0] - meta.center[0]
    const dzC = charPos[2] - meta.center[2]
    const centerSq = dxC * dxC + dzC * dzC
    const doorBias = meta.category === 'DOOR_STAIR' ? 0.35 : 0
    const volumeTie = Math.min(0.1, meta.size[0] * meta.size[2] * 0.002)
    const score = effDistSq + centerSq * 0.06 + doorBias + volumeTie

    if (score < bestScore) {
      bestScore = score
      bestMeta = meta
    }
  })

  activeTargetMeta = bestMeta
  const curUi = st.activeTargetUi
  const nextMeta = activeTargetMeta as InteractionMeta | null
  if (nextMeta) {
    if (!curUi || curUi.id !== nextMeta.id || curUi.label !== nextMeta.label) {
      st.setActiveTargetUi({
        id: nextMeta.id,
        label: nextMeta.label,
        category: nextMeta.category,
      })
    }
  } else if (curUi !== null) {
    st.setActiveTargetUi(null)
  }

  return activeTargetMeta
}

/** Kích hoạt vật thể activeTarget hiện tại bằng phím [F] hoặc bấm vào Floating Pill */
export function triggerActiveTargetFKey(): boolean {
  if (!activeTargetMeta) return false
  executeInteraction(activeTargetMeta)
  return true
}

/** Hysteresis cho cửa tự động: < 1.8m mở (3.24), > 2.2m đóng (4.84) */
export function getProximityDoorOpen(
  doorId: string,
  distSq: number,
  openSq = 3.24,
  closeSq = 4.84,
): boolean {
  const prev = doorHysteresisState.get(doorId) ?? false
  if (distSq < openSq) {
    doorHysteresisState.set(doorId, true)
    return true
  }
  if (distSq > closeSq) {
    doorHysteresisState.set(doorId, false)
    return false
  }
  return prev
}

/** Chỉ dẫn proximity cho Mochi & Bơ (< 2.2 units nhìn thẳng, nhún nhảy & theo sau 1.2u) */
export function getPetProximityDirectives(
  _petId: string,
  petPos: V3,
  charPos: V3,
  charYaw: number,
): PetProximityDirectives {
  const sameFloor = Math.abs(petPos[1] - charPos[1]) < 1.5
  const dx = charPos[0] - petPos[0]
  const dz = charPos[2] - petPos[2]
  const distSq = dx * dx + dz * dz
  const isNearby = sameFloor && distSq < PET_PROXIMITY_SQ

  if (!isNearby) {
    return {
      isNearby: false,
      shouldBounce: false,
      bounceOffsetY: 0,
      lookAtYaw: 0,
      followTarget: null,
      distSq,
    }
  }

  const timeSec = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001
  const lookAtYaw = Math.atan2(dx, dz)
  const bounceOffsetY = Math.max(0, Math.sin(timeSec * 8) * 0.055)
  const followTarget: V3 = [
    charPos[0] - Math.sin(charYaw) * PET_FOLLOW_DIST,
    charPos[1],
    charPos[2] - Math.cos(charYaw) * PET_FOLLOW_DIST,
  ]

  return {
    isNearby: true,
    shouldBounce: true,
    bounceOffsetY,
    lookAtYaw,
    followTarget,
    distSq,
  }
}

function readStoreElectronicForMetaId(id: string): boolean | null {
  const st = useStore.getState()
  if (id === 'tv') return st.tvOn
  if (id === 'ac') return st.acOn
  if (id === 'pc') return st.pcState !== 'off'
  if (id === 'girl_pc') return st.girlPcState !== 'off'
  if (id.startsWith('floor1_floor_lamp')) return st.floor1FloorLampOn
  if (id.startsWith('floor1_bed_lamp')) return st.floor1BedLampOn
  if (id.startsWith('floor1_desk_lamp')) return st.floor1DeskLampOn
  if (id.startsWith('floor1_headboard_led')) return st.floor1HeadboardLedOn
  if (id.startsWith('bath_mirror_light')) return st.bathMirrorLightOn
  if (id.startsWith('bath_full_mirror_light')) return st.bathFullMirrorLightOn
  if (id.startsWith('laundry')) return st.laundryRunning
  if (id.startsWith('firepit')) return st.firepitLit
  if (id.startsWith('floor2_reading_lamp')) return st.floor2ReadingLampOn
  if (id.startsWith('floor2_arch_light')) return st.floor2ArchLightOn
  if (id.startsWith('girl_lamp')) return st.girlLampOn
  if (id.startsWith('girl_vanity_light')) return st.girlVanityLightOn
  if (id.startsWith('girl_shelf_led')) return st.girlShelfLedOn
  return null
}

function buildDynamicSeatTarget(
  meta: InteractionMeta,
  char: ActiveChar,
): { id: string; char: ActiveChar; pos: V3; yaw: number; pose: 'sit' | 'lie' | 'recline'; label: string } {
  if (meta.customSitAnchor) {
    return {
      id: meta.id,
      char,
      pos: [...meta.customSitAnchor.pos] as V3,
      yaw: meta.customSitAnchor.yaw,
      pose: meta.customSitAnchor.pose ?? meta.pose ?? 'sit',
      label: meta.label,
    }
  }
  const seatY = Math.max(meta.floorY + 0.08, Math.min(meta.center[1], meta.boxMax[1] - 0.15))
  const yaw = Math.atan2(
    meta.standOffset[0] - meta.center[0],
    meta.standOffset[2] - meta.center[2],
  )
  return {
    id: meta.id,
    char,
    pos: [meta.center[0], seatY, meta.center[2]],
    yaw,
    pose: meta.pose ?? 'sit',
    label: meta.label,
  }
}

function buildContainerCardAnchor(meta: InteractionMeta): V3 {
  const wideSpan = Math.max(meta.size[0], meta.size[2]) > 3.2
  if (wideSpan) {
    return [
      THREE.MathUtils.lerp(meta.standOffset[0], meta.center[0], 0.35),
      Math.max(meta.floorY + 1.05, meta.boxMax[1] + 0.2),
      THREE.MathUtils.lerp(meta.standOffset[2], meta.center[2], 0.35),
    ]
  }
  return [
    meta.center[0],
    Math.min(meta.floorY + 2.15, meta.boxMax[1] + 0.25),
    meta.center[2],
  ]
}

/** Trình thực thi đa năng: xoay mặt nhìn vật thể + kích hoạt gốc + hành vi archetype */
export function executeInteraction(
  targetObject: InteractionMeta | THREE.Object3D,
  opts: ExecuteInteractionOptions = {},
): void {
  const meta: InteractionMeta | undefined =
    'root' in targetObject && 'category' in targetObject
      ? targetObject
      : (targetObject.userData?.interaction as InteractionMeta | undefined) ??
        registryByRoot.get(targetObject)
  if (!meta) return

  const st = useStore.getState()
  const char: ActiveChar = opts.forChar ?? st.userRole ?? st.activeChar ?? 'boy'
  const charPos: V3 = char === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos

  // Bước 1: Định hướng mượt nhân vật nhìn thẳng vào tâm vật thể
  getLiveMetaCenter(meta, _liveCenterScratch)
  const dx = _liveCenterScratch[0] - charPos[0]
  const dz = _liveCenterScratch[2] - charPos[2]
  if (dx * dx + dz * dz > 0.002) {
    st.setOrientCommand(char, Math.atan2(dx, dz))
  }

  triggerBounce(meta.root)
  const syntheticClick = makeSyntheticClickEvent()

  // Bước 2: Thực thi theo Archetype
  switch (meta.category) {
    case 'PET': {
      const petId: 'mochi' | 'bo' = meta.id === 'bo' ? 'bo' : 'mochi'
      if (opts.fromAuto || opts.forChar) {
        st.petDog(petId, !opts.fromAuto, char)
      } else if (meta.originalOnClick) {
        meta.originalOnClick(syntheticClick)
      } else {
        st.petDog(petId, true, char)
      }
      return
    }

    case 'DOOR_STAIR': {
      if (!opts.fromAuto) {
        meta.originalOnClick?.(syntheticClick)
      }
      return
    }

    case 'SEAT': {
      // Bật TV / PC / Firepit tự động theo ngữ cảnh ghế
      if (meta.linkedStation === 'tv' && !useStore.getState().tvOn) {
        st.toggleTv()
      } else if (meta.linkedStation === 'pc' && useStore.getState().pcState === 'off') {
        st.toggleElectronicState('pc', true)
      } else if (meta.linkedStation === 'girl_pc' && useStore.getState().girlPcState === 'off') {
        st.toggleElectronicState('girl_pc', true)
      } else if (
        (meta.id.includes('firepit') || meta.rawHint.toLowerCase().includes('sưởi')) &&
        !useStore.getState().firepitLit
      ) {
        st.toggleFirepit(true)
      }

      if (meta.linkedStation) {
        if (opts.fromAuto || opts.forChar) {
          st.startActivity(meta.linkedStation, !opts.fromAuto, char)
        } else if (meta.originalOnClick) {
          meta.originalOnClick(syntheticClick)
        } else {
          st.startActivity(meta.linkedStation, true, char)
        }
        return
      }

      // Ghế động ngoài STATIONS cố định (Ghế Sofa ngoài trời, Ghế tắm nắng, Ghế Sân thượng...)
      const prevSeat = useStore.getState().dynamicSeatTarget
      if (!opts.fromAuto && meta.originalOnClick) {
        meta.originalOnClick(syntheticClick)
      }
      const afterSeat = useStore.getState().dynamicSeatTarget
      // Nếu hàm gốc chưa tự set dynamicSeatTarget thì engine tự đặt tư thế ngồi/ngả
      if (!afterSeat || (afterSeat === prevSeat && afterSeat.id !== meta.id)) {
        const seatTarget = buildDynamicSeatTarget(meta, char)
        useStore.getState().setDynamicSeatTarget(seatTarget)
        if (!opts.fromAuto) {
          useStore.getState().notify(`${meta.icon} ${meta.label}`)
        }
      }
      return
    }

    case 'ELECTRONIC': {
      const storeBefore = readStoreElectronicForMetaId(meta.id)
      if (storeBefore !== null) {
        if (!opts.fromAuto && meta.originalOnClick) {
          meta.originalOnClick(syntheticClick)
        }
        const storeAfter = readStoreElectronicForMetaId(meta.id)
        if (storeAfter !== null && storeAfter === storeBefore) {
          meta.isActive = useStore.getState().toggleElectronicState(meta.id)
        } else if (storeAfter !== null) {
          meta.isActive = storeAfter
        }
      } else {
        if (meta.originalOnClick) {
          meta.originalOnClick(syntheticClick)
          meta.isActive = !meta.isActive
          useStore.getState().toggleElectronicState(meta.id, meta.isActive)
        } else {
          meta.isActive = useStore.getState().toggleElectronicState(meta.id)
        }
      }
      triggerBounce(meta.root)
      return
    }

    case 'CONTAINER_INFO': {
      const isModalTarget =
        meta.linkedStation === 'wardrobe' ||
        meta.linkedStation === 'girl_wardrobe' ||
        meta.linkedStation === 'piano' ||
        meta.id.startsWith('wall_photo')

      if (opts.fromAuto || opts.forChar) {
        if (meta.linkedStation) {
          st.startActivity(meta.linkedStation, !opts.fromAuto, char)
        }
        return
      }

      if (meta.originalOnClick) {
        meta.originalOnClick(syntheticClick)
      } else if (meta.linkedStation) {
        st.startActivity(meta.linkedStation, true, char)
      }

      if (!isModalTarget) {
        const cardZone: 'exterior' | 'interior_f1' | 'interior_f2' =
          meta.zone === 'interior_f2'
            ? 'interior_f2'
            : meta.zone === 'exterior'
              ? 'exterior'
              : 'interior_f1'
        useStore.getState().setContainerCard({
          id: meta.id,
          title: meta.infoTitle || meta.label,
          body: meta.infoBody || meta.rawHint,
          icon: meta.icon,
          anchor: buildContainerCardAnchor(meta),
          zone: cardZone,
        })
      }
      return
    }
  }
}

/** Xử lý click vào vật thể tương tác: gần (< 1.6 cùng tầng) -> chạy ngay; xa / khác tầng -> xếp hàng đi tới */
export function handleInteractClickOrQueue(
  metaOrRoot: InteractionMeta | THREE.Object3D,
  _e?: ThreeEvent<MouseEvent>,
): boolean {
  const meta: InteractionMeta | undefined =
    'root' in metaOrRoot && 'category' in metaOrRoot
      ? metaOrRoot
      : (metaOrRoot.userData?.interaction as InteractionMeta | undefined) ??
        registryByRoot.get(metaOrRoot)
  if (!meta) return false

  const st = useStore.getState()
  if (isHouseClosedOverview(st) && meta.zone !== 'exterior') {
    return false
  }

  refreshInteractableBounds(meta)
  const char: ActiveChar = st.userRole || st.activeChar || 'boy'
  const charPos: V3 = char === 'girl' ? LIVE_ACTORS.girlWorldPos : LIVE_ACTORS.khoaWorldPos
  const sameFloor = Math.abs(charPos[1] - meta.floorY) < 1.5

  const boxSq = computeHorizBoxDistSq(charPos[0], charPos[2], meta)
  const dxS = charPos[0] - meta.standOffset[0]
  const dzS = charPos[2] - meta.standOffset[2]
  const standSq = dxS * dxS + dzS * dzS

  if (sameFloor && Math.min(boxSq, standSq) <= INTERACT_RANGE_SQ) {
    pendingInteractionTarget = null
    executeInteraction(meta)
    return true
  }

  // Xếp hàng Click-to-Walk tới standOffset (tự động lên/xuống cầu thang nếu khác tầng)
  pendingInteractionTarget = meta
  st.setAvatarTarget([...meta.standOffset] as V3, false, true)
  st.notify(`🚶 Đang đi tới ${meta.label}`)
  return true
}

/** Utility-Based Autonomy: chọn mục tiêu tự động thông minh theo ngày/đêm & vai trò nhân vật */
export function pickUtilityAutoTarget(
  char: ActiveChar,
  darkMode: boolean,
  recentIds: string[] = [],
): InteractionMeta | null {
  const recentSet = new Set(recentIds)
  const candidates: Array<{ meta: InteractionMeta; score: number }> = []

  registryByRoot.forEach((meta) => {
    if (
      meta.category !== 'SEAT' &&
      meta.category !== 'ELECTRONIC' &&
      meta.category !== 'CONTAINER_INFO'
    ) {
      return
    }
    if (!isHierarchyVisible(meta.root)) return

    const id = meta.id
    // Quyền riêng tư vai nhân vật
    if (char === 'boy' && (id.startsWith('girl_wardrobe') || id.startsWith('girl_vanity'))) {
      return
    }
    if (char === 'girl' && id.startsWith('wardrobe')) {
      return
    }
    // Bỏ qua vật quá hẹp hoặc khung ảnh nhỏ gây lặp nhàm chán
    if (id.startsWith('wall_photo')) return

    let score = 30
    const isLight =
      id.includes('lamp') || id.includes('led') || id.includes('light') || id.includes('lantern')

    if (darkMode) {
      // Đêm khuya ấm áp: ưu tiên giường ngủ, sofa, firepit, đèn ấm, bồn tắm, TV
      if (id.includes('bed')) score += 55
      else if (id.includes('firepit')) score += 52
      else if (id === 'living_sofa' || id === 'tv') score += 48
      else if (id === 'bathtub') score += 42
      else if (isLight) {
        score += meta.isActive ? 16 : 44
      } else if (id === 'girl_lounge' || id === 'bookshelf' || id === 'piano') {
        score += 36
      } else if (id === 'sun_lounger' || id === 'koi_pond' || id === 'infinity_pool') {
        score -= 18
      }
    } else {
      // Ban ngày nắng ấm: ưu tiên bàn làm việc PC, bếp, sân vườn (tắm nắng, thác nước, hồ bơi, cá Koi), piano/sách/tranh/phi tiêu
      if (id.includes('pc') || id === 'kitchen_bar' || id === 'water_dispenser') score += 50
      else if (id.startsWith('sun_lounger') || id === 'koi_pond' || id === 'infinity_pool' || id === 'waterfall') {
        score += 48
      } else if (id === 'rooftop_lounge' || id === 'sundeck_juice') score += 42
      else if (id === 'piano' || id === 'easel_paint' || id === 'bookshelf' || id === 'dartboard') {
        score += 44
      } else if (id === 'girl_nook' || id === 'lavabo' || id === 'laundry' || id === 'pet_feeder') {
        score += 38
      } else if (id.includes('bed')) {
        score -= 16
      } else if (isLight) {
        score += meta.isActive ? 22 : -15
      }
    }

    // Thiện cảm khu vực tự nhiên của mỗi nhân vật (vẫn đi khắp nhà & sân vườn)
    if (char === 'girl' && meta.zone === 'interior_f2') score += 12
    if (char === 'boy' && (meta.zone === 'interior_f1' || meta.zone === 'exterior')) score += 10
    if (char === 'girl' && meta.zone === 'exterior' && !darkMode) score += 8

    // Tránh lặp lại vật vừa dùng gần đây
    if (recentSet.has(id)) score -= 95

    // Thêm chút ngẫu nhiên nhỏ tạo nhịp sống sinh động
    score += Math.random() * 14
    candidates.push({ meta, score })
  })

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  const topN = Math.min(4, candidates.length)
  const pickedIdx = Math.floor(Math.random() * topN)
  return candidates[pickedIdx].meta
}

function projectPoint(
  camera: THREE.Camera,
  wx: number,
  wy: number,
  wz: number,
  width: number,
  height: number,
): { visible: boolean; x: number; y: number } {
  _projVec.set(wx, wy, wz).project(camera)
  if (_projVec.z < -1 || _projVec.z > 1) {
    return { visible: false, x: 0, y: 0 }
  }
  const sx = (_projVec.x * 0.5 + 0.5) * width
  const sy = (-_projVec.y * 0.5 + 0.5) * height
  return { visible: true, x: sx, y: sy }
}

/** Chiếu tọa độ 3D -> 2D không cấp phát bộ nhớ để cập nhật UI overlay bằng transform trực tiếp */
export function projectInteractionOverlays(
  camera: THREE.Camera,
  width: number,
  height: number,
  boyPos?: V3,
  girlPos?: V3,
): void {
  if (width <= 0 || height <= 0) {
    PROJECTED_UI_STATE.pillVisible = false
    PROJECTED_UI_STATE.cardVisible = false
    PROJECTED_UI_STATE.boyIntentVisible = false
    PROJECTED_UI_STATE.girlIntentVisible = false
    return
  }

  // 1. Floating [F] {label} pill trên activeTarget (< 1.6 units)
  if (activeTargetMeta) {
    let px = activeTargetMeta.center[0]
    let py = Math.min(activeTargetMeta.boxMax[1] + 0.35, activeTargetMeta.floorY + 2.55)
    let pz = activeTargetMeta.center[2]
    if (activeTargetMeta.category === 'PET') {
      getLiveMetaCenter(activeTargetMeta, _liveCenterScratch)
      px = _liveCenterScratch[0]
      py = _liveCenterScratch[1] + 0.72
      pz = _liveCenterScratch[2]
    }
    const p = projectPoint(camera, px, py, pz, width, height)
    PROJECTED_UI_STATE.pillVisible =
      p.visible && p.x >= 20 && p.x <= width - 20 && p.y >= 20 && p.y <= height - 20
    PROJECTED_UI_STATE.pillX = THREE.MathUtils.clamp(p.x, 70, Math.max(70, width - 70))
    PROJECTED_UI_STATE.pillY = THREE.MathUtils.clamp(p.y, 40, Math.max(40, height - 40))
    PROJECTED_UI_STATE.pillLabel = activeTargetMeta.label
  } else {
    PROJECTED_UI_STATE.pillVisible = false
    PROJECTED_UI_STATE.pillLabel = ''
  }

  // 2. Floating Container Info Card
  const st = useStore.getState()
  if (st.containerCard) {
    const a = st.containerCard.anchor
    const p = projectPoint(camera, a[0], a[1], a[2], width, height)
    if (p.visible) {
      PROJECTED_UI_STATE.cardVisible = true
      PROJECTED_UI_STATE.cardX = THREE.MathUtils.clamp(p.x, 160, Math.max(160, width - 160))
      PROJECTED_UI_STATE.cardY = THREE.MathUtils.clamp(p.y, 90, Math.max(90, height - 130))
    } else {
      PROJECTED_UI_STATE.cardVisible = true
      PROJECTED_UI_STATE.cardX = Math.max(180, width - 220)
      PROJECTED_UI_STATE.cardY = Math.max(120, height * 0.35)
    }
  } else {
    PROJECTED_UI_STATE.cardVisible = false
  }

  // 3. Avatar Auto Intention Bubble trên đầu Khoa & Bạn Gái
  const bPos = boyPos ?? LIVE_ACTORS.khoaWorldPos
  const boyIntent = st.autoIntent.boy
  if (boyIntent) {
    const p = projectPoint(camera, bPos[0], bPos[1] + 2.12, bPos[2], width, height)
    const onScreen = p.visible && p.x >= 16 && p.x <= width - 16 && p.y >= 16 && p.y <= height - 16
    PROJECTED_UI_STATE.boyIntentVisible = onScreen
    PROJECTED_UI_STATE.boyIntentX = p.x
    PROJECTED_UI_STATE.boyIntentY = p.y
    PROJECTED_UI_STATE.boyIntentIcon = boyIntent.icon
    PROJECTED_UI_STATE.boyIntentLabel = boyIntent.label
  } else {
    PROJECTED_UI_STATE.boyIntentVisible = false
  }

  const gPos = girlPos ?? LIVE_ACTORS.girlWorldPos
  const girlIntent = st.autoIntent.girl
  if (girlIntent) {
    const p = projectPoint(camera, gPos[0], gPos[1] + 2.02, gPos[2], width, height)
    const onScreen = p.visible && p.x >= 16 && p.x <= width - 16 && p.y >= 16 && p.y <= height - 16
    PROJECTED_UI_STATE.girlIntentVisible = onScreen
    PROJECTED_UI_STATE.girlIntentX = p.x
    PROJECTED_UI_STATE.girlIntentY = p.y
    PROJECTED_UI_STATE.girlIntentIcon = girlIntent.icon
    PROJECTED_UI_STATE.girlIntentLabel = girlIntent.label
  } else {
    PROJECTED_UI_STATE.girlIntentVisible = false
  }
}
