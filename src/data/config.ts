export type V3 = [number, number, number]

export const SITE = {
  eyebrow: "KHOA'S LITTLE CORNER",
  title: 'Góc nhỏ của Khoa',
  music: {
    src: '/audio/kiss-the-rain.mp3',
    title: 'Kiss the Rain – Yiruma',
  },
}

// Vị trí trực tiếp theo thời gian thực của nhân vật và 2 bé chó để đồng bộ camera & tương tác vuốt ve
export const LIVE_ACTORS: {
  khoaPos: [number, number]
  khoaFloorY: number
  khoaYaw: number
  girlPos: V3
  girlYaw: number
  dogs: Record<'mochi' | 'bo', { pos: V3; floorMeetPos: [number, number] }>
} = {
  khoaPos: [-1.1, -1.2],
  khoaFloorY: 0,
  khoaYaw: 0.15,
  girlPos: [-3.9, 4.35, -0.35],
  girlYaw: -0.15,
  dogs: {
    mochi: { pos: [-5.8, 0, 1.2], floorMeetPos: [-5.2, 1.2] },
    bo: { pos: [-4.2, 0, 2.2], floorMeetPos: [-4.2, 2.2] },
  },
}

export interface Outfit {
  id: string
  name: string
  shirt: string
  pants: string
  shoes: string
  collar: string
  longSleeve?: boolean
}

export const OUTFITS: Outfit[] = [
  {
    id: 'casual',
    name: 'Áo thun trắng & Quần short kem',
    shirt: '#f8f7f4',
    pants: '#d6cbb9',
    shoes: '#f8fafc',
    collar: '#e5e7eb',
    longSleeve: false,
  },
  {
    id: 'allwhite',
    name: 'Sơ mi trắng & Quần trắng',
    shirt: '#ffffff',
    pants: '#f1f5f9',
    shoes: '#ffffff',
    collar: '#e2e8f0',
    longSleeve: true,
  },
  {
    id: 'street',
    name: 'Hoodie đen & Jogger xám',
    shirt: '#1e2024',
    pants: '#64748b',
    shoes: '#111827',
    collar: '#27272a',
    longSleeve: true,
  },
  {
    id: 'navy',
    name: 'Polo xanh Navy & Jeans xám',
    shirt: '#1e3a5f',
    pants: '#94a3b8',
    shoes: '#f8fafc',
    collar: '#172554',
    longSleeve: false,
  },
  {
    id: 'pijama',
    name: 'Đồ ngủ Pijama xanh nhạt',
    shirt: '#93c5fd',
    pants: '#bfdbfe',
    shoes: '#e2e8f0',
    collar: '#dbeafe',
    longSleeve: true,
  },
]

export const TV_CHANNELS = [
  { id: 0, name: 'Lofi Sunset Clouds' },
  { id: 1, name: 'Thủy cung 3D' },
  { id: 2, name: 'Vũ trụ & Sao băng' },
  { id: 3, name: 'Bóng đá trực tiếp' },
]

export interface WallPhoto {
  id: number
  src: string
  title: string
  position: V3
  camera: { pos: V3; target: V3 }
}

export const WALL_PHOTOS: WallPhoto[] = [
  {
    id: 1,
    src: '/photos/photo-1.jpg',
    title: 'Buổi chiều ở triển lãm',
    position: [-0.45, 3.28, -5.92],
    camera: { pos: [-0.45, 3.45, -2.5], target: [-0.45, 3.18, -5.92] },
  },
  {
    id: 2,
    src: '/photos/photo-2.jpg',
    title: 'Khoảnh khắc bên nhau',
    position: [0.22, 3.28, -5.92],
    camera: { pos: [0.22, 3.45, -2.5], target: [0.22, 3.18, -5.92] },
  },
  {
    id: 3,
    src: '/photos/photo-3.jpg',
    title: 'Chuyến đi giữa núi rừng',
    position: [0.89, 3.28, -5.92],
    camera: { pos: [0.89, 3.45, -2.5], target: [0.89, 3.18, -5.92] },
  },
]

