/**
 * Quản lý đồng bộ sự hiện diện, khóa vai và đồng bộ hành động thời gian thực (Role Presence, Locking & Multiplayer Sync)
 * - Tự động đồng bộ tức thời qua BroadcastChannel (cho các tab/cửa sổ cùng thiết bị, độ trễ 0ms)
 * - Đồng bộ tức thời qua Cloud Pub/Sub WebSockets (ntfy.sh) cho hai thiết bị khác nhau (PC & Điện thoại)
 * - Khóa độc quyền: Khoa vào vai Nam thì đối phương không thể vào vai Nam nữa và ngược lại
 * - Đồng bộ hành động: Đi lại, tương tác đồ vật, vuốt chó, đổi đồ, bật tắt đèn/TV/rèm cửa... cùng một thời điểm
 * - Tắt hoàn toàn Auto-Life khi có người chơi thật vào vai để nhân vật không "tự biên tự diễn"
 */

export type RoleType = 'boy' | 'girl'

export interface RoleOccupancy {
  occupied: boolean
  clientId: string | null
  lastSeen: number
  isSelf: boolean
}

export type PresenceState = Record<RoleType, RoleOccupancy>

export interface RemoteActorState {
  pos: [number, number, number]
  yaw: number
  activity: string
  phase: string
  outfitId: string
  lastSeen: number
}

export interface PlayerActionPayload {
  type: 'player_action'
  clientId: string
  role: RoleType
  action: 'startActivity' | 'petDog' | 'walkTo' | 'setOutfit' | 'worldToggle'
  payload: any
  ts: number
}

export interface PosSyncPayload {
  type: 'pos_sync'
  clientId: string
  role: RoleType
  pos: [number, number, number]
  yaw: number
  activity: string
  phase: string
  outfitId: string
  ts: number
}

const SYNC_TOPIC = 'goc-nho-khoa-role-lock-room-95'
const TIMEOUT_MS = 16000 // 16 giây không có heartbeat thì tự giải phóng vai
const HEARTBEAT_INTERVAL_MS = 3800

// Mỗi phiên trình duyệt (tab) có 1 clientId ngẫu nhiên duy nhất
function getSessionClientId(): string {
  if (typeof window === 'undefined') return 'server'
  let id = sessionStorage.getItem('goc_nho_client_id')
  if (!id) {
    id = 'cli_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36)
    sessionStorage.setItem('goc_nho_client_id', id)
  }
  return id
}

export const CLIENT_ID = getSessionClientId()

type PresenceListener = (state: PresenceState) => void
type ActionListener = (action: PlayerActionPayload) => void
type PosSyncListener = (posSync: PosSyncPayload) => void

const presenceListeners = new Set<PresenceListener>()
const actionListeners = new Set<ActionListener>()
const posSyncListeners = new Set<PosSyncListener>()

const presenceState: PresenceState = {
  boy: { occupied: false, clientId: null, lastSeen: 0, isSelf: false },
  girl: { occupied: false, clientId: null, lastSeen: 0, isSelf: false },
}

export const REMOTE_ACTORS: Record<RoleType, RemoteActorState> = {
  boy: {
    pos: [-1.1, 0, -1.2],
    yaw: 0.15,
    activity: 'idle',
    phase: 'active',
    outfitId: 'casual',
    lastSeen: 0,
  },
  girl: {
    pos: [-3.9, 4.35, -0.35],
    yaw: -0.15,
    activity: 'idle',
    phase: 'active',
    outfitId: 'girl_casual',
    lastSeen: 0,
  },
}

function notifyPresenceListeners() {
  const snapshot: PresenceState = {
    boy: { ...presenceState.boy, isSelf: presenceState.boy.clientId === CLIENT_ID },
    girl: { ...presenceState.girl, isSelf: presenceState.girl.clientId === CLIENT_ID },
  }
  presenceListeners.forEach((l) => l(snapshot))
}

