import type { V3 } from './config'

export interface Memory {
  id: string
  emoji: string
  title: string
  text: string
  /** vị trí hotspot ◆ trong cảnh */
  position: V3
  /** camera khi mở ký ức */
  camera: { pos: V3; target: V3 }
}

export const MEMORIES: Memory[] = [
  {
    id: 'desk',
    emoji: '💻',
    title: 'Góc làm việc',
    text: 'Ba màn hình, một tách cà phê và những đêm code tới sáng. Nơi những ý tưởng đầu tiên được thành hình.',
    position: [3.5, 2.05, -5.1],
    camera: { pos: [3.5, 2.6, -1.2], target: [3.5, 1.4, -5.6] },
  },
  {
    id: 'painting',
    emoji: '🌻',
    title: 'Bức tranh hướng dương',
    text: 'Hoa hướng dương luôn quay về phía mặt trời – lời nhắc mỗi ngày hãy hướng về điều tích cực.',
    position: [3.6, 3.95, -5.85],
    camera: { pos: [3.6, 3.0, -1.5], target: [3.6, 3.0, -6] },
  },
  {
    id: 'books',
    emoji: '📚',
    title: 'Kệ sách',
    text: 'Mỗi cuốn sách là một chuyến đi. Có cuốn đọc lại tới lần thứ năm vẫn thấy hay.',
    position: [6.1, 2.6, -5.4],
    camera: { pos: [5.4, 2.2, -2.2], target: [6.1, 1.4, -5.6] },
  },
  {
    id: 'bed',
    emoji: '🛏️',
    title: 'Giấc ngủ trưa',
    text: 'Chiếc giường mà Mochi luôn giành chỗ trước. Những buổi trưa cuối tuần yên bình nhất.',
    position: [-1.3, 1.2, -3.4],
    camera: { pos: [-1.0, 3.0, 0.0], target: [-2.2, 0.6, -4.2] },
  },
  {
    id: 'doghouse',
    emoji: '🐶',
    title: 'Nhà của hai bé',
    text: 'Góc riêng của Mochi và Bơ: nhà gỗ, nệm tròn và máy cho ăn tự động.',
    position: [-7.6, 1.75, -0.3],
    camera: { pos: [-4.5, 3.2, 3.2], target: [-7.4, 0.6, 0.2] },
  },
  {
    id: 'tv',
    emoji: '📺',
    title: 'Góc giải trí & Smart TV',
    text: 'Chiếc TV màn hình lớn giữa phòng khách – nơi bật những bản nhạc chill, xem phim cuối tuần hay phát bất kỳ video yêu thích nào.',
    position: [4.8, 2.35, 0.45],
    camera: { pos: [4.8, 2.2, 4.4], target: [4.8, 1.4, 0.45] },
  },
  {
    id: 'sofa',
    emoji: '🛋️',
    title: 'Bộ sofa chữ L ấm cúng',
    text: 'Nơi ngả lưng xem TV sau ngày dài, nhâm nhi tách trà trên bàn và vuốt ve bé Bơ đang ngủ say.',
    position: [7.2, 1.45, 2.6],
    camera: { pos: [3.2, 3.0, 5.8], target: [6.2, 0.8, 2.8] },
  },
  {
    id: 'window',
    emoji: '🪟',
    title: 'Khung cửa sổ',
    text: 'Ánh nắng sớm hay ánh trăng đêm len qua rèm cửa – mỗi thời khắc trong phòng đều có một vẻ đẹp riêng.',
    position: [8.6, 3.6, -5.8],
    camera: { pos: [7.2, 2.6, -1.0], target: [8.6, 2.2, -6] },
  },
]
