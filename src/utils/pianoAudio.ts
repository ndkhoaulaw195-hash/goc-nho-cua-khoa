/** Bộ phát âm thanh Piano du dương bằng Web Audio API (Không cần tải file ngoài, cực nhẹ và êm tai) */
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Tần số các nốt nhạc Piano (Quãng 4 và Quãng 5): C4, D4, E4, F4, G4, A4, B4, C5
export const PIANO_NOTES: Record<string, { name: string; key: string; freq: number }> = {
  C4: { name: 'Đồ', key: '1', freq: 261.63 },
  D4: { name: 'Rê', key: '2', freq: 293.66 },
  E4: { name: 'Mi', key: '3', freq: 329.63 },
  F4: { name: 'Fa', key: '4', freq: 349.23 },
  G4: { name: 'Sol', key: '5', freq: 392.00 },
  A4: { name: 'La', key: '6', freq: 440.00 },
  B4: { name: 'Si', key: '7', freq: 493.88 },
  C5: { name: 'Đố', key: '8', freq: 523.25 },
}

/** Phát một nốt nhạc Piano với âm sắc ấm áp và độ ngân mềm mại (ADSR envelope) */
export function playPianoNote(freq: number, duration = 1.4) {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Dao động chính (Tone chính dạng sine/triangle ấm)
  const osc1 = ctx.createOscillator()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(freq, now)

  // Dao động phụ (Bồi âm nhẹ tạo độ dày tiếng piano)
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(freq * 2, now)

  const gainNode = ctx.createGain()
  // Attack tức thì
  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(0.28, now + 0.02)
  // Decay & Release ngân vang êm ái
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc1.connect(gainNode)
  osc2.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc1.start(now)
  osc2.start(now)
  osc1.stop(now + duration)
  osc2.stop(now + duration)
}

/** Giai điệu điệp khúc Kiss The Rain ngọt ngào */
const KISS_THE_RAIN_MELODY: { note: string; delay: number }[] = [
  { note: 'E4', delay: 0 },
  { note: 'G4', delay: 400 },
  { note: 'A4', delay: 800 },
  { note: 'C5', delay: 1200 },
  { note: 'B4', delay: 1800 },
  { note: 'G4', delay: 2400 },
  { note: 'E4', delay: 3000 },
  { note: 'D4', delay: 3600 },
  { note: 'E4', delay: 4200 },
  { note: 'G4', delay: 4800 },
]

let melodyTimers: number[] = []

/** Tự động dạo một khúc nhạc Piano lãng mạn */
export function playKissTheRainMelody(onNotePlayed?: (note: string) => void) {
  stopKissTheRainMelody()

  KISS_THE_RAIN_MELODY.forEach((item) => {
    const tid = window.setTimeout(() => {
      const n = PIANO_NOTES[item.note]
      if (n) {
        playPianoNote(n.freq, 1.8)
        onNotePlayed?.(item.note)
      }
    }, item.delay)
    melodyTimers.push(tid)
  })
}

export function stopKissTheRainMelody() {
  melodyTimers.forEach((t) => clearTimeout(t))
  melodyTimers = []
}
