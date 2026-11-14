import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FLOOR1_VIEW,
  FLOOR2_VIEW,
  FP_DISTANCE_MAX,
  FP_DISTANCE_MIN,
  FP_DISTANCES,
  GIRL_OUTFITS,
  HOME_VIEW,
  LIVE_ACTORS,
  OUTFITS,
  RANDOM_VIEWS,
  STATIONS,
  TV_CHANNELS,
  WALKTHROUGH_SPOTS,
  WEATHER_MODES,
  type FpDistPreset,
  type V3,
  type WalkthroughSpaceId,
} from './data/config'
export { FP_DISTANCES } from './data/config'
export type { FpDistPreset } from './data/config'
import {
  broadcastPlayerAction,
  claimRole,
  getPresenceSnapshot,
  initPresenceSync,
  releaseRole,
  subscribePlayerAction,
  subscribePosSync,
  subscribePresence,
} from './presence'

export type Mode = 'orbit' | 'fp'
export type ActiveChar = 'boy' | 'girl'

export interface DynamicSeatTarget {
  id: string
  char: ActiveChar
  pos: V3
  yaw: number
  pose: 'sit' | 'lie' | 'recline'
  label: string
}

export interface OrientCommand {
  char: ActiveChar
  yaw: number
  tick: number
}

export interface ActiveTargetUi {
  id: string
  label: string
  category: string
}

export interface ContainerCard {
  id: string
  title: string
  body: string
  icon: string
  anchor: V3
  zone: 'exterior' | 'interior_f1' | 'interior_f2'
}

export interface AutoIntent {
  icon: string
  label: string
  targetId: string | null
}
export type Activity =
  | 'idle'
  | 'tv'
  | 'pc'
  | 'sleep'
  | 'wardrobe'
  | 'feed'
  | 'drink'
  | 'darts'
  | 'pet'
  | 'bath'
  | 'wash'
  | 'laundry'
  | 'read'
  | 'girl_sleep'
  | 'girl_pc'
  | 'girl_vanity'
  | 'girl_lounge'
  | 'girl_nook'
  | 'girl_wardrobe'
  | 'piano'
  | 'paint'

export type ActivityPhase = 'walking' | 'entering' | 'active'
export type PcState = 'on' | 'rgb' | 'off'

export type WeatherMode = 'clear' | 'sunset' | 'rain' | 'night'

export interface CamFocus {
  pos: V3
  target: V3
}

interface State {
  // Sảnh chờ & Tài khoản nhân vật ('boy' = Khoa, 'girl' = Bạn Gái)
  userRole: ActiveChar | null
  roleOccupancy: { boy: boolean; girl: boolean }
  setUserRole: (role: ActiveChar) => boolean
  logout: () => void

  mode: Mode
  setMode: (m: Mode) => void
  darkMode: boolean
  toggleDarkMode: () => void
  graphicMode: 'hd'
  toggleGraphicMode: () => void
  isInteracting: boolean
  setIsInteracting: (isInteracting: boolean) => void

  // Chọn nhân vật người chơi đang điều khiển: 'boy' (Khoa) hoặc 'girl' (Bạn Gái)
  activeChar: ActiveChar
  setActiveChar: (char: ActiveChar) => void

  // Trạng thái hoạt động độc lập của từng nhân vật (Cả 2 đều dùng chung mọi đồ đạc trong nhà, trừ tủ quần áo)
  boyActivity: Activity
  boyPhase: ActivityPhase
  girlActivity: Activity
  girlPhase: ActivityPhase

  // Hoạt động của nhân vật đang được chọn điều khiển (đồng bộ với UI & Camera)
  activity: Activity
  activityPhase: ActivityPhase
  isUserInitiated: boolean
  boyAutoLife: boolean
  girlAutoLife: boolean
  toggleBoyAutoLife: () => void
  toggleGirlAutoLife: () => void
  startActivity: (act: Activity, fromUser?: boolean, forChar?: ActiveChar, fromRemote?: boolean) => void
  setActivityPhase: (phase: ActivityPhase, forChar?: ActiveChar) => void

  avatarTarget: V3 | null
  setAvatarTarget: (p: V3 | null, fromRemote?: boolean, fromQueue?: boolean) => void
  outfitId: string
  outfitSpinTick: number
  setOutfitId: (id: string, fromRemote?: boolean) => void

  // Tiện ích & Thiết bị Tầng 2
  girlOutfitId: string
  girlOutfitSpinTick: number
  setGirlOutfitId: (id: string, fromRemote?: boolean) => void
  girlPcState: PcState
  cycleGirlPcState: () => void
  girlChairSpinTick: number
  spinGirlChair: () => void
  girlLampOn: boolean
  toggleGirlLamp: (next?: boolean) => boolean
  girlVanityLightOn: boolean
  toggleGirlVanityLight: () => void
  girlShelfLedOn: boolean
  toggleGirlShelfLed: () => void
  girlWardrobeOpen: boolean
  setGirlWardrobeOpen: (v: boolean) => void
  girlBookPage: number
  nextGirlBookPage: () => void

  // Khung ảnh treo tường
  activePhoto: number | null
  setActivePhoto: (id: number | null) => void

  // Camera & Góc nhìn & Kiến trúc
  focus: CamFocus | null
  viewPreset: 'overview' | 'floor1' | 'floor2'
  roofVisible: boolean
  wallMode: 'full' | 'cutaway' | 'ghost'
  nearInteriorOpen: boolean
  setNearInteriorOpen: (v: boolean) => void
  fpPerspective: 'third' | 'eye'
  toggleFpPerspective: () => void
  fpDistPreset: FpDistPreset
  fpDistance: number
  setFpDistPreset: (p: FpDistPreset) => void
  cycleFpDistPreset: () => void
  setFpDistance: (d: number) => void
  walkthroughSpace: WalkthroughSpaceId
  walkthroughSpawn: { space: WalkthroughSpaceId; pos: V3; yaw: number; tick: number } | null
  jumpToWalkthroughSpace: (space: WalkthroughSpaceId) => void
  cycleWallMode: () => void
  randomViewIdx: number
  setFocus: (f: CamFocus | null, preset?: 'overview' | 'floor1' | 'floor2') => void
  returnOverview: () => void
  resetCamera: () => void
  randomCameraView: () => void
  cutWalls: { back: boolean; left: boolean; right: boolean }
  setCutWalls: (cw: { back: boolean; left: boolean; right: boolean }) => void

  // Thiết bị trong phòng Tầng 1
  lampOn: boolean
  toggleLamp: () => void
  floor1BedLampOn: boolean
  toggleFloor1BedLamp: () => void
  floor1DeskLampOn: boolean
  toggleFloor1DeskLamp: () => void
  floor1HeadboardLedOn: boolean
  toggleFloor1HeadboardLed: () => void

  // Thiết bị phòng tắm
  bathMirrorLightOn: boolean
  toggleBathMirrorLight: () => void
  bathFullMirrorLightOn: boolean
  toggleBathFullMirrorLight: () => void

  // Đèn riêng Tầng 2
  floor2ReadingLampOn: boolean
  toggleFloor2ReadingLamp: () => void
  floor2ArchLightOn: boolean
  toggleFloor2ArchLight: () => void

  acOn: boolean
  toggleAc: () => void
  curtainsOpen: boolean
  curtainsFloor1Open: boolean
  curtainsFloor2Open: boolean
  toggleCurtains: (floor?: 1 | 2) => void
  toggleCurtainsFloor1: () => void
  toggleCurtainsFloor2: () => void
  wardrobeOpen: boolean
  setWardrobeOpen: (v: boolean) => void
  pcState: PcState
  cyclePcState: () => void
  chairSpinTick: number
  spinChair: () => void
  dartCount: number
  dartFlightStart: number
  triggerDartFlight: () => void
  waterPourUntil: number
  tvOn: boolean
  toggleTv: () => void
  tvChannel: number
  cycleTvChannel: () => void

  // Cho chó ăn & đi tới vuốt ve thật
  feedingUntil: number
  petTargetId: 'mochi' | 'bo'
  petDog: (id: 'mochi' | 'bo', fromUser?: boolean, forChar?: ActiveChar, fromRemote?: boolean) => void

  // Tiện ích phòng tắm & giặt ủi
  bathBubbles: boolean
  toggleBathBubbles: () => void
  sinkWaterUntil: number
  triggerSinkWater: () => void
  laundryRunning: boolean
  toggleLaundry: () => void
  setLaundryRunning: (running: boolean) => void

  // Đọc sách Tầng 1
  readBookPage: number
  nextBookPage: () => void

  // Tiện ích Chữa Lành & Thư Giãn (Healing & Cozy Sanctuary)
  pianoModalOpen: boolean
  setPianoModalOpen: (v: boolean) => void
  drinkType: 'water' | 'tea' | 'coffee'
  setDrinkType: (type: 'water' | 'tea' | 'coffee') => void

  // 1. Hệ thống Thời tiết & Ánh sáng đa dạng
  weather: WeatherMode
  setWeather: (w: WeatherMode) => void
  cycleWeather: () => void

  // Gợi ý & thông báo ngắn
  hoverHint: string | null
  setHoverHint: (h: string | null) => void
  toastMessage: string | null
  notify: (msg: string) => void

