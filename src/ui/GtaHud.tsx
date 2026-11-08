import { useEffect } from 'react'
import { useStore, type GtaWeapon } from '../store'

export function GtaHud() {
  const isDriving = useStore((s) => s.isDrivingVacuum)
  const stopDrivingVacuum = useStore((s) => s.stopDrivingVacuum)
  const vacuumSpeed = useStore((s) => s.vacuumSpeed)
  const wantedStars = useStore((s) => s.wantedStars)
  const isWasted = useStore((s) => s.isWasted)
  const wastedReason = useStore((s) => s.wastedReason)
  const weaponWheelOpen = useStore((s) => s.weaponWheelOpen)
  const setWeaponWheelOpen = useStore((s) => s.setWeaponWheelOpen)
  const currentWeapon = useStore((s) => s.currentWeapon)
  const setWeapon = useStore((s) => s.setWeapon)
  const clearWanted = useStore((s) => s.clearWanted)

  // Lắng nghe phím Tab để bật/tắt Weapon Wheel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.code === 'Tab') {
        e.preventDefault()
        setWeaponWheelOpen(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault()
        setWeaponWheelOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [setWeaponWheelOpen])

  const weapons: { id: GtaWeapon; name: string; icon: string; desc: string }[] = [
    { id: 'unarmed', name: 'Tay không', icon: '👊', desc: 'Đấm trêu vui nhộn' },
    { id: 'water_gun', name: 'Súng bắn nước', icon: '💦', desc: 'Bắn xối xả né tránh' },
    { id: 'pillow', name: 'Gối chiến đấu', icon: '🥊', desc: 'Đập bôm bốp lông vũ văng' },
    { id: 'nerf', name: 'Súng đạn xốp Nerf', icon: '🎯', desc: 'Bắn đạn dính tường' },
  ]

  // Tính tốc độ hiển thị km/h
  const speedKmh = Math.round(Math.abs(vacuumSpeed) * 3.6)

  return (
    <>
      {/* 1. SAO TRUY NÃ GTA (WANTED STARS) Ở GÓC TRÊN */}
      <div className={`gta-wanted-container ${wantedStars > 0 ? 'active' : ''}`}>
        <div className="wanted-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star-icon ${star <= wantedStars ? 'flashing-star' : 'empty-star'}`}
            >
              ★
            </span>
          ))}
        </div>
        {wantedStars >= 3 && (
          <div className="police-chase-tag animate-pulse">
            🚨 POLICE CHASE · CẢNH SÁT RƯỢT ĐUỔI!
          </div>
        )}
        {wantedStars > 0 && (
          <button className="bribe-police-btn" onClick={clearWanted} title="Xóa tội">
            🕊️ Đầu hàng / Xóa sao
          </button>
        )}
      </div>

      {/* 2. NÚT CHỌN NHANH VŨ KHÍ GÓC MÀN HÌNH */}
      <div className="gta-quick-action-bar">
        <button
          className="weapon-badge-btn"
          onClick={() => setWeaponWheelOpen(!weaponWheelOpen)}
          title="Bấm hoặc Giữ phím TAB để mở Bánh Xe Vũ Khí"
        >
          <span className="w-icon">
            {weapons.find((w) => w.id === currentWeapon)?.icon || '👊'}
          </span>
          <span className="w-name">
            {weapons.find((w) => w.id === currentWeapon)?.name || 'Tay không'}
          </span>
          <span className="w-hint">[TAB]</span>
        </button>

        {!isDriving && (
          <button
            className="drive-quick-btn"
            onClick={() => useStore.getState().startDrivingVacuum()}
            title="Lên lái xe Robot Hút Bụi"
          >
            🏎️ Lên xe lái [WASD]
          </button>
        )}
      </div>

      {/* 3. GTA WEAPON WHEEL (BÁNH XE VŨ KHÍ TRÒN XOAY) */}
      {weaponWheelOpen && (
        <div className="weapon-wheel-overlay" onClick={() => setWeaponWheelOpen(false)}>
          <div className="weapon-wheel-card" onClick={(e) => e.stopPropagation()}>
            <div className="wheel-title">🔫 KHO VŨ KHÍ GTA ROOM</div>
            <div className="wheel-grid">
              {weapons.map((w) => (
                <button
                  key={w.id}
                  className={`wheel-slot ${currentWeapon === w.id ? 'active' : ''}`}
                  onClick={() => setWeapon(w.id)}
                >
                  <span className="slot-icon">{w.icon}</span>
                  <span className="slot-name">{w.name}</span>
                  <span className="slot-desc">{w.desc}</span>
                </button>
              ))}
            </div>
            <p className="wheel-tip">Tip: Click chuột trái để tấn công trêu chọc và tăng sao truy nã!</p>
          </div>
        </div>
      )}

      {/* 4. SPEEDOMETER & NITRO (KHI LÁI XE ROBOT) */}
      {isDriving && (
        <div className="gta-speedometer-hud">
          <div className="speed-dial">
            <span className="speed-number">{speedKmh}</span>
            <span className="speed-unit">KM/H</span>
          </div>

          <div className="nitro-bar-wrap">
            <div className="nitro-label">NITRO [SHIFT]</div>
            <div className="nitro-bar">
              <div className="nitro-fill" />
            </div>
          </div>

          <div className="drive-controls-guide">
            <span><b>W/S</b>: Ga / Phanh</span>
            <span><b>A/D</b>: Lái</span>
            <span><b>Space</b>: Drift</span>
            <button className="exit-vehicle-btn" onClick={stopDrivingVacuum}>
              [F] Xuống xe
            </button>
          </div>
        </div>
      )}

      {/* 5. MÀN HÌNH WASTED / BUSTED KINH ĐIỂN CỦA GTA */}
      {isWasted && (
        <div className="gta-wasted-screen">
          <div className="wasted-banner">
            <h1 className="wasted-text">{wastedReason}</h1>
            <p className="wasted-sub">ĐANG HỒI SINH TẠI GÓC NHÀ...</p>
          </div>
        </div>
      )}
    </>
  )
}
