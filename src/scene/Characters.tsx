import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, type Activity } from '../store'
import { isBlocked, isBlockedTier2 } from './Furniture'
import { LIVE_ACTORS, OUTFITS, STATIONS, type V3 } from '../data/config'
import { broadcastPosSync, REMOTE_ACTORS } from '../presence'
import { openBookPages } from './textures'

function Capsule({
  p = [0, 0, 0],
  r = [0, 0, 0],
  s = [1, 1, 1],
  rad,
  len,
  c,
  rough = 0.85,
  metal = 0,
}: {
  p?: V3
  r?: V3
  s?: V3
  rad: number
  len: number
  c: string
  rough?: number
  metal?: number
}) {
  return (
    <mesh position={p} rotation={r} scale={s} castShadow receiveShadow>
      <capsuleGeometry args={[rad, len, 8, 16]} />
      <meshStandardMaterial color={c} roughness={rough} metalness={metal} />
    </mesh>
  )
}

function Ball({ p, s, c, rough = 0.85 }: { p: V3; s: V3; c: string; rough?: number }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[1, 20, 16]} />
      <meshStandardMaterial color={c} roughness={rough} />
    </mesh>
  )
}

// Mạng lưới điểm dẫn đường thông thoáng khắp Tầng 1, Phòng tắm & Sân vườn ngoài trời
const NAV_NODES: [number, number][] = [
  [-8.5, -3.4],
  [-8.5, -2.0],
  [-6.8, -3.8],
  [-5.5, -2.0],
  [-4.9, -2.5],
  [-3.85, -2.0],
  [-2.6, -2.0],
  [-1.2, -2.0],
  [0.85, -2.2],
  [0.85, -3.8],
  [2.85, -3.2],
  [5.35, -3.8],
  [-5.5, 0.2],
  [-5.5, 1.8],
  [-5.5, 4.85],
  [-7.2, 4.88],
  [-8.85, 4.92],
  [-0.5, 0.5],
  [-0.5, 2.8],
  [-0.5, 4.6],
  [1.2, 0.8],
  [1.2, 2.85],
  [2.85, 2.85],
  [4.15, 2.85],
  [7.35, 2.2],
  [7.35, -2.0],
  [-10.0, -3.4],
  [-11.6, -3.4],
  [-12.4, -4.4],
  [-10.6, -4.4],
  [-12.2, -1.6],
  [-12.2, 1.2],
  // Hành lang cửa chính & Lối đá bước dạo ngoài sân
  [-1.45, 5.2],
  [-1.45, 6.14],
  [-1.45, 7.1],
  [-1.45, 9.5],
  [-1.45, 11.8],
  [-1.45, 13.8],
  // Nhánh phải: Sundeck, mép hồ bơi & sàn gỗ hông phải
  [1.2, 10.5],
  [2.0, 12.0],
  [1.6, 7.2],
  [4.8, 6.7],
  [4.65, 10.5],
  [4.65, 13.2],
  [11.8, 6.5],
  [11.8, 0.5],
  // Nhánh trái: Firepit Lounge & bãi cỏ
  [-6.0, 13.5],
  [-11.5, 13.5],
  [-14.5, 13.5],
  [-15.5, 10.5],
  [-8.2, 11.2],
  [-10.95, 12.6],
  [-17.8, 4.0],
]

/** Tính cao độ mặt sàn / sân vườn tại tọa độ (x, z) khớp chính xác LuxuryLandscaping.tsx */
export function getGroundY(x: number, z: number): number {
  // Bên trong nhà Tầng 1, Phòng tắm & ngưỡng cửa chính
  if (x >= -15.88 && x <= 10.28 && z >= -6.28 && z <= 6.28) {
    return 0
  }

  // Hiên cửa chính (Porch Landing: x -3.10..+0.30, z 6.28..7.84, top y = -0.01)
  if (x >= -3.1 && x <= 0.3 && z > 6.28 && z <= 7.84) {
    return -0.01
  }

  // 5 phiến đá bước dạo nổi trên mặt nước (giật cấp mượt từ -0.0525 -> -0.1405)
  if (x >= -2.85 && x <= 0.05 && z > 7.84 && z <= 14.72) {
    if (z < 7.98) {
      return THREE.MathUtils.lerp(-0.01, -0.0525, (z - 7.84) / (7.98 - 7.84))
    }
    if (z <= 9.02) return -0.0525
    if (z < 9.32) {
      return THREE.MathUtils.lerp(-0.0525, -0.0825, (z - 9.02) / (9.32 - 9.02))
    }
    if (z <= 10.38) return -0.0825
    if (z < 10.68) {
      return THREE.MathUtils.lerp(-0.0825, -0.1075, (z - 10.38) / (10.68 - 10.38))
    }
    if (z <= 11.72) return -0.1075
    if (z < 12.02) {
      return THREE.MathUtils.lerp(-0.1075, -0.1275, (z - 11.72) / (12.02 - 11.72))
    }
    if (z <= 13.08) return -0.1275
    if (z < 13.39) {
      return THREE.MathUtils.lerp(-0.1275, -0.1405, (z - 13.08) / (13.39 - 13.08))
    }
    return -0.1405
  }

  // Sàn gỗ Sundeck cạnh hồ bơi (x: 1.10..5.60, z: 6.32..14.12, top y = -0.15)
  if (x >= 1.1 && x <= 5.6 && z >= 6.32 && z <= 14.12) {
    return -0.15
  }

  // Đường dạo gỗ sườn phải (x: 10.28..13.36, z: -6.30..7.20, top y = -0.175)
  if (x >= 10.28 && x <= 13.36 && z >= -6.3 && z <= 7.2) {
    return -0.175
  }

  // Đá bước dạo nối Firepit Lounge sang lối chính (x: -5.725..-4.575, z: 10.55..11.85, top y = -0.155)
  if (x >= -5.725 && x <= -4.575 && z >= 10.55 && z <= 11.85) {
    return -0.155
  }

  // Sân lát đá tối khu Firepit Lounge (x: -16.55..-6.05, z: 7.90..14.10, top y = -0.165)
  if (x >= -16.55 && x <= -6.05 && z >= 7.9 && z <= 14.1) {
    return -0.165
  }

  // Thảm cỏ & sỏi trắng ngoài trời (top y = -0.20)
  return -0.2
}

// Mạng lưới điểm dẫn đường thông thoáng trên Tầng 2 (tránh giường ngủ, cầu thang & lan can giếng trời)
const NAV_NODES_TIER2: [number, number][] = [
  [-8.85, -0.45],
  [-8.2, -1.6],
  [-6.8, -1.6],
  [-5.0, -1.6],
  [-3.2, -1.6],
  [-6.2, 0.0],
  [-6.2, 2.4],
  [-1.8, 0.0],
  [-1.8, 2.4],
  [-1.5, -1.6],
  [0.5, -2.2],
  [2.25, -3.6],
  [4.95, -3.6],
  [6.2, -2.4],
  [7.65, -3.5],
  [5.4, -1.2],
]

function isSegmentClear(x1: number, z1: number, x2: number, z2: number): boolean {
  const dist = Math.hypot(x2 - x1, z2 - z1)
  if (dist < 0.25) return true
  const steps = Math.max(2, Math.ceil(dist / 0.22))
  const startBlocked = isBlocked(x1, z1, 0.16)
  const endBlocked = isBlocked(x2, z2, 0.16)
  const startIdx = startBlocked ? Math.min(steps - 1, Math.ceil(0.45 / 0.22)) : 1
  const endIdx = endBlocked ? Math.max(startIdx, steps - Math.ceil(0.35 / 0.22)) : steps - 1
  for (let i = startIdx; i <= endIdx; i++) {
    const t = i / steps
    if (isBlocked(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, 0.16)) {
      return false
    }
  }
  return true
}

function isSegmentClearTier2(x1: number, z1: number, x2: number, z2: number): boolean {
  const dist = Math.hypot(x2 - x1, z2 - z1)
  if (dist < 0.25) return true
  const steps = Math.max(2, Math.ceil(dist / 0.22))
  const startBlocked = isBlockedTier2(x1, z1, 0.16)
  const endBlocked = isBlockedTier2(x2, z2, 0.16)
  const startIdx = startBlocked ? Math.min(steps - 1, Math.ceil(0.45 / 0.22)) : 1
  const endIdx = endBlocked ? Math.max(startIdx, steps - Math.ceil(0.35 / 0.22)) : steps - 1
  for (let i = startIdx; i <= endIdx; i++) {
    const t = i / steps
    if (isBlockedTier2(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, 0.16)) {
      return false
    }
  }
  return true
}

export function getNextWaypoint(cx: number, cz: number, tx: number, tz: number): [number, number] {
  if (Math.hypot(tx - cx, tz - cz) < 0.45 || isSegmentClear(cx, cz, tx, tz)) {
    return [tx, tz]
  }
  const pts: [number, number][] = [[cx, cz], ...NAV_NODES, [tx, tz]]
  const n = pts.length
  const dist = new Array(n).fill(Infinity)
  const nextHop = new Array(n).fill(-1)
  const visited = new Array(n).fill(false)
  dist[n - 1] = 0

  for (let iter = 0; iter < n; iter++) {
    let u = -1
    let best = Infinity
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < best) {
        best = dist[i]
        u = i
      }
    }
    if (u === -1 || u === 0) break
    visited[u] = true
    for (let v = 0; v < n; v++) {
      if (visited[v] || v === u) continue
      const [ux, uz] = pts[u]
      const [vx, vz] = pts[v]
      const d = Math.hypot(ux - vx, uz - vz)
      if (d > 0.12 && isSegmentClear(vx, vz, ux, uz)) {
        if (dist[u] + d < dist[v]) {
          dist[v] = dist[u] + d
          nextHop[v] = u
        }
      }
    }
  }

  const hop = nextHop[0]
  if (hop !== -1) {
    return pts[hop]
  }
  // Fallback chống kẹt: nếu đang đứng sát vật cản, chọn NAV_NODE gần nhất có đường tới đích
  let bestFallback = -1
  let bestScore = Infinity
  for (let i = 1; i < n - 1; i++) {
    const dToNode = Math.hypot(pts[i][0] - cx, pts[i][1] - cz)
    if (dToNode > 0.25 && dist[i] + dToNode < bestScore) {
      bestScore = dist[i] + dToNode
      bestFallback = i
    }
  }
  if (bestFallback !== -1) {
    return pts[bestFallback]
  }
  return [tx, tz]
}

export function getNextWaypointTier2(cx: number, cz: number, tx: number, tz: number): [number, number] {
  if (Math.hypot(tx - cx, tz - cz) < 0.45 || isSegmentClearTier2(cx, cz, tx, tz)) {
    return [tx, tz]
  }
  const pts: [number, number][] = [[cx, cz], ...NAV_NODES_TIER2, [tx, tz]]
  const n = pts.length
  const dist = new Array(n).fill(Infinity)
  const nextHop = new Array(n).fill(-1)
  const visited = new Array(n).fill(false)
  dist[n - 1] = 0

  for (let iter = 0; iter < n; iter++) {
    let u = -1
    let best = Infinity
    for (let i = 0; i < n; i++) {
      if (!visited[i] && dist[i] < best) {
        best = dist[i]
        u = i
      }
    }
    if (u === -1 || u === 0) break
    visited[u] = true
    for (let v = 0; v < n; v++) {
      if (visited[v] || v === u) continue
      const [ux, uz] = pts[u]
      const [vx, vz] = pts[v]
      const d = Math.hypot(ux - vx, uz - vz)
      if (d > 0.12 && isSegmentClearTier2(vx, vz, ux, uz)) {
        if (dist[u] + d < dist[v]) {
          dist[v] = dist[u] + d
          nextHop[v] = u
        }
      }
    }
  }

  const hop = nextHop[0]
  if (hop !== -1) {
    return pts[hop]
  }
  let bestFallback = -1
  let bestScore = Infinity
  for (let i = 1; i < n - 1; i++) {
    const dToNode = Math.hypot(pts[i][0] - cx, pts[i][1] - cz)
    if (dToNode > 0.25 && dist[i] + dToNode < bestScore) {
      bestScore = dist[i] + dToNode
      bestFallback = i
    }
  }
  if (bestFallback !== -1) {
    return pts[bestFallback]
  }
  return [tx, tz]
}