export const HOME_VIEW = { pos: [-1.5, 17.5, 34.0] as V3, target: [-1.5, 3.1, -0.5] as V3 }
export const FLOOR1_VIEW = { pos: [-2.2, 11.8, 23.5] as V3, target: [-2.2, 0.75, -0.3] as V3 }
export const FLOOR2_VIEW = { pos: [-0.6, 11.4, 16.8] as V3, target: [-0.6, 5.1, -1.8] as V3 }
export const ATRIUM_VIEW = { pos: [-0.8, 6.8, 10.8] as V3, target: [2.3, 3.2, -1.8] as V3 }
export const TV_VIEW = { pos: [2.6, 3.05, 6.4] as V3, target: [4.3, 1.05, 1.6] as V3 }
export const PC_VIEW = { pos: [1.35, 2.45, -2.1] as V3, target: [2.85, 1.15, -5.2] as V3 }
export const BED_VIEW = { pos: [-0.5, 2.85, -1.4] as V3, target: [-2.6, 0.75, -4.3] as V3 }
export const WARDROBE_VIEW = { pos: [-4.8, 2.25, -1.2] as V3, target: [-7.2, 1.1, -4.4] as V3 }
export const FEED_VIEW = { pos: [-4.4, 2.75, 4.3] as V3, target: [-6.9, 0.55, 1.45] as V3 }
export const DRINK_VIEW = { pos: [3.9, 2.35, -2.4] as V3, target: [5.35, 1.05, -5.3] as V3 }
export const DART_VIEW = { pos: [-2.8, 2.5, -1.8] as V3, target: [-4.9, 1.75, -5.6] as V3 }
export const BATH_VIEW = { pos: [-12.2, 1.85, 0.4] as V3, target: [-13.7, 0.75, -1.6] as V3 }
export const WASH_VIEW = { pos: [-10.4, 1.75, -3.6] as V3, target: [-12.4, 1.25, -5.35] as V3 }
export const LAUNDRY_VIEW = { pos: [-12.4, 1.65, -3.4] as V3, target: [-10.8, 0.95, -5.2] as V3 }
export const READ_VIEW = { pos: [1.85, 1.75, -2.8] as V3, target: [0.85, 1.15, -4.15] as V3 }

// Camera góc nhìn cận cảnh Tầng 2
export const GIRL_BED_VIEW = { pos: [-5.0, 7.2, 0.2] as V3, target: [-5.0, 4.9, -3.85] as V3 }
export const GIRL_PC_VIEW = { pos: [2.25, 6.05, -2.5] as V3, target: [2.25, 5.25, -5.2] as V3 }
export const GIRL_VANITY_VIEW = { pos: [4.95, 6.05, -2.5] as V3, target: [4.95, 5.25, -5.2] as V3 }
export const GIRL_LOUNGE_VIEW = { pos: [-3.0, 7.2, 4.2] as V3, target: [-3.0, 4.9, 1.1] as V3 }
export const GIRL_NOOK_VIEW = { pos: [4.2, 6.5, 0.6] as V3, target: [7.1, 4.95, -1.35] as V3 }
export const GIRL_WARDROBE_VIEW = { pos: [7.65, 6.6, -1.2] as V3, target: [7.65, 5.6, -5.1] as V3 }

export interface GirlOutfit {
  id: string
  name: string
  desc: string
  jacket: string
  inner: string
  skirt: string
  sock: string
}

