import { useState } from 'react'
import { useStore } from '../store'

export function LoginLobby() {
  const userRole = useStore((s) => s.userRole)
  const setUserRole = useStore((s) => s.setUserRole)

  const [username, setUsername] = useState<'khoa' | 'bangai'>('khoa')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (userRole) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Hệ thống xác thực 2 tài khoản chuẩn xác cho Khoa và Bạn Gái
    if (username === 'khoa') {
      if (password.trim() === '123' || password.trim() === 'khoa' || password.trim() === '') {
        setUserRole('boy')
      } else {
        setError('Mật khẩu không đúng cho tài khoản Khoa (Mặc định: 123 hoặc để trống)')
      }
    } else if (username === 'bangai') {
      if (password.trim() === '123' || password.trim() === 'bangai' || password.trim() === '') {
        setUserRole('girl')
      } else {
        setError('Mật khẩu không đúng cho tài khoản Bạn Gái (Mặc định: 123 hoặc để trống)')
      }
    }
  }

  return (
    <div className="login-lobby-backdrop">
      <div className="login-lobby-card">
        <div className="login-header">
          <span className="login-badge">KHOA'S & HER LITTLE CORNER</span>
          <h1 className="login-title">Đăng Nhập Tài Khoản</h1>
          <p className="login-subtitle">
            Hệ thống chỉ cấp quyền cho 2 tài khoản duy nhất: Khoa (Nam) và Bạn Gái (Nữ).
          </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {/* Lựa chọn tài khoản đăng nhập */}
          <div className="account-select-tabs">
            <button
              type="button"
              className={`acc-tab boy-tab ${username === 'khoa' ? 'active' : ''}`}
              onClick={() => {
                setUsername('khoa')
                setError('')
              }}
            >
              <span className="acc-avatar">👦</span>
              <div className="acc-meta">
                <span className="acc-name">Khoa</span>
                <span className="acc-role">Tài khoản Nam</span>
              </div>
            </button>

            <button
              type="button"
              className={`acc-tab girl-tab ${username === 'bangai' ? 'active' : ''}`}
              onClick={() => {
                setUsername('bangai')
                setError('')
              }}
            >
              <span className="acc-avatar">👧</span>
              <div className="acc-meta">
                <span className="acc-name">Bạn Gái</span>
                <span className="acc-role">Tài khoản Nữ</span>
              </div>
            </button>
          </div>

          <div className="input-field-group">
            <label className="input-label">Mật khẩu đăng nhập</label>
            <input
              type="password"
              className="login-input"
              placeholder={username === 'khoa' ? 'Nhập mật khẩu (mặc định: 123)' : 'Nhập mật khẩu (mặc định: 123)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          <button type="submit" className={`login-submit-btn ${username === 'khoa' ? 'boy-submit' : 'girl-submit'}`}>
            Đăng nhập vào vai {username === 'khoa' ? 'Khoa (Nam)' : 'Bạn Gái (Nữ)'} →
          </button>
        </form>

        <div className="login-footer-note">
          🔒 Mỗi người dùng chỉ đăng nhập vào 1 nhân vật duy nhất để điều khiển.
        </div>
      </div>
    </div>
  )
}