  // Universal Archetype Interaction Engine states & actions
  dynamicSeatTarget: DynamicSeatTarget | null
  dynamicSeatTargets: Record<ActiveChar, DynamicSeatTarget | null>
  setDynamicSeatTarget: (seat: DynamicSeatTarget | null, forChar?: ActiveChar) => void
  clearCharacterPosture: (char?: ActiveChar) => void
  orientCommand: OrientCommand | null
  setOrientCommand: (char: ActiveChar, yaw: number) => void
  activeTargetUi: ActiveTargetUi | null
  setActiveTargetUi: (t: ActiveTargetUi | null) => void
  containerCard: ContainerCard | null
  setContainerCard: (c: ContainerCard | null) => void
  autoIntent: Record<ActiveChar, AutoIntent | null>
  setAutoIntent: (char: ActiveChar, intent: AutoIntent | null) => void
  electronicStates: Record<string, boolean>
  toggleElectronicState: (id: string, next?: boolean) => boolean
  firepitLit: boolean
  toggleFirepit: (next?: boolean) => boolean
  floor1FloorLampOn: boolean
  toggleFloor1FloorLamp: (next?: boolean) => boolean
}

const getInitialRole = (): ActiveChar | null => {
  if (typeof window === 'undefined') return null
  const r = sessionStorage.getItem('user_role')
  return r === 'boy' || r === 'girl' ? r : null
}
const initRole = getInitialRole()

const FP_DIST_TOASTS: Record<FpDistPreset, string> = {
  close: '🎥 Cự ly: Gần',
  medium: '🎥 Cự ly: Trung bình',
  far: '🎥 Cự ly: Toàn cảnh xa',
}

let orientCommandSeq = 0
let pendingClearCallback: (() => void) | null = null

/** Đăng ký callback xóa pendingInteractionTarget khi người chơi chủ động đi bộ (tránh circular import) */
export function setPendingClearCallback(cb: (() => void) | null): void {
  pendingClearCallback = cb
}

type KnownElectronicKey =
  | 'tv'
  | 'ac'
  | 'pc'
  | 'girl_pc'
  | 'floor1_floor_lamp'
  | 'floor1_bed_lamp'
  | 'floor1_desk_lamp'
  | 'floor1_headboard_led'
  | 'bath_mirror_light'
  | 'bath_full_mirror_light'
  | 'laundry'
  | 'firepit'
  | 'floor2_reading_lamp'
  | 'floor2_arch_light'
  | 'girl_lamp'
  | 'girl_vanity_light'
  | 'girl_shelf_led'

function resolveCanonicalElectronicKey(id: string): KnownElectronicKey | null {
  const k = id.toLowerCase()
  if (k === 'tv' || k === 'tvon' || k.startsWith('tv_')) return 'tv'
  if (k === 'ac' || k === 'acon' || k.startsWith('ac_') || k.includes('air_con')) return 'ac'
  if (k === 'girl_pc' || k === 'girlpcstate' || k.startsWith('girl_pc_')) return 'girl_pc'
  if (k === 'pc' || k === 'pcstate' || k.startsWith('pc_')) return 'pc'
  if (
    k === 'floor1_floor_lamp' ||
    k === 'floor1floorlampon' ||
    k === 'lampon' ||
    k === 'lamp' ||
    k === 'living_lamp' ||
    k.startsWith('floor1_floor_lamp_')
  ) {
    return 'floor1_floor_lamp'
  }
  if (k === 'floor1_bed_lamp' || k === 'floor1bedlampon' || k.startsWith('floor1_bed_lamp_')) {
    return 'floor1_bed_lamp'
  }
  if (k === 'floor1_desk_lamp' || k === 'floor1desklampon' || k.startsWith('floor1_desk_lamp_')) {
    return 'floor1_desk_lamp'
  }
  if (
    k === 'floor1_headboard_led' ||
    k === 'floor1headboardledon' ||
    k.startsWith('floor1_headboard_led_')
  ) {
    return 'floor1_headboard_led'
  }
  if (k === 'bath_mirror_light' || k === 'bathmirrorlighton' || k.startsWith('bath_mirror_light_')) {
    return 'bath_mirror_light'
  }
  if (
    k === 'bath_full_mirror_light' ||
    k === 'bathfullmirrorlighton' ||
    k.startsWith('bath_full_mirror_light_')
  ) {
    return 'bath_full_mirror_light'
  }
  if (k === 'laundry' || k === 'washer' || k === 'laundryrunning' || k.startsWith('washer_')) {
    return 'laundry'
  }
  if (k === 'firepit' || k === 'firepitlit' || k.startsWith('firepit_')) return 'firepit'
  if (
    k === 'floor2_reading_lamp' ||
    k === 'floor2readinglampon' ||
    k.startsWith('floor2_reading_lamp_')
  ) {
    return 'floor2_reading_lamp'
  }
  if (k === 'floor2_arch_light' || k === 'floor2archlighton' || k.startsWith('floor2_arch_light_')) {
    return 'floor2_arch_light'
  }
  if (k === 'girl_lamp' || k === 'girllampon' || k === 'girl_bed_lamp' || k.startsWith('girl_lamp_')) {
    return 'girl_lamp'
  }
  if (k === 'girl_vanity_light' || k === 'girlvanitylighton' || k.startsWith('girl_vanity_light_')) {
    return 'girl_vanity_light'
  }
  if (k === 'girl_shelf_led' || k === 'girlshelfledon' || k.startsWith('girl_shelf_led_')) {
    return 'girl_shelf_led'
  }
  return null
}

function readKnownElectronicBool(s: State, key: KnownElectronicKey): boolean {
  switch (key) {
    case 'tv':
      return s.tvOn
    case 'ac':
      return s.acOn
    case 'pc':
      return s.pcState !== 'off'
    case 'girl_pc':
      return s.girlPcState !== 'off'
    case 'floor1_floor_lamp':
      return s.floor1FloorLampOn
    case 'floor1_bed_lamp':
      return s.floor1BedLampOn
    case 'floor1_desk_lamp':
      return s.floor1DeskLampOn
    case 'floor1_headboard_led':
      return s.floor1HeadboardLedOn
    case 'bath_mirror_light':
      return s.bathMirrorLightOn
    case 'bath_full_mirror_light':
      return s.bathFullMirrorLightOn
    case 'laundry':
      return s.laundryRunning
    case 'firepit':
      return s.firepitLit
    case 'floor2_reading_lamp':
      return s.floor2ReadingLampOn
    case 'floor2_arch_light':
      return s.floor2ArchLightOn
    case 'girl_lamp':
      return s.girlLampOn
    case 'girl_vanity_light':
      return s.girlVanityLightOn
    case 'girl_shelf_led':
      return s.girlShelfLedOn
  }
}

