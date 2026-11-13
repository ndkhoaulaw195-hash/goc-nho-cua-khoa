export type V3 = [number, number, number]

export const SITE = {
  eyebrow: "KHOA'S LITTLE CORNER",
  title: 'Góc nhỏ của Khoa',
  music: {
    src: '/audio/kiss-the-rain.mp3',
    title: 'Kiss the Rain – Yiruma',
  },
}

export const WEATHER_MODES = {
  clear: { icon: '☀️', label: 'Nắng ấm' },
  sunset: { icon: '🌇', label: 'Hoàng hôn' },
  rain: { icon: '🌧️', label: 'Mưa Lofi' },
  night: { icon: '🌙', label: 'Đêm khuya ấm áp' },
} as const

// Vị trí trực tiếp theo thời gian thực của nhân vật và 2 bé chó để đồng bộ camera & tương tác vuốt ve
export const LIVE_ACTORS: {
  khoaPos: [number, number]
  khoaFloorY: number
  khoaYaw: number
  khoaWorldPos: V3
  girlPos: V3
  girlFloorY: number
  girlYaw: number
  girlWorldPos: V3
  fpYaw: number
  dogs: Record<'mochi' | 'bo', { pos: V3; floorMeetPos: [number, number] }>
} = {
  khoaPos: [-1.1, -1.2],
  khoaFloorY: 0,
  khoaYaw: 0.15,
  khoaWorldPos: [-1.1, 0, -1.2],
  girlPos: [-3.9, 4.35, -0.35],
  girlFloorY: 4.35,
  girlYaw: -0.15,
  girlWorldPos: [-3.9, 4.35, -0.35],
  fpYaw: 0.15,
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
    name: 'Áo thun kem & Quần short cát',
    shirt: '#f4f1ea',
    pants: '#cfc7ba',
    shoes: '#ece8e0',
    collar: '#e2dcd2',
    longSleeve: false,
  },
  {
    id: 'allwhite',
    name: 'Sơ mi trắng ngà & Quần đá sáng',
    shirt: '#faf8f5',
    pants: '#e5e0d8',
    shoes: '#f6f3ee',
    collar: '#dcd6cd',
    longSleeve: true,
  },
  {
    id: 'street',
    name: 'Hoodie than chì & Jogger xám tro',
    shirt: '#2a2927',
    pants: '#726d66',
    shoes: '#1c1b19',
    collar: '#3a3835',
    longSleeve: true,
  },
  {
    id: 'navy',
    name: 'Polo xám chì & Quần taupe',
    shirt: '#45484c',
    pants: '#9a9389',
    shoes: '#f3efe9',
    collar: '#323437',
    longSleeve: false,
  },
  {
    id: 'pijama',
    name: 'Đồ ngủ Linen xám khói',
    shirt: '#b8bec2',
    pants: '#d5d9dc',
    shoes: '#e7e4de',
    collar: '#d0d5d8',
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

export const HOME_VIEW = { pos: [-1.5, 14.5, 30.5] as V3, target: [-1.5, 2.8, -0.5] as V3 }
export const FLOOR1_VIEW = { pos: [-2.2, 9.2, 21.0] as V3, target: [-2.2, 1.4, -0.5] as V3 }
export const FLOOR2_VIEW = { pos: [-0.6, 9.8, 15.2] as V3, target: [-0.6, 5.2, -1.8] as V3 }
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

export const RANDOM_VIEWS: {
  id: string
  label: string
  preset: 'overview' | 'floor1' | 'floor2'
  camera: { pos: V3; target: V3 }
}[] = [
  { id: 'atrium', label: 'Sảnh thông tầng', preset: 'overview', camera: ATRIUM_VIEW },
  { id: 'tv', label: 'Phòng khách & Sofa', preset: 'floor1', camera: TV_VIEW },
  { id: 'pc', label: 'Bàn làm việc Tầng 1', preset: 'floor1', camera: PC_VIEW },
  { id: 'bed1', label: 'Phòng ngủ Tầng 1', preset: 'floor1', camera: BED_VIEW },
  { id: 'bed2', label: 'Phòng ngủ Tầng 2', preset: 'floor2', camera: GIRL_BED_VIEW },
  { id: 'nook', label: 'Góc đọc sách Tầng 2', preset: 'floor2', camera: GIRL_NOOK_VIEW },
  { id: 'lounge', label: 'Ghế lười & Ban công', preset: 'floor2', camera: GIRL_LOUNGE_VIEW },
  { id: 'pc2', label: 'Góc học tập Tầng 2', preset: 'floor2', camera: GIRL_PC_VIEW },
]

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
    jacket: '#ece6dc',
    inner: '#f7f4ee',
    skirt: '#dfd8cc',
    sock: '#f7f4ee',
  },
  {
    id: 'cardigan-brown',
    name: 'Cardigan Taupe Ấm',
    desc: 'Áo khoác dệt kim màu nâu taupe trung tính, áo trong kem & chân váy cát',
    jacket: '#6e6459',
    inner: '#f6f3ed',
    skirt: '#c9bfb1',
    sock: '#f6f3ed',
  },
  {
    id: 'sage-green',
    name: 'Set Olive Xám Dịu',
    desc: 'Áo blazer olive xám trầm hài hòa cùng không gian nội thất',
    jacket: '#778175',
    inner: '#f6f3ed',
    skirt: '#596157',
    sock: '#f6f3ed',
  },
  {
    id: 'pastel-pink',
    name: 'Hoodie Kem Cát Ấm',
    desc: 'Áo hoodie tone kem be trầm tối giản mặc ở nhà thoải mái',
    jacket: '#d6c8bc',
    inner: '#f7f4ee',
    skirt: '#b5a79a',
    sock: '#f7f4ee',
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
  | 'girl_wardrobe'
  | 'piano'
  | 'paint',
  StationConfig
> = {
  piano: {
    entryPos: [0.47, -1.05],
    entryYaw: Math.PI,
    floorY: 4.35,
    camera: { pos: [0.47, 5.85, 0.95], target: [0.47, 4.85, -1.55] },
    fpPos: [0.47, 4.35 + 1.25, -1.05],
    fpTarget: [0.47, 4.35 + 1.15, -1.6],
    label: '🎹 Chơi đàn Piano',
  },
  paint: {
    entryPos: [-0.71, -1.05],
    entryYaw: 0.25,
    floorY: 4.35,
    camera: { pos: [-0.71, 5.75, 0.85], target: [-0.71, 4.95, -1.55] },
    fpPos: [-0.71, 4.35 + 1.45, -1.05],
    fpTarget: [-0.71, 4.35 + 1.45, -1.55],
    label: '🎨 Vẽ tranh Canvas',
  },
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
    entryPos: [3.85, 2.85],
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

/** Bảng màu kiến trúc đồng bộ giữa Tầng 1 và Tầng 2 (Hệ màu Trung Tính Warm Greige & Stone) */
export function getHousePalette(darkMode: boolean) {
  return {
    extWall: darkMode ? '#2B2D2F' : '#D6D1C9',
    subFloor: darkMode ? '#222426' : '#D6D1C9',
    floorTint: darkMode ? '#9A9287' : '#FFFFFF',
    wallCream: darkMode ? '#3A3B3D' : '#EFECE6',
    wallPartition: darkMode ? '#343638' : '#EFECE6',
    wallAccent: darkMode ? '#364552' : '#5E7487',
    wallBath: darkMode ? '#38393B' : '#E5E4E0',
    crownMolding: darkMode ? '#444648' : '#D6D1C9',
    baseboard: darkMode ? '#1F2123' : '#2B2D2F',
  }
}
