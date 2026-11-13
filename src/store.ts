import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FLOOR1_VIEW,
  FLOOR2_VIEW,
  GIRL_OUTFITS,
  HOME_VIEW,
  LIVE_ACTORS,
  OUTFITS,
  RANDOM_VIEWS,
  STATIONS,
  TV_CHANNELS,
  WEATHER_MODES,
  type V3,
} from './data/config'
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
  graphicMode: 'hd' | 'smooth'
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
  setAvatarTarget: (p: V3 | null, fromRemote?: boolean) => void
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
  toggleGirlLamp: () => void
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
  toggleRoof: () => void
  wallMode: 'cutaway' | 'ghost' | 'full'
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
}

const getInitialRole = (): ActiveChar | null => {
  if (typeof window === 'undefined') return null
  const r = sessionStorage.getItem('user_role')
  return r === 'boy' || r === 'girl' ? r : null
}
const initRole = getInitialRole()

function broadcastWorldChange(key: string, val: any) {
  if (typeof window === 'undefined') return
  const role = useStore?.getState?.()?.userRole || 'boy'
  broadcastPlayerAction(role, 'worldToggle', { key, val })
}

export const useStore = create<State>()(
  persist(
    (set) => ({
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
        set((s) => ({
          mode,
          focus:
            mode === 'orbit'
              ? s.viewPreset === 'floor1'
                ? FLOOR1_VIEW
                : s.viewPreset === 'floor2'
                  ? FLOOR2_VIEW
                  : HOME_VIEW
              : null,
          activePhoto: null,
          toastMessage: mode === 'fp' ? '👁️ Góc nhìn thứ nhất' : '🏠 Góc nhìn toàn cảnh',
        })),
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
        set((s) => {
          const next = s.graphicMode === 'hd' ? 'smooth' : 'hd'
          return {
            graphicMode: next,
            toastMessage: next === 'hd' ? '✨ Đồ họa: HD' : '⚡ Đồ họa: Mượt',
          }
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
            return {
              boyActivity: char === 'boy' ? 'idle' : s.boyActivity,
              boyPhase: char === 'boy' ? 'active' : s.boyPhase,
              girlActivity: char === 'girl' ? 'idle' : s.girlActivity,
              girlPhase: char === 'girl' ? 'active' : s.girlPhase,
              ...(s.activeChar === char
                ? { activity: 'idle', activityPhase: 'active', isUserInitiated: false }
                : {}),
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
      setAvatarTarget: (avatarTarget, fromRemote = false) => {
        if (avatarTarget && !fromRemote) {
          const char = useStore.getState().userRole || useStore.getState().activeChar || 'boy'
          broadcastPlayerAction(char, 'walkTo', { target: avatarTarget })
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
      roofVisible: false,
      toggleRoof: () =>
        set((s) => {
          const next = !s.roofVisible
          broadcastWorldChange('roofVisible', next)
          const needsOverview = next && s.viewPreset !== 'overview'
          return {
            roofVisible: next,
            ...(needsOverview
              ? {
                  mode: 'orbit' as const,
                  viewPreset: 'overview' as const,
                  focus: { pos: [...HOME_VIEW.pos], target: [...HOME_VIEW.target] },
                }
              : {}),
            toastMessage: next ? '🏠 Hiện mái nhà & ngoại thất' : '✨ Ẩn mái nhà',
          }
        }),
      wallMode: 'cutaway',
      cycleWallMode: () =>
        set((s) => {
          const order: Array<'cutaway' | 'ghost' | 'full'> = ['cutaway', 'ghost', 'full']
          const next = order[(order.indexOf(s.wallMode) + 1) % order.length]
          const labels = {
            cutaway: '🧱 Tường lửng (tự động hạ tường chắn)',
            ghost: '🪟 Tường kính mờ (giữ khung 4 mặt)',
            full: '🏛️ Đủ 4 tường (ngoại thất kín)',
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
          ...(preset === 'floor1' || preset === 'floor2' ? { roofVisible: false } : {}),
        })),
      returnOverview: () =>
        set((s) => {
          const char = s.userRole || s.activeChar || 'boy'
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
            viewPreset: 'overview',
            focus: s.mode === 'orbit' ? { pos: [...HOME_VIEW.pos], target: [...HOME_VIEW.target] } : null,
          }
        }),
      resetCamera: () =>
        set(() => ({
          mode: 'orbit',
          activePhoto: null,
          wardrobeOpen: false,
          girlWardrobeOpen: false,
          viewPreset: 'overview',
          focus: { pos: [...HOME_VIEW.pos], target: [...HOME_VIEW.target] },
          toastMessage: '↺ Đã đặt lại góc nhìn mặc định',
        })),
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
            ...(picked.preset === 'floor1' || picked.preset === 'floor2' ? { roofVisible: false } : {}),
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
          return {
            lampOn: next,
            toastMessage: next ? '💡 Bật đèn cây phòng khách' : '💡 Tắt đèn cây phòng khách',
          }
        }),
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
            toastMessage: next ? '🧺 Bật máy giặt' : '⏹️ Tắt máy giặt',
          }
        }),
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
      toggleGirlLamp: () =>
        set((s) => {
          const next = !s.girlLampOn
          broadcastWorldChange('girlLampOn', next)
          return {
            girlLampOn: next,
            toastMessage: next ? '💡 Bật đèn ngủ Tầng 2' : '💡 Tắt đèn ngủ Tầng 2',
          }
        }),

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
    }),
    {
      name: 'goc-nho-cua-khoa-v10',
      partialize: (s) => ({
        darkMode: s.darkMode,
        weather: s.weather,
        graphicMode: s.graphicMode,
        outfitId: s.outfitId,
        girlOutfitId: s.girlOutfitId,
      }),
    },
  ),
)

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