/** Bộ xử lý đi bộ tự do đa tầng (Tầng 1 <-> Cầu thang <-> Tầng 2) bằng phím W A S D hoặc nhấp chuột cho cả Nam & Nữ */
export function stepCharacterWalk(
  posRef: { current: [number, number] },
  floorYRef: { current: number },
  yawRef: { current: number },
  phaseRef: { current: number },
  moveX: number,
  moveZ: number,
  shiftDown: boolean,
  avatarTarget: V3 | null,
  clearTarget: () => void,
  delta: number,
  otherPos?: [number, number],
  otherFloorY?: number,
): boolean {
  let vx = 0
  let vz = 0
  let moving = false

  const cx = posRef.current[0]
  const cz = posRef.current[1]
  const cy = floorYRef.current
  const midStair = cy >= 0.08 && cy <= 4.27

  // Tốc độ đi bộ nhanh nhẹn theo yêu cầu: bình thường 2.45 m/s, chạy Shift 3.4 m/s, leo cầu thang 1.55 m/s
  const walkSpeed = midStair ? 1.55 : shiftDown ? 3.4 : 2.45

  if (moveX !== 0 || moveZ !== 0) {
    const len = Math.hypot(moveX, moveZ)
    vx = (moveX / len) * walkSpeed
    vz = (moveZ / len) * walkSpeed
    moving = true
    if (avatarTarget) clearTarget()
  } else if (avatarTarget) {
    const [tx, ty, tz] = avatarTarget
    const wantTier2 = ty > 2.0
    const isTier2 = cy > 2.0

    let goalX = tx
    let goalZ = tz

    if (midStair) {
      // Đang ở trên cầu thang: đi thẳng hết chiều cầu thang tới đỉnh [-8.85, -0.45] hoặc chân [-8.85, 4.92]
      goalX = -8.85
      goalZ = wantTier2 ? -0.45 : 4.92
    } else if (wantTier2 && !isTier2) {
      // Đang ở Tầng 1 muốn lên Tầng 2: đi tới chân cầu thang [-8.85, 4.92] trước
      const distToBottom = Math.hypot(cx - -8.85, cz - 4.92)
      if (distToBottom < 0.38) {
        floorYRef.current = 0.12
        goalX = -8.85
        goalZ = -0.45
      } else {
        const [wx, wz] = getNextWaypoint(cx, cz, -8.85, 4.92)
        goalX = wx
        goalZ = wz
      }
    } else if (!wantTier2 && isTier2) {
      // Đang ở Tầng 2 muốn xuống Tầng 1: đi tới đỉnh cầu thang [-8.85, -0.45] trước
      const distToTop = Math.hypot(cx - -8.85, cz - -0.45)
      if (distToTop < 0.38) {
        floorYRef.current = 4.22
        goalX = -8.85
        goalZ = 4.92
      } else {
        const [wx, wz] = getNextWaypointTier2(cx, cz, -8.85, -0.45)
        goalX = wx
        goalZ = wz
      }
    } else if (isTier2) {
      const [wx, wz] = getNextWaypointTier2(cx, cz, tx, tz)
      goalX = wx
      goalZ = wz
    } else {
      const [wx, wz] = getNextWaypoint(cx, cz, tx, tz)
      goalX = wx
      goalZ = wz
    }

    const dx = goalX - cx
    const dz = goalZ - cz
    const dist = Math.hypot(dx, dz)
    const expectedTy = wantTier2 ? ty : getGroundY(tx, tz)
    const totalDist = Math.hypot(tx - cx, tz - cz) + Math.abs(expectedTy - floorYRef.current)
    if (totalDist > 0.18 && dist > 0.02) {
      vx = (dx / dist) * walkSpeed
      vz = (dz / dist) * walkSpeed
      moving = true
    } else {
      clearTarget()
    }
  }

  if (moving) {
    let nx = cx + vx * delta
    let nz = cz + vz * delta

    // Chặn không cho 2 nhân vật đi xuyên qua nhau khi ở cùng 1 tầng
    if (otherPos && otherFloorY !== undefined && Math.abs(cy - otherFloorY) < 0.65) {
      const distToOther = Math.hypot(nx - otherPos[0], nz - otherPos[1])
      if (distToOther < 0.52) {
        const pushX = nx - otherPos[0]
        const pushZ = nz - otherPos[1]
        const pushLen = Math.hypot(pushX, pushZ) || 0.001
        nx = otherPos[0] + (pushX / pushLen) * 0.54
        nz = otherPos[1] + (pushZ / pushLen) * 0.54
      }
    }

    const manualStairEntry =
      (moveX !== 0 || moveZ !== 0) &&
      nx >= -9.45 &&
      nx <= -8.25 &&
      ((floorYRef.current < 0.1 && nz >= 4.4 && nz <= 5.05 && vz < 0) ||
        (floorYRef.current > 4.25 && nz >= -0.55 && nz <= 0.65 && vz > 0))

    if (midStair || manualStairEntry || (floorYRef.current >= 0.08 && floorYRef.current <= 4.27)) {
      posRef.current[0] = THREE.MathUtils.clamp(nx, -9.25, -8.45)
      posRef.current[1] = THREE.MathUtils.clamp(nz, -0.5, 5.0)
      const stairProgress = THREE.MathUtils.clamp((4.75 - posRef.current[1]) / (4.75 - 0.4), 0, 1)
      if (posRef.current[1] <= -0.35) {
        floorYRef.current = 4.35
      } else if (posRef.current[1] >= 4.82) {
        floorYRef.current = getGroundY(posRef.current[0], posRef.current[1])
      } else {
        floorYRef.current = THREE.MathUtils.clamp(stairProgress * 4.35, 0.1, 4.25)
      }
    } else if (floorYRef.current > 2.0) {
      const curStuck = isBlockedTier2(cx, cz, 0.18)
      let moved = false
      if (curStuck || !isBlockedTier2(nx, nz, 0.18)) {
        posRef.current[0] = nx
        posRef.current[1] = nz
        moved = true
      } else {
        if (!isBlockedTier2(nx, cz, 0.18)) {
          posRef.current[0] = nx
          moved = true
        }
        if (!isBlockedTier2(posRef.current[0], nz, 0.18)) {
          posRef.current[1] = nz
          moved = true
        }
      }
      // Nếu bị vướng góc cạnh đồ vật, tự động trượt vuông góc qua góc cản
      if (!moved) {
        const s1x = cx - vz * delta * 0.9
        const s1z = cz + vx * delta * 0.9
        const s2x = cx + vz * delta * 0.9
        const s2z = cz - vx * delta * 0.9
        if (!isBlockedTier2(s1x, s1z, 0.16)) {
          posRef.current[0] = s1x
          posRef.current[1] = s1z
        } else if (!isBlockedTier2(s2x, s2z, 0.16)) {
          posRef.current[0] = s2x
          posRef.current[1] = s2z
        } else {
          posRef.current[0] = nx
          posRef.current[1] = nz
        }
      }
      floorYRef.current = 4.35
    } else {
      const curStuck = isBlocked(cx, cz, 0.18)
      let moved = false
      if (curStuck || !isBlocked(nx, nz, 0.18)) {
        posRef.current[0] = nx
        posRef.current[1] = nz
        moved = true
      } else {
        if (!isBlocked(nx, cz, 0.18)) {
          posRef.current[0] = nx
          moved = true
        }
        if (!isBlocked(posRef.current[0], nz, 0.18)) {
          posRef.current[1] = nz
          moved = true
        }
      }
      if (!moved) {
        const s1x = cx - vz * delta * 0.9
        const s1z = cz + vx * delta * 0.9
        const s2x = cx + vz * delta * 0.9
        const s2z = cz - vx * delta * 0.9
        if (!isBlocked(s1x, s1z, 0.16)) {
          posRef.current[0] = s1x
          posRef.current[1] = s1z
        } else if (!isBlocked(s2x, s2z, 0.16)) {
          posRef.current[0] = s2x
          posRef.current[1] = s2z
        } else {
          posRef.current[0] = nx
          posRef.current[1] = nz
        }
      }
      floorYRef.current = getGroundY(posRef.current[0], posRef.current[1])
    }

    const tYaw = Math.atan2(vx, vz)
    const diff = Math.atan2(Math.sin(tYaw - yawRef.current), Math.cos(tYaw - yawRef.current))
    yawRef.current += diff * Math.min(1, delta * 12)
    phaseRef.current += delta * (shiftDown ? 16.5 : 13.8)
  } else {
    phaseRef.current = THREE.MathUtils.lerp(phaseRef.current, 0, delta * 8)
  }

  return moving
}

/** Tọa độ điểm đứng trước khi vào tương tác cho từng nhân vật (hỗ trợ cả 2 nhân vật dùng chung cùng lúc) */
export function getStationEntryForChar(
  act: Exclude<Activity, 'idle'>,
  char: 'boy' | 'girl',
): { entryX: number; entryZ: number; floorY: number; entryYaw: number } {
  const s = useStore.getState()
  const bothHere = s.boyActivity === act && s.girlActivity === act
  const sideOffset = bothHere ? (char === 'boy' ? -0.38 : 0.38) : 0

  if (act === 'sleep') {
    // Giường đôi Tầng 1: Cho phép cả 2 người cùng ngủ trên một giường
    // Khoa nằm bên trái (-3.08), Bạn Gái nằm bên phải (-2.12)
    return {
      entryX: char === 'boy' ? -3.65 : -1.55,
      entryZ: -3.55,
      floorY: 0,
      entryYaw: char === 'boy' ? Math.PI / 2 : -Math.PI / 2,
    }
  }
  if (act === 'girl_sleep') {
    // Giường đôi Tầng 2: Cho phép cả 2 người cùng ngủ trên một giường
    // Khoa nằm bên trái (-5.60), Bạn Gái nằm bên phải (-4.40)
    return {
      entryX: char === 'boy' ? -5.60 : -4.40,
      entryZ: -2.10,
      floorY: 4.35,
      entryYaw: 0,
    }
  }
  if (act === 'tv') {
    // Sofa xem TV phòng khách: Cả 2 cùng ngồi cạnh nhau trên sofa (Khoa bên trái, Bạn Gái bên phải)
    return char === 'boy'
      ? { entryX: 3.85, entryZ: 2.85, floorY: 0, entryYaw: Math.PI }
      : { entryX: 4.85, entryZ: 2.85, floorY: 0, entryYaw: Math.PI }
  }
  if (act === 'girl_lounge' && bothHere && char === 'boy') {
    return { entryX: -2.45, entryZ: 0.45, floorY: 4.35, entryYaw: -0.5 }
  }
  if (act === 'girl_nook' && bothHere && char === 'boy') {
    return { entryX: 5.45, entryZ: -1.35, floorY: 4.35, entryYaw: 1.2 }
  }
  const st = STATIONS[act]
  return {
    entryX: st.entryPos[0] + sideOffset,
    entryZ: st.entryPos[1],
    floorY: st.floorY,
    entryYaw: st.entryYaw,
  }
}

