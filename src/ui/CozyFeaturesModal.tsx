import { useState, useEffect, useRef } from 'react'
import { useStore, HIDDEN_MEMORIES_DATA } from '../store'

/* =========================================================================
   1. BẢNG TIN NHẮN TỦ LẠNH (STICKY LOVE NOTES)
   ========================================================================= */
export function StickyNotesModal() {
  const refrigeratorOpen = useStore((s) => s.refrigeratorOpen)
  const stickyNotes = useStore((s) => s.stickyNotes)
  const userRole = useStore((s) => s.userRole)
  const activeChar = useStore((s) => s.activeChar)
  const addStickyNote = useStore((s) => s.addStickyNote)
  const deleteStickyNote = useStore((s) => s.deleteStickyNote)
  const toggleRefrigerator = useStore((s) => s.toggleRefrigerator)

  const [text, setText] = useState('')
  const [selectedColor, setSelectedColor] = useState('#fef08a')

  if (!refrigeratorOpen) return null

  const colors = [
    { code: '#fef08a', label: 'Vàng nắng' },
    { code: '#fbcfe8', label: 'Hồng phấn' },
    { code: '#a7f3d0', label: 'Xanh mint' },
    { code: '#c7d2fe', label: 'Tím lavender' },
  ]

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addStickyNote(text.trim(), selectedColor)
    setText('')
  }

  const currentAuthor = userRole || activeChar || 'boy'

  return (
    <div className="cozy-modal-backdrop" onClick={toggleRefrigerator}>
      <div className="cozy-modal-card fridge-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cozy-modal-header">
          <div className="header-title">
            <span className="icon">🧊</span>
            <div>
              <h3>Cánh Tủ Lạnh Tình Yêu</h3>
              <p className="subtitle">Dán những mẩu giấy nhắn ngọt ngào cho người thương</p>
            </div>
          </div>
          <button className="cozy-close-btn" onClick={toggleRefrigerator}>✕</button>
        </div>

        {/* Form viết giấy nhắn mới */}
        <form className="note-input-form" onSubmit={handleAdd}>
          <textarea
            placeholder={`Gửi lời nhắn từ ${currentAuthor === 'boy' ? 'Khoa 👦' : 'Bạn Gái 👧'}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={140}
          />
          <div className="form-bottom">
            <div className="color-picker">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  className={`color-dot ${selectedColor === c.code ? 'active' : ''}`}
                  style={{ background: c.code }}
                  onClick={() => setSelectedColor(c.code)}
                  title={c.label}
                />
              ))}
            </div>
            <button type="submit" className="cozy-primary-btn" disabled={!text.trim()}>
              📌 Dán lên tủ lạnh
            </button>
          </div>
        </form>

        {/* Danh sách giấy nhắn đã dán */}
        <div className="sticky-notes-grid">
          {stickyNotes.length === 0 ? (
            <div className="empty-hint">Chưa có mẩu giấy nhắn nào. Hãy là người đầu tiên dán nhé!</div>
          ) : (
            stickyNotes.map((note) => (
              <div
                key={note.id}
                className="sticky-note-item"
                style={{ background: note.color || '#fef08a' }}
              >
                <div className="note-pin">🔴</div>
                <div className="note-meta">
                  <span className="author">
                    {note.author === 'boy' ? '👦 Khoa' : '👧 Bạn Gái'}
                  </span>
                  <span className="date">{note.date}</span>
                </div>
                <div className="note-content">{note.text}</div>
                <button
                  className="note-del-btn"
                  onClick={() => deleteStickyNote(note.id)}
                  title="Gỡ giấy nhắn này"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   2. BẢNG NHIỆM VỤ HÀNG NGÀY & TIM HẠNH PHÚC (DAILY QUESTS)
   ========================================================================= */
export function QuestsModal() {
  const questModalOpen = useStore((s) => s.questModalOpen)
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen)
  const quests = useStore((s) => s.quests)
  const lovePoints = useStore((s) => s.lovePoints)
  const resetQuests = useStore((s) => s.resetQuests)

  if (!questModalOpen) return null

  const completedCount = quests.filter((q) => q.completed).length

  return (
    <div className="cozy-modal-backdrop" onClick={() => setQuestModalOpen(false)}>
      <div className="cozy-modal-card quests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cozy-modal-header">
          <div className="header-title">
            <span className="icon">📋</span>
            <div>
              <h3>Sổ Nhiệm Vụ Hàng Ngày</h3>
              <p className="subtitle">Chăm sóc tổ ấm & tích lũy Tim Hạnh Phúc</p>
            </div>
          </div>
          <button className="cozy-close-btn" onClick={() => setQuestModalOpen(false)}>✕</button>
        </div>

        {/* Thanh điểm tim tình yêu */}
        <div className="love-points-bar">
          <div className="points-display">
            <span className="heart-icon">❤️</span>
            <span className="points-val">{lovePoints}</span>
            <span className="points-label">Tim Hạnh Phúc</span>
          </div>
          <div className="progress-summary">
            Tiến độ: {completedCount}/{quests.length} nhiệm vụ
          </div>
        </div>

        {/* Danh sách nhiệm vụ */}
        <div className="quests-list">
          {quests.map((q) => (
            <div key={q.id} className={`quest-card ${q.completed ? 'completed' : ''}`}>
              <div className="quest-icon">{q.icon}</div>
              <div className="quest-info">
                <div className="quest-title">{q.title}</div>
                <div className="quest-desc">{q.desc}</div>
              </div>
              <div className="quest-reward">
                {q.completed ? (
                  <span className="badge-done">✓ Đã xong (+{q.points} ❤️)</span>
                ) : (
                  <span className="badge-pending">+{q.points} ❤️</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="cozy-modal-footer">
          <button className="cozy-secondary-btn" onClick={resetQuests}>
            🔄 Làm mới ngày mới
          </button>
          <button className="cozy-primary-btn" onClick={() => setQuestModalOpen(false)}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   3. MINI-GAME BẮN PHI TIÊU ĐỐI KHÁNG (PVP DARTS)
   ========================================================================= */
export function DartsGameModal() {
  const dartsModalOpen = useStore((s) => s.dartsModalOpen)
  const setDartsModalOpen = useStore((s) => s.setDartsModalOpen)
  const dartScores = useStore((s) => s.dartScores)
  const recordDartScore = useStore((s) => s.recordDartScore)
  const resetDartsGame = useStore((s) => s.resetDartsGame)
  const userRole = useStore((s) => s.userRole)
  const activeChar = useStore((s) => s.activeChar)

  const [timingX, setTimingX] = useState(50)
  const [timingY, setTimingY] = useState(50)
  const [isThrowing, setIsThrowing] = useState(false)
  const [lastThrowScore, setLastThrowScore] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)

  const currentPlayer = userRole || activeChar || 'boy'

  useEffect(() => {
    if (!dartsModalOpen) return
    let dirX = 1.8
    let dirY = 2.4
    let posX = 50
    let posY = 50

    const interval = window.setInterval(() => {
      posX += dirX
      if (posX > 90 || posX < 10) dirX *= -1
      posY += dirY
      if (posY > 90 || posY < 10) dirY *= -1
      setTimingX(posX)
      setTimingY(posY)
    }, 28)

    timerRef.current = interval
    return () => clearInterval(interval)
  }, [dartsModalOpen])

  if (!dartsModalOpen) return null

  const handleThrow = () => {
    if (isThrowing) return
    setIsThrowing(true)

    // Tính điểm dựa trên khoảng cách tới tâm (50, 50)
    const dist = Math.hypot(timingX - 50, timingY - 50)
    let score = 5
    if (dist < 6) score = 50 // Hồng tâm Bullseye
    else if (dist < 14) score = 25
    else if (dist < 24) score = 20
    else if (dist < 34) score = 15
    else if (dist < 42) score = 10

    setLastThrowScore(score)
    recordDartScore(currentPlayer, score)

    setTimeout(() => {
      setIsThrowing(false)
    }, 700)
  }

  const boyTotal = dartScores.boy.reduce((a, b) => a + b, 0)
  const girlTotal = dartScores.girl.reduce((a, b) => a + b, 0)
  const bothFinished = dartScores.boy.length >= 3 && dartScores.girl.length >= 3

  return (
    <div className="cozy-modal-backdrop" onClick={() => setDartsModalOpen(false)}>
      <div className="cozy-modal-card darts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cozy-modal-header">
          <div className="header-title">
            <span className="icon">🎯</span>
            <div>
              <h3>Đại Chiến Phi Tiêu Đối Kháng</h3>
              <p className="subtitle">Căn nhịp ngắm hồng tâm để phân định thắng thua</p>
            </div>
          </div>
          <button className="cozy-close-btn" onClick={() => setDartsModalOpen(false)}>✕</button>
        </div>

        {/* Bảng so điểm 2 người chơi */}
        <div className="darts-scoreboard">
          <div className={`score-card ${currentPlayer === 'boy' ? 'active-turn' : ''}`}>
            <div className="player-name">👦 Khoa</div>
            <div className="total-score">{boyTotal}</div>
            <div className="round-scores">
              {dartScores.boy.map((s, i) => (
                <span key={i} className="score-pill">{s}</span>
              ))}
              {Array.from({ length: Math.max(0, 3 - dartScores.boy.length) }).map((_, i) => (
                <span key={i} className="score-pill empty">-</span>
              ))}
            </div>
          </div>

          <div className="vs-badge">VS</div>

          <div className={`score-card ${currentPlayer === 'girl' ? 'active-turn' : ''}`}>
            <div className="player-name">👧 Bạn Gái</div>
            <div className="total-score">{girlTotal}</div>
            <div className="round-scores">
              {dartScores.girl.map((s, i) => (
                <span key={i} className="score-pill">{s}</span>
              ))}
              {Array.from({ length: Math.max(0, 3 - dartScores.girl.length) }).map((_, i) => (
                <span key={i} className="score-pill empty">-</span>
              ))}
            </div>
          </div>
        </div>

        {/* Khung bia ngắm bắn phi tiêu */}
        <div className="dart-target-stage" onClick={handleThrow}>
          <div className="target-board">
            <div className="ring ring-5" />
            <div className="ring ring-4" />
            <div className="ring ring-3" />
            <div className="ring ring-2" />
            <div className="ring ring-bullseye">50</div>
          </div>

          {/* Hồng tâm nhấp nháy di chuyển */}
          <div
            className={`crosshair ${isThrowing ? 'thrown' : ''}`}
            style={{ left: `${timingX}%`, top: `${timingY}%` }}
          >
            <div className="ch-line-h" />
            <div className="ch-line-v" />
            <div className="ch-dot" />
          </div>

          {lastThrowScore !== null && (
            <div className="throw-feedback animate-pop">
              +{lastThrowScore} ĐIỂM!
            </div>
          )}
        </div>

        {bothFinished && (
          <div className="winner-announcement">
            {boyTotal > girlTotal ? (
              <p>🏆 <b>Khoa</b> đã chiến thắng! Bạn Gái phải pha trà sữa khao Khoa nhé!</p>
            ) : boyTotal < girlTotal ? (
              <p>🏆 <b>Bạn Gái</b> đã chiến thắng! Khoa chịu phạt rửa bát tối nay nha!</p>
            ) : (
              <p>🤝 <b>Hòa nhau!</b> Hai bạn quả là cặp đôi thần tài đồng tâm hiệp lực!</p>
            )}
          </div>
        )}

        <div className="cozy-modal-footer">
          <button className="cozy-secondary-btn" onClick={resetDartsGame}>
            🔄 Ván mới
          </button>
          <button
            className="cozy-primary-btn"
            onClick={handleThrow}
            disabled={dartScores[currentPlayer].length >= 3 || isThrowing}
          >
            🎯 Phóng Phi Tiêu (Lượt {dartScores[currentPlayer].length + 1}/3)
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   4. CHƠI GAME TRÊN MÀN HÌNH PC (ARCADE CONSOLE)
   ========================================================================= */
export function PcArcadeModal() {
  const pcGameModalOpen = useStore((s) => s.pcGameModalOpen)
  const setPcGameModalOpen = useStore((s) => s.setPcGameModalOpen)

  const [activeTab, setActiveTab] = useState<'caro' | 'flappy'>('caro')

  // State Cờ Caro (10x10)
  const [board, setBoard] = useState<(string | null)[]>(Array(100).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)

  // State Flappy Corgi
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flappyScore, setFlappyScore] = useState(0)
  const [flappyGameOver, setFlappyGameOver] = useState(false)
  const flappyState = useRef({ y: 130, vy: 0, pipes: [] as { x: number; top: number; bottom: number }[], score: 0 })

  // Vòng lặp vẽ và cập nhật game Flappy Corgi
  useEffect(() => {
    if (!pcGameModalOpen || activeTab !== 'flappy') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let pipeTick = 0

    const loop = () => {
      const state = flappyState.current
      if (!flappyGameOver) {
        state.vy += 0.28 // Trọng lực
        state.y += state.vy

        // Tạo chướng ngại vật định kỳ
        pipeTick++
        if (pipeTick % 75 === 0) {
          const topH = 30 + Math.random() * 90
          const gap = 85
          state.pipes.push({
            x: canvas.width,
            top: topH,
            bottom: canvas.height - (topH + gap),
          })
        }

        // Cập nhật vị trí các ống
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i]
          p.x -= 2.2
          // Va chạm với cún Corgi (tọa độ cún: x = 60, y = state.y, r = 14)
          const corgiX = 60
          const corgiY = state.y
          const corgiR = 12

          if (corgiX + corgiR > p.x && corgiX - corgiR < p.x + 36) {
            if (corgiY - corgiR < p.top || corgiY + corgiR > canvas.height - p.bottom) {
              setFlappyGameOver(true)
            }
          }

          if (p.x + 36 < 0) {
            state.pipes.splice(i, 1)
            state.score += 1
            setFlappyScore(state.score)
          }
        }

        if (state.y > canvas.height - 20 || state.y < 10) {
          setFlappyGameOver(true)
        }
      }

      // Xóa khung hình & vẽ nền trời
      ctx.fillStyle = '#7dd3fc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Vẽ đám mây trắng trôi
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(80, 45, 18, 0, Math.PI * 2)
      ctx.arc(105, 45, 24, 0, Math.PI * 2)
      ctx.arc(130, 45, 18, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(260, 65, 16, 0, Math.PI * 2)
      ctx.arc(285, 65, 22, 0, Math.PI * 2)
      ctx.arc(310, 65, 16, 0, Math.PI * 2)
      ctx.fill()

      // Vẽ các cột chướng ngại vật
      for (const p of state.pipes) {
        ctx.fillStyle = '#15803d'
        ctx.fillRect(p.x, 0, 36, p.top)
        ctx.fillRect(p.x, canvas.height - p.bottom, 36, p.bottom)
        // Viền đầu ống
        ctx.fillStyle = '#16a34a'
        ctx.fillRect(p.x - 3, p.top - 12, 42, 12)
        ctx.fillRect(p.x - 3, canvas.height - p.bottom, 42, 12)
      }

      // Vẽ dải cỏ ở đáy
      ctx.fillStyle = '#22c55e'
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18)
      ctx.fillStyle = '#15803d'
      ctx.fillRect(0, canvas.height - 4, canvas.width, 4)

      // Vẽ chú cún Corgi Mochi
      const cx = 60
      const cy = state.y
      // Thân cún
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 15, 11, 0, 0, Math.PI * 2)
      ctx.fill()
      // Bụng trắng
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.ellipse(cx + 4, cy + 3, 9, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      // Tai vểnh
      ctx.fillStyle = '#b45309'
      ctx.beginPath()
      ctx.moveTo(cx - 6, cy - 8)
      ctx.lineTo(cx - 2, cy - 18)
      ctx.lineTo(cx + 4, cy - 8)
      ctx.fill()
      // Mắt & mũi
      ctx.fillStyle = '#18181b'
      ctx.beginPath()
      ctx.arc(cx + 8, cy - 2, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 14, cy + 1, 2.5, 0, Math.PI * 2)
      ctx.fill()

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [pcGameModalOpen, activeTab, flappyGameOver])

  if (!pcGameModalOpen) return null

  // Xử lý cờ Caro
  const handleCellClick = (idx: number) => {
    if (board[idx] || winner) return
    const next = [...board]
    next[idx] = isXNext ? 'X' : 'O'
    setBoard(next)
    setIsXNext(!isXNext)

    // Kiểm tra thắng 4-5 quân
    const checkWin = (b: (string | null)[]) => {
      const size = 10
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const sym = b[r * size + c]
          if (!sym) continue
          // Ngang
          if (c + 4 < size && [0, 1, 2, 3, 4].every((i) => b[r * size + c + i] === sym)) return sym
          // Dọc
          if (r + 4 < size && [0, 1, 2, 3, 4].every((i) => b[(r + i) * size + c] === sym)) return sym
          // Chéo xuôi
          if (r + 4 < size && c + 4 < size && [0, 1, 2, 3, 4].every((i) => b[(r + i) * size + c + i] === sym)) return sym
          // Chéo ngược
          if (r + 4 < size && c - 4 >= 0 && [0, 1, 2, 3, 4].every((i) => b[(r + i) * size + c - i] === sym)) return sym
        }
      }
      return null
    }

    const w = checkWin(next)
    if (w) setWinner(w)
  }

  const resetCaro = () => {
    setBoard(Array(100).fill(null))
    setIsXNext(true)
    setWinner(null)
  }

  return (
    <div className="cozy-modal-backdrop" onClick={() => setPcGameModalOpen(false)}>
      <div className="cozy-modal-card pc-arcade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cozy-modal-header">
          <div className="header-title">
            <span className="icon">🎮</span>
            <div>
              <h3>Phòng Game PC Gaming</h3>
              <p className="subtitle">Giải trí cùng nhau trên màn hình máy tính</p>
            </div>
          </div>
          <button className="cozy-close-btn" onClick={() => setPcGameModalOpen(false)}>✕</button>
        </div>

        {/* Tab chọn game */}
        <div className="game-tabs">
          <button
            className={`tab-btn ${activeTab === 'caro' ? 'active' : ''}`}
            onClick={() => setActiveTab('caro')}
          >
            ⭕ Cờ Caro Đối Kháng
          </button>
          <button
            className={`tab-btn ${activeTab === 'flappy' ? 'active' : ''}`}
            onClick={() => setActiveTab('flappy')}
          >
            🐶 Flappy Corgi Mini
          </button>
        </div>

        {activeTab === 'caro' ? (
          <div className="caro-container">
            <div className="caro-status">
              {winner ? (
                <span className="winner-tag">🎉 Người chơi {winner === 'X' ? 'Khoa (X)' : 'Bạn Gái (O)'} Chiến Thắng!</span>
              ) : (
                <span>Lượt đi: <b>{isXNext ? 'Khoa (X)' : 'Bạn Gái (O)'}</b></span>
              )}
              <button className="cozy-secondary-btn small" onClick={resetCaro}>Ván mới</button>
            </div>
            <div className="caro-grid">
              {board.map((cell, idx) => (
                <button
                  key={idx}
                  className={`caro-cell ${cell ? cell.toLowerCase() : ''}`}
                  onClick={() => handleCellClick(idx)}
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flappy-container">
            <div className="flappy-hint">Bấm vào khung game hoặc phím Space để bé Corgi bay qua chướng ngại vật!</div>
            <div className="flappy-canvas-wrap">
              <canvas
                ref={canvasRef}
                width={360}
                height={260}
                className="flappy-canvas"
                onClick={() => {
                  flappyState.current.vy = -6.2
                  if (flappyGameOver) {
                    setFlappyGameOver(false)
                    flappyState.current = { y: 130, vy: -5, pipes: [], score: 0 }
                    setFlappyScore(0)
                  }
                }}
              />
              <div className="flappy-score-hud">Điểm: {flappyScore}</div>
              {flappyGameOver && <div className="flappy-gameover-overlay">Game Over! Nhấn để chơi lại</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   5. POPUP KÝ ỨC ẨN & CHÚC MỪNG HOÀN THÀNH BỘ SƯU TẬP (MEMORY HUNT)
   ========================================================================= */
export function MemoryModal() {
  const memoryModalItem = useStore((s) => s.memoryModalItem)
  const setMemoryModalItem = useStore((s) => s.setMemoryModalItem)
  const foundMemories = useStore((s) => s.foundMemories)

  if (!memoryModalItem) return null

  const isAllCollected = foundMemories.length >= Object.keys(HIDDEN_MEMORIES_DATA).length

  return (
    <div className="cozy-modal-backdrop" onClick={() => setMemoryModalItem(null)}>
      <div className="cozy-modal-card memory-modal" onClick={(e) => e.stopPropagation()}>
        <div className="memory-badge-icon">{memoryModalItem.icon}</div>
        <h3 className="memory-item-title">{memoryModalItem.title}</h3>
        <p className="memory-item-loc">📍 Vị trí: {memoryModalItem.location}</p>
        <blockquote className="memory-quote">{memoryModalItem.desc}</blockquote>

        <div className="collection-progress">
          <div className="progress-bar-outer">
            <div
              className="progress-bar-inner"
              style={{ width: `${(foundMemories.length / 5) * 100}%` }}
            />
          </div>
          <span className="progress-label">Đã tìm thấy: {foundMemories.length}/5 ký ức bí mật</span>
        </div>

        {isAllCollected && (
          <div className="celebration-box animate-pop">
            <div className="trophy">🏆</div>
            <h4>HOÀN THÀNH BỘ SƯU TẬP KÝ ỨC!</h4>
            <p>Hai bạn đã mở khóa huy hiệu <b>"Thám Tử Tình Yêu Vĩ Đại"</b>!</p>
          </div>
        )}

        <button className="cozy-primary-btn full" onClick={() => setMemoryModalItem(null)}>
          Cất vào hộp ký ức ❤️
        </button>
      </div>
    </div>
  )
}