let bc: BroadcastChannel | null = null
let ws: WebSocket | null = null
let heartbeatTimer: any = null
let pruneTimer: any = null
let currentClaimedRole: RoleType | null = null

// Hạn chế gửi quá nhiều request lên ntfy.sh (Throttle POS sync)
let lastRemotePosSyncTime = 0
let pendingPosSyncPayload: any = null
let posSyncThrottleTimer: any = null

// Khởi tạo kênh BroadcastChannel & Remote WebSocket
export function initPresenceSync() {
  if (typeof window === 'undefined') return

  // 1. Kênh Broadcast nội bộ máy (cross-tab)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('goc_nho_presence_channel')
      bc.onmessage = (e) => {
        handleIncomingMessage(e.data)
      }
    } catch {
      // Fallback nếu trình duyệt cũ không hỗ trợ
    }
  }

  // 2. Kênh WebSocket từ xa (cross-device giữa PC và điện thoại)
  connectRemoteWs()

  // 3. Đọc dữ liệu ban đầu từ localStorage nếu có
  try {
    const raw = localStorage.getItem('goc_nho_presence_cache')
    if (raw) {
      const parsed = JSON.parse(raw)
      const now = Date.now()
      if (parsed.boy && now - parsed.boy.lastSeen < TIMEOUT_MS) {
        presenceState.boy = parsed.boy
      }
      if (parsed.girl && now - parsed.girl.lastSeen < TIMEOUT_MS) {
        presenceState.girl = parsed.girl
      }
      notifyPresenceListeners()
    }
  } catch {}

  // 4. Gửi tín hiệu query để hỏi các tab/thiết bị khác
  broadcastMessage({ type: 'query', clientId: CLIENT_ID })

  // 5. Chu kỳ kiểm tra xóa người chơi đã offline (timeout)
  if (!pruneTimer) {
    pruneTimer = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const r of ['boy', 'girl'] as RoleType[]) {
        if (presenceState[r].occupied && presenceState[r].clientId !== CLIENT_ID) {
          if (now - presenceState[r].lastSeen > TIMEOUT_MS) {
            presenceState[r] = { occupied: false, clientId: null, lastSeen: 0, isSelf: false }
            changed = true
          }
        }
      }
      if (changed) {
        saveCache()
        notifyPresenceListeners()
      }
    }, 3000)
  }

  // 6. Xử lý khi đóng tab hoặc reload: tự động nhả vai
  window.addEventListener('beforeunload', () => {
    if (currentClaimedRole) {
      releaseRole(currentClaimedRole)
    }
  })
}

function connectRemoteWs() {
  try {
    ws = new WebSocket(`wss://ntfy.sh/${SYNC_TOPIC}/ws`)
    ws.onopen = () => {
      // Khi vừa kết nối, hỏi trạng thái từ các máy khác
      broadcastRemote({ type: 'query', clientId: CLIENT_ID })
      if (currentClaimedRole) {
        broadcastRemote({ type: 'claim', role: currentClaimedRole, clientId: CLIENT_ID, ts: Date.now() })
      }
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'message' && msg.message) {
          const payload = JSON.parse(msg.message)
          handleIncomingMessage(payload)
        }
      } catch {}
    }
    ws.onclose = () => {
      setTimeout(connectRemoteWs, 4000)
    }
    ws.onerror = () => {
      try { ws?.close() } catch {}
    }
  } catch {
    // ntfy.sh có thể bị chặn trên một số mạng, BroadcastChannel và localStorage vẫn chạy độc lập hoàn hảo
  }
}

