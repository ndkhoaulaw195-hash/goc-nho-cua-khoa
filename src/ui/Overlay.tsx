import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { LoginLobby } from './LoginLobby'
import { PianoModal } from './PianoModal'
import { PROJECTED_UI_STATE, triggerActiveTargetFKey } from '../scene/interactionEngine'
import {
  GIRL_OUTFITS,
  OUTFITS,
  SITE,
  STATIONS,
  TV_CHANNELS,
  WALL_PHOTOS,
} from '../data/config'

const I = {
  close: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
}

function releaseCanvasPointerLock() {
  try {
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock?.()
    }
  } catch {
    // Bỏ qua nếu không thể nhả Pointer Lock
  }
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
  const wardrobeOpen = useStore((s) => s.wardrobeOpen)
  const girlWardrobeOpen = useStore((s) => s.girlWardrobeOpen)
  const pianoModalOpen = useStore((s) => s.pianoModalOpen)
  const activePhoto = useStore((s) => s.activePhoto)

  const [isPointerLocked, setIsPointerLocked] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => useStore.setState({ toastMessage: null }), 2500)
    return () => clearTimeout(t)
  }, [toastMessage])

  // Lắng nghe trạng thái khóa chuột GTA (Pointer Lock)
  useEffect(() => {
    const syncPointerLock = () => {
      if (typeof document === 'undefined') return
      const canvas = document.querySelector('canvas')
      setIsPointerLocked(
        Boolean(document.pointerLockElement && (!canvas || document.pointerLockElement === canvas)),
      )
    }
    syncPointerLock()
    document.addEventListener('pointerlockchange', syncPointerLock)
    document.addEventListener('pointerlockerror', syncPointerLock)
    return () => {
      document.removeEventListener('pointerlockchange', syncPointerLock)
      document.removeEventListener('pointerlockerror', syncPointerLock)
    }
  }, [])

  const hasModalOpen =
    (wardrobeOpen && isUserInitiated && (!userRole || userRole === 'boy')) ||
    (girlWardrobeOpen && isUserInitiated && (!userRole || userRole === 'girl')) ||
    pianoModalOpen ||
    activePhoto !== null ||
    !userRole

  // Tự nhả khóa chuột khi rời khỏi chế độ Tầm mắt hoặc khi có hộp thoại tương tác mở lên
  useEffect(() => {
    if (mode !== 'fp' || hasModalOpen) {
      releaseCanvasPointerLock()
    }
  }, [mode, hasModalOpen])

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
      if (st.containerCard) return st.setContainerCard(null)
      if (st.activePhoto !== null) return st.returnOverview()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const hasContextDock = isUserInitiated && activity !== 'idle'
  const showOnboarding = Boolean(userRole) && mode === 'orbit' && !hasContextDock

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

      {mode === 'fp' && !hasModalOpen && isPointerLocked && (
        <div className={`fp-crosshair ${hoverHint ? 'active' : ''}`} aria-hidden="true" />
      )}

      {hoverHint && !hasModalOpen && (
        <div
          className={`hover-hint ${mode === 'fp' ? 'in-fp' : ''} ${hasContextDock ? 'with-context' : ''}`}
          role="status"
          aria-live="polite"
        >
          {mode === 'fp' && <span className="hover-hint-dot" aria-hidden="true" />}
          <span>{hoverHint}</span>
        </div>
      )}

      {mode === 'fp' && !hasModalOpen && <GtaHudHint isPointerLocked={isPointerLocked} />}

      <FloatingInteractionPill hidden={hasModalOpen} />
      <ContainerInfoCard hidden={hasModalOpen} />
      <AvatarIntentIcons hidden={hasModalOpen} />

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