export interface CharPoseResult {
  pos: V3
  rotX: number
  rotY: number
  lHipX: number
  rHipX: number
  rHipZ: number
  lKneeX: number
  rKneeX: number
  lArmX: number
  lArmZ: number
  rArmX: number
  rArmZ: number
  headX: number
  headY: number
  showCup: boolean
  showRemote: boolean
  showBook: boolean
}

/** Bộ tính toán tư thế tương tác dùng chung cho cả Nam (Khoa) và Nữ (Bạn Gái) trên mọi đồ vật trong nhà */
export function computeCharActivityPose(
  act: Exclude<Activity, 'idle'>,
  char: 'boy' | 'girl',
  phase: 'entering' | 'active',
  pNorm: number,
  t: number,
  phaseTimer: number,
  spinUntil: number,
): CharPoseResult {
  const Y2 = 4.35
  const isGirl = char === 'girl'
  const s = useStore.getState()
  const bothHere = s.boyActivity === act && s.girlActivity === act
  const sideOffset = bothHere ? (char === 'boy' ? -0.36 : 0.36) : 0
  // Điều chỉnh độ cao nhẹ theo khung xương của từng nhân vật
  const sitOffset = isGirl ? 0.06 : 0

  let pos: V3 = [0, 0, 0]
  let rotX = 0
  let rotY = 0
  let lHipX = 0
  let rHipX = 0
  let rHipZ = 0
  let lKneeX = 0
  let rKneeX = 0
  let lArmX = isGirl ? -0.22 : 0
  let lArmZ = isGirl ? 0.08 : 0
  let rArmX = isGirl ? -0.22 : 0
  let rArmZ = isGirl ? -0.08 : 0
  let headX = 0
  let headY = 0
  let showCup = false
  let showRemote = false
  let showBook = false

  if (phase === 'entering') {
    if (act === 'tv') {
      const targetSofaX = bothHere ? (char === 'boy' ? 4.05 : 4.85) : 4.45
      const startSofaX = bothHere ? (char === 'boy' ? 3.85 : 4.85) : 4.45
      pos = [
        THREE.MathUtils.lerp(startSofaX, targetSofaX, pNorm),
        THREE.MathUtils.lerp(0, -0.22 + sitOffset, pNorm),
        THREE.MathUtils.lerp(2.85, 3.55, pNorm),
      ]
      rotY = Math.PI
      lHipX = -1.2 * pNorm
      rHipX = -1.2 * pNorm
      lKneeX = 1.2 * pNorm
      rKneeX = 1.2 * pNorm
      rArmX = -1.35
      showRemote = char === 'boy' || !bothHere
    } else if (act === 'pc') {
      pos = [
        2.85 + sideOffset,
        THREE.MathUtils.lerp(0, -0.26 + sitOffset, pNorm),
        THREE.MathUtils.lerp(-3.55, -4.55, pNorm),
      ]
      rotY = Math.PI
      lHipX = -1.42 * pNorm
      rHipX = -1.42 * pNorm
      lKneeX = 1.42 * pNorm
      rKneeX = 1.42 * pNorm
      lArmX = -0.85 * pNorm
      rArmX = -0.85 * pNorm
    } else if (act === 'sleep') {
      // Giường đôi Tầng 1: Khoa nằm bên trái (-3.08), Bạn Gái nằm bên phải (-2.12)
      const bedX = char === 'boy' ? -3.08 : -2.12
      const targetY = 0.73
      const targetZ = -3.58
      const startX = char === 'boy' ? -3.65 : -1.55
      pos = [
        THREE.MathUtils.lerp(startX, bedX, pNorm),
        THREE.MathUtils.lerp(0, targetY, pNorm),
        THREE.MathUtils.lerp(-3.55, targetZ, pNorm),
      ]
      rotX = (-Math.PI / 2) * pNorm
      rotY = (char === 'boy' ? 0.05 : -0.05) * pNorm
      lArmX = -0.35 * pNorm
      rArmX = -0.35 * pNorm
      lArmZ = 0.28 * pNorm
      rArmZ = -0.28 * pNorm
      headX = 0.1 * pNorm
    } else if (act === 'wardrobe') {
      pos = [-7.1, 0, -4.15]
      rotY = Math.PI
      lArmX = -1.35
      rArmX = -1.35
      lArmZ = -0.35 * pNorm
      rArmZ = 0.35 * pNorm
    } else if (act === 'feed') {
      pos = [-5.85, 0, 1.45 + sideOffset * 0.8]
      rotY = -1.55
      lArmX = -2.0 + Math.sin(t * 14) * 0.25
      rArmX = -0.8
      headX = 0.25
    } else if (act === 'drink') {
      pos = [5.35 + sideOffset * 0.75, 0, -4.45]
      rotY = Math.PI
      rArmX = -1.25
      headX = 0.28
      showCup = true
    } else if (act === 'darts') {
      pos = [-4.9 + sideOffset * 0.7, 0, -3.25]
      rotY = Math.PI
      rArmX = -1.75 - pNorm * 0.35
      lArmX = -0.35
    } else if (act === 'pet') {
      const [epx, epz] = STATIONS.pet.entryPos
      pos = [epx + sideOffset * 0.65, THREE.MathUtils.lerp(0, -0.36 + sitOffset, pNorm), epz]
      rotY = STATIONS.pet.entryYaw
      rotX = 0.22 * pNorm
      lHipX = -1.42 * pNorm
      lKneeX = 1.45 * pNorm
      rHipX = -0.25 * pNorm
      rKneeX = 1.55 * pNorm
      rArmX = -1.32 * pNorm
      rArmZ = 0.32 * pNorm
      lArmX = -0.45 * pNorm
      headX = 0.32 * pNorm
    } else if (act === 'read') {
      pos = [0.85 + sideOffset * 0.75, 0, -4.15]
      rotY = 0.58
      lArmX = -1.15 * pNorm
      rArmX = -1.15 * pNorm
      lArmZ = 0.22 * pNorm
      rArmZ = -0.22 * pNorm
      headX = 0.35 * pNorm
      showBook = true
    } else if (act === 'bath') {
      const targetZ = bothHere ? (char === 'boy' ? -1.92 : -1.28) : -1.6
      pos = [
        THREE.MathUtils.lerp(-12.4, -13.8, pNorm),
        THREE.MathUtils.lerp(0, -0.46 + sitOffset, pNorm),
        targetZ,
      ]
      rotX = 0.15 * pNorm
      rotY = (bothHere && char === 'girl' ? 2.65 : 0.45) * pNorm
      lHipX = -1.45 * pNorm
      rHipX = -1.45 * pNorm
      lKneeX = 1.4 * pNorm
      rKneeX = 1.4 * pNorm
      lArmZ = 0.72 * pNorm
      rArmZ = -0.72 * pNorm
    } else if (act === 'wash') {
      pos = [-12.4 + sideOffset * 0.7, 0, -4.55]
      rotY = Math.PI
      lArmX = -1.1 * pNorm
      rArmX = -1.1 * pNorm
      headX = 0.3 * pNorm
    } else if (act === 'laundry') {
      pos = [-10.4 + sideOffset * 0.65, 0, -4.6]
      rotY = -2.1
      rArmX = -1.25 * pNorm
      headX = 0.2 * pNorm
    } else if (act === 'girl_sleep') {
      // Giường đôi Tầng 2: Khoa nằm bên trái (-5.60), Bạn Gái nằm bên phải (-4.40)
      const bedX = char === 'boy' ? -5.60 : -4.40
      const targetY = Y2 + 0.71
      const targetZ = -3.42
      const startX = char === 'boy' ? -5.60 : -4.40
      pos = [
        THREE.MathUtils.lerp(startX, bedX, pNorm),
        THREE.MathUtils.lerp(Y2, targetY, pNorm),
        THREE.MathUtils.lerp(-2.10, targetZ, pNorm),
      ]
      rotX = (-Math.PI / 2) * pNorm
      rotY = (char === 'boy' ? 0.05 : -0.05) * pNorm
      lArmX = -0.35 * pNorm
      rArmX = -0.35 * pNorm
      lArmZ = 0.28 * pNorm
      rArmZ = -0.28 * pNorm
      headX = 0.1 * pNorm
    } else if (act === 'piano') {
      pos = [
        0.47,
        Y2 + THREE.MathUtils.lerp(0, -0.22 + sitOffset, pNorm),
        THREE.MathUtils.lerp(-0.75, -1.05, pNorm),
      ]
      rotY = Math.PI
      lHipX = -1.35 * pNorm
      rHipX = -1.35 * pNorm
      lKneeX = 1.35 * pNorm
      rKneeX = 1.35 * pNorm
      lArmX = -0.85 * pNorm
      rArmX = -0.85 * pNorm
    } else if (act === 'paint') {
      pos = [-0.71, Y2, -1.05]
      rotY = 0.25
      lArmX = -0.72 * pNorm
      rArmX = -0.88 * pNorm
    } else if (act === 'girl_pc') {
      pos = [
        2.25 + sideOffset,
        Y2 + THREE.MathUtils.lerp(0, -0.22 + sitOffset, pNorm),
        THREE.MathUtils.lerp(-3.8, -4.64, pNorm),
      ]
      rotY = Math.PI
      lHipX = -1.4 * pNorm
      rHipX = -1.4 * pNorm
      lKneeX = 1.4 * pNorm
      rKneeX = 1.4 * pNorm
      lArmX = -0.95 * pNorm
      rArmX = -0.95 * pNorm
    } else if (act === 'girl_vanity') {
      pos = [
        4.95 + sideOffset,
        Y2 + THREE.MathUtils.lerp(0, -0.22 + sitOffset, pNorm),
        THREE.MathUtils.lerp(-3.8, -4.72, pNorm),
      ]
      rotY = Math.PI
      lHipX = -1.4 * pNorm
      rHipX = -1.4 * pNorm
      lKneeX = 1.4 * pNorm
      rKneeX = 1.4 * pNorm
      lArmX = -0.8 * pNorm
      rArmX = -1.2 * pNorm
    } else if (act === 'girl_lounge') {
      const useOttoman = bothHere && char === 'boy'
      pos = useOttoman
        ? [-2.87, Y2 - 0.1 + sitOffset, 0.43]
        : [-3.1, Y2 - 0.04 + sitOffset, 1.2]
      rotY = useOttoman ? -0.25 : -0.7
      lHipX = -1.25 * pNorm
      rHipX = -1.25 * pNorm
      lKneeX = 1.25 * pNorm
      rKneeX = 1.25 * pNorm
      showBook = true
    } else if (act === 'girl_nook') {
      const useOttoman = bothHere && char === 'boy'
      pos = useOttoman
        ? [5.6, Y2 - 0.12 + sitOffset, -1.33]
        : [7.55, Y2 - 0.04 + sitOffset, -1.36]
      rotY = useOttoman ? 1.35 : -0.68
      lHipX = -1.25 * pNorm
      rHipX = -1.25 * pNorm
      lKneeX = 1.25 * pNorm
      rKneeX = 1.25 * pNorm
      showBook = true
    } else if (act === 'girl_wardrobe') {
      pos = [7.65, Y2, -3.65]
      rotY = Math.PI
      lArmX = -0.6 * pNorm
      rArmX = -1.1 * pNorm
    }
    return {
      pos,
      rotX,
      rotY,
      lHipX,
      rHipX,
      rHipZ,
      lKneeX,
      rKneeX,
      lArmX,
      lArmZ,
      rArmX,
      rArmZ,
      headX,
      headY,
      showCup,
      showRemote,
      showBook,
    }
  }

  // phase === 'active'
  if (act === 'tv') {
    const sofaX = bothHere ? (char === 'boy' ? 4.05 : 4.85) : 4.45
    pos = [sofaX, -0.26 + sitOffset, 3.55]
    rotY = Math.PI
    lHipX = -1.42
    rHipX = -1.42
    lKneeX = 1.42
    rKneeX = 1.42
    lArmX = -0.45
    rArmX = -0.6 + Math.sin(t * 1.5) * 0.08
    headY = Math.sin(t * 0.6) * 0.1
    headX = -0.05 + Math.sin(t * 2.2) * 0.03
    showRemote = char === 'boy' || !bothHere
  } else if (act === 'pc') {
    pos = [2.85 + sideOffset, -0.26 + sitOffset, -4.55]
    rotY = Math.PI
    lHipX = -1.42
    rHipX = -1.42
    lKneeX = 1.42
    rKneeX = 1.42
    lArmX = -1.14 + Math.sin(t * 15) * 0.08
    rArmX = -1.14 + Math.cos(t * 15) * 0.08
    headY = Math.sin(t * 1.2) * 0.22
  } else if (act === 'sleep') {
    // Giường đôi Tầng 1: Cho phép 2 người ngủ cùng lúc trên 1 giường!
    // Khoa nằm bên trái (-3.08), Bạn Gái nằm bên phải (-2.12), gối đầu ngay ngắn trên gối, nằm ngửa tự nhiên
    const bedX = char === 'boy' ? -3.08 : -2.12
    pos = [bedX, 0.73, -3.58]
    rotX = -Math.PI / 2
    rotY = char === 'boy' ? 0.05 : -0.05
    // Tư thế chân thả lỏng tự nhiên, đầu gối chùng nhẹ
    lHipX = 0.06
    rHipX = 0.06
    rHipZ = -0.06
    lKneeX = 0.12
    rKneeX = 0.15
    // Hai tay đặt nhẹ nhàng lên bụng/ngực, phập phồng theo nhịp thở
    lArmX = -0.36 + Math.sin(t * 1.8) * 0.015
    rArmX = -0.36 + Math.sin(t * 1.8) * 0.015
    lArmZ = char === 'boy' ? 0.32 : 0.22
    rArmZ = char === 'boy' ? -0.22 : -0.32
    // Đầu ngửa nhẹ tựa lên gối và nghiêng về phía người kia
    headX = 0.12
    headY = (bothHere ? (char === 'boy' ? 0.22 : -0.22) : (char === 'boy' ? 0.08 : -0.08)) + Math.sin(t * 1.2) * 0.03
  } else if (act === 'wardrobe') {
    const spinning = t < spinUntil
    const spinProgress = spinning ? 1 - (spinUntil - t) / 0.95 : 0
    const jumpY = spinning ? Math.sin(spinProgress * Math.PI) * 0.28 : 0
    pos = [-7.1, jumpY, -4.05]
    rotY = spinning ? spinProgress * Math.PI * 2 : 0.25 + Math.sin(t * 1.4) * 0.35
    lArmX = spinning ? -2.2 : -0.18
    rArmX = spinning ? -2.2 : -0.18
    lArmZ = spinning ? -0.4 : -0.08
    rArmZ = spinning ? 0.4 : 0.08
  } else if (act === 'feed') {
    pos = [-5.85, 0, 1.45 + sideOffset * 0.8]
    rotY = -1.55
    rArmX = -1.05 + Math.sin(t * 8) * 0.2
    lArmX = -0.3
    headX = 0.35
    headY = Math.sin(t * 2) * 0.12
  } else if (act === 'drink') {
    const drinkWave = Math.min(1, phaseTimer / 0.5)
    pos = [5.35 + sideOffset * 0.75, 0, -4.45]
    rotY = Math.PI
    rArmX = -1.25 - drinkWave * 0.95
    rArmZ = -0.28 * drinkWave
    headX = -0.32 * drinkWave
    showCup = true
  } else if (act === 'darts') {
    const celebrate = phaseTimer > 0.38
    const jump = celebrate ? Math.abs(Math.sin((phaseTimer - 0.38) * 9)) * 0.18 : 0
    pos = [-4.9 + sideOffset * 0.7, jump, -3.25]
    rotY = celebrate ? Math.sin(phaseTimer * 4) * 0.35 : Math.PI
    rArmX = celebrate ? -2.55 + Math.sin(t * 12) * 0.2 : -0.95
    lArmX = celebrate ? -2.55 - Math.sin(t * 12) * 0.2 : -0.25
    headX = celebrate ? -0.15 : 0
  } else if (act === 'pet') {
    const [epx, epz] = STATIONS.pet.entryPos
    pos = [epx + sideOffset * 0.65, -0.36 + sitOffset, epz]
    rotY = STATIONS.pet.entryYaw
    rotX = 0.24
    lHipX = -1.42
    lKneeX = 1.45
    rHipX = -0.25
    rKneeX = 1.55
    lArmX = -0.55
    lArmZ = 0.12
    rArmX = -1.32 + Math.sin(t * 7.2) * 0.14
    rArmZ = 0.34 + Math.cos(t * 7.2) * 0.12
    headX = 0.34 + Math.sin(t * 3.6) * 0.04
    headY = Math.sin(t * 3.6) * 0.08
  } else if (act === 'read') {
    pos = [0.85 + sideOffset * 0.75, 0, -4.15]
    rotY = 0.58
    lArmX = -1.25 + Math.sin(t * 1.8) * 0.03
    rArmX = -1.25 + Math.cos(t * 1.8) * 0.03
    lArmZ = 0.25
    rArmZ = -0.25
    headX = 0.42 + Math.sin(t * 1.2) * 0.04
    headY = -0.12 + Math.sin(t * 0.8) * 0.06
    showBook = true
  } else if (act === 'bath') {
    const bathZ = bothHere ? (char === 'boy' ? -1.92 : -1.28) : -1.6
    pos = [-13.8, -0.46 + sitOffset, bathZ]
    rotX = 0.15
    rotY = bothHere && char === 'girl' ? 2.65 : 0.45
    lHipX = -1.45
    rHipX = -1.45
    lKneeX = 1.4
    rKneeX = 1.4
    lArmX = -0.15
    rArmX = -0.15
    lArmZ = 0.72 + Math.sin(t * 1.8) * 0.03
    rArmZ = -0.72 - Math.sin(t * 1.8) * 0.03
    headX = -0.25 + Math.sin(t * 1.2) * 0.02
    headY = Math.sin(t * 0.6) * 0.06
  } else if (act === 'wash') {
    pos = [-12.4 + sideOffset * 0.7, 0, -4.55]
    rotY = Math.PI
    lArmX = -1.15 + Math.sin(t * 9) * 0.18
    rArmX = -1.15 + Math.sin(t * 9 + 0.3) * 0.18
    lArmZ = 0.15
    rArmZ = -0.15
    headX = 0.36 + Math.sin(t * 4.5) * 0.08
  } else if (act === 'laundry') {
    pos = [-10.4 + sideOffset * 0.65, 0, -4.6]
    rotY = -2.1
    rArmX = -1.35 + Math.sin(t * 6) * 0.1
    rArmZ = -0.22
    lArmX = -0.25
    headX = 0.32
  } else if (act === 'girl_sleep') {
    // Giường đôi Tầng 2: Cho phép 2 người ngủ cùng lúc trên 1 giường!
    // Khoa nằm bên trái (-5.60), Bạn Gái nằm bên phải (-4.40), gối đầu tự nhiên trên gối
    const bedX = char === 'boy' ? -5.60 : -4.40
    pos = [bedX, Y2 + 0.71, -3.42]
    rotX = -Math.PI / 2
    rotY = char === 'boy' ? 0.05 : -0.05
    // Tư thế chân thả lỏng tự nhiên, đầu gối chùng nhẹ
    lHipX = 0.06
    rHipX = 0.06
    rHipZ = -0.06
    lKneeX = 0.12
    rKneeX = 0.15
    // Hai tay đặt nhẹ nhàng lên bụng/ngực, phập phồng theo nhịp thở
    lArmX = -0.36 + Math.sin(t * 1.8) * 0.015
    rArmX = -0.36 + Math.sin(t * 1.8) * 0.015
    lArmZ = char === 'boy' ? 0.32 : 0.22
    rArmZ = char === 'boy' ? -0.22 : -0.32
    // Đầu ngửa nhẹ tựa lên gối và nghiêng về phía người kia
    headX = 0.12
    headY = (bothHere ? (char === 'boy' ? 0.22 : -0.22) : (char === 'boy' ? 0.08 : -0.08)) + Math.sin(t * 1.2) * 0.03
  } else if (act === 'girl_pc') {
    pos = [2.25 + sideOffset, Y2 - 0.24 + sitOffset, -4.64]
    rotY = Math.PI
    lHipX = -1.4
    rHipX = -1.4
    lKneeX = 1.4
    rKneeX = 1.4
    lArmX = -1.1 + Math.sin(t * 12) * 0.06
    rArmX = -1.1 + Math.cos(t * 12) * 0.06
    headX = 0.08
    headY = Math.sin(t * 1.2) * 0.12
  } else if (act === 'girl_vanity') {
    pos = [4.95 + sideOffset, Y2 - 0.24 + sitOffset, -4.72]
    rotY = Math.PI
    lHipX = -1.4
    rHipX = -1.4
    lKneeX = 1.4
    rKneeX = 1.4
    lArmX = -0.85
    rArmX = -1.45 + Math.sin(t * 3.5) * 0.12
    headY = Math.sin(t * 1.5) * 0.12
    headX = -0.05
  } else if (act === 'girl_lounge') {
    const useOttoman = bothHere && char === 'boy'
    pos = useOttoman
      ? [-2.87, Y2 - 0.1 + sitOffset, 0.43]
      : [-3.1, Y2 - 0.04 + sitOffset, 1.2]
    rotY = useOttoman ? -0.25 : -0.7
    rotX = -0.1
    lHipX = -1.25
    rHipX = -1.25
    lKneeX = 1.25
    rKneeX = 1.25
    lArmX = -1.15
    rArmX = -1.15 + Math.sin(t * 2.5) * 0.04
    lArmZ = 0.2
    rArmZ = -0.2
    headX = 0.32
    showBook = true
  } else if (act === 'girl_nook') {
    const useOttoman = bothHere && char === 'boy'
    pos = useOttoman
      ? [5.6, Y2 - 0.12 + sitOffset, -1.33]
      : [7.55, Y2 - 0.04 + sitOffset, -1.36]
    rotY = useOttoman ? 1.35 : -0.68
    rotX = -0.08
    lHipX = -1.25
    rHipX = -1.25
    lKneeX = 1.25
    rKneeX = 1.25
    lArmX = -1.15
    rArmX = -1.15 + Math.sin(t * 2.2) * 0.04
    lArmZ = 0.2
    rArmZ = -0.2
    headX = 0.3
    showBook = true
  } else if (act === 'girl_wardrobe') {
    const spinning = t < spinUntil
    const spinProgress = spinning ? 1 - (spinUntil - t) / 0.95 : 0
    pos = [7.65, Y2, -3.65]
    rotY = spinning ? Math.PI + spinProgress * Math.PI * 2 : Math.PI
    lArmX = -0.6
    rArmX = -1.2 + Math.sin(t * 3) * 0.15
    headY = Math.sin(t * 2) * 0.15
  } else if (act === 'piano') {
    pos = [0.47, Y2 - 0.22 + sitOffset, -1.15]
    rotY = Math.PI
    lHipX = -1.35
    rHipX = -1.35
    lKneeX = 1.35
    rKneeX = 1.35
    lArmX = -0.92 + Math.sin(t * 8.2) * 0.08
    rArmX = -0.92 + Math.cos(t * 8.8) * 0.08
    lArmZ = -0.16 + Math.sin(t * 3.2) * 0.1
    rArmZ = 0.16 + Math.cos(t * 3.8) * 0.1
    headX = 0.16 + Math.sin(t * 3.6) * 0.04
    headY = Math.sin(t * 1.8) * 0.08
  } else if (act === 'paint') {
    pos = [-0.71, Y2, -1.05]
    rotY = 0.25
    lArmX = -0.78 + Math.sin(t * 1.5) * 0.03
    lArmZ = 0.22
    rArmX = -1.32 + Math.sin(t * 5.2) * 0.22
    rArmZ = -0.1 + Math.cos(t * 4.0) * 0.16
    headX = 0.12 + Math.sin(t * 2.5) * 0.05
    headY = 0.06 + Math.sin(t * 1.6) * 0.08
  }

  return {
    pos,
    rotX,
    rotY,
    lHipX,
    rHipX,
    rHipZ,
    lKneeX,
    rKneeX,
    lArmX,
    lArmZ,
    rArmX,
    rArmZ,
    headX,
    headY,
    showCup,
    showRemote,
    showBook,
  }
}