function broadcastRemote(data: any) {
  try {
    fetch(`https://ntfy.sh/${SYNC_TOPIC}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {})
  } catch {}
}

function broadcastMessage(data: any) {
  if (bc) {
    try {
      bc.postMessage(data)
    } catch {}
  }
  broadcastRemote(data)
}

function handleIncomingMessage(data: any) {
  if (!data || typeof data !== 'object') return
  if (data.clientId === CLIENT_ID) return // Bỏ qua tin nhắn từ chính mình

  const now = Date.now()

  // 1. Phản hồi Query
  if (data.type === 'query') {
    if (currentClaimedRole) {
      broadcastMessage({
        type: 'claim',
        role: currentClaimedRole,
        clientId: CLIENT_ID,
        ts: now,
      })
    }
    return
  }

  // 2. Claim hoặc Heartbeat sự hiện diện
  if (data.type === 'claim' || data.type === 'heartbeat') {
    const role: RoleType = data.role
    if (role === 'boy' || role === 'girl') {
      presenceState[role] = {
        occupied: true,
        clientId: data.clientId,
        lastSeen: now,
        isSelf: false,
      }
      saveCache()
      notifyPresenceListeners()
    }
    return
  }

  // 3. Release nhả vai
  if (data.type === 'release') {
    const role: RoleType = data.role
    if (role === 'boy' || role === 'girl') {
      if (presenceState[role].clientId === data.clientId) {
        presenceState[role] = {
          occupied: false,
          clientId: null,
          lastSeen: 0,
          isSelf: false,
        }
        saveCache()
        notifyPresenceListeners()
      }
    }
    return
  }

  // 4. Đồng bộ Hành động người chơi (Player Action)
  if (data.type === 'player_action') {
    const actionMsg = data as PlayerActionPayload
    const role = actionMsg.role
    if (role === 'boy' || role === 'girl') {
      presenceState[role] = {
        occupied: true,
        clientId: actionMsg.clientId,
        lastSeen: now,
        isSelf: false,
      }
      saveCache()
      notifyPresenceListeners()
    }
    actionListeners.forEach((listener) => {
      try {
        listener(actionMsg)
      } catch (err) {
        console.error('Lỗi khi xử lý action listener:', err)
      }
    })
    return
  }

  // 5. Đồng bộ Tọa độ thời gian thực (Position Sync)
  if (data.type === 'pos_sync') {
    const posMsg = data as PosSyncPayload
    const role = posMsg.role
    if (role === 'boy' || role === 'girl') {
      presenceState[role] = {
        occupied: true,
        clientId: posMsg.clientId,
        lastSeen: now,
        isSelf: false,
      }
      REMOTE_ACTORS[role] = {
        pos: posMsg.pos,
        yaw: posMsg.yaw,
        activity: posMsg.activity,
        phase: posMsg.phase,
        outfitId: posMsg.outfitId,
        lastSeen: now,
      }
      notifyPresenceListeners()
    }
    posSyncListeners.forEach((listener) => {
      try {
        listener(posMsg)
      } catch (err) {
        console.error('Lỗi khi xử lý posSync listener:', err)
      }
    })
    return
  }
}

function saveCache() {
  try {
    localStorage.setItem('goc_nho_presence_cache', JSON.stringify(presenceState))
  } catch {}
}

/** Đăng ký nhận cập nhật trạng thái sự hiện diện */
export function subscribePresence(listener: PresenceListener): () => void {
  presenceListeners.add(listener)
  // Gửi ngay trạng thái hiện tại
  listener({
    boy: { ...presenceState.boy, isSelf: presenceState.boy.clientId === CLIENT_ID },
    girl: { ...presenceState.girl, isSelf: presenceState.girl.clientId === CLIENT_ID },
  })
  return () => {
    presenceListeners.delete(listener)
  }
}

/** Đăng ký nhận hành động người chơi từ xa */
export function subscribePlayerAction(listener: ActionListener): () => void {
  actionListeners.add(listener)
  return () => {
    actionListeners.delete(listener)
  }
}

/** Đăng ký nhận tọa độ thời gian thực từ xa */
export function subscribePosSync(listener: PosSyncListener): () => void {
  posSyncListeners.add(listener)
  return () => {
    posSyncListeners.delete(listener)
  }
}

/** Phát thông điệp hành động người chơi (startActivity, petDog, walkTo, setOutfit, worldToggle) */
export function broadcastPlayerAction(
  role: RoleType,
  action: 'startActivity' | 'petDog' | 'walkTo' | 'setOutfit' | 'worldToggle',
  payload: any,
) {
  const msg: PlayerActionPayload = {
    type: 'player_action',
    clientId: CLIENT_ID,
    role,
    action,
    payload,
    ts: Date.now(),
  }
  broadcastMessage(msg)
}

/** Phát tọa độ và trạng thái thời gian thực của nhân vật mình đang điều khiển */
export function broadcastPosSync(
  role: RoleType,
  pos: [number, number, number],
  yaw: number,
  activity: string,
  phase: string,
  outfitId: string,
) {
  const msg: PosSyncPayload = {
    type: 'pos_sync',
    clientId: CLIENT_ID,
    role,
    pos,
    yaw,
    activity,
    phase,
    outfitId,
    ts: Date.now(),
  }

  // Kênh BroadcastChannel (cùng máy): gửi ngay lập tức không giới hạn
  if (bc) {
    try {
      bc.postMessage(msg)
    } catch {}
  }

  // Kênh Remote ntfy.sh (khác thiết bị): throttle tối đa 1 lần mỗi 800ms
  pendingPosSyncPayload = msg
  const now = performance.now()
  if (now - lastRemotePosSyncTime > 800) {
    lastRemotePosSyncTime = now
    broadcastRemote(msg)
  } else if (!posSyncThrottleTimer) {
    posSyncThrottleTimer = setTimeout(() => {
      posSyncThrottleTimer = null
      lastRemotePosSyncTime = performance.now()
      if (pendingPosSyncPayload) {
        broadcastRemote(pendingPosSyncPayload)
      }
    }, 800)
  }
}

/** Yêu cầu chiếm giữ vai (Claim Role) */
export function claimRole(role: RoleType): boolean {
  const now = Date.now()
  const cur = presenceState[role]
  if (cur.occupied && cur.clientId !== CLIENT_ID && now - cur.lastSeen < TIMEOUT_MS) {
    return false // Đã có người vào vai này rồi!
  }

  // Nếu đang giữ vai khác, nhả vai cũ trước
  if (currentClaimedRole && currentClaimedRole !== role) {
    releaseRole(currentClaimedRole)
  }

  currentClaimedRole = role
  presenceState[role] = {
    occupied: true,
    clientId: CLIENT_ID,
    lastSeen: now,
    isSelf: true,
  }
  saveCache()
  notifyPresenceListeners()

  // Phát thông báo ra ngoài
  broadcastMessage({
    type: 'claim',
    role,
    clientId: CLIENT_ID,
    ts: now,
  })

  // Bắt đầu gửi Heartbeat định kỳ
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    if (currentClaimedRole) {
      presenceState[currentClaimedRole].lastSeen = Date.now()
      saveCache()
      broadcastMessage({
        type: 'heartbeat',
        role: currentClaimedRole,
        clientId: CLIENT_ID,
        ts: Date.now(),
      })
    }
  }, HEARTBEAT_INTERVAL_MS)

  return true
}

/** Nhả vai (khi đổi vai, đăng xuất hoặc đóng tab) */
export function releaseRole(role?: RoleType) {
  const targetRole = role || currentClaimedRole
  if (!targetRole) return

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  if (currentClaimedRole === targetRole) {
    currentClaimedRole = null
  }

  if (presenceState[targetRole].clientId === CLIENT_ID) {
    presenceState[targetRole] = {
      occupied: false,
      clientId: null,
      lastSeen: 0,
      isSelf: false,
    }
  }

  saveCache()
  notifyPresenceListeners()

  broadcastMessage({
    type: 'release',
    role: targetRole,
    clientId: CLIENT_ID,
    ts: Date.now(),
  })
}

/** Lấy trạng thái hiện tại tức thời */
export function getPresenceSnapshot(): PresenceState {
  return {
    boy: { ...presenceState.boy, isSelf: presenceState.boy.clientId === CLIENT_ID },
    girl: { ...presenceState.girl, isSelf: presenceState.girl.clientId === CLIENT_ID },
  }
}