/* ---------- Floating Pill [F] {label} (60 FPS translate3d từ PROJECTED_UI_STATE) ---------- */
function FloatingInteractionPill({ hidden }: { hidden: boolean }) {
  const pillRef = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = pillRef.current
    if (!el) return
    if (hidden) {
      el.classList.remove('is-visible')
      return
    }

    let rafId = 0
    let lastLabel = ''
    let lastVisible = false

    const tick = () => {
      const visible = PROJECTED_UI_STATE.pillVisible && Boolean(PROJECTED_UI_STATE.pillLabel)
      if (visible) {
        const nextLabel = PROJECTED_UI_STATE.pillLabel
        if (nextLabel !== lastLabel && labelRef.current) {
          labelRef.current.textContent = nextLabel
          lastLabel = nextLabel
        }
        const w = el.offsetWidth || 168
        const h = el.offsetHeight || 34
        const px = Math.max(12, Math.min(window.innerWidth - w - 12, PROJECTED_UI_STATE.pillX - w * 0.5))
        const py = Math.max(58, Math.min(window.innerHeight - 66 - h, PROJECTED_UI_STATE.pillY - h))
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`
      }
      if (visible !== lastVisible) {
        el.classList.toggle('is-visible', visible)
        el.setAttribute('aria-hidden', visible ? 'false' : 'true')
        lastVisible = visible
      }
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(rafId)
      el.classList.remove('is-visible')
    }
  }, [hidden])

  return (
    <button
      ref={pillRef}
      type="button"
      className="floating-interact-pill"
      aria-hidden="true"
      onClick={(e) => {
        e.stopPropagation()
        triggerActiveTargetFKey()
      }}
    >
      <span className="floating-interact-inner">
        <kbd className="floating-interact-keycap">F</kbd>
        <span ref={labelRef} className="floating-interact-label" />
      </span>
    </button>
  )
}

/* ---------- Floating Container Info Card (CONTAINER_INFO glassmorphism) ---------- */
function ContainerInfoCard({ hidden }: { hidden: boolean }) {
  const containerCard = useStore((s) => s.containerCard)
  const setContainerCard = useStore((s) => s.setContainerCard)
  const cardRef = useRef<HTMLElement>(null)

  const active = Boolean(containerCard) && !hidden

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (!active) {
      el.classList.remove('is-visible')
      return
    }

    let rafId = 0
    const tick = () => {
      const w = el.offsetWidth || 276
      const h = el.offsetHeight || 132
      let px: number
      let py: number

      if (PROJECTED_UI_STATE.cardVisible) {
        const rightCandidate = PROJECTED_UI_STATE.cardX + 20
        const leftCandidate = PROJECTED_UI_STATE.cardX - w - 20
        const preferredX =
          rightCandidate + w <= window.innerWidth - 14 ? rightCandidate : leftCandidate
        px = Math.max(14, Math.min(window.innerWidth - w - 14, preferredX))
        py = Math.max(66, Math.min(window.innerHeight - h - 72, PROJECTED_UI_STATE.cardY - h * 0.5))
      } else {
        px = Math.max(14, window.innerWidth - w - 18)
        py = 74
      }

      el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`
      el.classList.add('is-visible')
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(rafId)
      el.classList.remove('is-visible')
    }
  }, [active, containerCard?.id])

  if (!containerCard || hidden) return null

  return (
    <aside
      ref={cardRef}
      className="container-info-card"
      role="dialog"
      aria-label={containerCard.title}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="container-info-card-inner">
        <div className="container-info-head">
          <div className="container-info-title-wrap">
            <span className="container-info-icon" aria-hidden="true">
              {containerCard.icon}
            </span>
            <h3 className="container-info-title">{containerCard.title}</h3>
          </div>
          <button
            type="button"
            className="container-info-close"
            onClick={() => setContainerCard(null)}
            aria-label="Đóng thông tin"
          >
            ×
          </button>
        </div>
        <p className="container-info-body">{containerCard.body}</p>
      </div>
    </aside>
  )
}

