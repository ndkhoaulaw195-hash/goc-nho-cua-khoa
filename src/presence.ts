/**
 * Quản lý đồng bộ sự hiện diện và khóa vai nhân vật (Role Presence & Locking)
 * - Tự động đồng bộ thời gian thực qua BroadcastChannel (cho các tab/cửa sổ cùng thiết bị)
 * - Đồng bộ tức thời qua Cloud Pub/Sub WebSockets (ntfy.sh) cho hai thiết bị khác nhau (PC & Điện thoại)
 * - Khóa độc quyền: Khoa vào vai Nam thì đối phương không thể vào vai Nam nữa và ngược lại
 * - Tự động nhả vai (release) khi đóng tab, đổi vai, hoặc mất kết nối quá 12 giây
 */

export type RoleType = 'boy' | 'girl'

export interface RoleOccupancy {
  occupied: boolean
  clientId: string | null
  lastSeen: number
  isSelf: boolean
}

export type PresenceState = Record<RoleType, RoleOccupancy>

const SYNC_TOPIC = 'goc-nho-khoa-role-lock-room-95'
const TIMEOUT_MS = 12000 // 12 giây không có heartbeat thì tự giải phóng vai
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
const listeners = new Set<PresenceListener>()

const presenceState: PresenceState = {
  boy: { occupied: false, clientId: null, lastSeen: 0, isSelf: false },
  girl: { occupied: false, clientId: null, lastSeen: 0, isSelf: false },
}

function notifyListeners() {
  const snapshot: PresenceState = {
    boy: { ...presenceState.boy, isSelf: presenceState.boy.clientId === CLIENT_ID },
    girl: { ...presenceState.girl, isSelf: presenceState.girl.clientId === CLIENT_ID },
  }
  listeners.forEach((l) => l(snapshot))
}

let bc: BroadcastChannel | null = null
let ws: WebSocket | null = null
let heartbeatTimer: any = null
let pruneTimer: any = null
let currentClaimedRole: RoleType | null = null

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
      notifyListeners()
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
        notifyListeners()
      }
    }, 2500)
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
      // Tự động kết nối lại sau 3.5s nếu bị ngắt mạng
      setTimeout(connectRemoteWs, 3500)
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

  if (data.type === 'query') {
    // Tab khác hỏi: nếu mình đang giữ vai nào, phát lại thông điệp claim để họ biết
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
      notifyListeners()
    }
    return
  }

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
        notifyListeners()
      }
    }
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
  listeners.add(listener)
  // Gửi ngay trạng thái hiện tại
  listener({
    boy: { ...presenceState.boy, isSelf: presenceState.boy.clientId === CLIENT_ID },
    girl: { ...presenceState.girl, isSelf: presenceState.girl.clientId === CLIENT_ID },
  })
  return () => {
    listeners.delete(listener)
  }
}

/** Yêu cầu chiếm giữ vai (Claim Role) */
export function claimRole(role: RoleType): boolean {
  const now = Date.now()
  // Kiểm tra xem vai này đã bị ai khác chiếm chưa
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
  notifyListeners()

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
  notifyListeners()

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
