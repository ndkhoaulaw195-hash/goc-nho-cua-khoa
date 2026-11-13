import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { LoginLobby } from './LoginLobby'
import { PianoModal } from './PianoModal'
import {
  FLOOR1_VIEW,
  FLOOR2_VIEW,
  GIRL_OUTFITS,
  OUTFITS,
  SITE,
  STATIONS,
  TV_CHANNELS,
  WALL_PHOTOS,
  WEATHER_MODES,
} from '../data/config'

const I = {
  music: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  mute: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M2 2l20 20" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  reset: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  shuffle: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
}

export function Overlay() {
  const darkMode = useStore((s) => s.darkMode)
  const toastMessage = useStore((s) => s.toastMessage)
  const hoverHint = useStore((s) => s.hoverHint)
  const mode = useStore((s) => s.mode)
  const userRole = useStore((s) => s.userRole)
  const activity = useStore((s) => s.activity)
  const isUserInitiated = useStore((s) => s.isUserInitiated)
  const boyAutoLife = useStore((s) => s.boyAutoLife)
  const girlAutoLife = useStore((s) => s.girlAutoLife)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => useStore.setState({ toastMessage: null }), 2500)
    return () => clearTimeout(t)
  }, [toastMessage])

  // Hỗ trợ nhấn ESC để đóng nhanh modal đang mở
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const st = useStore.getState()
      if (st.pianoModalOpen) return st.setPianoModalOpen(false)
      if (st.wardrobeOpen) {
        return useStore.setState({ wardrobeOpen: false, boyActivity: 'idle', boyPhase: 'active', isUserInitiated: false })
      }
      if (st.girlWardrobeOpen) {
        return useStore.setState({ girlWardrobeOpen: false, girlActivity: 'idle', girlPhase: 'active', isUserInitiated: false })
      }
      if (st.activePhoto !== null) return st.returnOverview()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const showOnboarding = Boolean(userRole) && mode === 'orbit' && !(isUserInitiated && activity !== 'idle')

  return (
    <div className={`overlay ${darkMode ? 'is-dark' : ''}`}>
      <div className="hud-top-bar">
        <TopLeft boyAutoLife={boyAutoLife} girlAutoLife={girlAutoLife} />
      </div>

      <TopRight />
      <ContextualDock />
      <WardrobeModal />
      <GirlWardrobeModal />
      <PhotoModal />
      <PianoModal />
      <LoginLobby />

      {showOnboarding && <OnboardingHint />}

      {mode === 'fp' && (
        <>
          <div className={`fp-crosshair ${hoverHint ? 'active' : ''}`} />
          <div className="fp-hud">WASD di chuyển · Chuột xoay góc nhìn · ESC thoát</div>
        </>
      )}
      {hoverHint && <div className="hover-hint">{hoverHint}</div>}
      {toastMessage && <div className="toast" role="status" aria-live="polite">{toastMessage}</div>}
    </div>
  )
}

/* ---------- Gợi ý thao tác nhỏ gọn ở cạnh dưới, tự mờ dần sau tương tác đầu tiên ---------- */
function OnboardingHint() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'hidden'>('visible')

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    const triggerFade = () => {
      setPhase((prev) => {
        if (prev !== 'visible') return prev
        hideTimer = setTimeout(() => setPhase('hidden'), 550)
        return 'fading'
      })
    }

    const onInteract = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('canvas') || target.closest('.hud-top-right')) {
        triggerFade()
      }
    }

    window.addEventListener('pointerdown', onInteract, { passive: true })
    window.addEventListener('wheel', onInteract, { passive: true })
    window.addEventListener('touchstart', onInteract, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('wheel', onInteract)
      window.removeEventListener('touchstart', onInteract)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      className={`onboarding-hint ${phase === 'fading' ? 'is-fading' : ''}`}
      onClick={() => setPhase('hidden')}
      role="note"
    >
      <span className="onboarding-desktop">
        Kéo chuột để xoay • Cuộn để thu phóng • Chạm vào đồ vật để khám phá
      </span>
      <span className="onboarding-mobile">
        Chạm kéo để xoay • Chụm để thu phóng • Chạm đồ vật khám phá
      </span>
    </div>
  )
}