/* ---------- Avatar Overhead Intention Bubbles (Auto-Life) ---------- */
function AvatarIntentIcons({ hidden }: { hidden: boolean }) {
  const boyIntent = useStore((s) => s.autoIntent.boy)
  const girlIntent = useStore((s) => s.autoIntent.girl)
  const boyRef = useRef<HTMLDivElement>(null)
  const girlRef = useRef<HTMLDivElement>(null)

  const hasAny = !hidden && Boolean(boyIntent || girlIntent)

  useEffect(() => {
    const bEl = boyRef.current
    const gEl = girlRef.current
    if (!hasAny) {
      bEl?.classList.remove('is-visible')
      gEl?.classList.remove('is-visible')
      return
    }

    let rafId = 0
    const placeBubble = (
      el: HTMLDivElement | null,
      visible: boolean,
      sx: number,
      sy: number,
    ) => {
      if (!el) return
      if (!visible) {
        el.classList.remove('is-visible')
        return
      }
      const w = el.offsetWidth || 92
      const h = el.offsetHeight || 26
      const px = Math.max(10, Math.min(window.innerWidth - w - 10, sx - w * 0.5))
      const py = Math.max(54, Math.min(window.innerHeight - 66 - h, sy - h - 6))
      el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`
      el.classList.add('is-visible')
    }

    const tick = () => {
      placeBubble(
        bEl,
        Boolean(boyIntent) && PROJECTED_UI_STATE.boyIntentVisible,
        PROJECTED_UI_STATE.boyIntentX,
        PROJECTED_UI_STATE.boyIntentY,
      )
      placeBubble(
        gEl,
        Boolean(girlIntent) && PROJECTED_UI_STATE.girlIntentVisible,
        PROJECTED_UI_STATE.girlIntentX,
        PROJECTED_UI_STATE.girlIntentY,
      )
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(rafId)
      bEl?.classList.remove('is-visible')
      gEl?.classList.remove('is-visible')
    }
  }, [hasAny, boyIntent, girlIntent])

  if (!hasAny) return null

  return (
    <>
      {boyIntent && (
        <div ref={boyRef} className="avatar-intent-bubble" aria-hidden="true">
          <span className="avatar-intent-icon">{boyIntent.icon}</span>
          <span className="avatar-intent-text">{boyIntent.label}</span>
        </div>
      )}
      {girlIntent && (
        <div ref={girlRef} className="avatar-intent-bubble" aria-hidden="true">
          <span className="avatar-intent-icon">{girlIntent.icon}</span>
          <span className="avatar-intent-text">{girlIntent.label}</span>
        </div>
      )}
    </>
  )
}

/* ---------- Dải gợi ý & điều khiển GTA Camera ở mép dưới khi đang Vào nhà ('fp') ---------- */
type FpDistOption = {
  id: 'close' | 'medium' | 'far'
  label: string
}

const FP_DIST_OPTIONS: readonly FpDistOption[] = [
  { id: 'close', label: 'Gần' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'far', label: 'Toàn cảnh xa' },
]

type FpStoreShape = {
  fpDistPreset?: 'close' | 'medium' | 'far'
  setFpDistPreset?: (p: 'close' | 'medium' | 'far') => void
  fpPerspective?: 'eye' | 'third'
  toggleFpPerspective?: () => void
}

function GtaHudHint({ isPointerLocked }: { isPointerLocked: boolean }) {
  const fpDistPreset = useStore((s) => (s as typeof s & FpStoreShape).fpDistPreset ?? 'medium')
  const fpPerspective = useStore((s) => (s as typeof s & FpStoreShape).fpPerspective ?? 'third')

  const handleSelectDist = (preset: 'close' | 'medium' | 'far') => {
    const st = useStore.getState() as ReturnType<typeof useStore.getState> & FpStoreShape
    st.setFpDistPreset?.(preset)
  }

  const handleTogglePerspective = () => {
    const st = useStore.getState() as ReturnType<typeof useStore.getState> & FpStoreShape
    st.toggleFpPerspective?.()
  }

  return (
    <div
      className={`gta-hud-hint ${isPointerLocked ? 'is-locked' : 'is-unlocked'}`}
      role="region"
      aria-label="Điều khiển GTA Camera"
    >
      <div className="gta-hud-controls">
        {isPointerLocked && <span className="gta-lock-dot" aria-hidden="true" />}

        <div className="gta-dist-group" role="group" aria-label="Cự ly GTA Camera (Phím V)">
          <span className="gta-dist-kbd" title="Bấm phím V để chuyển nhanh 3 cự ly">
            V
          </span>
          {FP_DIST_OPTIONS.map((opt) => {
            const active = fpDistPreset === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                className={`gta-dist-btn ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => handleSelectDist(opt.id)}
                title={`Cự ly ${opt.label} (Phím V)`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className={`gta-persp-btn ${fpPerspective === 'third' ? 'is-third' : 'is-eye'}`}
          aria-pressed={fpPerspective === 'eye'}
          onClick={handleTogglePerspective}
          title={
            fpPerspective === 'third'
              ? 'Đang ở góc nhìn Sau lưng GTA · Bấm chuyển Tầm mắt'
              : 'Đang ở góc nhìn Tầm mắt · Bấm chuyển Sau lưng GTA'
          }
        >
          <span aria-hidden="true">{fpPerspective === 'third' ? '🎥' : '👁️'}</span>
          <span>{fpPerspective === 'third' ? 'Sau lưng' : 'Tầm mắt'}</span>
        </button>

        {!isPointerLocked && (
          <button
            type="button"
            className="gta-hint-exit-btn"
            onClick={() => {
              releaseCanvasPointerLock()
              useStore.getState().returnOverview()
            }}
            title="Quay lại góc nhìn Toàn cảnh"
          >
            <span aria-hidden="true">🏠</span>
            <span>Toàn cảnh</span>
          </button>
        )}
      </div>

      <div className="gta-hud-guide" role="status" aria-live="polite">
        <span>
          WASD / Click sàn để đi · Kéo chuột xoay 360° · Cuộn / V thu phóng · [F] Tương tác gần
        </span>
      </div>
    </div>
  )
}

/* ---------- Gợi ý thao tác nhỏ gọn ở cạnh dưới (Toàn cảnh), tự mờ dần sau tương tác đầu tiên ---------- */
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

/* ---------- Cụm Trái Trên: Tiêu đề + Trạng thái Vai ---------- */
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
            <span aria-hidden="true">{userRole === 'boy' ? '👦' : '👧'}</span>
            <span>{userRole === 'boy' ? 'Khoa' : 'Bạn Gái'}</span>
          </span>

          <button
            type="button"
            className={`auto-toggle-chip ${isAuto ? 'on' : ''}`}
            aria-pressed={isAuto}
            onClick={() =>
              userRole === 'boy'
                ? useStore.getState().toggleBoyAutoLife()
                : useStore.getState().toggleGirlAutoLife()
            }
            title={isAuto ? 'Tự động sinh hoạt đang bật' : 'Bật tự động sinh hoạt cho nhân vật'}
          >
            <span className={`pulse-dot ${isAuto ? 'on' : ''}`} aria-hidden="true" />
            <span>Auto</span>
          </button>

          <button
            type="button"
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
  const mode = useStore((s) => s.mode)
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
    <div
      className={`context-dock card ${mode === 'fp' ? 'in-fp' : ''}`}
      role="region"
      aria-label="Điều khiển hoạt động hiện tại"
    >
      <span className="dock-status">
        <span className="dock-status-dot" aria-hidden="true" />
        <span>{activityPhase === 'walking' ? '🚶 Đang đi tới...' : STATIONS[activity].label}</span>
      </span>

      <span className="dock-sep context-sep" aria-hidden="true" />

      {/* --- TẦNG 1: HOẠT ĐỘNG CỦA KHOA --- */}
      {activity === 'tv' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().cycleTvChannel()}>
            📺 Kênh: {TV_CHANNELS[tvChannel].name}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleTv()}>
            {tvOn ? '🔴 Tắt TV' : '🟢 Bật TV'}
          </button>
        </>
      )}

      {activity === 'pc' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().cyclePcState()}>
            🖥️ Màn hình: {pcState === 'on' ? 'Code' : pcState === 'rgb' ? 'Ấm 3000K' : 'Tắt'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().spinChair()}>
            🔄 Xoay ghế
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleFloor1DeskLamp()}>
            {floor1DeskLampOn ? '💡 Tắt đèn bàn' : '💡 Bật đèn bàn'}
          </button>
        </>
      )}

      {activity === 'sleep' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleDarkMode()}>
            {darkMode ? '☀️ Nắng ấm' : '🌙 Đêm khuya'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleFloor1BedLamp()}>
            {floor1BedLampOn ? '💡 Tắt đèn ngủ' : '💡 Bật đèn ngủ'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleFloor1HeadboardLed()}>
            {floor1HeadboardLedOn ? '✨ Tắt LED đầu giường' : '✨ Bật LED đầu giường'}
          </button>
        </>
      )}

      {activity === 'darts' && (
        <button type="button" className="dock-btn" onClick={() => useStore.getState().triggerDartFlight()}>
          🎯 Phóng thêm phi tiêu
        </button>
      )}

      {activity === 'drink' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().setDrinkType('tea')}>
            🌼 Pha trà hoa cúc mật ong
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().setDrinkType('coffee')}>
            ☕ Pha cà phê sữa nóng
          </button>
        </>
      )}

      {activity === 'piano' && (
        <button type="button" className="dock-btn primary" onClick={() => useStore.getState().setPianoModalOpen(true)}>
          🎹 Mở bàn phím Piano
        </button>
      )}

      {activity === 'pet' && (
        <button
          type="button"
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
        <button type="button" className="dock-btn" onClick={() => useStore.getState().nextBookPage()}>
          📖 Trang {useStore.getState().readBookPage} · Lật trang tiếp
        </button>
      )}

      {activity === 'bath' && (
        <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleBathBubbles()}>
          {useStore.getState().bathBubbles ? '🫧 Tắt bọt xà phòng' : '🫧 Bật bọt xà phòng'}
        </button>
      )}

      {activity === 'wash' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().triggerSinkWater()}>
            💧 Xả nước bồn rửa
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleBathMirrorLight()}>
            {bathMirrorLightOn ? '✨ Tắt đèn gương' : '✨ Bật đèn gương'}
          </button>
        </>
      )}

      {activity === 'laundry' && (
        <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleLaundry()}>
          {useStore.getState().laundryRunning ? '🧺 Tắt máy giặt' : '🧺 Bật máy giặt'}
        </button>
      )}

      {/* --- TẦNG 2: HOẠT ĐỘNG CỦA BẠN GÁI --- */}
      {activity === 'girl_sleep' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleDarkMode()}>
            {darkMode ? '☀️ Nắng ấm' : '🌙 Đêm khuya'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleGirlLamp()}>
            {girlLampOn ? '💡 Tắt đèn ngủ' : '💡 Bật đèn ngủ'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleFloor2ArchLight()}>
            {floor2ArchLightOn ? '✨ Tắt đèn vòm' : '✨ Bật đèn vòm'}
          </button>
        </>
      )}

      {activity === 'girl_pc' && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().cycleGirlPcState()}>
            🖥️ Màn hình: {girlPcState === 'on' ? 'UI Design' : girlPcState === 'rgb' ? 'Vẽ 3D' : 'Tắt'}
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().spinGirlChair()}>
            🔄 Xoay ghế
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleGirlShelfLed()}>
            {girlShelfLedOn ? '✨ Tắt LED kệ' : '✨ Bật LED kệ'}
          </button>
        </>
      )}

      {activity === 'girl_vanity' && (
        <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleGirlVanityLight()}>
          {girlVanityLightOn ? '🪞 Tắt đèn gương Halo' : '🪞 Bật đèn gương Halo'}
        </button>
      )}

      {(activity === 'girl_lounge' || activity === 'girl_nook') && (
        <>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().nextGirlBookPage()}>
            📖 Trang {girlBookPage} · Lật trang
          </button>
          <button type="button" className="dock-btn" onClick={() => useStore.getState().toggleFloor2ReadingLamp()}>
            {floor2ReadingLampOn ? '💡 Tắt đèn đọc sách' : '💡 Bật đèn đọc sách'}
          </button>
        </>
      )}

      <button type="button" className="dock-btn primary" onClick={() => useStore.getState().returnOverview()}>
        {activity === 'sleep' || activity === 'girl_sleep'
          ? '☀️ Thức dậy'
          : activity === 'bath'
            ? '🛁 Rời bồn tắm'
            : '🚶 Đứng dậy'}
      </button>
    </div>
  )
}

