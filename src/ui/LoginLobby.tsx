import { useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  getPresenceSnapshot,
  subscribePresence,
  type PresenceState,
  type RoleType,
} from '../presence'

export function LoginLobby() {
  const userRole = useStore((s) => s.userRole)
  const setUserRole = useStore((s) => s.setUserRole)
  const darkMode = useStore((s) => s.darkMode)
  const toggleDarkMode = useStore((s) => s.toggleDarkMode)

  const [presence, setPresence] = useState<PresenceState>(getPresenceSnapshot())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribePresence((state) => {
      setPresence(state)
    })
    return unsub
  }, [])

  if (userRole) return null

  const handleSelectRole = (role: RoleType) => {
    setErrorMsg(null)
    const occ = presence[role]
    if (occ.occupied && !occ.isSelf) {
      setErrorMsg(`⚠️ Vai ${role === 'boy' ? 'Khoa' : 'Bạn Gái'} đã có người chọn! Vui lòng chọn vai còn lại.`)
      return
    }

    const success = setUserRole(role)
    if (!success) {
      setErrorMsg(`⚠️ Vai ${role === 'boy' ? 'Khoa' : 'Bạn Gái'} hiện đang có người sử dụng.`)
    }
  }

  const boyOccupied = presence.boy.occupied && !presence.boy.isSelf
  const girlOccupied = presence.girl.occupied && !presence.girl.isSelf

  return (
    <div className="login-lobby-backdrop" role="dialog" aria-modal="true" aria-labelledby="lobby-title">
      <div className="login-lobby-card">
        <button
          type="button"
          className="lobby-theme-toggle"
          onClick={toggleDarkMode}
          title={darkMode ? 'Chuyển sang giao diện Ban ngày' : 'Chuyển sang giao diện Ban đêm'}
          aria-label="Đổi giao diện Sáng/Tối"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        <div className="login-badge">Chào mừng về nhà ✨</div>
        <h1 id="lobby-title" className="login-title">
          Góc Nhỏ Của Khoa
        </h1>
        <p className="login-subtitle">
          Chọn nhân vật của riêng bạn để cùng bước vào không gian 3D ấm cúng và đồng bộ thời gian thực
        </p>

        {errorMsg && <div className="login-error-banner">{errorMsg}</div>}

        <div className="role-cards-grid">
          {/* Card 1: Khoa */}
          <div
            role="button"
            tabIndex={boyOccupied ? -1 : 0}
            aria-disabled={boyOccupied}
            onClick={() => !boyOccupied && handleSelectRole('boy')}
            onKeyDown={(e) => {
              if (!boyOccupied && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleSelectRole('boy')
              }
            }}
            className={`role-select-box boy-box ${boyOccupied ? 'is-occupied' : 'is-available'}`}
          >
            <div className="role-avatar-circle boy-avatar">👦</div>
            <div className="role-main-title">Khoa</div>
            <div className="role-sub-title">Vai Nam · Tầng 1</div>

            <div className="role-feature-tags">
              <span className="role-feature-tag">🖥️ PC & Game</span>
              <span className="role-feature-tag">🛋️ Phòng khách</span>
              <span className="role-feature-tag">🐶 Cún cưng</span>
            </div>

            {boyOccupied ? (
              <span className="status-pill occupied">
                <span className="status-dot red" />
                Đã có người vào vai
              </span>
            ) : (
              <span className="status-pill free-boy">
                <span className="status-dot green" />
                Sẵn sàng · Có thể chọn
              </span>
            )}

            <button
              type="button"
              disabled={boyOccupied}
              className="role-enter-btn boy-enter-btn"
            >
              {boyOccupied ? '🚫 Đã có người vào vai' : 'Vào vai Khoa →'}
            </button>
          </div>

          {/* Card 2: Bạn Gái */}
          <div
            role="button"
            tabIndex={girlOccupied ? -1 : 0}
            aria-disabled={girlOccupied}
            onClick={() => !girlOccupied && handleSelectRole('girl')}
            onKeyDown={(e) => {
              if (!girlOccupied && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleSelectRole('girl')
              }
            }}
            className={`role-select-box girl-box ${girlOccupied ? 'is-occupied' : 'is-available'}`}
          >
            <div className="role-avatar-circle girl-avatar">👧</div>
            <div className="role-main-title">Bạn Gái</div>
            <div className="role-sub-title">Vai Nữ · Tầng 2</div>

            <div className="role-feature-tags">
              <span className="role-feature-tag">🎹 Đàn Piano</span>
              <span className="role-feature-tag">💄 Bàn trang điểm</span>
              <span className="role-feature-tag">🎨 Góc nghệ thuật</span>
            </div>

            {girlOccupied ? (
              <span className="status-pill occupied">
                <span className="status-dot red" />
                Đã có người vào vai
              </span>
            ) : (
              <span className="status-pill free-girl">
                <span className="status-dot pink" />
                Sẵn sàng · Có thể chọn
              </span>
            )}

            <button
              type="button"
              disabled={girlOccupied}
              className="role-enter-btn girl-enter-btn"
            >
              {girlOccupied ? '🚫 Đã có người vào vai' : 'Vào vai Bạn Gái →'}
            </button>
          </div>
        </div>

        <div className="lobby-footer-note">
          💡 Mỗi người điều khiển 1 nhân vật riêng biệt · Bấm <strong>"Đổi vai"</strong> ở góc trên bất kỳ lúc nào để chuyển đổi
        </div>
      </div>
    </div>
  )
}