/* ---------- Cụm Trái Trên: Tiêu đề + Trạng thái Vai & Tim Hạnh Phúc ---------- */
function TopLeft({
  boyAutoLife,
  girlAutoLife,
}: {
  boyAutoLife: boolean
  girlAutoLife: boolean
}) {
  const userRole = useStore((s) => s.userRole)
  const logout = useStore((s) => s.logout)
  const isAuto = userRole === 'boy' ? boyAutoLife : girlAutoLife

  return (
    <div className="hud-top-left">
      <div className="card title-card">
        <div className="eyebrow">{SITE.eyebrow}</div>
        <h1>{SITE.title}</h1>
      </div>

      {userRole && (
        <div className="card role-status-strip">
          <span className="role-current-tag">
            {userRole === 'boy' ? '👦 Khoa' : '👧 Bạn Gái'}
          </span>

          <button
            className={`auto-toggle-chip ${isAuto ? 'on' : ''}`}
            onClick={() =>
              userRole === 'boy'
                ? useStore.getState().toggleBoyAutoLife()
                : useStore.getState().toggleGirlAutoLife()
            }
            title={isAuto ? 'Tự động sinh hoạt đang bật' : 'Bật tự động sinh hoạt cho nhân vật'}
          >
            <span className={`pulse-dot ${isAuto ? 'on' : ''}`} />
            <span>Auto</span>
          </button>

          <button
            className="role-logout-btn"
            onClick={logout}
            title="Quay lại sảnh để chọn nhân vật khác"
          >
            Đổi vai
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- Thanh hành động ngữ cảnh gọn gàng khi đang tương tác với đồ vật ---------- */
function ContextualDock() {
  const activity = useStore((s) => s.activity)
  const activityPhase = useStore((s) => s.activityPhase)
  const isUserInitiated = useStore((s) => s.isUserInitiated)
  const tvChannel = useStore((s) => s.tvChannel)
  const tvOn = useStore((s) => s.tvOn)
  const pcState = useStore((s) => s.pcState)
  const darkMode = useStore((s) => s.darkMode)
  const floor1BedLampOn = useStore((s) => s.floor1BedLampOn)
  const floor1DeskLampOn = useStore((s) => s.floor1DeskLampOn)
  const floor1HeadboardLedOn = useStore((s) => s.floor1HeadboardLedOn)
  const bathMirrorLightOn = useStore((s) => s.bathMirrorLightOn)
  const girlPcState = useStore((s) => s.girlPcState)
  const girlLampOn = useStore((s) => s.girlLampOn)
  const floor2ArchLightOn = useStore((s) => s.floor2ArchLightOn)
  const floor2ReadingLampOn = useStore((s) => s.floor2ReadingLampOn)
  const girlVanityLightOn = useStore((s) => s.girlVanityLightOn)
  const girlShelfLedOn = useStore((s) => s.girlShelfLedOn)
  const girlBookPage = useStore((s) => s.girlBookPage)

  if (!isUserInitiated || activity === 'idle') return null

  return (
    <div className="context-dock card">
      <span className="dock-status">
        {activityPhase === 'walking' ? `🚶 Đang đi tới...` : STATIONS[activity].label}
      </span>

      {/* --- TẦNG 1: HOẠT ĐỘNG CỦA KHOA --- */}
      {activity === 'tv' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().cycleTvChannel()}>
            📺 Kênh: {TV_CHANNELS[tvChannel].name}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleTv()}>
            {tvOn ? '🔴 Tắt TV' : '🟢 Bật TV'}
          </button>
        </>
      )}

      {activity === 'pc' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().cyclePcState()}>
            🖥️ Màn hình: {pcState === 'on' ? 'Code' : pcState === 'rgb' ? 'Ấm 3000K' : 'Tắt'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().spinChair()}>
            🔄 Xoay ghế
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleFloor1DeskLamp()}>
            {floor1DeskLampOn ? '💡 Tắt đèn bàn' : '💡 Bật đèn bàn'}
          </button>
        </>
      )}

      {activity === 'sleep' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().toggleDarkMode()}>
            {darkMode
              ? `${WEATHER_MODES.clear.icon} ${WEATHER_MODES.clear.label}`
              : `${WEATHER_MODES.night.icon} ${WEATHER_MODES.night.label}`}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleFloor1BedLamp()}>
            {floor1BedLampOn ? '💡 Tắt đèn ngủ' : '💡 Bật đèn ngủ'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleFloor1HeadboardLed()}>
            {floor1HeadboardLedOn ? '✨ Tắt LED đầu giường' : '✨ Bật LED đầu giường'}
          </button>
        </>
      )}

      {activity === 'darts' && (
        <button className="dock-btn" onClick={() => useStore.getState().triggerDartFlight()}>
          🎯 Phóng thêm phi tiêu
        </button>
      )}

      {activity === 'drink' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().setDrinkType('tea')}>
            🌼 Pha trà hoa cúc mật ong
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().setDrinkType('coffee')}>
            ☕ Pha cà phê sữa nóng
          </button>
        </>
      )}

      {activity === 'piano' && (
        <button className="dock-btn primary" onClick={() => useStore.getState().setPianoModalOpen(true)}>
          🎹 Mở bàn phím Piano
        </button>
      )}

      {activity === 'pet' && (
        <button
          className="dock-btn"
          onClick={() => {
            const nextId = useStore.getState().petTargetId === 'mochi' ? 'bo' : 'mochi'
            useStore.getState().petDog(nextId, true)
          }}
        >
          🐶 Đổi sang vuốt ve {useStore.getState().petTargetId === 'mochi' ? 'Bơ' : 'Mochi'}
        </button>
      )}

      {activity === 'read' && (
        <button className="dock-btn" onClick={() => useStore.getState().nextBookPage()}>
          📖 Trang {useStore.getState().readBookPage} · Lật trang tiếp
        </button>
      )}

      {activity === 'bath' && (
        <button className="dock-btn" onClick={() => useStore.getState().toggleBathBubbles()}>
          {useStore.getState().bathBubbles ? '🫧 Tắt bọt xà phòng' : '🫧 Bật bọt xà phòng'}
        </button>
      )}

      {activity === 'wash' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().triggerSinkWater()}>
            💧 Xả nước bồn rửa
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleBathMirrorLight()}>
            {bathMirrorLightOn ? '✨ Tắt đèn gương' : '✨ Bật đèn gương'}
          </button>
        </>
      )}

      {activity === 'laundry' && (
        <button className="dock-btn" onClick={() => useStore.getState().toggleLaundry()}>
          {useStore.getState().laundryRunning ? '🧺 Tắt máy giặt' : '🧺 Bật máy giặt'}
        </button>
      )}

      {/* --- TẦNG 2: HOẠT ĐỘNG CỦA BẠN GÁI --- */}
      {activity === 'girl_sleep' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().toggleDarkMode()}>
            {darkMode
              ? `${WEATHER_MODES.clear.icon} ${WEATHER_MODES.clear.label}`
              : `${WEATHER_MODES.night.icon} ${WEATHER_MODES.night.label}`}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleGirlLamp()}>
            {girlLampOn ? '💡 Tắt đèn ngủ' : '💡 Bật đèn ngủ'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleFloor2ArchLight()}>
            {floor2ArchLightOn ? '✨ Tắt đèn vòm' : '✨ Bật đèn vòm'}
          </button>
        </>
      )}

      {activity === 'girl_pc' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().cycleGirlPcState()}>
            🖥️ Màn hình: {girlPcState === 'on' ? 'UI Design' : girlPcState === 'rgb' ? 'Vẽ 3D' : 'Tắt'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().spinGirlChair()}>
            🔄 Xoay ghế
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleGirlShelfLed()}>
            {girlShelfLedOn ? '✨ Tắt LED kệ' : '✨ Bật LED kệ'}
          </button>
        </>
      )}

      {activity === 'girl_vanity' && (
        <button className="dock-btn" onClick={() => useStore.getState().toggleGirlVanityLight()}>
          {girlVanityLightOn ? '🪞 Tắt đèn gương Halo' : '🪞 Bật đèn gương Halo'}
        </button>
      )}

      {(activity === 'girl_lounge' || activity === 'girl_nook') && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().nextGirlBookPage()}>
            📖 Trang {girlBookPage} · Lật trang
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleFloor2ReadingLamp()}>
            {floor2ReadingLampOn ? '💡 Tắt đèn đọc sách' : '💡 Bật đèn đọc sách'}
          </button>
        </>
      )}

      <button className="dock-btn primary" onClick={() => useStore.getState().returnOverview()}>
        {activity === 'sleep' || activity === 'girl_sleep'
          ? '☀️ Thức dậy'
          : activity === 'bath'
            ? '🛁 Rời bồn tắm'
            : '🚶 Đứng dậy'}
      </button>
    </div>
  )
}

