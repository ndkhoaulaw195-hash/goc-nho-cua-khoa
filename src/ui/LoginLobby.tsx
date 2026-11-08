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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.78) 0%, rgba(2, 6, 23, 0.94) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '32px',
          padding: '40px 36px 32px',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
          textAlign: 'center',
          color: '#0f172a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Badge */}
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#d97706',
              background: '#fef3c7',
              padding: '5px 16px',
              borderRadius: '999px',
              textTransform: 'uppercase',
            }}
          >
            Chào mừng về nhà ✨
          </span>
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: '6px 0 6px',
            color: '#0f172a',
          }}
        >
          Sảnh Chọn Nhân Vật
        </h1>
        <p
          style={{
            fontSize: '14.5px',
            color: '#64748b',
            margin: '0 0 28px',
            fontWeight: 500,
          }}
        >
          Mỗi người chọn một nhân vật riêng để cùng trải nghiệm căn biệt thự 3D
        </p>

        {errorMsg && (
          <div
            style={{
              fontSize: '13.5px',
              color: '#dc2626',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              padding: '11px 16px',
              borderRadius: '14px',
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* 2 Character Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Khoa (Nam) */}
          <div
            onClick={() => !boyOccupied && handleSelectRole('boy')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '28px 22px 24px',
              borderRadius: '24px',
              background: boyOccupied
                ? '#f8fafc'
                : 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
              border: boyOccupied ? '2px dashed #cbd5e1' : '2px solid #86efac',
              cursor: boyOccupied ? 'not-allowed' : 'pointer',
              opacity: boyOccupied ? 0.6 : 1,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              boxShadow: boyOccupied
                ? 'none'
                : '0 12px 28px -6px rgba(34, 197, 94, 0.22)',
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                background: boyOccupied
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                boxShadow: boyOccupied
                  ? 'none'
                  : '0 8px 18px rgba(34, 197, 94, 0.25)',
                marginBottom: '14px',
                border: '3px solid #ffffff',
              }}
            >
              👦
            </div>

            <div
              style={{
                fontSize: '21px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '3px',
              }}
            >
              Khoa
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              Vai Nam · Tầng 1 (Làm việc & Khách)
            </div>

            {/* Status Pill */}
            <div style={{ marginBottom: '18px' }}>
              {boyOccupied ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '999px',
                    color: '#b91c1c',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                  />
                  Đã có người vào vai
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '999px',
                    color: '#15803d',
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 8px #22c55e',
                    }}
                  />
                  Đang trống · Có thể chọn
                </span>
              )}
            </div>

            {/* Enter Button */}
            <button
              type="button"
              disabled={boyOccupied}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#ffffff',
                border: 'none',
                cursor: boyOccupied ? 'not-allowed' : 'pointer',
                background: boyOccupied
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: boyOccupied
                  ? 'none'
                  : '0 8px 20px rgba(22, 163, 74, 0.38)',
                transition: 'all 0.18s ease',
              }}
            >
              {boyOccupied ? '🚫 Đã có người vào vai' : 'Vào vai Khoa →'}
            </button>
          </div>

          {/* Card 2: Bạn Gái (Nữ) */}
          <div
            onClick={() => !girlOccupied && handleSelectRole('girl')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '28px 22px 24px',
              borderRadius: '24px',
              background: girlOccupied
                ? '#f8fafc'
                : 'linear-gradient(180deg, #fff1f2 0%, #ffffff 100%)',
              border: girlOccupied ? '2px dashed #cbd5e1' : '2px solid #fca5a5',
              cursor: girlOccupied ? 'not-allowed' : 'pointer',
              opacity: girlOccupied ? 0.6 : 1,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              boxShadow: girlOccupied
                ? 'none'
                : '0 12px 28px -6px rgba(244, 63, 94, 0.22)',
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                background: girlOccupied
                  ? '#e2e8f0'
                  : 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
                boxShadow: girlOccupied
                  ? 'none'
                  : '0 8px 18px rgba(244, 63, 94, 0.25)',
                marginBottom: '14px',
                border: '3px solid #ffffff',
              }}
            >
              👧
            </div>

            <div
              style={{
                fontSize: '21px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '3px',
              }}
            >
              Bạn Gái
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 600,
                marginBottom: '16px',
              }}
            >
              Vai Nữ · Tầng 2 (Nghệ thuật & Ngủ)
            </div>

            {/* Status Pill */}
            <div style={{ marginBottom: '18px' }}>
              {girlOccupied ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '999px',
                    color: '#b91c1c',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                    }}
                  />
                  Đã có người vào vai
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '999px',
                    color: '#e11d48',
                    background: '#ffe4e6',
                    border: '1px solid #fca5a5',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f43f5e',
                      boxShadow: '0 0 8px #f43f5e',
                    }}
                  />
                  Đang trống · Có thể chọn
                </span>
              )}
            </div>

            {/* Enter Button */}
            <button
              type="button"
              disabled={girlOccupied}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#ffffff',
                border: 'none',
                cursor: girlOccupied ? 'not-allowed' : 'pointer',
                background: girlOccupied
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                boxShadow: girlOccupied
                  ? 'none'
                  : '0 8px 20px rgba(225, 29, 72, 0.38)',
                transition: 'all 0.18s ease',
              }}
            >
              {girlOccupied ? '🚫 Đã có người vào vai' : 'Vào vai Bạn Gái →'}
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, letterSpacing: '-0.01em' }}>
          💡 Mỗi người điều khiển 1 nhân vật riêng biệt · Bấm nút "Đổi vai" ở thanh trên bất kỳ lúc nào để chuyển vai
        </div>
      </div>
    </div>
  )
}
