# Góc nhỏ của Khoa 🏠

Căn phòng 3D tương tác (React + Three.js / React Three Fiber).

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # xuất bản vào dist/
```

## Tuỳ chỉnh

| Muốn đổi | File |
|---|---|
| Tiêu đề, link portfolio, nhạc | `src/data/config.ts` |
| Tên & mô tả 2 bé chó | `src/data/config.ts` → `DOGS` |
| Nội dung 8 ký ức | `src/data/memories.ts` |
| Vị trí / màu đồ nội thất | `src/scene/Furniture.tsx` |
| Màu tường, sàn, thảm, ánh sáng | `src/scene/Room.tsx` |

## Nhạc nền "Kiss the Rain"

Nhạc có bản quyền nên không kèm sẵn. Đặt file mp3 vào:

```
public/audio/kiss-the-rain.mp3
```

## Deploy

Đưa thư mục lên GitHub rồi import vào Vercel/Netlify (Build: `npm run build`, Output: `dist`).