/* ---------- Cụm Phải Trên (Desktop) / Thanh Dock Dưới Đáy (Mobile): Điều hướng & Tiện ích ---------- */
function TopRight() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const weather = useStore((s) => s.weather)
  const cycleWeather = useStore((s) => s.cycleWeather)
  const graphicMode = useStore((s) => s.graphicMode)
  const toggleGraphicMode = useStore((s) => s.toggleGraphicMode)
  const viewPreset = useStore((s) => s.viewPreset)
  const resetCamera = useStore((s) => s.resetCamera)
  const randomCameraView = useStore((s) => s.randomCameraView)

  const isFloor1 = mode === 'orbit' && viewPreset === 'floor1'
  const isFloor2 = mode === 'orbit' && viewPreset === 'floor2'
  const isOverview = mode === 'orbit' && viewPreset === 'overview'

  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audio.current?.pause()
    }
  }, [])

  const toggleMusic = () => {
    const notify = useStore.getState().notify
    if (!audio.current) {
      audio.current = new Audio(SITE.music.src)
      audio.current.loop = true
      audio.current.volume = 0.65
    }
    if (playing) {
      audio.current.pause()
      setPlaying(false)
      notify('🔇 Đã tắt nhạc')
    } else {
      audio.current
        .play()
        .then(() => {
          setPlaying(true)
          notify(`♪ ${SITE.music.title}`)
        })
        .catch(() => {
          notify('Không thể phát nhạc')
        })
    }
  }

  const weatherMeta = WEATHER_MODES[weather]

  return (
    <div className="hud-top-right">
      {/* Hàng 1: Điều hướng góc nhìn 3D */}
      <div className="glass-dock">
        <div className="view-switcher">
          <button
            className={`dock-pill-btn ${isOverview ? 'active' : ''}`}
            onClick={() => useStore.getState().returnOverview()}
            data-tooltip="Đưa về toàn cảnh mặc định"
            title="Đưa về toàn cảnh mặc định"
            aria-label="Toàn cảnh"
          >
            🏠 <span className="pill-label">Toàn cảnh</span>
          </button>
          <button
            className={`dock-pill-btn ${isFloor1 ? 'active' : ''}`}
            onClick={() => {
              useStore.getState().setMode('orbit')
              useStore.getState().setFocus(FLOOR1_VIEW, 'floor1')
              useStore.getState().notify('👦 Tầng 1 – Khoa')
            }}
            data-tooltip="Xem Tầng 1 – Khoa"
            title="Xem Tầng 1 – Khoa"
          >
            👦 <span>Tầng 1</span>
          </button>
          <button
            className={`dock-pill-btn ${isFloor2 ? 'active' : ''}`}
            onClick={() => {
              useStore.getState().setMode('orbit')
              useStore.getState().setFocus(FLOOR2_VIEW, 'floor2')
              useStore.getState().notify('👧 Tầng 2 – Bạn Gái')
            }}
            data-tooltip="Xem Tầng 2 – Bạn Gái"
            title="Xem Tầng 2 – Bạn Gái"
          >
            👧 <span>Tầng 2</span>
          </button>
        </div>

        <button
          className={`dock-pill-btn ${mode === 'fp' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'fp' ? 'orbit' : 'fp')}
          data-tooltip={mode === 'fp' ? 'Thoát góc nhìn thứ nhất' : 'Góc nhìn thứ nhất (WASD đi bộ)'}
          title={mode === 'fp' ? 'Thoát góc nhìn thứ nhất' : 'Góc nhìn thứ nhất (WASD đi bộ)'}
        >
          {I.eye} <span className="pill-label">{mode === 'fp' ? 'Thoát góc nhìn 1' : 'Góc nhìn 1'}</span>
        </button>

        <span className="dock-sep" />

        <button
          className="dock-icon-btn"
          onClick={resetCamera}
          data-tooltip="Đặt lại góc nhìn mặc định"
          title="Đặt lại góc nhìn mặc định"
          aria-label="Đặt lại góc nhìn mặc định"
        >
          {I.reset}
        </button>

        <button
          className="dock-icon-btn"
          onClick={randomCameraView}
          data-tooltip="Đổi góc nhìn ngẫu nhiên"
          title="Đổi góc nhìn ngẫu nhiên"
          aria-label="Đổi góc nhìn ngẫu nhiên"
        >
          {I.shuffle}
        </button>
      </div>

      {/* Hàng 2: Ánh sáng, Âm thanh & Chất lượng đồ họa */}
      <div className="glass-dock">
        <button
          className={`dock-icon-btn ${playing ? 'active' : ''}`}
          onClick={toggleMusic}
          data-tooltip={playing ? 'Tắt nhạc nền' : 'Phát nhạc nền'}
          title={playing ? 'Tắt nhạc nền' : 'Phát nhạc nền'}
          aria-label={playing ? 'Tắt nhạc nền' : 'Phát nhạc nền'}
        >
          {playing ? I.music : I.mute}
          {playing && (
            <span className="eq">
              <i />
              <i />
              <i />
            </span>
          )}
        </button>

        <button
          className="dock-pill-btn"
          onClick={cycleWeather}
          data-tooltip={`Ánh sáng: ${weatherMeta.label} (Bấm để đổi)`}
          title={`Ánh sáng: ${weatherMeta.label} (Bấm để đổi)`}
          aria-label={`Chế độ ánh sáng: ${weatherMeta.label}`}
        >
          <span>{weatherMeta.icon}</span>
          <span>{weatherMeta.label}</span>
        </button>

        <span className="dock-sep" />

        <button
          className={`dock-pill-btn ${graphicMode === 'hd' ? 'active' : ''}`}
          onClick={toggleGraphicMode}
          data-tooltip={graphicMode === 'hd' ? 'Chế độ HD sắc nét (Bấm chuyển Mượt)' : 'Chế độ Mượt tối ưu FPS (Bấm chuyển HD)'}
          title={graphicMode === 'hd' ? 'Chế độ HD sắc nét (Bấm chuyển Mượt)' : 'Chế độ Mượt tối ưu FPS (Bấm chuyển HD)'}
          aria-label={graphicMode === 'hd' ? 'Đồ họa HD' : 'Đồ họa Mượt'}
        >
          {graphicMode === 'hd' ? '✨ HD' : '⚡ Mượt'}
        </button>
      </div>
    </div>
  )
}

/* ---------- Bảng Chọn đồ cho Khoa (Tầng 1) ---------- */
function WardrobeModal() {
  const wardrobeOpen = useStore((s) => s.wardrobeOpen)
  const isUserInitiated = useStore((s) => s.isUserInitiated)
  const userRole = useStore((s) => s.userRole)
  const outfitId = useStore((s) => s.outfitId)

  // Chỉ mở bảng chọn đồ khi người dùng CHỦ ĐỘNG click vào tủ đồ của Khoa (không tự bật khi Auto-Life)
  if (!wardrobeOpen || !isUserInitiated || (userRole && userRole !== 'boy')) return null

  const handleClose = () => {
    useStore.setState({
      wardrobeOpen: false,
      boyActivity: 'idle',
      boyPhase: 'active',
      isUserInitiated: false,
    })
  }

  return (
    <div className="card side-modal" role="dialog">
      <button className="icon-btn close" onClick={handleClose} aria-label="Đóng">
        ✕
      </button>
      <h2>👕 Trang phục của Khoa</h2>
      <div className="outfit-list">
        {OUTFITS.map((o) => (
          <button
            key={o.id}
            className={`outfit-item ${outfitId === o.id ? 'active' : ''}`}
            onClick={() => useStore.getState().setOutfitId(o.id)}
          >
            <span className="swatch">
              <i style={{ background: o.shirt }} />
              <i style={{ background: o.pants }} />
            </span>
            <span>{o.name}</span>
          </button>
        ))}
      </div>
      <button
        className="dock-btn primary"
        style={{ marginTop: 12, width: '100%', height: 36 }}
        onClick={handleClose}
      >
        ✓ Hoàn tất thay đồ
      </button>
    </div>
  )
}

/* ---------- Bảng Chọn đồ cho Bạn Gái (Tầng 2) ---------- */
function GirlWardrobeModal() {
  const girlWardrobeOpen = useStore((s) => s.girlWardrobeOpen)
  const isUserInitiated = useStore((s) => s.isUserInitiated)
  const userRole = useStore((s) => s.userRole)
  const girlOutfitId = useStore((s) => s.girlOutfitId)

  // Chỉ mở bảng chọn đồ khi người dùng CHỦ ĐỘNG click vào tủ đồ của Bạn Gái (không tự bật khi Auto-Life)
  if (!girlWardrobeOpen || !isUserInitiated || (userRole && userRole !== 'girl')) return null

  const handleClose = () => {
    useStore.setState({
      girlWardrobeOpen: false,
      girlActivity: 'idle',
      girlPhase: 'active',
      isUserInitiated: false,
    })
  }

  return (
    <div className="card side-modal" role="dialog">
      <button className="icon-btn close" onClick={handleClose} aria-label="Đóng">
        ✕
      </button>
      <h2>👗 Trang phục Bạn Gái</h2>
      <div className="outfit-list">
        {GIRL_OUTFITS.map((o) => (
          <button
            key={o.id}
            className={`outfit-item ${girlOutfitId === o.id ? 'active' : ''}`}
            onClick={() => useStore.getState().setGirlOutfitId(o.id)}
          >
            <span className="swatch">
              <i style={{ background: o.jacket }} />
              <i style={{ background: o.skirt }} />
            </span>
            <span>{o.name}</span>
          </button>
        ))}
      </div>
      <button
        className="dock-btn primary"
        style={{ marginTop: 12, width: '100%', height: 36 }}
        onClick={handleClose}
      >
        ✓ Hoàn tất thay đồ
      </button>
    </div>
  )
}

/* ---------- Modal Xem 3 ảnh trên tường ---------- */
function PhotoModal() {
  const activePhoto = useStore((s) => s.activePhoto)
  const item = WALL_PHOTOS.find((p) => p.id === activePhoto)
  if (!item) return null

  const close = () => {
    useStore.getState().returnOverview()
  }

  const switchPhoto = (dir: number) => {
    const idx = WALL_PHOTOS.findIndex((p) => p.id === item.id)
    const next = WALL_PHOTOS[(idx + dir + WALL_PHOTOS.length) % WALL_PHOTOS.length]
    const st = useStore.getState()
    st.setActivePhoto(next.id)
    if (st.mode === 'orbit') st.setFocus(next.camera)
  }

  return (
    <div className="card side-modal" role="dialog">
      <button className="icon-btn close" onClick={close} aria-label="Đóng">
        {I.close}
      </button>
      <img src={item.src} alt={item.title} className="photo-preview" />
      <h2>{item.title}</h2>
      <div className="modal-actions">
        <button className="pill-btn" onClick={() => switchPhoto(-1)}>
          ← Trước
        </button>
        <button className="pill-btn" onClick={() => switchPhoto(1)}>
          Tiếp →
        </button>
      </div>
    </div>
  )
}