export const AUTO_SEQUENCE_BOY: Exclude<Activity, 'idle'>[] = [
  'pc',
  'read',
  'pet',
  'wash',
  'drink',
  'tv',
  'bath',
  'laundry',
  'feed',
  'darts',
  'wardrobe',
  'sleep',
  'girl_nook',
  'girl_sleep',
]

export const AUTO_SEQUENCE_GIRL: Exclude<Activity, 'idle'>[] = [
  'girl_lounge',
  'girl_pc',
  'piano',
  'paint',
  'girl_vanity',
  'girl_nook',
  'girl_wardrobe',
  'tv',
  'read',
  'drink',
  'pet',
  'girl_sleep',
  'sleep',
  'wash',
]

export const OUTDOOR_STROLL_SPOTS: { pos: V3; lookYaw: number }[] = [
  { pos: [4.65, -0.15, 10.5], lookYaw: Math.PI / 2 },    // Sundeck ngắm hồ bơi vô cực
  { pos: [-1.45, -0.14, 13.8], lookYaw: 0 },              // Lối đá bước dạo nổi trên mặt nước
  { pos: [-10.95, -0.165, 12.6], lookYaw: Math.PI },      // Sân Firepit Lounge ấm áp
  { pos: [11.8, -0.175, 6.5], lookYaw: Math.PI },         // Sàn gỗ hông phải hóng gió
]

