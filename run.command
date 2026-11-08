#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "============================================="
echo "   ĐANG KHỞI CHẠY GÓC NHỎ CỦA KHOA (3D)...  "
echo "============================================="

# Mở trình duyệt sau 1.5 giây
(sleep 2 && open "http://localhost:5180") &

# Chạy server
npx vite --port 5180