export const GIRL_OUTFITS: GirlOutfit[] = [
  {
    id: 'linen-cream',
    name: 'Váy Linen Bắc Âu',
    desc: 'Đầm suông vải linen trắng kem tối giản thanh lịch',
    jacket: '#eae4da',
    inner: '#f7f4ee',
    skirt: '#e4ddd2',
    sock: '#f7f4ee',
  },
  {
    id: 'cardigan-brown',
    name: 'Cardigan Nâu Ấm',
    desc: 'Áo khoác dệt kim màu nâu ấm, áo thun trắng & chân váy kem',
    jacket: '#6b4423',
    inner: '#ffffff',
    skirt: '#d2b48c',
    sock: '#ffffff',
  },
  {
    id: 'sage-green',
    name: 'Set Xanh Sage Dịu Mát',
    desc: 'Áo blazer xanh bơ dịu nhẹ cùng tone với mảng tường phòng làm việc',
    jacket: '#7d977d',
    inner: '#ffffff',
    skirt: '#5c735c',
    sock: '#ffffff',
  },
  {
    id: 'pastel-pink',
    name: 'Hoodie Hồng Pastel',
    desc: 'Áo hoodie hồng phấn dễ thương mặc ở nhà cực kỳ thoải mái',
    jacket: '#f4a4b4',
    inner: '#ffffff',
    skirt: '#fed7aa',
    sock: '#ffffff',
  },
]

export interface StationConfig {
  entryPos: [number, number]
  entryYaw: number
  floorY: number
  camera: { pos: V3; target: V3 }
  fpPos: V3
  fpTarget: V3
  label: string
}

export const STATIONS: Record<
  | 'tv'
  | 'pc'
  | 'sleep'
  | 'wardrobe'
  | 'feed'
  | 'drink'
  | 'darts'
  | 'pet'
  | 'bath'
  | 'wash'
  | 'laundry'
  | 'read'
  | 'girl_sleep'
  | 'girl_pc'
  | 'girl_vanity'
  | 'girl_lounge'
  | 'girl_nook'
  | 'girl_wardrobe',
  StationConfig