export const AUTO_DURATION: Record<Exclude<Activity, 'idle'>, number> = {
  pc: 8.5,
  pet: 7.5,
  read: 8.5,
  drink: 3.6,
  tv: 8.5,
  bath: 9.5,
  wash: 6.0,
  laundry: 5.5,
  feed: 6.5,
  darts: 3.4,
  wardrobe: 5.2,
  sleep: 8.5,
  girl_sleep: 10.0,
  girl_pc: 9.0,
  girl_vanity: 8.0,
  girl_lounge: 9.0,
  girl_nook: 9.0,
  girl_wardrobe: 6.0,
  piano: 9.5,
  paint: 9.5,
}

/** Chấm tròn nhỏ phát sáng trên đầu nhân vật: Xanh lá khi có người vào vai, Đỏ khi trống (Auto-Life) */
export function CharacterRoleIndicator({
  isControlled,
  y = 1.82,
  visible = true,
}: {
  isControlled: boolean
  y?: number
  visible?: boolean
}) {
  if (!visible) return null
  return (
    <mesh position={[0, y, 0]}>
      <sphereGeometry args={[0.024, 16, 16]} />
      <meshStandardMaterial
        color={isControlled ? '#6f8772' : '#9c6e67'}
        emissive={isControlled ? '#6f8772' : '#9c6e67'}
        emissiveIntensity={2.0}
        roughness={0.25}
      />
    </mesh>
  )
}

