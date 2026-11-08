import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FLOOR1_VIEW,
  FLOOR2_VIEW,
  GIRL_OUTFITS,
  HOME_VIEW,
  LIVE_ACTORS,
  OUTFITS,
  STATIONS,
  TV_CHANNELS,
  type V3,
} from './data/config'
import { claimRole, initPresenceSync, releaseRole, subscribePresence } from './presence'

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
  startActivity: (act: Activity, fromUser?: boolean, forChar?: ActiveChar) => void
  setActivityPhase: (phase: ActivityPhase, forChar?: ActiveChar) => void

  avatarTarget: V3 | null
  setAvatarTarget: (p: V3 | null) => void
  outfitId: string
  outfitSpinTick: number
  setOutfitId: (id: string) => void

  // Tiện ích & Thiết bị Tầng 2
  girlOutfitId: string
  girlOutfitSpinTick: number
  setGirlOutfitId: (id: string) => void
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

  // Camera & Góc nhìn
  focus: CamFocus | null
  viewPreset: 'overview' | 'floor1' | 'floor2'
  setFocus: (f: CamFocus | null, preset?: 'overview' | 'floor1' | 'floor2') => void
  returnOverview: () => void
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
  petDog: (id: 'mochi' | 'bo', fromUser?: boolean, forChar?: ActiveChar) => void

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

  // Nhà thông minh
  robotVacuumOn: boolean
  toggleRobotVacuum: () => void

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
        set((s) => ({
          userRole: role,
          activeChar: role,
          boyAutoLife: role === 'girl' ? true : false,
          girlAutoLife: role === 'boy' ? true : false,
          roleOccupancy: { ...s.roleOccupancy, [role]: true },
          toastMessage: role === 'boy' ? '👦 Chào mừng Khoa về nhà!' : '👧 Chào mừng Bạn Gái về nhà!',
        }))
        return true
      },
      logout: () => {
        releaseRole()
        if (typeof window !== 'undefined') sessionStorage.removeItem('user_role')
        set(() => ({
          userRole: null,
          activeChar: 'boy',
          boyAutoLife: true, // Khi không vào vai, nhân vật tự hoạt động
          girlAutoLife: true, // Khi không vào vai, nhân vật tự hoạt động
          roleOccupancy: { boy: false, girl: false },
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
        set((s) => ({
          darkMode: !s.darkMode,
          toastMessage: !s.darkMode ? '🌙 Ban đêm' : '☀️ Ban ngày',
        })),

      setActiveChar: (activeChar) =>
        set((s) => {
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

      startActivity: (act, fromUser = true, forChar) =>
        set((s) => {
          // Tủ đồ tầng 1 dành riêng cho Khoa, Tủ đồ tầng 2 dành riêng cho Bạn Gái
          const char =
            act === 'wardrobe'
              ? 'boy'
              : act === 'girl_wardrobe'
                ? 'girl'
                : (forChar ?? (s.userRole || s.activeChar || 'boy'))
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
              wardrobeOpen: char === 'boy' ? false : s.wardrobeOpen,
              girlWardrobeOpen: char === 'girl' ? false : s.girlWardrobeOpen,
              activePhoto: null,
              focus: null,
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
              wardrobeOpen: char === 'boy' ? false : s.wardrobeOpen,
              girlWardrobeOpen: char === 'girl' ? false : s.girlWardrobeOpen,
              activePhoto: null,
              focus: s.focus,
              toastMessage: '🚶 Đã đứng dậy',
            }
          }

          const station = STATIONS[act]
          const nextBoyAct = char === 'boy' ? act : s.boyActivity
          const nextGirlAct = char === 'girl' ? act : s.girlActivity

          return {
            boyActivity: nextBoyAct,
            boyPhase: char === 'boy' ? 'walking' : s.boyPhase,
            girlActivity: nextGirlAct,
            girlPhase: char === 'girl' ? 'walking' : s.girlPhase,
            activeChar: char,
            activity: act,
            activityPhase: 'walking',
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
            toastMessage: fromUser ? station?.label : s.toastMessage,
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
      setAvatarTarget: (avatarTarget) =>
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
        })),

      outfitId: OUTFITS[0].id,
      outfitSpinTick: 0,
      setOutfitId: (outfitId) => {
        const found = OUTFITS.find((o) => o.id === outfitId)
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
      setFocus: (focus, preset) =>
        set(() => ({
          focus,
          ...(preset ? { viewPreset: preset } : {}),
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
            focus: s.mode === 'orbit' ? HOME_VIEW : null,
          }
        }),
      cutWalls: { back: false, left: false, right: false },
      setCutWalls: (cutWalls) => set({ cutWalls }),

      lampOn: true,
      toggleLamp: () =>
        set((s) => ({
          lampOn: !s.lampOn,
          toastMessage: !s.lampOn ? '💡 Bật đèn cây phòng khách' : '💡 Tắt đèn cây phòng khách',
        })),
      floor1BedLampOn: true,
      toggleFloor1BedLamp: () =>
        set((s) => ({
          floor1BedLampOn: !s.floor1BedLampOn,
          toastMessage: !s.floor1BedLampOn ? '💡 Bật đèn ngủ Tầng 1' : '💡 Tắt đèn ngủ Tầng 1',
        })),
      floor1DeskLampOn: true,
      toggleFloor1DeskLamp: () =>
        set((s) => ({
          floor1DeskLampOn: !s.floor1DeskLampOn,
          toastMessage: !s.floor1DeskLampOn ? '💡 Bật đèn bàn máy tính' : '💡 Tắt đèn bàn máy tính',
        })),
      floor1HeadboardLedOn: true,
      toggleFloor1HeadboardLed: () =>
        set((s) => ({
          floor1HeadboardLedOn: !s.floor1HeadboardLedOn,
          toastMessage: !s.floor1HeadboardLedOn ? '✨ Bật đèn hắt đầu giường' : '✨ Tắt đèn hắt đầu giường',
        })),

      // Đèn phòng tắm
      bathMirrorLightOn: true,
      toggleBathMirrorLight: () =>
        set((s) => ({
          bathMirrorLightOn: !s.bathMirrorLightOn,
          toastMessage: !s.bathMirrorLightOn ? '✨ Bật đèn gương Halo phòng tắm' : '✨ Tắt đèn gương Halo phòng tắm',
        })),
      bathFullMirrorLightOn: true,
      toggleBathFullMirrorLight: () =>
        set((s) => ({
          bathFullMirrorLightOn: !s.bathFullMirrorLightOn,
          toastMessage: !s.bathFullMirrorLightOn ? '✨ Bật đèn gương toàn thân' : '✨ Tắt đèn gương toàn thân',
        })),

      // Đèn Tầng 2
      floor2ReadingLampOn: true,
      toggleFloor2ReadingLamp: () =>
        set((s) => ({
          floor2ReadingLampOn: !s.floor2ReadingLampOn,
          toastMessage: !s.floor2ReadingLampOn ? '💡 Bật đèn cây đọc sách Tầng 2' : '💡 Tắt đèn cây đọc sách Tầng 2',
        })),
      floor2ArchLightOn: true,
      toggleFloor2ArchLight: () =>
        set((s) => ({
          floor2ArchLightOn: !s.floor2ArchLightOn,
          toastMessage: !s.floor2ArchLightOn ? '✨ Bật đèn vòm nghệ thuật Tầng 2' : '✨ Tắt đèn vòm nghệ thuật Tầng 2',
        })),
      acOn: true,
      toggleAc: () =>
        set((s) => ({
          acOn: !s.acOn,
          toastMessage: !s.acOn ? '❄️ Bật điều hòa' : '❄️ Tắt điều hòa',
        })),
      curtainsOpen: true,
      curtainsFloor1Open: true,
      curtainsFloor2Open: true,
      toggleCurtainsFloor1: () =>
        set((s) => {
          const next = !s.curtainsFloor1Open
          return {
            curtainsFloor1Open: next,
            curtainsOpen: next,
            toastMessage: next ? '🪟 Mở rèm cửa Tầng 1' : '🪟 Đóng rèm cửa Tầng 1',
          }
        }),
      toggleCurtainsFloor2: () =>
        set((s) => {
          const next = !s.curtainsFloor2Open
          return {
            curtainsFloor2Open: next,
            toastMessage: next ? '🪟 Mở rèm cửa Tầng 2' : '🪟 Đóng rèm cửa Tầng 2',
          }
        }),
      toggleCurtains: (floor) =>
        set((s) => {
          if (floor === 2) {
            const next = !s.curtainsFloor2Open
            return {
              curtainsFloor2Open: next,
              toastMessage: next ? '🪟 Mở rèm cửa Tầng 2' : '🪟 Đóng rèm cửa Tầng 2',
            }
          }
          if (floor === 1) {
            const next = !s.curtainsFloor1Open
            return {
              curtainsFloor1Open: next,
              curtainsOpen: next,
              toastMessage: next ? '🪟 Mở rèm cửa Tầng 1' : '🪟 Đóng rèm cửa Tầng 1',
            }
          }
          const next = !s.curtainsOpen
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
          return {
            pcState: next,
            toastMessage:
              next === 'on' ? '💻 Chế độ Code' : next === 'rgb' ? '🌈 Gaming RGB' : '🖥️ Tắt màn hình',
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
        set((s) => ({
          tvOn: !s.tvOn,
          toastMessage: !s.tvOn ? '📺 Bật TV' : '🔴 Tắt TV',
        })),
      tvChannel: 0,
      cycleTvChannel: () =>
        set((s) => {
          const next = (s.tvChannel + 1) % TV_CHANNELS.length
          return {
            tvOn: true,
            tvChannel: next,
            toastMessage: `📺 ${TV_CHANNELS[next].name}`,
          }
        }),

      feedingUntil: 0,
      petTargetId: 'mochi',
      petDog: (id, fromUser = true, forChar) =>
        set((s) => {
          const char = forChar ?? s.activeChar
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
        }),

      hoverHint: null,
      setHoverHint: (hoverHint) => set({ hoverHint }),
      bathBubbles: true,
      toggleBathBubbles: () =>
        set((s) => ({
          bathBubbles: !s.bathBubbles,
          toastMessage: !s.bathBubbles ? '🛁 Bật bọt xà phòng' : '🛁 Tắt bọt xà phòng',
        })),
      sinkWaterUntil: 0,
      triggerSinkWater: () =>
        set({
          sinkWaterUntil: Date.now() + 4500,
          toastMessage: '💧 Xả nước bồn rửa',
        }),
      laundryRunning: false,
      toggleLaundry: () =>
        set((s) => ({
          laundryRunning: !s.laundryRunning,
          toastMessage: !s.laundryRunning ? '🧺 Bật máy giặt' : '⏹️ Tắt máy giặt',
        })),
      readBookPage: 1,
      nextBookPage: () =>
        set((s) => ({
          readBookPage: (s.readBookPage % 5) + 1,
          toastMessage: `📖 Trang ${(s.readBookPage % 5) + 1}`,
        })),

      girlOutfitId: GIRL_OUTFITS[0].id,
      girlOutfitSpinTick: 0,
      setGirlOutfitId: (girlOutfitId) => {
        const found = GIRL_OUTFITS.find((o) => o.id === girlOutfitId)
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
        set((s) => ({
          girlLampOn: !s.girlLampOn,
          toastMessage: !s.girlLampOn ? '💡 Bật đèn ngủ Tầng 2' : '💡 Tắt đèn ngủ Tầng 2',
        })),

      girlVanityLightOn: true,
      toggleGirlVanityLight: () =>
        set((s) => ({
          girlVanityLightOn: !s.girlVanityLightOn,
          toastMessage: !s.girlVanityLightOn ? '✨ Bật đèn gương Halo' : '✨ Tắt đèn gương Halo',
        })),

      girlShelfLedOn: true,
      toggleGirlShelfLed: () =>
        set((s) => ({
          girlShelfLedOn: !s.girlShelfLedOn,
          toastMessage: !s.girlShelfLedOn ? '✨ Bật LED kệ sách' : '✨ Tắt LED kệ sách',
        })),

      girlWardrobeOpen: false,
      setGirlWardrobeOpen: (girlWardrobeOpen) => set({ girlWardrobeOpen }),

      girlBookPage: 1,
      nextGirlBookPage: () =>
        set((s) => ({
          girlBookPage: (s.girlBookPage % 4) + 1,
          toastMessage: `📖 Trang ${(s.girlBookPage % 4) + 1}`,
        })),

      robotVacuumOn: true,
      toggleRobotVacuum: () =>
        set((s) => ({
          robotVacuumOn: !s.robotVacuumOn,
          toastMessage: !s.robotVacuumOn ? '🤖 Bật Robot hút bụi' : '🔌 Tắt Robot hút bụi',
        })),

      toastMessage: null,
      notify: (toastMessage) => set({ toastMessage }),
    }),
    {
      name: 'goc-nho-cua-khoa-v9',
      partialize: (s) => ({
        darkMode: s.darkMode,
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
    useStore.setState({
      roleOccupancy: { boy: boyOcc, girl: girlOcc },
      // Khi không có ai vào vai (hoặc người chơi thoát), nhân vật tự động chạy Auto
      boyAutoLife: s.userRole === 'boy' ? s.boyAutoLife : true,
      girlAutoLife: s.userRole === 'girl' ? s.girlAutoLife : true,
    })
  })
}