function broadcastWorldChange(key: string, val: any) {
  if (typeof window === 'undefined') return
  const role = useStore?.getState?.()?.userRole || 'boy'
  broadcastPlayerAction(role, 'worldToggle', { key, val })
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      userRole: initRole,
      roleOccupancy: { boy: initRole === 'boy', girl: initRole === 'girl' },
      activeChar: initRole || 'boy',
      // Khi chưa vào vai (hoặc người kia không vào vai), nhân vật tự động bật chế độ tự hoạt động
      boyAutoLife: initRole !== 'boy',
      girlAutoLife: initRole !== 'girl',
      setUserRole: (role: ActiveChar) => {
        const ok = claimRole(role)
        if (!ok) {
          set({ toastMessage: '⚠️ Vai này đã có người chọn! Vui lòng chọn vai còn lại.' })
          return false
        }
        if (typeof window !== 'undefined') sessionStorage.setItem('user_role', role)
        const otherRole = role === 'boy' ? 'girl' : 'boy'
        const pres = getPresenceSnapshot()
        const otherOccupied = pres[otherRole].occupied && !pres[otherRole].isSelf

        set((s) => ({
          userRole: role,
          activeChar: role,
          // Nhân vật mình điều khiển: mặc định tắt AutoLife
          // Nhân vật còn lại: nếu có người chơi khác đang vào vai -> TẮT AutoLife!
          boyAutoLife: role === 'boy' ? false : !otherOccupied,
          girlAutoLife: role === 'girl' ? false : !otherOccupied,
          roleOccupancy: { ...s.roleOccupancy, [role]: true },
          wardrobeOpen: false,
          girlWardrobeOpen: false,
          toastMessage: role === 'boy' ? '👦 Chào mừng Khoa về nhà!' : '👧 Chào mừng Bạn Gái về nhà!',
        }))
        return true
      },
      logout: () => {
        releaseRole()
        if (typeof window !== 'undefined') sessionStorage.removeItem('user_role')
        const pres = getPresenceSnapshot()
        const boyBusy = pres.boy.occupied && !pres.boy.isSelf
        const girlBusy = pres.girl.occupied && !pres.girl.isSelf
        set(() => ({
          userRole: null,
          activeChar: 'boy',
          boyAutoLife: !boyBusy,
          girlAutoLife: !girlBusy,
          roleOccupancy: { boy: boyBusy, girl: girlBusy },
          wardrobeOpen: false,
          girlWardrobeOpen: false,
          toastMessage: '👋 Đã rời vai nhân vật',
        }))
      },

      mode: 'orbit',
      setMode: (mode) =>
        set((s) => {
          if (mode === 'fp') {
            return {
              mode: 'fp',
              roofVisible: true,
              wallMode: 'full',
              nearInteriorOpen: false,
              viewPreset: 'overview',
              focus: null,
              activePhoto: null,
              walkthroughSpawn: null,
              toastMessage: s.fpPerspective === 'eye' ? '👁️ Góc nhìn tầm mắt' : '🎥 Góc nhìn sau lưng',
            }
          }
          const isFloorPreset = s.viewPreset === 'floor1' || s.viewPreset === 'floor2'
          return {
            mode: 'orbit',
            nearInteriorOpen: false,
            roofVisible: !isFloorPreset,
            wallMode: isFloorPreset ? 'cutaway' : 'full',
            focus:
              s.viewPreset === 'floor1'
                ? FLOOR1_VIEW
                : s.viewPreset === 'floor2'
                  ? FLOOR2_VIEW
                  : HOME_VIEW,
            activePhoto: null,
            walkthroughSpawn: null,
            toastMessage: '🏠 Góc nhìn toàn cảnh',
          }
        }),
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const nextDark = !s.darkMode
          const nextWeather: WeatherMode = nextDark ? 'night' : 'clear'
          broadcastWorldChange('darkMode', nextDark)
          broadcastWorldChange('weather', nextWeather)
          const meta = WEATHER_MODES[nextWeather]
          return {
            darkMode: nextDark,
            weather: nextWeather,
            toastMessage: `${meta.icon} ${meta.label}`,
          }
        }),

      graphicMode: 'hd',
      toggleGraphicMode: () =>
        set({
          graphicMode: 'hd',
          toastMessage: '✨ Đồ họa: HD',
        }),

      isInteracting: false,
      setIsInteracting: (isInteracting) => set({ isInteracting }),

      setActiveChar: (activeChar) =>
        set((s) => {
          // Khi đã chọn vai (userRole), tuyệt đối không cho phép chuyển sang điều khiển nhân vật còn lại
          if (s.userRole && s.userRole !== activeChar) {
            return {
              toastMessage: `🔒 Bạn đang vào vai ${s.userRole === 'boy' ? 'Khoa' : 'Bạn Gái'}. Bấm nút "Đổi vai" ở góc trên nếu muốn đổi.`
            }
          }
          const curAct = activeChar === 'boy' ? s.boyActivity : s.girlActivity
          const curPhase = activeChar === 'boy' ? s.boyPhase : s.girlPhase
          return {
            activeChar,
            activity: curAct,
            activityPhase: curPhase,
            isUserInitiated: curAct !== 'idle',
            avatarTarget: null,
            toastMessage: activeChar === 'boy' ? '👦 Đang điều khiển: Khoa' : '👧 Đang điều khiển: Bạn Gái',
          }
        }),

      boyActivity: 'idle',
      boyPhase: 'active',
      girlActivity: 'idle',
      girlPhase: 'active',

      activity: 'idle',
      activityPhase: 'active',
      isUserInitiated: false,
      toggleBoyAutoLife: () =>
        set((s) => {
          const next = !s.boyAutoLife
          return {
            boyAutoLife: next,
            boyActivity: next ? s.boyActivity : 'idle',
            boyPhase: 'active',
            ...(s.activeChar === 'boy'
              ? {
                  activity: next ? s.boyActivity : 'idle',
                  activityPhase: 'active',
                  isUserInitiated: false,
                }
              : {}),
            wardrobeOpen: false,
            toastMessage: next ? '👦 Tự hoạt động Khoa: Bật' : '👦 Tự hoạt động Khoa: Tắt',
          }
        }),
      toggleGirlAutoLife: () =>
        set((s) => {
          const next = !s.girlAutoLife
          return {
            girlAutoLife: next,
            girlActivity: next ? s.girlActivity : 'idle',
            girlPhase: 'active',
            ...(s.activeChar === 'girl'
              ? {
                  activity: next ? s.girlActivity : 'idle',
                  activityPhase: 'active',
                  isUserInitiated: false,
                }
              : {}),
            girlWardrobeOpen: false,
            toastMessage: next ? '👧 Tự hoạt động Bạn Gái: Bật' : '👧 Tự hoạt động Bạn Gái: Tắt',
          }
        }),

      startActivity: (act, fromUser = true, forChar, fromRemote = false) =>
        set((s) => {
          // Bảo vệ quyền riêng tư trang phục: Khoa không dùng tủ đồ Bạn Gái, Bạn Gái không dùng tủ đồ Khoa
          if (fromUser && !fromRemote) {
            if (s.userRole === 'boy' && act === 'girl_wardrobe') {
              return { toastMessage: '🔒 Tủ đồ này dành riêng cho Bạn Gái' }
            }
            if (s.userRole === 'girl' && act === 'wardrobe') {
              return { toastMessage: '🔒 Tủ đồ này dành riêng cho Khoa' }
            }
          }

          // Xác định nhân vật thực hiện hành động:
          let char: ActiveChar = 'boy'
          if (forChar) {
            char = forChar
          } else if (s.userRole) {
            char = s.userRole
          } else {
            // Khi chưa đăng nhập (chế độ tự do):
            // Hỗ trợ 2 người cùng ngủ trên một chiếc giường (cả Tầng 1 và Tầng 2):
            if (act === 'sleep') {
              if (s.boyActivity === 'sleep' && s.girlActivity !== 'sleep') {
                char = 'girl'
              } else if (s.girlActivity === 'sleep' && s.boyActivity !== 'sleep') {
                char = 'boy'
              } else {
                char = s.activeChar || 'boy'
              }
            } else if (act === 'girl_sleep') {
              if (s.girlActivity === 'girl_sleep' && s.boyActivity !== 'girl_sleep') {
                char = 'boy'
              } else if (s.boyActivity === 'girl_sleep' && s.girlActivity !== 'girl_sleep') {
                char = 'girl'
              } else {
                char = s.activeChar === 'girl' ? 'girl' : 'boy'
              }
            } else if (
              act === 'girl_wardrobe' ||
              act === 'girl_pc' ||
              act === 'girl_vanity' ||
              act === 'girl_lounge' ||
              act === 'girl_nook'
            ) {
              char = 'girl'
            } else if (act === 'wardrobe') {
              char = 'boy'
            } else {
              char = s.activeChar || 'boy'
            }
          }

          // Đồng bộ hành động tức thời tới người chơi còn lại qua BroadcastChannel & WebSocket
          if (fromUser && !fromRemote) {
            broadcastPlayerAction(char, 'startActivity', { act })
          }

          const curCharAct = char === 'boy' ? s.boyActivity : s.girlActivity

          if (act === 'idle') {
            const otherChar: ActiveChar = char === 'boy' ? 'girl' : 'boy'
            return {
              boyActivity: char === 'boy' ? 'idle' : s.boyActivity,
              boyPhase: char === 'boy' ? 'active' : s.boyPhase,
              girlActivity: char === 'girl' ? 'idle' : s.girlActivity,
              girlPhase: char === 'girl' ? 'active' : s.girlPhase,
              ...(s.activeChar === char
                ? { activity: 'idle', activityPhase: 'active', isUserInitiated: false }
                : {}),
              dynamicSeatTargets: { ...s.dynamicSeatTargets, [char]: null },
              dynamicSeatTarget:
                s.dynamicSeatTarget && s.dynamicSeatTarget.char === char
                  ? s.dynamicSeatTargets[otherChar] ?? null
                  : s.dynamicSeatTarget,
              wardrobeOpen: false,
              girlWardrobeOpen: false,
              activePhoto: null,
              focus: null,
            }
          }

          // Nếu cả hai đang cùng ngủ trên chiếc giường này và bấm lại vào giường ở chế độ tự do:
          const bothSleepingOnThisBed =
            !s.userRole &&
            (act === 'sleep' || act === 'girl_sleep') &&
            s.boyActivity === act &&
            s.girlActivity === act

          if (fromUser && bothSleepingOnThisBed) {
            return {
              boyActivity: 'idle',
              boyPhase: 'active',
              girlActivity: 'idle',
              girlPhase: 'active',
              activity: 'idle',
              activityPhase: 'active',
              isUserInitiated: false,
              wardrobeOpen: false,
              girlWardrobeOpen: false,
              activePhoto: null,
              focus: s.focus,
              toastMessage: '☀️ Cả hai cùng thức dậy!',
            }
          }

          // Nếu bấm lại vào đúng đồ vật mà nhân vật đang dùng -> đứng dậy
          if (
            fromUser &&
            curCharAct === act &&
            s.isUserInitiated &&
            act !== 'darts' &&
            act !== 'drink' &&
            act !== 'feed' &&
            act !== 'pet' &&
            act !== 'wardrobe' &&
            act !== 'girl_wardrobe'
          ) {
            return {
              boyActivity: char === 'boy' ? 'idle' : s.boyActivity,
              boyPhase: char === 'boy' ? 'active' : s.boyPhase,
              girlActivity: char === 'girl' ? 'idle' : s.girlActivity,
              girlPhase: char === 'girl' ? 'active' : s.girlPhase,
              activity: 'idle',
              activityPhase: 'active',
              isUserInitiated: false,
              wardrobeOpen: false,
              girlWardrobeOpen: false,
              activePhoto: null,
              focus: s.focus,
              toastMessage: '🚶 Đã đứng dậy',
            }
          }

          const station = STATIONS[act]
          const nextBoyAct = char === 'boy' ? act : s.boyActivity
          const nextGirlAct = char === 'girl' ? act : s.girlActivity

          // Chỉ cập nhật ngữ cảnh người chơi (activeChar, activity, dock) khi người dùng chủ động click hoặc Auto-Life của nhân vật đang điều khiển
          const shouldUpdateUserContext = fromUser || (!s.userRole && char === s.activeChar)

          let toast = station?.label || '🚶 Đang di chuyển...'
          if (fromUser) {
            if (act === 'sleep') {
              if (s.boyActivity === 'sleep' || s.girlActivity === 'sleep') {
                toast = '🛏️ Cùng nhau ngủ ngon trên giường Tầng 1'
              }
            } else if (act === 'girl_sleep') {
              if (s.boyActivity === 'girl_sleep' || s.girlActivity === 'girl_sleep') {
                toast = '🛏️ Cùng nhau ngủ ngon trên giường Tầng 2'
              }
            }
          }

          // Tự động mở bàn phím Piano khi người dùng chủ động bước tới đàn Piano
          if (fromUser && act === 'piano') {
            setTimeout(() => {
              useStore.setState({ pianoModalOpen: true })
            }, 1200)
          }

          return {
            boyActivity: nextBoyAct,
            boyPhase: char === 'boy' ? 'walking' : s.boyPhase,
            girlActivity: nextGirlAct,
            girlPhase: char === 'girl' ? 'walking' : s.girlPhase,
            activeChar: shouldUpdateUserContext ? char : s.activeChar,
            activity: shouldUpdateUserContext ? act : s.activity,
            activityPhase: shouldUpdateUserContext ? 'walking' : s.activityPhase,
            isUserInitiated: fromUser ? true : s.isUserInitiated,
            boyAutoLife: fromUser && char === 'boy' ? false : s.boyAutoLife,
            girlAutoLife: fromUser && char === 'girl' ? false : s.girlAutoLife,
            avatarTarget: fromUser ? null : s.avatarTarget,
            activePhoto: fromUser ? null : s.activePhoto,
            wardrobeOpen: fromUser && act === 'wardrobe',
            girlWardrobeOpen: fromUser && act === 'girl_wardrobe',
            dynamicSeatTargets: { ...s.dynamicSeatTargets, [char]: null },
            dynamicSeatTarget:
              s.dynamicSeatTarget && s.dynamicSeatTarget.char === char
                ? s.dynamicSeatTargets[char === 'boy' ? 'girl' : 'boy'] ?? null
                : s.dynamicSeatTarget,
            containerCard: fromUser ? null : s.containerCard,
            girlOutfitId:
              !fromUser && act === 'girl_wardrobe'
                ? GIRL_OUTFITS[(GIRL_OUTFITS.findIndex((o) => o.id === s.girlOutfitId) + 1) % GIRL_OUTFITS.length].id
                : s.girlOutfitId,
            girlOutfitSpinTick:
              !fromUser && act === 'girl_wardrobe' ? s.girlOutfitSpinTick + 1 : s.girlOutfitSpinTick,
            outfitId:
              !fromUser && act === 'wardrobe'
                ? OUTFITS[(OUTFITS.findIndex((o) => o.id === s.outfitId) + 1) % OUTFITS.length].id
                : s.outfitId,
            outfitSpinTick:
              !fromUser && act === 'wardrobe' ? s.outfitSpinTick + 1 : s.outfitSpinTick,
            focus: s.focus,
            toastMessage: fromUser ? toast : s.toastMessage,
          }
        }),

      setActivityPhase: (phase, forChar) =>
        set((s) => {
          const targetChar = forChar ?? (s.userRole || s.activeChar)
          const act = targetChar === 'boy' ? s.boyActivity : s.girlActivity
          const updates: Partial<State> =
            targetChar === 'boy'
              ? {
                  boyPhase: phase,
                  ...(s.activeChar === 'boy' ? { activityPhase: phase } : {}),
                }
              : {
                  girlPhase: phase,
                  ...(s.activeChar === 'girl' ? { activityPhase: phase } : {}),
                }

          if (phase === 'entering') {
            if (act === 'tv') {
              updates.tvOn = true
            } else if (act === 'pc') {
              updates.pcState = s.pcState === 'off' ? 'on' : s.pcState
            } else if (act === 'wardrobe') {
              updates.wardrobeOpen = true
            } else if (act === 'drink') {
              updates.waterPourUntil = Date.now() + 2600
            } else if (act === 'feed') {
              updates.feedingUntil = Date.now() + 7000
            } else if (act === 'bath') {
              updates.bathBubbles = true
            } else if (act === 'wash') {
              updates.sinkWaterUntil = Date.now() + 5000
            } else if (act === 'laundry') {
              updates.laundryRunning = true
            } else if (act === 'girl_pc') {
              updates.girlPcState = s.girlPcState === 'off' ? 'on' : s.girlPcState
            } else if (act === 'girl_wardrobe') {
              updates.girlWardrobeOpen = true
            }
          }
          if (phase === 'active') {
            if (act === 'darts') {
              updates.dartFlightStart = performance.now()
              updates.dartCount = (s.dartCount % 5) + 1
              if (s.isUserInitiated) updates.toastMessage = '🎯 Hồng tâm!'
            } else if (act === 'wardrobe' && !s.isUserInitiated) {
              const others = OUTFITS.filter((o) => o.id !== s.outfitId)
              const pick = others[Math.floor(Math.random() * others.length)] || OUTFITS[0]
              updates.outfitId = pick.id
              updates.outfitSpinTick = s.outfitSpinTick + 1
            } else if (act === 'girl_wardrobe' && !s.isUserInitiated) {
              const others = GIRL_OUTFITS.filter((o) => o.id !== s.girlOutfitId)
              const pick = others[Math.floor(Math.random() * others.length)] || GIRL_OUTFITS[0]
              updates.girlOutfitId = pick.id
              updates.girlOutfitSpinTick = s.girlOutfitSpinTick + 1
            } else if (act === 'pet' && s.isUserInitiated) {
              updates.toastMessage =
                s.petTargetId === 'mochi' ? '❤️ Vuốt ve Mochi' : '❤️ Vuốt ve Bơ'
            }
          }
          return updates
        }),

      avatarTarget: null,
      setAvatarTarget: (avatarTarget, fromRemote = false, fromQueue = false) => {
        if (avatarTarget && !fromRemote) {
          const char = useStore.getState().userRole || useStore.getState().activeChar || 'boy'
          broadcastPlayerAction(char, 'walkTo', { target: avatarTarget })
        }
        if (avatarTarget !== null && !fromQueue) {
          pendingClearCallback?.()
        }
        set((s) => ({
          boyActivity: s.activeChar === 'boy' ? 'idle' : s.boyActivity,
          boyPhase: s.activeChar === 'boy' ? 'active' : s.boyPhase,
          girlActivity: s.activeChar === 'girl' ? 'idle' : s.girlActivity,
          girlPhase: s.activeChar === 'girl' ? 'active' : s.girlPhase,
          activity: 'idle',
          activityPhase: 'active',
          isUserInitiated: false,
          wardrobeOpen: s.activeChar === 'boy' ? false : s.wardrobeOpen,
          girlWardrobeOpen: s.activeChar === 'girl' ? false : s.girlWardrobeOpen,
          ...(avatarTarget !== null
            ? {
                dynamicSeatTargets: { ...s.dynamicSeatTargets, [s.activeChar]: null },
                dynamicSeatTarget:
                  s.dynamicSeatTarget && s.dynamicSeatTarget.char !== s.activeChar
                    ? s.dynamicSeatTarget
                    : s.dynamicSeatTargets[s.activeChar === 'boy' ? 'girl' : 'boy'] ?? null,
                containerCard: null,
              }
            : {}),
          avatarTarget,
        }))
      },

      outfitId: OUTFITS[0].id,
      outfitSpinTick: 0,
      setOutfitId: (outfitId, fromRemote = false) => {
        const found = OUTFITS.find((o) => o.id === outfitId)
        if (!fromRemote) {
          broadcastPlayerAction('boy', 'setOutfit', { outfitId })
        }
        set((s) => ({
          outfitId,
          outfitSpinTick: s.outfitSpinTick + 1,
          toastMessage: found ? `✨ ${found.name}` : '✨ Đã thay đồ',
        }))
      },

      activePhoto: null,
      setActivePhoto: (activePhoto) => set({ activePhoto }),

      focus: null,
      viewPreset: 'overview',
      roofVisible: true,
      wallMode: 'full',
      nearInteriorOpen: false,
      setNearInteriorOpen: (nearInteriorOpen) => set({ nearInteriorOpen }),
      fpPerspective: 'third',
      toggleFpPerspective: () =>
        set((s) => {
          const next: 'third' | 'eye' = s.fpPerspective === 'third' ? 'eye' : 'third'
          return {
            fpPerspective: next,
            toastMessage: next === 'eye' ? '👁️ Góc nhìn tầm mắt' : '🎥 Góc nhìn sau lưng',
          }
        }),
      fpDistPreset: 'medium',
      fpDistance: FP_DISTANCES.medium,
      setFpDistPreset: (p) =>
        set({
          fpPerspective: 'third',
          fpDistPreset: p,
          fpDistance: FP_DISTANCES[p],
          toastMessage: FP_DIST_TOASTS[p],
        }),
      cycleFpDistPreset: () =>
        set((s) => {
          const order: FpDistPreset[] = ['close', 'medium', 'far']
          const idx = order.indexOf(s.fpDistPreset)
          const next = order[(idx + 1) % order.length]
          return {
            fpPerspective: 'third',
            fpDistPreset: next,
            fpDistance: FP_DISTANCES[next],
            toastMessage: FP_DIST_TOASTS[next],
          }
        }),
      setFpDistance: (d) =>
        set(() => {
          const clamped = Math.max(FP_DISTANCE_MIN, Math.min(FP_DISTANCE_MAX, d))
          const preset: FpDistPreset =
            clamped < (FP_DISTANCES.close + FP_DISTANCES.medium) / 2
              ? 'close'
              : clamped < (FP_DISTANCES.medium + FP_DISTANCES.far) / 2
                ? 'medium'
                : 'far'
          return {
            fpDistPreset: preset,
            fpDistance: clamped,
          }
        }),
      walkthroughSpace: 'living',
      walkthroughSpawn: null,
      jumpToWalkthroughSpace: (space) =>
        set((s) => {
          const spot = WALKTHROUGH_SPOTS[space]
          const char = s.userRole || s.activeChar || 'boy'
          const nextTick = Math.max(Date.now(), (s.walkthroughSpawn?.tick ?? 0) + 1)
          return {
            mode: 'fp',
            roofVisible: true,
            wallMode: 'full',
            nearInteriorOpen: false,
            viewPreset: 'overview',
            focus: null,
            activePhoto: null,
            avatarTarget: null,
            wardrobeOpen: false,
            girlWardrobeOpen: false,
            boyActivity: char === 'boy' ? 'idle' : s.boyActivity,
            boyPhase: char === 'boy' ? 'active' : s.boyPhase,
            girlActivity: char === 'girl' ? 'idle' : s.girlActivity,
            girlPhase: char === 'girl' ? 'active' : s.girlPhase,
            activity: 'idle',
            activityPhase: 'active',
            isUserInitiated: false,
            walkthroughSpace: space,
            walkthroughSpawn: {
              space,
              pos: [...spot.pos] as V3,
              yaw: spot.yaw,
              tick: nextTick,
            },
            toastMessage: `${spot.icon} ${spot.label}`,
          }
        }),
      cycleWallMode: () =>
        set((s) => {
          const next: 'full' | 'cutaway' | 'ghost' =
            s.wallMode === 'full' ? 'cutaway' : s.wallMode === 'cutaway' ? 'ghost' : 'full'
          const labels = {
            full: '🏛️ Đủ tường (Kiến trúc hoàn chỉnh)',
            cutaway: '🧱 Tường lửng (Mở mặt tiền xem nội thất)',
            ghost: '🪟 Tường mờ (Xem xuyên nội thất)',
          }
          return {
            wallMode: next,
            toastMessage: labels[next],
          }
        }),
      randomViewIdx: -1,
      setFocus: (focus, preset) =>
        set(() => ({
          focus,
          ...(preset ? { viewPreset: preset } : {}),
          ...(preset === 'floor1' || preset === 'floor2'
            ? { roofVisible: false, wallMode: 'cutaway', nearInteriorOpen: false }
            : preset === 'overview'
              ? { roofVisible: true, wallMode: 'full', nearInteriorOpen: false }
              : {}),
        })),
      returnOverview: () => {
        pendingClearCallback?.()
        set((s) => {
          const char = s.userRole || s.activeChar || 'boy'
          return {
            mode: 'orbit',
            boyActivity: char === 'boy' ? 'idle' : s.boyActivity,
            boyPhase: char === 'boy' ? 'active' : s.boyPhase,
            girlActivity: char === 'girl' ? 'idle' : s.girlActivity,
            girlPhase: char === 'girl' ? 'active' : s.girlPhase,
            activity: 'idle',
            activityPhase: 'active',
            isUserInitiated: false,
            wardrobeOpen: false,
            girlWardrobeOpen: false,
            activePhoto: null,
            dynamicSeatTarget: null,
            dynamicSeatTargets: { boy: null, girl: null },
            activeTargetUi: null,
            containerCard: null,
            walkthroughSpawn: null,
            viewPreset: 'overview',
            roofVisible: true,
            wallMode: 'full',
            nearInteriorOpen: false,
            focus: { pos: [...HOME_VIEW.pos], target: [...HOME_VIEW.target] },
          }
        })
      },
      resetCamera: () => {
        pendingClearCallback?.()
        set(() => ({
          mode: 'orbit',
          activePhoto: null,
          walkthroughSpawn: null,
          wardrobeOpen: false,
          girlWardrobeOpen: false,
          dynamicSeatTarget: null,
          dynamicSeatTargets: { boy: null, girl: null },
          activeTargetUi: null,
          containerCard: null,
          viewPreset: 'overview',
          roofVisible: true,
          wallMode: 'full',
          nearInteriorOpen: false,
          focus: { pos: [...HOME_VIEW.pos], target: [...HOME_VIEW.target] },
          toastMessage: '↺ Đã đặt lại góc nhìn mặc định',
        }))
      },
      randomCameraView: () =>
        set((s) => {
          let nextIdx = Math.floor(Math.random() * RANDOM_VIEWS.length)
          if (RANDOM_VIEWS.length > 1 && nextIdx === s.randomViewIdx) {
            nextIdx = (nextIdx + 1) % RANDOM_VIEWS.length
          }
          const picked = RANDOM_VIEWS[nextIdx]
          return {
            mode: 'orbit',
            activePhoto: null,
            randomViewIdx: nextIdx,
            viewPreset: picked.preset,
            ...(picked.preset === 'floor1' || picked.preset === 'floor2'
              ? { roofVisible: false, wallMode: 'cutaway', nearInteriorOpen: false }
              : picked.preset === 'overview'
                ? { roofVisible: true, wallMode: 'full', nearInteriorOpen: false }
                : {}),
            focus: { pos: [...picked.camera.pos], target: [...picked.camera.target] },
            toastMessage: `🎲 ${picked.label}`,
          }
        }),
      cutWalls: { back: false, left: false, right: false },
      setCutWalls: (cutWalls) => set({ cutWalls }),

      lampOn: true,
      toggleLamp: () =>
        set((s) => {
          const next = !s.lampOn
          broadcastWorldChange('lampOn', next)
          broadcastWorldChange('floor1FloorLampOn', next)
          return {
            lampOn: next,
            floor1FloorLampOn: next,
            electronicStates: { ...s.electronicStates, floor1_floor_lamp: next, lamp: next },
            toastMessage: next ? '💡 Bật đèn cây phòng khách' : '💡 Tắt đèn cây phòng khách',
          }
        }),
      floor1FloorLampOn: true,
      toggleFloor1FloorLamp: (next?: boolean) => {
        const val = typeof next === 'boolean' ? next : !get().floor1FloorLampOn
        broadcastWorldChange('floor1FloorLampOn', val)
        broadcastWorldChange('lampOn', val)
        set((s) => ({
          floor1FloorLampOn: val,
          lampOn: val,
          electronicStates: { ...s.electronicStates, floor1_floor_lamp: val, lamp: val },
          toastMessage: val ? '💡 Bật đèn cây phòng khách' : '💡 Tắt đèn cây phòng khách',
        }))
        return val
      },
      floor1BedLampOn: true,
      toggleFloor1BedLamp: () =>
        set((s) => {
          const next = !s.floor1BedLampOn
          broadcastWorldChange('floor1BedLampOn', next)
          return {
            floor1BedLampOn: next,
            toastMessage: next ? '💡 Bật đèn ngủ Tầng 1' : '💡 Tắt đèn ngủ Tầng 1',
          }
        }),
      floor1DeskLampOn: true,
      toggleFloor1DeskLamp: () =>
        set((s) => {
          const next = !s.floor1DeskLampOn
          broadcastWorldChange('floor1DeskLampOn', next)
          return {
            floor1DeskLampOn: next,
            toastMessage: next ? '💡 Bật đèn bàn máy tính' : '💡 Tắt đèn bàn máy tính',
          }
        }),
      floor1HeadboardLedOn: true,
      toggleFloor1HeadboardLed: () =>
        set((s) => {
          const next = !s.floor1HeadboardLedOn
          broadcastWorldChange('floor1HeadboardLedOn', next)
          return {
            floor1HeadboardLedOn: next,
            toastMessage: next ? '✨ Bật đèn hắt đầu giường' : '✨ Tắt đèn hắt đầu giường',
          }
        }),

      // Đèn phòng tắm
      bathMirrorLightOn: true,
      toggleBathMirrorLight: () =>
        set((s) => {
          const next = !s.bathMirrorLightOn
          broadcastWorldChange('bathMirrorLightOn', next)
          return {
            bathMirrorLightOn: next,
            toastMessage: next ? '✨ Bật đèn gương Halo phòng tắm' : '✨ Tắt đèn gương Halo phòng tắm',
          }
        }),
      bathFullMirrorLightOn: true,
      toggleBathFullMirrorLight: () =>
        set((s) => {
          const next = !s.bathFullMirrorLightOn
          broadcastWorldChange('bathFullMirrorLightOn', next)
          return {
            bathFullMirrorLightOn: next,
            toastMessage: next ? '✨ Bật đèn gương toàn thân' : '✨ Tắt đèn gương toàn thân',
          }
        }),

      // Đèn Tầng 2
      floor2ReadingLampOn: true,
      toggleFloor2ReadingLamp: () =>
        set((s) => {
          const next = !s.floor2ReadingLampOn
          broadcastWorldChange('floor2ReadingLampOn', next)
          return {
            floor2ReadingLampOn: next,
            toastMessage: next ? '💡 Bật đèn cây đọc sách Tầng 2' : '💡 Tắt đèn cây đọc sách Tầng 2',
          }
        }),
      floor2ArchLightOn: true,
      toggleFloor2ArchLight: () =>
        set((s) => {
          const next = !s.floor2ArchLightOn
          broadcastWorldChange('floor2ArchLightOn', next)
          return {
            floor2ArchLightOn: next,
            toastMessage: next ? '✨ Bật đèn vòm nghệ thuật Tầng 2' : '✨ Tắt đèn vòm nghệ thuật Tầng 2',
          }
        }),
      acOn: true,
      toggleAc: () =>
        set((s) => {
          const next = !s.acOn
          broadcastWorldChange('acOn', next)
          return {
            acOn: next,
            toastMessage: next ? '❄️ Bật điều hòa' : '❄️ Tắt điều hòa',
          }
        }),
      curtainsOpen: true,
      curtainsFloor1Open: true,
      curtainsFloor2Open: true,
      toggleCurtainsFloor1: () =>
        set((s) => {
          const next = !s.curtainsFloor1Open
          broadcastWorldChange('curtainsFloor1Open', next)
          return {
            curtainsFloor1Open: next,
            curtainsOpen: next,
            toastMessage: next ? '🪟 Mở rèm cửa Tầng 1' : '🪟 Đóng rèm cửa Tầng 1',
          }
        }),
      toggleCurtainsFloor2: () =>
        set((s) => {
          const next = !s.curtainsFloor2Open
          broadcastWorldChange('curtainsFloor2Open', next)
          return {
            curtainsFloor2Open: next,
            toastMessage: next ? '🪟 Mở rèm cửa Tầng 2' : '🪟 Đóng rèm cửa Tầng 2',
          }
        }),
      toggleCurtains: (floor) =>
        set((s) => {
          if (floor === 2) {
            const next = !s.curtainsFloor2Open
            broadcastWorldChange('curtainsFloor2Open', next)
            return {
              curtainsFloor2Open: next,
              toastMessage: next ? '🪟 Mở rèm cửa Tầng 2' : '🪟 Đóng rèm cửa Tầng 2',
            }
          }
          if (floor === 1) {
            const next = !s.curtainsFloor1Open
            broadcastWorldChange('curtainsFloor1Open', next)
            return {
              curtainsFloor1Open: next,
              curtainsOpen: next,
              toastMessage: next ? '🪟 Mở rèm cửa Tầng 1' : '🪟 Đóng rèm cửa Tầng 1',
            }
          }
          const next = !s.curtainsOpen
          broadcastWorldChange('curtainsOpen', next)
          broadcastWorldChange('curtainsFloor1Open', next)
          broadcastWorldChange('curtainsFloor2Open', next)
          return {
            curtainsOpen: next,
            curtainsFloor1Open: next,
            curtainsFloor2Open: next,
            toastMessage: next ? '🪟 Mở tất cả rèm cửa' : '🪟 Đóng tất cả rèm cửa',
          }
        }),
      wardrobeOpen: false,
      setWardrobeOpen: (wardrobeOpen) => set({ wardrobeOpen }),
      pcState: 'on',
      cyclePcState: () =>
        set((s) => {
          const next: PcState = s.pcState === 'on' ? 'rgb' : s.pcState === 'rgb' ? 'off' : 'on'
          broadcastWorldChange('pcState', next)
          return {
            pcState: next,
            toastMessage:
              next === 'on' ? '💻 Chế độ Code' : next === 'rgb' ? '☀️ Sáng ấm 3000K' : '🖥️ Tắt màn hình',
          }
        }),
      chairSpinTick: 0,
      spinChair: () =>
        set((s) => ({
          chairSpinTick: s.chairSpinTick + 1,
          toastMessage: '🔄 Xoay ghế',
        })),
      dartCount: 1,
      dartFlightStart: 0,
      triggerDartFlight: () =>
        set((s) => ({
          dartFlightStart: performance.now(),
          dartCount: (s.dartCount % 5) + 1,
        })),
      waterPourUntil: 0,
      tvOn: true,
      toggleTv: () =>
        set((s) => {
          const next = !s.tvOn
          broadcastWorldChange('tvOn', next)
          return {
            tvOn: next,
            toastMessage: next ? '📺 Bật TV' : '🔴 Tắt TV',
          }
        }),
      tvChannel: 0,
      cycleTvChannel: () =>
        set((s) => {
          const next = (s.tvChannel + 1) % TV_CHANNELS.length
          broadcastWorldChange('tvChannel', next)
          broadcastWorldChange('tvOn', true)
          return {
            tvOn: true,
            tvChannel: next,
            toastMessage: `📺 ${TV_CHANNELS[next].name}`,
          }
        }),

      feedingUntil: 0,
      petTargetId: 'mochi',
      petDog: (id: 'mochi' | 'bo', fromUser = true, forChar?: ActiveChar, fromRemote = false) => {
        const char = forChar ?? useStore.getState().userRole ?? useStore.getState().activeChar
        if (fromUser && !fromRemote) {
          broadcastPlayerAction(char, 'petDog', { dogId: id })
        }
        set((s) => {
          const dogName = id === 'mochi' ? 'Mochi' : 'Bơ'
          const [mx, mz] = LIVE_ACTORS.dogs[id].floorMeetPos
          const side = mx > 4.5 ? -1 : 1
          const entryX = mx + side * 0.82
          const entryZ = mz
          const midX = mx + side * 0.41
          const cam: CamFocus = {
            pos: [midX, 1.78, mz + 2.45],
            target: [midX, 0.52, mz],
          }
          STATIONS.pet = {
            entryPos: [entryX, entryZ],
            entryYaw: Math.atan2(mx - entryX, mz - entryZ),
            floorY: 0,
            camera: cam,
            fpPos: [mx + side * 0.68, 0.82, mz + 0.12],
            fpTarget: [mx, 0.34, mz],
            label: `🐶 Vuốt ve ${dogName}`,
          }
          return {
            petTargetId: id,
            boyActivity: char === 'boy' ? 'pet' : s.boyActivity,
            boyPhase: char === 'boy' ? 'walking' : s.boyPhase,
            girlActivity: char === 'girl' ? 'pet' : s.girlActivity,
            girlPhase: char === 'girl' ? 'walking' : s.girlPhase,
            ...(s.activeChar === char ? { activity: 'pet', activityPhase: 'walking' } : {}),
            isUserInitiated: fromUser ? true : s.isUserInitiated,
            boyAutoLife: fromUser && char === 'boy' ? false : s.boyAutoLife,
            girlAutoLife: fromUser && char === 'girl' ? false : s.girlAutoLife,
            avatarTarget: fromUser ? null : s.avatarTarget,
            activePhoto: fromUser ? null : s.activePhoto,
            wardrobeOpen: false,
            girlWardrobeOpen: false,
            // Giữ nguyên góc nhìn tổng quan hiện tại
            focus: s.focus,
            toastMessage: fromUser ? `🐶 Vuốt ve ${dogName}` : s.toastMessage,
          }
        })
      },

      hoverHint: null,
      setHoverHint: (hoverHint: string | null) => set({ hoverHint }),
      bathBubbles: true,
      toggleBathBubbles: () =>
        set((s) => {
          const next = !s.bathBubbles
          broadcastWorldChange('bathBubbles', next)
          return {
            bathBubbles: next,
            toastMessage: next ? '🛁 Bật bọt xà phòng' : '🛁 Tắt bọt xà phòng',
          }
        }),
      sinkWaterUntil: 0,
      triggerSinkWater: () =>
        set({
          sinkWaterUntil: Date.now() + 4500,
          toastMessage: '💧 Xả nước bồn rửa',
        }),
      laundryRunning: false,
      toggleLaundry: () =>
        set((s) => {
          const next = !s.laundryRunning
          broadcastWorldChange('laundryRunning', next)
          return {
            laundryRunning: next,
            electronicStates: { ...s.electronicStates, laundry: next, washer: next },
            toastMessage: next ? '🧺 Bật máy giặt' : '⏹️ Tắt máy giặt',
          }
        }),
      setLaundryRunning: (running: boolean) => {
        broadcastWorldChange('laundryRunning', running)
        set((s) => ({
          laundryRunning: running,
          electronicStates: { ...s.electronicStates, laundry: running, washer: running },
          toastMessage: running ? '🧺 Bật máy giặt' : '⏹️ Tắt máy giặt',
        }))
      },
      readBookPage: 1,
      nextBookPage: () =>
        set((s) => ({
          readBookPage: (s.readBookPage % 5) + 1,
          toastMessage: `📖 Trang ${(s.readBookPage % 5) + 1}`,
        })),

      girlOutfitId: GIRL_OUTFITS[0].id,
      girlOutfitSpinTick: 0,
      setGirlOutfitId: (girlOutfitId: string, fromRemote = false) => {
        const found = GIRL_OUTFITS.find((o) => o.id === girlOutfitId)
        if (!fromRemote) {
          broadcastPlayerAction('girl', 'setOutfit', { outfitId: girlOutfitId })
        }
        set((s) => ({
          girlOutfitId,
          girlOutfitSpinTick: s.girlOutfitSpinTick + 1,
          toastMessage: found ? `👗 ${found.name}` : '👗 Đã thay đồ',
        }))
      },

      girlPcState: 'on',
      cycleGirlPcState: () =>
        set((s) => {
          const next = s.girlPcState === 'on' ? 'rgb' : s.girlPcState === 'rgb' ? 'off' : 'on'
          broadcastWorldChange('girlPcState', next)
          return {
            girlPcState: next,
            toastMessage:
              next === 'on' ? '💻 UI Design' : next === 'rgb' ? '🎨 Vẽ 3D' : '🔌 Tắt màn hình',
          }
        }),
      girlChairSpinTick: 0,
      spinGirlChair: () =>
        set((s) => ({
          girlChairSpinTick: s.girlChairSpinTick + 1,
          toastMessage: '🔄 Xoay ghế',
        })),

      girlLampOn: true,
      toggleGirlLamp: (next?: boolean) => {
        const val = typeof next === 'boolean' ? next : !get().girlLampOn
        broadcastWorldChange('girlLampOn', val)
        set((s) => ({
          girlLampOn: val,
          electronicStates: { ...s.electronicStates, girl_lamp: val, girlLampOn: val },
          toastMessage: val ? '💡 Bật đèn ngủ Tầng 2' : '💡 Tắt đèn ngủ Tầng 2',
        }))
        return val
      },

      girlVanityLightOn: true,
      toggleGirlVanityLight: () =>
        set((s) => {
          const next = !s.girlVanityLightOn
          broadcastWorldChange('girlVanityLightOn', next)
          return {
            girlVanityLightOn: next,
            toastMessage: next ? '✨ Bật đèn gương Halo' : '✨ Tắt đèn gương Halo',
          }
        }),

      girlShelfLedOn: true,
      toggleGirlShelfLed: () =>
        set((s) => {
          const next = !s.girlShelfLedOn
          broadcastWorldChange('girlShelfLedOn', next)
          return {
            girlShelfLedOn: next,
            toastMessage: next ? '✨ Bật LED kệ sách' : '✨ Tắt LED kệ sách',
          }
        }),

      girlWardrobeOpen: false,
      setGirlWardrobeOpen: (girlWardrobeOpen: boolean) => set({ girlWardrobeOpen }),

      girlBookPage: 1,
      nextGirlBookPage: () =>
        set((s) => ({
          girlBookPage: (s.girlBookPage % 4) + 1,
          toastMessage: `📖 Trang ${(s.girlBookPage % 4) + 1}`,
        })),

      // 1. Thời tiết & Bầu không khí đa dạng
      weather: 'clear',
      setWeather: (weather) => {
        const isNight = weather === 'night'
        broadcastWorldChange('weather', weather)
        broadcastWorldChange('darkMode', isNight)
        set({ weather, darkMode: isNight })
      },
      cycleWeather: () =>
        set((s) => {
          const modes: WeatherMode[] = ['clear', 'sunset', 'rain', 'night']
          const curIdx = modes.indexOf(s.weather)
          const next = modes[(curIdx + 1) % modes.length]
          const isNight = next === 'night'
          broadcastWorldChange('weather', next)
          broadcastWorldChange('darkMode', isNight)
          const meta = WEATHER_MODES[next]
          return {
            weather: next,
            darkMode: isNight,
            toastMessage: `${meta.icon} ${meta.label}`,
          }
        }),

      // Tiện ích Chữa Lành & Thư Giãn (Healing & Cozy Sanctuary)
      pianoModalOpen: false,
      setPianoModalOpen: (pianoModalOpen) => set({ pianoModalOpen }),

      drinkType: 'tea',
      setDrinkType: (drinkType) => {
        broadcastWorldChange('drinkType', drinkType)
        const names = { water: 'Ly nước tinh khiết', tea: 'Trà hoa cúc mật ong ấm', coffee: 'Cà phê sữa thơm nồng' }
        set({ drinkType, toastMessage: `☕ Đã chọn: ${names[drinkType]}` })
      },

      toastMessage: null,
      notify: (toastMessage: string) => set({ toastMessage }),

      // Universal Archetype Interaction Engine states & actions
      dynamicSeatTarget: null,
      dynamicSeatTargets: { boy: null, girl: null },
      setDynamicSeatTarget: (seat, forChar) =>
        set((s) => {
          const targetChar: ActiveChar = seat?.char ?? forChar ?? s.userRole ?? s.activeChar ?? 'boy'
          const nextMap: Record<ActiveChar, DynamicSeatTarget | null> = {
            ...s.dynamicSeatTargets,
            [targetChar]: seat,
          }
          const otherChar: ActiveChar = targetChar === 'boy' ? 'girl' : 'boy'
          return {
            dynamicSeatTargets: nextMap,
            dynamicSeatTarget: seat ?? nextMap[otherChar] ?? null,
          }
        }),
      clearCharacterPosture: (char?: ActiveChar) =>
        set((s) => {
          const targetChar = char ?? s.activeChar
          const otherChar: ActiveChar = targetChar === 'boy' ? 'girl' : 'boy'
          const nextMap: Record<ActiveChar, DynamicSeatTarget | null> = char
            ? { ...s.dynamicSeatTargets, [targetChar]: null }
            : { boy: null, girl: null }
          const remaining = char ? nextMap[otherChar] : null
          return {
            boyActivity: targetChar === 'boy' ? 'idle' : s.boyActivity,
            boyPhase: targetChar === 'boy' ? 'active' : s.boyPhase,
            girlActivity: targetChar === 'girl' ? 'idle' : s.girlActivity,
            girlPhase: targetChar === 'girl' ? 'active' : s.girlPhase,
            activity: s.activeChar === targetChar ? 'idle' : s.activity,
            activityPhase: s.activeChar === targetChar ? 'active' : s.activityPhase,
            wardrobeOpen: targetChar === 'boy' ? false : s.wardrobeOpen,
            girlWardrobeOpen: targetChar === 'girl' ? false : s.girlWardrobeOpen,
            dynamicSeatTargets: nextMap,
            dynamicSeatTarget:
              s.dynamicSeatTarget && (!char || s.dynamicSeatTarget.char === targetChar)
                ? remaining
                : s.dynamicSeatTarget,
            containerCard: null,
          }
        }),
      orientCommand: null,
      setOrientCommand: (char: ActiveChar, yaw: number) =>
        set({ orientCommand: { char, yaw, tick: ++orientCommandSeq } }),
      activeTargetUi: null,
      setActiveTargetUi: (activeTargetUi) => set({ activeTargetUi }),
      containerCard: null,
      setContainerCard: (containerCard) => set({ containerCard }),
      autoIntent: { boy: null, girl: null },
      setAutoIntent: (char: ActiveChar, intent: AutoIntent | null) =>
        set((s) => ({ autoIntent: { ...s.autoIntent, [char]: intent } })),
      firepitLit: true,
      toggleFirepit: (next?: boolean) => {
        const val = typeof next === 'boolean' ? next : !get().firepitLit
        broadcastWorldChange('firepitLit', val)
        set((s) => ({
          firepitLit: val,
          electronicStates: { ...s.electronicStates, firepit: val },
          toastMessage: val ? '🔥 Nhóm lửa Firepit sưởi ấm sân vườn' : '🧯 Tắt lửa Firepit',
        }))
        return val
      },
      electronicStates: {
        tv: true,
        ac: true,
        pc: true,
        girl_pc: true,
        floor1_floor_lamp: true,
        lamp: true,
        floor1_bed_lamp: true,
        floor1_desk_lamp: true,
        floor1_headboard_led: true,
        bath_mirror_light: true,
        bath_full_mirror_light: true,
        laundry: false,
        washer: false,
        firepit: true,
        floor2_reading_lamp: true,
        floor2_arch_light: true,
        girl_lamp: true,
        girl_vanity_light: true,
        girl_shelf_led: true,
        yard_lights: true,
        waterfall: true,
        rooftop_lantern: true,
      },
      toggleElectronicState: (id: string, next?: boolean) => {
        const s = get()
        const canonical = resolveCanonicalElectronicKey(id)
        const current = canonical
          ? readKnownElectronicBool(s, canonical)
          : (s.electronicStates[id] ?? false)
        const val = typeof next === 'boolean' ? next : !current

        const nextElectronicStates: Record<string, boolean> = {
          ...s.electronicStates,
          [id]: val,
          ...(canonical ? { [canonical]: val } : {}),
        }
        const updates: Partial<State> = {
          electronicStates: nextElectronicStates,
        }

        if (canonical === 'tv') {
          updates.tvOn = val
          broadcastWorldChange('tvOn', val)
        } else if (canonical === 'ac') {
          updates.acOn = val
          broadcastWorldChange('acOn', val)
        } else if (canonical === 'pc') {
          const nextPc: PcState = val ? (s.pcState === 'off' ? 'on' : s.pcState) : 'off'
          updates.pcState = nextPc
          broadcastWorldChange('pcState', nextPc)
        } else if (canonical === 'girl_pc') {
          const nextGirlPc: PcState = val ? (s.girlPcState === 'off' ? 'on' : s.girlPcState) : 'off'
          updates.girlPcState = nextGirlPc
          broadcastWorldChange('girlPcState', nextGirlPc)
        } else if (canonical === 'floor1_floor_lamp') {
          updates.floor1FloorLampOn = val
          updates.lampOn = val
          nextElectronicStates.lamp = val
          broadcastWorldChange('floor1FloorLampOn', val)
          broadcastWorldChange('lampOn', val)
        } else if (canonical === 'floor1_bed_lamp') {
          updates.floor1BedLampOn = val
          broadcastWorldChange('floor1BedLampOn', val)
        } else if (canonical === 'floor1_desk_lamp') {
          updates.floor1DeskLampOn = val
          broadcastWorldChange('floor1DeskLampOn', val)
        } else if (canonical === 'floor1_headboard_led') {
          updates.floor1HeadboardLedOn = val
          broadcastWorldChange('floor1HeadboardLedOn', val)
        } else if (canonical === 'bath_mirror_light') {
          updates.bathMirrorLightOn = val
          broadcastWorldChange('bathMirrorLightOn', val)
        } else if (canonical === 'bath_full_mirror_light') {
          updates.bathFullMirrorLightOn = val
          broadcastWorldChange('bathFullMirrorLightOn', val)
        } else if (canonical === 'laundry') {
          updates.laundryRunning = val
          nextElectronicStates.washer = val
          broadcastWorldChange('laundryRunning', val)
        } else if (canonical === 'firepit') {
          updates.firepitLit = val
          broadcastWorldChange('firepitLit', val)
        } else if (canonical === 'floor2_reading_lamp') {
          updates.floor2ReadingLampOn = val
          broadcastWorldChange('floor2ReadingLampOn', val)
        } else if (canonical === 'floor2_arch_light') {
          updates.floor2ArchLightOn = val
          broadcastWorldChange('floor2ArchLightOn', val)
        } else if (canonical === 'girl_lamp') {
          updates.girlLampOn = val
          broadcastWorldChange('girlLampOn', val)
        } else if (canonical === 'girl_vanity_light') {
          updates.girlVanityLightOn = val
          broadcastWorldChange('girlVanityLightOn', val)
        } else if (canonical === 'girl_shelf_led') {
          updates.girlShelfLedOn = val
          broadcastWorldChange('girlShelfLedOn', val)
        }

        set(updates)
        return val
      },
    }),
    {
      name: 'goc-nho-cua-khoa-v10',
      partialize: (s) => ({
        darkMode: s.darkMode,
        weather: s.weather,
        graphicMode: 'hd' as const,
        outfitId: s.outfitId,
        girlOutfitId: s.girlOutfitId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<State>) || {}
        return {
          ...currentState,
          ...persisted,
          graphicMode: 'hd',
        }
      },
    },
  ),
)

