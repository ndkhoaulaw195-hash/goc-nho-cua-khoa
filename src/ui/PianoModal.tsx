import { useEffect, useState } from 'react'
import { useStore } from '../store'
import {
  PIANO_NOTES,
  playPianoNote,
  playKissTheRainMelody,
  stopKissTheRainMelody,
} from '../utils/pianoAudio'

export function PianoModal() {
  const pianoModalOpen = useStore((s) => s.pianoModalOpen)
  const setPianoModalOpen = useStore((s) => s.setPianoModalOpen)
  const [activeNote, setActiveNote] = useState<string | null>(null)
  const [isPlayingAuto, setIsPlayingAuto] = useState(false)

  // Lắng nghe phím số 1-8 để chơi đàn bằng bàn phím
  useEffect(() => {
    if (!pianoModalOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      const entry = Object.entries(PIANO_NOTES).find(([_, n]) => n.key === e.key)
      if (entry) {
        e.preventDefault()
        const [noteId, noteData] = entry
        playPianoNote(noteData.freq)
        setActiveNote(noteId)
        setTimeout(() => setActiveNote(null), 250)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pianoModalOpen])

  if (!pianoModalOpen) return null

  const handleNoteClick = (noteId: string, freq: number) => {
    playPianoNote(freq)
    setActiveNote(noteId)
    setTimeout(() => setActiveNote(null), 250)
  }

  const handleAutoMelody = () => {
    if (isPlayingAuto) {
      stopKissTheRainMelody()
      setIsPlayingAuto(false)
    } else {
      setIsPlayingAuto(true)
      playKissTheRainMelody((note) => {
        setActiveNote(note)
        setTimeout(() => setActiveNote(null), 280)
      })
      setTimeout(() => setIsPlayingAuto(false), 5600)
    }
  }

  const handleClose = () => {
    stopKissTheRainMelody()
    setIsPlayingAuto(false)
    setPianoModalOpen(false)
  }

  return (
    <div className="piano-dock-overlay">
      <div className="piano-dock-card">
        <div className="piano-dock-header">
          <div className="piano-title">
            <span className="piano-icon">🎹</span>
            <div>
              <h4>Cây Đàn Piano Gỗ Tầng 2</h4>
              <p>Bấm phím [1-8] hoặc click phím đàn để dạo những nốt nhạc yêu thương</p>
            </div>
          </div>
          <div className="piano-actions">
            <button
              className={`auto-melody-btn ${isPlayingAuto ? 'playing' : ''}`}
              onClick={handleAutoMelody}
              title="Tự động dạo một khúc nhạc Kiss The Rain lãng mạn"
            >
              {isPlayingAuto ? '⏹ Dừng dạo nhạc' : '♪ Dạo khúc Kiss The Rain'}
            </button>
            <button className="piano-close-btn" onClick={handleClose} title="Thu gọn đàn">
              ✕
            </button>
          </div>
        </div>

        {/* Bàn phím đàn Piano 8 phím trắng */}
        <div className="piano-keys-container">
          {Object.entries(PIANO_NOTES).map(([noteId, n]) => {
            const isActive = activeNote === noteId
            return (
              <button
                key={noteId}
                className={`piano-white-key ${isActive ? 'pressed' : ''}`}
                onClick={() => handleNoteClick(noteId, n.freq)}
              >
                <span className="key-shortcut">{n.key}</span>
                <span className="key-solfege">{n.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
