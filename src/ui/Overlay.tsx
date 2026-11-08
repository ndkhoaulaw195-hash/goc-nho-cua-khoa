import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { LoginLobby } from './LoginLobby'
import {
  FLOOR1_VIEW,
  FLOOR2_VIEW,
  GIRL_OUTFITS,
  OUTFITS,
  SITE,
  STATIONS,
  TV_CHANNELS,
  WALL_PHOTOS,
} from '../data/config'

const I = {
  music: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  mute: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <path d="M2 2l20 20" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
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
  const mode = useStore((s) => s.mode)
  const boyAutoLife = useStore((s) => s.boyAutoLife)
  const girlAutoLife = useStore((s) => s.girlAutoLife)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(() => useStore.setState({ toastMessage: null }), 2200)
    return () => clearTimeout(t)
  }, [toastMessage])

  return (
    <div className={`overlay ${darkMode ? 'is-dark' : ''}`}>
      <div className="top-left">
        <div className="card title-card">
          <div className="eyebrow">{SITE.eyebrow}</div>
          <h1>{SITE.title}</h1>
        </div>
      </div>

      <TopRight boyAutoLife={boyAutoLife} girlAutoLife={girlAutoLife} />
      <ContextualDock />
      <WardrobeModal />
      <GirlWardrobeModal />
      <PhotoModal />
      <LoginLobby />

      {mode === 'fp' && <div className="fp-crosshair" />}
      {toastMessage && <div className="toast">{toastMessage}</div>}
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
  const lampOn = useStore((s) => s.lampOn)
  const girlPcState = useStore((s) => s.girlPcState)
  const girlLampOn = useStore((s) => s.girlLampOn)
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
            🖥️ Màn hình: {pcState === 'on' ? 'Code' : pcState === 'rgb' ? 'RGB' : 'Tắt'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().spinChair()}>
            🔄 Xoay ghế
          </button>
        </>
      )}

      {activity === 'sleep' && (
        <>
          <button className="dock-btn" onClick={() => useStore.getState().toggleDarkMode()}>
            {darkMode ? '☀️ Ban ngày' : '🌙 Ban đêm'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleLamp()}>
            {lampOn ? '💡 Tắt đèn cây' : '💡 Bật đèn cây'}
          </button>
        </>
      )}

      {activity === 'darts' && (
        <button className="dock-btn" onClick={() => useStore.getState().triggerDartFlight()}>
          🎯 Phóng thêm phi tiêu
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
        <button className="dock-btn" onClick={() => useStore.getState().triggerSinkWater()}>
          💧 Xả nước bồn rửa
        </button>
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
            {darkMode ? '☀️ Ban ngày' : '🌙 Ban đêm'}
          </button>
          <button className="dock-btn" onClick={() => useStore.getState().toggleGirlLamp()}>
            {girlLampOn ? '💡 Tắt đèn ngủ' : '💡 Bật đèn ngủ'}
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
        <button className="dock-btn" onClick={() => useStore.getState().nextGirlBookPage()}>
          📖 Trang {girlBookPage} · Lật trang
        </button>
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

/* ---------- Thanh Glassmorphism Dock hiện đại: Nhân vật + Auto, Nhạc, Dark Mode, Camera, Góc nhìn 1 ---------- */
function TopRight({
  boyAutoLife,
  girlAutoLife,
}: {
  boyAutoLife: boolean
  girlAutoLife: boolean
}) {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)
  const viewPreset = useStore((s) => s.viewPreset)
  const activity = useStore((s) => s.activity)
  const userRole = useStore((s) => s.userRole)
  const logout = useStore((s) => s.logout)

  const isFloor1 = mode === 'orbit' && viewPreset === 'floor1' && activity === 'idle'
  const isFloor2 = mode === 'orbit' && viewPreset === 'floor2' && activity === 'idle'
  const isOverview = mode === 'orbit' && viewPreset === 'overview' && activity === 'idle'

  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

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

  return (
    <div className="top-right">
      <div className="glass-dock">
        {/* Vai nhân vật của người chơi (Mỗi người chỉ vào vai 1 người, có nút Đổi vai) */}
        {userRole ? (
          <div className="user-role-badge">
            <span className="role-current-tag">
              {userRole === 'boy' ? '👦 Khoa' : '👧 Bạn Gái'}
            </span>
            <button
              className={`auto-toggle-chip ${(userRole === 'boy' ? boyAutoLife : girlAutoLife) ? 'on' : ''}`}
              onClick={() =>
                userRole === 'boy'
                  ? useStore.getState().toggleBoyAutoLife()
                  : useStore.getState().toggleGirlAutoLife()
              }
            >
              <span className={`pulse-dot ${(userRole === 'boy' ? boyAutoLife : girlAutoLife) ? 'on' : ''}`} />
              <span>Auto</span>
            </button>
            <button
              className="role-logout-btn"
              onClick={logout}
            >
              Đổi vai
            </button>
          </div>
        ) : null}

        <span className="dock-sep" />

        <button
          className={`dock-icon-btn ${playing ? 'active' : ''}`}
          onClick={toggleMusic}
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
          className={`dock-icon-btn ${darkMode ? 'active' : ''}`}
          onClick={toggleDarkMode}
        >
          {darkMode ? I.sun : I.moon}
        </button>

        <span className="dock-sep" />

        {mode === 'orbit' && (
          <div className="view-switcher">
            <button
              className={`dock-pill-btn ${isOverview ? 'active' : ''}`}
              onClick={() => useStore.getState().returnOverview()}
            >
              🏠 Toàn cảnh
            </button>
            <button
              className={`dock-pill-btn ${isFloor1 ? 'active' : ''}`}
              onClick={() => {
                useStore.getState().setFocus(FLOOR1_VIEW, 'floor1')
                useStore.getState().notify('👦 Tầng 1 – Khoa')
              }}
            >
              👦 Tầng 1
            </button>
            <button
              className={`dock-pill-btn ${isFloor2 ? 'active' : ''}`}
              onClick={() => {
                useStore.getState().setFocus(FLOOR2_VIEW, 'floor2')
                useStore.getState().notify('👧 Tầng 2 – Bạn Gái')
              }}
            >
              👧 Tầng 2
            </button>
          </div>
        )}

        <button
          className={`dock-pill-btn fp-toggle ${mode === 'fp' ? 'active' : ''}`}
          onClick={() => setMode(mode === 'fp' ? 'orbit' : 'fp')}
        >
          {I.eye} {mode === 'fp' ? 'Thoát góc nhìn 1' : 'Góc nhìn thứ nhất'}
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