const SYNCED_ELECTRONIC_KEYS: KnownElectronicKey[] = [
  'tv',
  'ac',
  'pc',
  'girl_pc',
  'floor1_floor_lamp',
  'floor1_bed_lamp',
  'floor1_desk_lamp',
  'floor1_headboard_led',
  'bath_mirror_light',
  'bath_full_mirror_light',
  'laundry',
  'firepit',
  'floor2_reading_lamp',
  'floor2_arch_light',
  'girl_lamp',
  'girl_vanity_light',
  'girl_shelf_led',
]

useStore.subscribe((state, prevState) => {
  let lampFix: Partial<State> | null = null
  if (state.lampOn !== prevState.lampOn && state.floor1FloorLampOn !== state.lampOn) {
    lampFix = { floor1FloorLampOn: state.lampOn }
  } else if (
    state.floor1FloorLampOn !== prevState.floor1FloorLampOn &&
    state.lampOn !== state.floor1FloorLampOn
  ) {
    lampFix = { lampOn: state.floor1FloorLampOn }
  }

  let elecChanged = false
  let nextElec: Record<string, boolean> | null = null
  const curElec = state.electronicStates

  for (let i = 0; i < SYNCED_ELECTRONIC_KEYS.length; i++) {
    const k = SYNCED_ELECTRONIC_KEYS[i]
    const v =
      k === 'floor1_floor_lamp' && lampFix?.floor1FloorLampOn !== undefined
        ? lampFix.floor1FloorLampOn
        : readKnownElectronicBool(state, k)
    if (curElec[k] !== v) {
      if (!nextElec) nextElec = { ...curElec }
      nextElec[k] = v
      if (k === 'floor1_floor_lamp') nextElec.lamp = v
      if (k === 'laundry') nextElec.washer = v
      elecChanged = true
    }
  }

  const existingKeys = Object.keys(curElec)
  for (let i = 0; i < existingKeys.length; i++) {
    const instKey = existingKeys[i]
    const mapped = resolveCanonicalElectronicKey(instKey)
    if (mapped) {
      const v =
        mapped === 'floor1_floor_lamp' && lampFix?.floor1FloorLampOn !== undefined
          ? lampFix.floor1FloorLampOn
          : readKnownElectronicBool(state, mapped)
      if ((nextElec ?? curElec)[instKey] !== v) {
        if (!nextElec) nextElec = { ...curElec }
        nextElec[instKey] = v
        elecChanged = true
      }
    }
  }

  if (lampFix || elecChanged) {
    useStore.setState({
      ...(lampFix ?? {}),
      ...(elecChanged && nextElec ? { electronicStates: nextElec } : {}),
    })
  }
})

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__store = useStore

  initPresenceSync()
  if (initRole) {
    claimRole(initRole)
  }

  // Tự động lắng nghe và cập nhật trạng thái có người vào vai / nhả vai theo thời gian thực
  subscribePresence((pres) => {
    const s = useStore.getState()
    const boyOcc = pres.boy.occupied
    const girlOcc = pres.girl.occupied

    const isOtherBoyOccupied = boyOcc && !pres.boy.isSelf
    const isOtherGirlOccupied = girlOcc && !pres.girl.isSelf

    useStore.setState({
      roleOccupancy: { boy: boyOcc, girl: girlOcc },
      // QUAN TRỌNG: Khi đối phương đã vào vai, TẮT HOÀN TOÀN AutoLife của đối phương để không "tự biên tự diễn"
      boyAutoLife: s.userRole === 'boy' ? s.boyAutoLife : !isOtherBoyOccupied,
      girlAutoLife: s.userRole === 'girl' ? s.girlAutoLife : !isOtherGirlOccupied,
    })
  })

  // Lắng nghe và đồng bộ hành động từ người chơi còn lại (Cùng thời điểm, cùng thao tác)
  subscribePlayerAction((msg) => {
    const s = useStore.getState()
    // Nếu là tin nhắn từ chính vai mình đang điều khiển thì bỏ qua
    if (s.userRole && msg.role === s.userRole) return

    const role = msg.role
    // Tắt ngay AutoLife của vai đối phương
    if (role === 'boy') useStore.setState({ boyAutoLife: false })
    if (role === 'girl') useStore.setState({ girlAutoLife: false })

    if (msg.action === 'startActivity') {
      s.startActivity(msg.payload.act, false, role, true)
    } else if (msg.action === 'petDog') {
      s.petDog(msg.payload.dogId, false, role, true)
    } else if (msg.action === 'walkTo') {
      s.setAvatarTarget(msg.payload.target, true)
    } else if (msg.action === 'setOutfit') {
      if (role === 'boy') s.setOutfitId(msg.payload.outfitId, true)
      if (role === 'girl') s.setGirlOutfitId(msg.payload.outfitId, true)
    } else if (msg.action === 'worldToggle') {
      const { key, val } = msg.payload
      if (key === 'graphicMode') return
      useStore.setState({ [key]: val } as any)
    }
  })

  // Lắng nghe tọa độ thời gian thực của người chơi đối phương để giữ vị trí chính xác cùng thời điểm
  subscribePosSync((msg) => {
    const s = useStore.getState()
    if (s.userRole && msg.role === s.userRole) return

    const role = msg.role
    if (role === 'boy') {
      const updates: any = { boyAutoLife: false }
      if (s.boyActivity !== msg.activity) updates.boyActivity = msg.activity
      if (s.boyPhase !== msg.phase) updates.boyPhase = msg.phase
      if (s.outfitId !== msg.outfitId) updates.outfitId = msg.outfitId
      useStore.setState(updates)
    } else if (role === 'girl') {
      const updates: any = { girlAutoLife: false }
      if (s.girlActivity !== msg.activity) updates.girlActivity = msg.activity
      if (s.girlPhase !== msg.phase) updates.girlPhase = msg.phase
      if (s.girlOutfitId !== msg.outfitId) updates.girlOutfitId = msg.outfitId
      useStore.setState(updates)
    }
  })
}