/* ---------- Cụm Phải Trên: 1 thanh Glass Dock tối giản gồm đúng 3 phần tử (Toàn cảnh | Tầm mắt + Dark Mode) ---------- */
function TopRight() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const returnOverview = useStore((s) => s.returnOverview)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)

  const isOrbit = mode === 'orbit'
  const isFp = mode === 'fp'

  return (
    <div className="hud-top-right">
      <div className="glass-dock" role="toolbar" aria-label="Điều khiển góc nhìn và chế độ sáng tối">
        <div className="view-switcher" role="group" aria-label="Chọn góc nhìn">
          <button
            type="button"
            className={`dock-pill-btn segment-btn ${isOrbit ? 'active' : ''}`}
            onClick={() => {
              releaseCanvasPointerLock()
              returnOverview()
            }}
            aria-pressed={isOrbit}
            data-tooltip="Góc nhìn Toàn cảnh biệt thự"
            title="Góc nhìn Toàn cảnh biệt thự"
          >
            <span aria-hidden="true">🏠</span>
            <span>Toàn cảnh</span>
          </button>

          <button
            type="button"
            className={`dock-pill-btn segment-btn ${isFp ? 'active' : ''}`}
            onClick={() => {
              setMode('fp')
            }}
            aria-pressed={isFp}
            data-tooltip="Góc nhìn Tầm mắt GTA · Kéo chuột xoay 360°"
            title="Góc nhìn Tầm mắt GTA · Kéo chuột xoay 360°"
          >
            <span aria-hidden="true">👁️</span>
            <span>Tầm mắt</span>
          </button>
        </div>

        <span className="dock-sep" aria-hidden="true" />

        <button
          type="button"
          className={`dock-pill-btn theme-toggle-btn ${darkMode ? 'is-night' : 'is-day'}`}
          onClick={toggleDarkMode}
          aria-pressed={darkMode}
          data-tooltip={darkMode ? 'Đang ở Đêm khuya · Bấm chuyển Nắng ấm' : 'Đang ở Nắng ấm · Bấm chuyển Đêm khuya'}
          title={darkMode ? 'Đang ở Đêm khuya · Bấm chuyển Nắng ấm' : 'Đang ở Nắng ấm · Bấm chuyển Đêm khuya'}
          aria-label={darkMode ? 'Đêm khuya · Bấm chuyển sang Nắng ấm' : 'Nắng ấm · Bấm chuyển sang Đêm khuya'}
        >
          <span aria-hidden="true">{darkMode ? '🌙' : '☀️'}</span>
          <span>{darkMode ? 'Đêm khuya' : 'Nắng ấm'}</span>
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
    <div className="card side-modal" role="dialog" aria-modal="true" aria-labelledby="boy-wardrobe-title">
      <button type="button" className="icon-btn close" onClick={handleClose} aria-label="Đóng tủ đồ của Khoa">
        {I.close}
      </button>
      <h2 id="boy-wardrobe-title">👕 Trang phục của Khoa</h2>
      <div className="outfit-list">
        {OUTFITS.map((o) => {
          const selected = outfitId === o.id
          return (
            <button
              type="button"
              key={o.id}
              aria-pressed={selected}
              className={`outfit-item ${selected ? 'active' : ''}`}
              onClick={() => useStore.getState().setOutfitId(o.id)}
            >
              <span className="swatch" aria-hidden="true">
                <i style={{ background: o.shirt }} />
                <i style={{ background: o.pants }} />
              </span>
              <span className="outfit-name">{o.name}</span>
              {selected && <span className="outfit-check" aria-hidden="true">✓</span>}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="dock-btn primary modal-done-btn"
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
    <div className="card side-modal" role="dialog" aria-modal="true" aria-labelledby="girl-wardrobe-title">
      <button type="button" className="icon-btn close" onClick={handleClose} aria-label="Đóng tủ đồ Bạn Gái">
        {I.close}
      </button>
      <h2 id="girl-wardrobe-title">👗 Trang phục Bạn Gái</h2>
      <div className="outfit-list">
        {GIRL_OUTFITS.map((o) => {
          const selected = girlOutfitId === o.id
          return (
            <button
              type="button"
              key={o.id}
              aria-pressed={selected}
              className={`outfit-item ${selected ? 'active' : ''}`}
              onClick={() => useStore.getState().setGirlOutfitId(o.id)}
            >
              <span className="swatch" aria-hidden="true">
                <i style={{ background: o.jacket }} />
                <i style={{ background: o.skirt }} />
              </span>
              <span className="outfit-name">{o.name}</span>
              {selected && <span className="outfit-check" aria-hidden="true">✓</span>}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="dock-btn primary modal-done-btn"
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
    <div className="card side-modal" role="dialog" aria-modal="true" aria-labelledby="photo-modal-title">
      <button type="button" className="icon-btn close" onClick={close} aria-label="Đóng khung ảnh">
        {I.close}
      </button>
      <img src={item.src} alt={item.title} className="photo-preview" />
      <h2 id="photo-modal-title">{item.title}</h2>
      <div className="modal-actions">
        <button type="button" className="pill-btn" onClick={() => switchPhoto(-1)}>
          ← Trước
        </button>
        <button type="button" className="pill-btn" onClick={() => switchPhoto(1)}>
          Tiếp →
        </button>
      </div>
    </div>
  )
}