/** Mô hình nhân vật Khoa – Hỗ trợ đi bộ đa tầng và dùng chung tất cả đồ đạc trong nhà (Tầng 1, Phòng tắm, Tầng 2) */
export function Avatar({ p, ry = 0 }: { p: V3; ry?: number }) {
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const leftKnee = useRef<THREE.Group>(null)
  const rightKnee = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const zzzRef = useRef<THREE.Group>(null)
  const cupRef = useRef<THREE.Mesh>(null)
  const remoteRef = useRef<THREE.Mesh>(null)
  const bookRef = useRef<THREE.Group>(null)

  const boyActivity = useStore((s) => s.boyActivity)
  const boyPhase = useStore((s) => s.boyPhase)
  const outfitId = useStore((s) => s.outfitId)
  const outfitSpinTick = useStore((s) => s.outfitSpinTick)
  const readBookPage = useStore((s) => s.readBookPage)

  const keys = useRef<Record<string, boolean>>({})
  const walkPos = useRef<[number, number]>([p[0], p[2]])
  const walkFloorY = useRef(0)
  const walkYaw = useRef(ry)
  const walkPhase = useRef(0)

  const prevActivity = useRef<Activity>('idle')
  const phaseTimer = useRef(0)
  const walkWatchdog = useRef(0)
  const autoIdleTimer = useRef(1.4)
  const autoSeqIdx = useRef(0)
  const outdoorStrollTarget = useRef<V3 | null>(null)
  const outdoorStrollYaw = useRef<number | null>(null)
  const outdoorStrollPause = useRef(0)
  const outdoorStrollIdx = useRef(0)
  const lastSpinTick = useRef(outfitSpinTick)
  const spinUntil = useRef(0)
  const lastPosBroadcast = useRef(0)

  const outfit = useMemo(() => OUTFITS.find((o) => o.id === outfitId) || OUTFITS[0], [outfitId])
  const bookTex = useMemo(() => openBookPages(readBookPage), [readBookPage])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      keys.current[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame(({ clock }, dt) => {
    const st = useStore.getState()
    if (!root.current) return

    const delta = Math.min(dt, 0.05)
    const t = clock.elapsedTime
    const k = 1 - Math.exp(-delta * 9)

    if (prevActivity.current !== st.boyActivity) {
      if (prevActivity.current !== 'idle') {
        const entry = getStationEntryForChar(prevActivity.current, 'boy')
        walkPos.current = [entry.entryX, entry.entryZ]
        walkFloorY.current = entry.floorY
      }
      prevActivity.current = st.boyActivity
      phaseTimer.current = 0
    }

    if (outfitSpinTick !== lastSpinTick.current) {
      lastSpinTick.current = outfitSpinTick
      spinUntil.current = t + 0.95
    }

    let targetPos: V3 = [walkPos.current[0], walkFloorY.current, walkPos.current[1]]
    let targetRotX = 0
    let targetRotY = walkYaw.current
    let lHipX = 0
    let rHipX = 0
    let rHipZ = 0
    let lKneeX = 0
    let rKneeX = 0
    let lArmX = 0
    let lArmZ = 0
    let rArmX = 0
    let rArmZ = 0
    let headY = Math.sin(t * 0.7) * 0.16
    let headX = 0
    let showCup = false
    let showRemote = false
    let showBook = false

    const kb = keys.current
    const isControllingBoy = (st.userRole || st.activeChar) === 'boy'
    let moveZ = 0
    let moveX = 0
    if (st.mode === 'orbit' && isControllingBoy) {
      moveZ = (kb.KeyS || kb.ArrowDown ? 1 : 0) - (kb.KeyW || kb.ArrowUp ? 1 : 0)
      moveX = (kb.KeyD || kb.ArrowRight ? 1 : 0) - (kb.KeyA || kb.ArrowLeft ? 1 : 0)
    } else if (st.mode === 'fp' && isControllingBoy) {
      const f = (kb.KeyW || kb.ArrowUp ? 1 : 0) - (kb.KeyS || kb.ArrowDown ? 1 : 0)
      const r = (kb.KeyD || kb.ArrowRight ? 1 : 0) - (kb.KeyA || kb.ArrowLeft ? 1 : 0)
      if (f !== 0 || r !== 0) {
        const cosY = Math.cos(LIVE_ACTORS.fpYaw)
        const sinY = Math.sin(LIVE_ACTORS.fpYaw)
        moveX = -sinY * f + cosY * r
        moveZ = -cosY * f - sinY * r
      }
    }

    if ((moveX !== 0 || moveZ !== 0) && st.boyActivity !== 'idle') {
      st.startActivity('idle', true, 'boy')
      return
    }

    // 1. Chế độ Đứng/Đi bộ tự do đa tầng (Tầng 1 <-> Cầu thang <-> Tầng 2 <-> Sân vườn)
    if (st.boyActivity === 'idle') {
      let moving = false

      if (isControllingBoy && (moveX !== 0 || moveZ !== 0 || st.avatarTarget)) {
        walkWatchdog.current = 0
        outdoorStrollTarget.current = null
        outdoorStrollYaw.current = null
        outdoorStrollPause.current = 0
        moving = stepCharacterWalk(
          walkPos,
          walkFloorY,
          walkYaw,
          walkPhase,
          moveX,
          moveZ,
          Boolean(kb.ShiftLeft || kb.ShiftRight),
          st.avatarTarget,
          () => st.setAvatarTarget(null),
          delta,
          [LIVE_ACTORS.girlPos[0], LIVE_ACTORS.girlPos[2]],
          LIVE_ACTORS.girlFloorY,
        )
        if (moving) autoIdleTimer.current = 4.0
      } else if (st.boyAutoLife) {
        if (outdoorStrollTarget.current) {
          walkWatchdog.current += delta
          const [ox, , oz] = outdoorStrollTarget.current
          const distOutdoor = Math.hypot(walkPos.current[0] - ox, walkPos.current[1] - oz)
          if (distOutdoor > 0.25 && walkWatchdog.current < 28.0) {
            moving = stepCharacterWalk(
              walkPos,
              walkFloorY,
              walkYaw,
              walkPhase,
              0,
              0,
              false,
              outdoorStrollTarget.current,
              () => {
                outdoorStrollTarget.current = null
              },
              delta,
              [LIVE_ACTORS.girlPos[0], LIVE_ACTORS.girlPos[2]],
              LIVE_ACTORS.girlFloorY,
            )
          } else {
            outdoorStrollTarget.current = null
            walkWatchdog.current = 0
            walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
          }
        } else if (outdoorStrollPause.current > 0) {
          walkWatchdog.current = 0
          outdoorStrollPause.current -= delta
          if (outdoorStrollYaw.current !== null) {
            const diff = Math.atan2(
              Math.sin(outdoorStrollYaw.current - walkYaw.current),
              Math.cos(outdoorStrollYaw.current - walkYaw.current),
            )
            walkYaw.current += diff * Math.min(1, delta * 4)
          }
          headY = Math.sin(t * 0.85) * 0.28
          walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
        } else {
          walkWatchdog.current = 0
          outdoorStrollYaw.current = null
          autoIdleTimer.current -= delta
          if (autoIdleTimer.current <= 0) {
            const nextAct = AUTO_SEQUENCE_BOY[autoSeqIdx.current % AUTO_SEQUENCE_BOY.length]
            autoSeqIdx.current += 1
            autoIdleTimer.current = 1.4
            if (nextAct === 'pet') {
              st.petDog(autoSeqIdx.current % 2 === 0 ? 'mochi' : 'bo', false, 'boy')
            } else {
              st.startActivity(nextAct, false, 'boy')
            }
            return
          }
        }
      } else {
        walkWatchdog.current = 0
        outdoorStrollTarget.current = null
        outdoorStrollYaw.current = null
        outdoorStrollPause.current = 0
        walkPhase.current = THREE.MathUtils.lerp(walkPhase.current, 0, delta * 8)
      }

      const swing = moving ? Math.sin(walkPhase.current) * 0.56 : 0
      const bob = moving ? Math.abs(Math.sin(walkPhase.current)) * 0.036 : Math.sin(t * 2) * 0.006
      targetPos = [walkPos.current[0], walkFloorY.current + bob, walkPos.current[1]]
      targetRotY = walkYaw.current
      lHipX = swing
      rHipX = -swing
      lKneeX = Math.max(0, -swing * 0.7)
      rKneeX = Math.max(0, swing * 0.7)
      lArmX = -swing * 0.65
      rArmX = swing * 0.65
    } else {
      // 2. Đi bộ đa tầng (kể cả leo cầu thang lên Tầng 2 hoặc xuống Tầng 1) tới đồ vật rồi tương tác
      const entry = getStationEntryForChar(st.boyActivity, 'boy')

      if (st.boyPhase === 'walking') {
        const targetV3: V3 = [entry.entryX, entry.floorY, entry.entryZ]
        walkWatchdog.current += delta
        const distToEntry = Math.hypot(walkPos.current[0] - entry.entryX, walkPos.current[1] - entry.entryZ)
        const distFloorY = Math.abs(walkFloorY.current - entry.floorY)

        const moving = stepCharacterWalk(
          walkPos,
          walkFloorY,
          walkYaw,
          walkPhase,
          0,
          0,
          false,
          targetV3,
          () => {
            walkPos.current = [entry.entryX, entry.entryZ]
            walkFloorY.current = entry.floorY
            walkYaw.current = entry.entryYaw
            phaseTimer.current = 0
            walkWatchdog.current = 0
            st.setActivityPhase('entering', 'boy')
          },
          delta,
          [LIVE_ACTORS.girlPos[0], LIVE_ACTORS.girlPos[2]],
          LIVE_ACTORS.girlFloorY,
        )

        // Chỉ khi nhân vật đã đi bộ đến thật sát vị trí đích (< 0.22m và cùng tầng) mới chuyển sang phase vào vị trí
        if (distToEntry < 0.22 && distFloorY < 0.25) {
          walkPos.current = [entry.entryX, entry.entryZ]
          walkFloorY.current = entry.floorY
          walkYaw.current = entry.entryYaw
          phaseTimer.current = 0
          walkWatchdog.current = 0
          st.setActivityPhase('entering', 'boy')
        } else if (walkWatchdog.current > 25.0) {
          // Chỉ phòng khi bị kẹt vật lý hơn 25 giây
          walkPos.current = [entry.entryX, entry.entryZ]
          walkFloorY.current = entry.floorY
          walkYaw.current = entry.entryYaw
          phaseTimer.current = 0
          walkWatchdog.current = 0
          st.setActivityPhase('entering', 'boy')
        }

        const swing = moving ? Math.sin(walkPhase.current) * 0.58 : 0
        const bob = moving ? Math.abs(Math.sin(walkPhase.current)) * 0.034 : 0
        targetPos = [walkPos.current[0], walkFloorY.current + bob, walkPos.current[1]]
        targetRotY = walkYaw.current
        lHipX = swing
        rHipX = -swing
        lKneeX = Math.max(0, -swing * 0.7)
        rKneeX = Math.max(0, swing * 0.7)
        lArmX = -swing * 0.65
        rArmX = swing * 0.65
        headY = 0
      } else if (st.boyPhase === 'entering') {
        phaseTimer.current += delta
        const enterDur = 0.75
        const pNorm = THREE.MathUtils.smoothstep(phaseTimer.current, 0, enterDur)
        const pose = computeCharActivityPose(
          st.boyActivity,
          'boy',
          'entering',
          pNorm,
          t,
          phaseTimer.current,
          spinUntil.current,
        )
        targetPos = pose.pos
        targetRotX = pose.rotX
        targetRotY = pose.rotY
        lHipX = pose.lHipX
        rHipX = pose.rHipX
        rHipZ = pose.rHipZ
        lKneeX = pose.lKneeX
        rKneeX = pose.rKneeX
        lArmX = pose.lArmX
        lArmZ = pose.lArmZ
        rArmX = pose.rArmX
        rArmZ = pose.rArmZ
        headX = pose.headX
        headY = pose.headY
        showCup = pose.showCup
        showRemote = pose.showRemote
        showBook = pose.showBook

        if (phaseTimer.current >= enterDur) {
          phaseTimer.current = 0
          st.setActivityPhase('active', 'boy')
        }
      } else {
        phaseTimer.current += delta
        const pose = computeCharActivityPose(
          st.boyActivity,
          'boy',
          'active',
          1,
          t,
          phaseTimer.current,
          spinUntil.current,
        )
        targetPos = pose.pos
        targetRotX = pose.rotX
        targetRotY = pose.rotY
        lHipX = pose.lHipX
        rHipX = pose.rHipX
        rHipZ = pose.rHipZ
        lKneeX = pose.lKneeX
        rKneeX = pose.rKneeX
        lArmX = pose.lArmX
        lArmZ = pose.lArmZ
        rArmX = pose.rArmX
        rArmZ = pose.rArmZ
        headX = pose.headX
        headY = pose.headY
        showCup = pose.showCup
        showRemote = pose.showRemote
        showBook = pose.showBook

        const maxDur = AUTO_DURATION[st.boyActivity]
        const isOneShot =
          st.boyActivity === 'drink' ||
          st.boyActivity === 'darts' ||
          st.boyActivity === 'feed'
        if (phaseTimer.current >= maxDur) {
          if (st.isUserInitiated && isOneShot && st.activeChar === 'boy') {
            st.returnOverview()
            return
          } else if (st.boyAutoLife) {
            if (autoSeqIdx.current > 0 && autoSeqIdx.current % 3 === 0) {
              const spot = OUTDOOR_STROLL_SPOTS[outdoorStrollIdx.current % OUTDOOR_STROLL_SPOTS.length]
              outdoorStrollIdx.current += 1
              outdoorStrollTarget.current = spot.pos
              outdoorStrollYaw.current = spot.lookYaw
              outdoorStrollPause.current = 5.0
              walkWatchdog.current = 0
              autoIdleTimer.current = 0.8
              st.startActivity('idle', false, 'boy')
              return
            }
            const nextAct = AUTO_SEQUENCE_BOY[autoSeqIdx.current % AUTO_SEQUENCE_BOY.length]
            autoSeqIdx.current += 1
            if (nextAct === 'pet') {
              st.petDog(autoSeqIdx.current % 2 === 0 ? 'mochi' : 'bo', false, 'boy')
            } else {
              st.startActivity(nextAct, false, 'boy')
            }
            return
          }
        }
      }
    }

    root.current.position.x = THREE.MathUtils.lerp(root.current.position.x, targetPos[0], k)
    root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, targetPos[1], k)
    root.current.position.z = THREE.MathUtils.lerp(root.current.position.z, targetPos[2], k)
    const isBoySleeping =
      (st.boyActivity === 'sleep' || st.boyActivity === 'girl_sleep') && st.boyPhase === 'active'
    if (isBoySleeping) {
      root.current.rotation.x = -Math.PI / 2
      root.current.rotation.y = 0.05
      root.current.rotation.z = 0
    } else {
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, targetRotX, k)
      const rotDiff = Math.atan2(
        Math.sin(targetRotY - root.current.rotation.y),
        Math.cos(targetRotY - root.current.rotation.y),
      )
      root.current.rotation.y += rotDiff * k
    }

    LIVE_ACTORS.khoaPos = [root.current.position.x, root.current.position.z]
    LIVE_ACTORS.khoaFloorY = walkFloorY.current
    LIVE_ACTORS.khoaYaw = root.current.rotation.y
    LIVE_ACTORS.khoaWorldPos = [root.current.position.x, root.current.position.y, root.current.position.z]

    // Đồng bộ tọa độ thời gian thực giữa 2 máy:
    if (st.userRole === 'boy') {
      const now = performance.now()
      const interval = st.boyPhase === 'walking' ? 320 : 850
      if (now - lastPosBroadcast.current > interval) {
        lastPosBroadcast.current = now
        broadcastPosSync(
          'boy',
          LIVE_ACTORS.khoaWorldPos,
          LIVE_ACTORS.khoaYaw,
          st.boyActivity,
          st.boyPhase,
          st.outfitId,
        )
      }
    } else if (st.roleOccupancy?.boy) {
      // Đối phương đang điều khiển Khoa từ xa: lerp mượt mà để cả 2 máy luôn cùng thời điểm
      const remote = REMOTE_ACTORS.boy
      if (remote && remote.lastSeen > 0) {
        const dx = remote.pos[0] - walkPos.current[0]
        const dz = remote.pos[2] - walkPos.current[1]
        const dist = Math.hypot(dx, dz)
        if (dist > 0.35) {
          const lerpK = Math.min(1, delta * 5.0)
          walkPos.current[0] += dx * lerpK
          walkPos.current[1] += dz * lerpK
          walkFloorY.current = THREE.MathUtils.lerp(walkFloorY.current, remote.pos[1], lerpK)
          walkYaw.current = remote.yaw
        }
      }
    }

    if (torso.current) {
      const isBoySleeping = st.boyActivity === 'sleep' || st.boyActivity === 'girl_sleep'
      const breath = isBoySleeping ? Math.sin(t * 2.2) * 0.045 : Math.sin(t * 3) * 0.015
      torso.current.scale.set(1.08, 1, 0.72 + breath)
    }

    if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, lHipX, k)
    if (rightLeg.current) {
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, rHipX, k)
      rightLeg.current.rotation.z = THREE.MathUtils.lerp(rightLeg.current.rotation.z, rHipZ, k)
    }
    if (leftKnee.current) leftKnee.current.rotation.x = THREE.MathUtils.lerp(leftKnee.current.rotation.x, lKneeX, k)
    if (rightKnee.current) rightKnee.current.rotation.x = THREE.MathUtils.lerp(rightKnee.current.rotation.x, rKneeX, k)

    if (leftArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, lArmX, k)
      leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, lArmZ, k)
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, rArmX, k)
      rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, rArmZ, k)
    }
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, headY, k)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, headX, k)
      head.current.visible = !(st.mode === 'fp' && isControllingBoy)
    }

    if (cupRef.current) cupRef.current.visible = showCup
    if (remoteRef.current) remoteRef.current.visible = showRemote
    if (bookRef.current) bookRef.current.visible = showBook

    const isSleepingLying =
      (st.boyActivity === 'sleep' || st.boyActivity === 'girl_sleep') && st.boyPhase === 'active'
    if (zzzRef.current) {
      zzzRef.current.visible = isSleepingLying
      if (isSleepingLying) {
        zzzRef.current.children.forEach((c, i) => {
          const phase = (t * 0.55 + i * 0.33) % 1
          c.position.z = 0.3 + phase * 0.55
          c.position.x = 0.08 + Math.sin(t * 2 + i) * 0.06
          const s = (1 - Math.abs(phase - 0.5) * 1.6) * (0.032 + i * 0.012)
          c.scale.setScalar(Math.max(0.005, s))
        })
      }
    }
  })

  const SKIN = '#deb089'
  const sleeping = boyActivity === 'sleep' || boyActivity === 'girl_sleep'
  const userRole = useStore((s) => s.userRole)
  const roleOccupancy = useStore((s) => s.roleOccupancy)
  const isBoyClaimed = userRole === 'boy' || Boolean(roleOccupancy?.boy)
  const canControlBoy = !userRole || userRole === 'boy'
  // Nhân vật Khoa chỉ ẩn thân xác khi chính người chơi này đang vào vai Khoa và ở góc nhìn thứ nhất (FP)
  const hideInFp = useStore((s) => s.mode === 'fp') && userRole === 'boy'

  const isBoySleepingNow =
    (boyActivity === 'sleep' || boyActivity === 'girl_sleep') && boyPhase === 'active'

  return (
    <group
      ref={root}
      position={p}
      rotation={[0, ry, 0]}
      visible={!hideInFp}
      onClick={
        canControlBoy
          ? (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation()
              useStore.getState().setActiveChar('boy')
            }
          : undefined
      }
      onPointerOver={
        canControlBoy
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
              useStore.getState().setHoverHint('🧑 Khoa (Click để điều khiển)')
            }
          : undefined
      }
      onPointerOut={
        canControlBoy
          ? () => {
              document.body.style.cursor = 'auto'
              useStore.getState().setHoverHint(null)
            }
          : undefined
      }
    >
      {/* Chấm tròn nhỏ phát sáng trên đầu: Xanh khi có người chơi, Đỏ khi trống / Auto (ẩn khi ngủ) */}
      <CharacterRoleIndicator isControlled={isBoyClaimed} y={1.82} visible={!isBoySleepingNow} />

      <group ref={zzzRef} position={[0, 1.65, 0.2]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial color="#f3dfc0" emissive="#d8be98" emissiveIntensity={0.85} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      <group ref={leftLeg} position={[-0.105, 0.82, 0]}>
        <Capsule p={[0, -0.18, 0]} rad={0.08} len={0.28} c={outfit.pants} />
        <group ref={leftKnee} position={[0, -0.38, 0]}>
          <Capsule p={[0, -0.18, 0]} rad={0.074} len={0.28} c={outfit.pants} />
          <Ball p={[0, -0.38, 0.04]} s={[0.076, 0.052, 0.138]} c={outfit.shoes} />
        </group>
      </group>

      <group ref={rightLeg} position={[0.105, 0.82, 0]}>
        <Capsule p={[0, -0.18, 0]} rad={0.08} len={0.28} c={outfit.pants} />
        <group ref={rightKnee} position={[0, -0.38, 0]}>
          <Capsule p={[0, -0.18, 0]} rad={0.074} len={0.28} c={outfit.pants} />
          <Ball p={[0, -0.38, 0.04]} s={[0.076, 0.052, 0.138]} c={outfit.shoes} />
        </group>
      </group>

      <Capsule p={[0, 0.88, 0]} r={[0, 0, Math.PI / 2]} rad={0.104} len={0.13} c={outfit.pants} />

      <mesh ref={torso} position={[0, 1.19, 0]} scale={[1.08, 1, 0.72]} castShadow receiveShadow>
        <capsuleGeometry args={[0.19, 0.34, 8, 16]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.44, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.074, 0.016, 8, 20]} />
        <meshStandardMaterial color={outfit.collar} />
      </mesh>

      <group ref={leftArm} position={[-0.255, 1.36, 0]}>
        <Capsule p={[-0.02, -0.09, 0]} r={[0, 0, 0.1]} rad={0.062} len={0.15} c={outfit.shirt} />
        <Capsule
          p={[-0.035, -0.29, 0]}
          r={[0, 0, 0.06]}
          rad={0.05}
          len={0.22}
          c={outfit.longSleeve ? outfit.shirt : SKIN}
        />
        <mesh position={[-0.045, -0.42, 0]} rotation={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.052, 0.052, 0.025, 16]} />
          <meshStandardMaterial color="#d2cec6" metalness={0.75} roughness={0.22} />
        </mesh>
        <Ball p={[-0.048, -0.49, 0]} s={[0.05, 0.058, 0.05]} c={SKIN} />
      </group>

      <group ref={rightArm} position={[0.255, 1.36, 0]}>
        <Capsule p={[0.02, -0.09, 0]} r={[0, 0, -0.1]} rad={0.062} len={0.15} c={outfit.shirt} />
        <Capsule
          p={[0.035, -0.29, 0]}
          r={[0, 0, -0.06]}
          rad={0.05}
          len={0.22}
          c={outfit.longSleeve ? outfit.shirt : SKIN}
        />
        <Ball p={[0.048, -0.49, 0]} s={[0.05, 0.058, 0.05]} c={SKIN} />
        <mesh ref={cupRef} position={[0.05, -0.52, 0.06]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <cylinderGeometry args={[0.038, 0.03, 0.095, 14]} />
          <meshStandardMaterial color="#f2ede4" roughness={0.3} />
        </mesh>
        <mesh ref={remoteRef} position={[0.05, -0.52, 0.06]} visible={false}>
          <boxGeometry args={[0.04, 0.018, 0.11]} />
          <meshStandardMaterial color="#252321" roughness={0.4} />
        </mesh>
      </group>

      <group ref={bookRef} position={[0, 1.08, 0.28]} rotation={[-0.45, 0, 0]} visible={false}>
        <mesh position={[0, 0, -0.006]} castShadow>
          <boxGeometry args={[0.42, 0.28, 0.012]} />
          <meshStandardMaterial color="#363330" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -0.012]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.28, 12]} />
          <meshStandardMaterial color="#b8ab96" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.4, 0.26]} />
          <meshStandardMaterial map={bookTex} roughness={0.88} />
        </mesh>
        <mesh position={[0, -0.08, 0.008]}>
          <boxGeometry args={[0.014, 0.18, 0.002]} />
          <meshStandardMaterial color="#856d61" roughness={0.6} />
        </mesh>
      </group>

      <group ref={head} position={[0, 1.5, 0]}>
        <Capsule p={[0, 0, 0]} rad={0.052} len={0.06} c={SKIN} />
        <Ball p={[0, 0.16, 0]} s={[0.128, 0.148, 0.132]} c={SKIN} />
        <Ball p={[-0.046, 0.17, 0.118]} s={[0.015, sleeping ? 0.004 : 0.015, 0.01]} c="#18181b" />
        <Ball p={[0.046, 0.17, 0.118]} s={[0.015, sleeping ? 0.004 : 0.015, 0.01]} c="#18181b" />
        <mesh position={[0, 0.122, 0.122]} rotation={[0.2, 0, Math.PI]}>
          <torusGeometry args={[0.02, 0.004, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#7c4a3a" />
        </mesh>
        <Ball p={[0, 0.255, -0.015]} s={[0.142, 0.095, 0.142]} c="#181514" />
        <Ball p={[0, 0.2, -0.065]} s={[0.136, 0.115, 0.11]} c="#181514" />
        <Ball p={[-0.058, 0.235, 0.095]} s={[0.068, 0.042, 0.055]} c="#1d1918" />
        <Ball p={[0.062, 0.238, 0.092]} s={[0.064, 0.04, 0.055]} c="#1d1918" />
        {!sleeping && (
          <>
            <mesh position={[-0.048, 0.17, 0.126]}>
              <torusGeometry args={[0.034, 0.005, 8, 20]} />
              <meshStandardMaterial color="#c8c4bc" metalness={0.75} roughness={0.2} />
            </mesh>
            <mesh position={[0.048, 0.17, 0.126]}>
              <torusGeometry args={[0.034, 0.005, 8, 20]} />
              <meshStandardMaterial color="#c8c4bc" metalness={0.75} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.175, 0.126]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.004, 0.004, 0.028, 6]} />
              <meshStandardMaterial color="#c8c4bc" metalness={0.75} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}