> = {
  girl_sleep: {
    entryPos: [-5.0, -1.8],
    entryYaw: Math.PI,
    floorY: 4.35,
    camera: GIRL_BED_VIEW,
    fpPos: [-5.0, 4.35 + 0.95, -3.85],
    fpTarget: [-5.0, 4.35 + 0.85, -5.5],
    label: '🛏️ Giường ngủ Tầng 2',
  },
  girl_pc: {
    entryPos: [2.25, -3.8],
    entryYaw: Math.PI,
    floorY: 4.35,
    camera: GIRL_PC_VIEW,
    fpPos: [2.25, 4.35 + 1.25, -4.5],
    fpTarget: [2.25, 4.35 + 1.15, -5.3],
    label: '💻 Bàn máy tính Tầng 2',
  },
  girl_vanity: {
    entryPos: [4.95, -3.8],
    entryYaw: Math.PI,
    floorY: 4.35,
    camera: GIRL_VANITY_VIEW,
    fpPos: [4.95, 4.35 + 1.25, -4.5],
    fpTarget: [4.95, 4.35 + 1.25, -5.3],
    label: '💄 Bàn trang điểm',
  },
  girl_lounge: {
    entryPos: [-3.0, 2.2],
    entryYaw: -1.2,
    floorY: 4.35,
    camera: GIRL_LOUNGE_VIEW,
    fpPos: [-3.0, 4.35 + 1.15, 1.1],
    fpTarget: [-4.0, 4.35 + 0.9, 1.2],
    label: '🛋️ Ghế lười Bouclé',
  },
  girl_nook: {
    entryPos: [6.2, -1.5],
    entryYaw: -0.58,
    floorY: 4.35,
    camera: GIRL_NOOK_VIEW,
    fpPos: [6.85, 4.35 + 1.15, -1.85],
    fpTarget: [5.5, 4.35 + 0.95, -0.8],
    label: '🪑 Ghế đọc sách Tầng 2',
  },
  girl_wardrobe: {
    entryPos: [7.65, -3.65],
    entryYaw: Math.PI,
    floorY: 4.35,
    camera: GIRL_WARDROBE_VIEW,
    fpPos: [7.65, 4.35 + 1.45, -2.8],
    fpTarget: [7.65, 4.35 + 1.45, -4.2],
    label: '👗 Tủ đồ Bạn Gái',
  },
  tv: {
    entryPos: [2.85, 3.25],
    entryYaw: Math.PI,
    floorY: 0,
    camera: TV_VIEW,
    fpPos: [4.45, 1.18, 3.55],
    fpTarget: [4.15, 1.28, 0.35],
    label: '🛋️ Xem TV',
  },
  pc: {
    entryPos: [2.85, -3.65],
    entryYaw: Math.PI,
    floorY: 0,
    camera: PC_VIEW,
    fpPos: [2.85, 1.24, -4.48],
    fpTarget: [2.85, 1.15, -5.4],
    label: '💻 Bàn máy tính Tầng 1',
  },
  sleep: {
    entryPos: [-3.6, -3.75],
    entryYaw: Math.PI / 2,
    floorY: 0,
    camera: BED_VIEW,
    fpPos: [-2.95, 0.96, -5.05],
    fpTarget: [-2.6, 1.75, -1.2],
    label: '🛏️ Giường ngủ Tầng 1',
  },
  wardrobe: {
    entryPos: [-7.2, -4.1],
    entryYaw: Math.PI,
    floorY: 0,
    camera: WARDROBE_VIEW,
    fpPos: [-7.2, 1.55, -3.25],
    fpTarget: [-7.3, 1.35, -5.45],
    label: '👕 Tủ đồ Khoa',
  },
  feed: {
    entryPos: [-6.1, 1.85],
    entryYaw: -2.05,
    floorY: 0,
    camera: FEED_VIEW,
    fpPos: [-5.65, 1.48, 2.15],
    fpTarget: [-6.95, 0.25, 1.45],
    label: '🦴 Cho cún ăn',
  },
  drink: {
    entryPos: [5.35, -4.35],
    entryYaw: Math.PI,
    floorY: 0,
    camera: DRINK_VIEW,
    fpPos: [5.35, 1.52, -4.05],
    fpTarget: [5.35, 0.85, -5.45],
    label: '💧 Rót nước',
  },
  darts: {
    entryPos: [-4.9, -3.25],
    entryYaw: Math.PI,
    floorY: 0,
    camera: DART_VIEW,
    fpPos: [-4.9, 1.58, -3.15],
    fpTarget: [-4.9, 2.45, -5.92],
    label: '🎯 Phóng phi tiêu',
  },
  pet: {
    entryPos: [-4.6, 1.8],
    entryYaw: -Math.PI / 2,
    floorY: 0,
    camera: { pos: [-2.5, 2.3, 4.2], target: [-5.0, 0.45, 1.6] },
    fpPos: [-4.5, 0.82, 1.8],
    fpTarget: [-5.1, 0.35, 1.5],
    label: '🐶 Vuốt ve cún',
  },
  bath: {
    entryPos: [-12.4, -1.6],
    entryYaw: -Math.PI / 2,
    floorY: 0,
    camera: BATH_VIEW,
    fpPos: [-13.7, 0.76, -1.85],
    fpTarget: [-13.7, 0.72, 0.5],
    label: '🛁 Tắm bồn',
  },
  wash: {
    entryPos: [-12.4, -4.55],
    entryYaw: Math.PI,
    floorY: 0,
    camera: WASH_VIEW,
    fpPos: [-12.4, 1.55, -4.6],
    fpTarget: [-12.4, 1.58, -5.85],
    label: '🪞 Rửa mặt',
  },
  laundry: {
    entryPos: [-10.55, -4.55],
    entryYaw: 2.85,
    floorY: 0,
    camera: LAUNDRY_VIEW,
    fpPos: [-10.55, 1.52, -4.6],
    fpTarget: [-10.8, 0.82, -5.5],
    label: '🧺 Máy giặt',
  },
  read: {
    entryPos: [0.85, -4.15],
    entryYaw: -2.4,
    floorY: 0,
    camera: READ_VIEW,
    fpPos: [0.85, 1.48, -4.15],
    fpTarget: [0.85, 1.35, -4.8],
    label: '📖 Đọc sách Tầng 1',
  },
}