interface DogLook {
  body: string
  belly: string
  face: string
  ear: string
  earType: 'up' | 'floppy'
}
export const CORGI: DogLook = {
  body: '#c79f74',
  belly: '#f4eee4',
  face: '#f4eee4',
  ear: '#b99166',
  earType: 'up',
}
export const PUG: DogLook = {
  body: '#e3cfae',
  belly: '#efe2cb',
  face: '#3a2e28',
  ear: '#2f2622',
  earType: 'floppy',
}

interface DogSpot {
  pos: V3
  yaw: number
  kind: 'stroll' | 'cushion' | 'kennel'
  meetPos: [number, number]
}

const DOG_ROUTINES: Record<'mochi' | 'bo', DogSpot[]> = {
  mochi: [
    { pos: [-3.2, 0, -1.6], yaw: 0.45, kind: 'stroll', meetPos: [-3.2, -1.6] },
    { pos: [-6.0, 0.08, 0.85], yaw: 0.65, kind: 'cushion', meetPos: [-5.15, 0.85] },
    { pos: [1.1, 0, -2.5], yaw: 1.25, kind: 'stroll', meetPos: [1.1, -2.5] },
    { pos: [-7.88, 0.08, -0.22], yaw: 0.25, kind: 'kennel', meetPos: [-5.65, 0.45] },
    { pos: [-1.4, 0, 2.2], yaw: 0.85, kind: 'stroll', meetPos: [-1.4, 2.2] },
  ],
  bo: [
    { pos: [2.6, 0, 3.8], yaw: -0.65, kind: 'stroll', meetPos: [2.6, 3.8] },
    { pos: [-7.35, 0.08, 3.65], yaw: 0.4, kind: 'cushion', meetPos: [-6.2, 3.35] },
    { pos: [7.6, 0, -1.2], yaw: -1.4, kind: 'stroll', meetPos: [7.6, -1.2] },
    { pos: [-7.28, 0.08, -0.28], yaw: 0.45, kind: 'kennel', meetPos: [-5.65, 0.15] },
    { pos: [0.4, 0, 1.65], yaw: -0.45, kind: 'stroll', meetPos: [0.4, 1.65] },
  ],
}

export function Dog({
  id,
  name,
  p,
  feedPos,
  feedYaw,
  ry = 0,
  look,
  s = 1,
}: {
  id: 'mochi' | 'bo'
  name: string
  p: V3
  feedPos: V3
  feedYaw: number
  ry?: number
  look: DogLook
  s?: number
}) {
  const root = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const flLeg = useRef<THREE.Group>(null)
  const frLeg = useRef<THREE.Group>(null)
  const blLeg = useRef<THREE.Group>(null)
  const brLeg = useRef<THREE.Group>(null)
  const leftEye = useRef<THREE.Mesh>(null)
  const rightEye = useRef<THREE.Mesh>(null)
  const heartRef = useRef<THREE.Mesh>(null)
  const zzzRef = useRef<THREE.Group>(null)

  const feedingUntil = useStore((st) => st.feedingUntil)
  const seed = id === 'mochi' ? 1.7 : 4.9

  const routineIdx = useRef(0)
  const routineTimer = useRef(id === 'mochi' ? 5.5 : 7.5)
  const walkCycle = useRef(0)
  const curYaw = useRef(ry)

  const heartGeo = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(0, -0.08)
    sh.bezierCurveTo(-0.01, -0.09, -0.11, -0.02, -0.11, 0.05)
    sh.bezierCurveTo(-0.11, 0.1, -0.04, 0.12, 0, 0.06)
    sh.bezierCurveTo(0.04, 0.12, 0.11, 0.1, 0.11, 0.05)
    sh.bezierCurveTo(0.11, -0.02, 0.01, -0.09, 0, -0.08)
    return new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 })
  }, [])

  useFrame(({ clock }, dt) => {
    if (!root.current) return
    const st = useStore.getState()
    const delta = Math.min(dt, 0.05)
    const t = clock.elapsedTime
    const k = 1 - Math.exp(-delta * 6)

    const isFeeding = Date.now() < feedingUntil
    const isBeingPetted =
      (st.boyActivity === 'pet' || st.girlActivity === 'pet') && st.petTargetId === id
    const shouldSleepInKennel = st.darkMode

    const routine = DOG_ROUTINES[id]
    const kennelSpot = routine.find((r) => r.kind === 'kennel') || routine[3]

    if (!isFeeding && !isBeingPetted && !shouldSleepInKennel) {
      routineTimer.current -= delta
      if (routineTimer.current <= 0) {
        routineIdx.current = (routineIdx.current + 1) % routine.length
        const nextSpot = routine[routineIdx.current]
        routineTimer.current = nextSpot.kind === 'kennel' ? 9.5 : 7.0
      }
    }

    const activeSpot = shouldSleepInKennel ? kennelSpot : routine[routineIdx.current]

    let tx = activeSpot.pos[0]
    let ty = activeSpot.pos[1]
    let tz = activeSpot.pos[2]
    let targetYaw = activeSpot.yaw

    if (isFeeding) {
      tx = feedPos[0]
      ty = feedPos[1]
      tz = feedPos[2]
      targetYaw = feedYaw
    } else if (isBeingPetted) {
      const [mx, mz] = LIVE_ACTORS.dogs[id].floorMeetPos
      tx = mx
      ty = 0
      tz = mz
      const [epx, epz] = STATIONS.pet.entryPos
      targetYaw = Math.atan2(epx - mx, epz - mz)
    } else {
      if (activeSpot.kind === 'stroll' && root.current.position.x > -6.2) {
        LIVE_ACTORS.dogs[id].floorMeetPos = [
          root.current.position.x,
          root.current.position.z,
        ]
      } else {
        LIVE_ACTORS.dogs[id].floorMeetPos = activeSpot.meetPos
      }
    }

    const cx = root.current.position.x
    const cz = root.current.position.z
    const dist = Math.hypot(tx - cx, tz - cz)
    const isWalking = dist > 0.06

    if (isWalking) {
      let wx = tx
      let wz = tz
      const inKennelNow = cx < -6.5 && cz < 0.35
      const targetInKennel = tx < -6.5 && tz < 0.35
      if (targetInKennel && !inKennelNow) {
        if (Math.abs(cx - -7.55) > 0.48 || cz < 0.35) {
          wx = -7.55
          wz = 0.78
        }
      } else if (!targetInKennel && inKennelNow) {
        wx = -7.55
        wz = 0.82
      }

      const dx = wx - cx
      const dz = wz - cz
      const segDist = Math.hypot(dx, dz) || 1
      const speed = isFeeding || isBeingPetted ? 2.15 : 1.35
      const step = Math.min(segDist, speed * delta)
      root.current.position.x += (dx / segDist) * step
      root.current.position.z += (dz / segDist) * step
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, ty, k)

      const moveYaw = Math.atan2(dx, dz)
      const yawDiff = Math.atan2(Math.sin(moveYaw - curYaw.current), Math.cos(moveYaw - curYaw.current))
      curYaw.current += yawDiff * Math.min(1, delta * 10)
      walkCycle.current += delta * (isFeeding ? 16 : 11)
    } else {
      root.current.position.x = THREE.MathUtils.lerp(root.current.position.x, tx, k)
      root.current.position.y = THREE.MathUtils.lerp(root.current.position.y, ty, k)
      root.current.position.z = THREE.MathUtils.lerp(root.current.position.z, tz, k)
      const yawDiff = Math.atan2(Math.sin(targetYaw - curYaw.current), Math.cos(targetYaw - curYaw.current))
      curYaw.current += yawDiff * Math.min(1, delta * 8)
    }

    root.current.rotation.y = curYaw.current
    LIVE_ACTORS.dogs[id].pos = [
      root.current.position.x,
      root.current.position.y,
      root.current.position.z,
    ]

    const isSleepingNow =
      !isWalking && !isFeeding && !isBeingPetted && activeSpot.kind === 'kennel'
    const isRestingOnCushion =
      !isWalking && !isFeeding && !isBeingPetted && activeSpot.kind === 'cushion'
    const isReceivingStrokes =
      isBeingPetted &&
      ((st.boyActivity === 'pet' && st.boyPhase !== 'walking') ||
        (st.girlActivity === 'pet' && st.girlPhase !== 'walking'))

    const legSwing = isWalking ? Math.sin(walkCycle.current) * 0.55 : 0
    const legTuck = isSleepingNow || isRestingOnCushion ? 1.15 : 0
    if (flLeg.current) flLeg.current.rotation.x = THREE.MathUtils.lerp(flLeg.current.rotation.x, isWalking ? legSwing : -legTuck, k)
    if (brLeg.current) brLeg.current.rotation.x = THREE.MathUtils.lerp(brLeg.current.rotation.x, isWalking ? legSwing : legTuck, k)
    if (frLeg.current) frLeg.current.rotation.x = THREE.MathUtils.lerp(frLeg.current.rotation.x, isWalking ? -legSwing : -legTuck, k)
    if (blLeg.current) blLeg.current.rotation.x = THREE.MathUtils.lerp(blLeg.current.rotation.x, isWalking ? -legSwing : legTuck, k)

    if (body.current) {
      const targetBodyY = isSleepingNow || isRestingOnCushion ? -0.055 : isReceivingStrokes ? -0.02 : 0
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, targetBodyY, k)
      body.current.scale.y = 1 + Math.sin((t + seed) * (isSleepingNow ? 1.2 : 2.2)) * 0.03
    }

    if (tail.current) {
      const wagSpeed = isBeingPetted || isFeeding ? 15 : isSleepingNow ? 1.5 : 7.5
      const wagAmp = isBeingPetted || isFeeding ? 0.65 : isSleepingNow ? 0.05 : 0.35
      tail.current.rotation.y = Math.sin((t + seed) * wagSpeed) * wagAmp
    }

    if (head.current) {
      if (isFeeding && !isWalking) {
        head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, 0.42 + Math.sin(t * 12 + seed) * 0.16, k)
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, Math.sin(t * 4) * 0.08, k)
        head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, 0, k)
      } else if (isReceivingStrokes) {
        head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -0.28 + Math.sin(t * 7.2) * 0.06, k)
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, Math.sin(t * 3.6) * 0.1, k)
        head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, Math.sin(t * 7.2) * 0.12, k)
      } else if (isSleepingNow) {
        head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, 0.28, k)
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, 0.15, k)
        head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, 0.12, k)
      } else {
        head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, 0, k)
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, Math.sin((t + seed) * 0.8) * 0.22, k)
        head.current.rotation.z = THREE.MathUtils.lerp(head.current.rotation.z, 0, k)
      }
    }

    const eyesClosed = isSleepingNow || isReceivingStrokes
    if (leftEye.current && rightEye.current) {
      leftEye.current.scale.y = eyesClosed ? 0.004 : 0.018
      rightEye.current.scale.y = eyesClosed ? 0.004 : 0.018
    }

    if (heartRef.current) {
      const showHeart = isBeingPetted || (isFeeding && !isWalking)
      heartRef.current.visible = showHeart
      if (showHeart) {
        heartRef.current.position.y = 0.58 + ((t * 0.55) % 0.32)
        heartRef.current.rotation.y = t * 2.6
      }
    }

    if (zzzRef.current) {
      zzzRef.current.visible = isSleepingNow
      if (isSleepingNow) {
        zzzRef.current.children.forEach((c, i) => {
          const phase = (t * 0.5 + i * 0.33) % 1
          c.position.y = 0.42 + phase * 0.38
          c.position.x = Math.sin(t * 2 + i) * 0.05
          const sc = (1 - Math.abs(phase - 0.5) * 1.6) * (0.025 + i * 0.008)
          c.scale.setScalar(Math.max(0.004, sc))
        })
      }
    }
  })

  return (
    <group
      ref={root}
      position={p}
      rotation={[0, ry, 0]}
      scale={s}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        useStore.getState().petDog(id, true)
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        useStore.getState().setHoverHint(`🐶 ${name}`)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        useStore.getState().setHoverHint(null)
      }}
    >
      <mesh ref={heartRef} geometry={heartGeo} position={[0, 0.62, 0.2]} visible={false}>
        <meshStandardMaterial color="#c98882" emissive="#c98882" emissiveIntensity={0.85} />
      </mesh>

      <group ref={zzzRef} position={[0, 0.35, 0.25]} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#f3dfc0" emissive="#d8be98" emissiveIntensity={0.85} />
          </mesh>
        ))}
      </group>

      <group ref={body}>
        <Capsule p={[0, 0.18, 0]} r={[Math.PI / 2, 0, 0]} s={[1.08, 1, 0.95]} rad={0.145} len={0.34} c={look.body} />
        <Capsule p={[0, 0.12, 0.02]} r={[Math.PI / 2, 0, 0]} rad={0.105} len={0.28} c={look.belly} />

        <group ref={flLeg} position={[-0.095, 0.12, 0.16]}>
          <Capsule p={[0, -0.055, 0]} rad={0.036} len={0.07} c={look.belly} />
        </group>
        <group ref={frLeg} position={[0.095, 0.12, 0.16]}>
          <Capsule p={[0, -0.055, 0]} rad={0.036} len={0.07} c={look.belly} />
        </group>
        <group ref={blLeg} position={[-0.105, 0.12, -0.15]}>
          <Capsule p={[0, -0.055, 0]} rad={0.04} len={0.07} c={look.body} />
        </group>
        <group ref={brLeg} position={[0.105, 0.12, -0.15]}>
          <Capsule p={[0, -0.055, 0]} rad={0.04} len={0.07} c={look.body} />
        </group>

        <group ref={head} position={[0, 0.3, 0.26]}>
          <Ball p={[0, 0, 0]} s={[0.145, 0.135, 0.135]} c={look.body} />
          <Ball p={[0, -0.035, 0.105]} s={[0.072, 0.058, 0.078]} c={look.face} />
          <Ball p={[0, -0.018, 0.182]} s={[0.024, 0.018, 0.018]} c="#111" rough={0.3} />
          <mesh ref={leftEye} position={[-0.058, 0.038, 0.118]} scale={[0.018, 0.018, 0.012]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
          <mesh ref={rightEye} position={[0.058, 0.038, 0.118]} scale={[0.018, 0.018, 0.012]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
          {look.earType === 'up' ? (
            <>
              <mesh position={[-0.078, 0.145, -0.02]} rotation={[0, 0, 0.28]} castShadow>
                <coneGeometry args={[0.052, 0.14, 10]} />
                <meshStandardMaterial color={look.ear} />
              </mesh>
              <mesh position={[0.078, 0.145, -0.02]} rotation={[0, 0, -0.28]} castShadow>
                <coneGeometry args={[0.052, 0.14, 10]} />
                <meshStandardMaterial color={look.ear} />
              </mesh>
            </>
          ) : (
            <>
              <Ball p={[-0.115, 0.055, 0]} s={[0.038, 0.058, 0.02]} c={look.ear} />
              <Ball p={[0.115, 0.055, 0]} s={[0.038, 0.058, 0.02]} c={look.ear} />
            </>
          )}
        </group>

        <group ref={tail} position={[0, 0.22, -0.28]}>
          <Capsule p={[0, 0.03, -0.05]} r={[-0.85, 0, 0]} rad={0.032} len={0.09} c={look.body} />
        </group>
      </group>
    </group>
  )
}
