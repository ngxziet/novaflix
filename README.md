# 🎬 NovaFlix - Private Cinema Experience

> **Nền tảng xem phim cá nhân thế hệ mới**, chuẩn hình ảnh tối thiểu **1080p Full HD / 4K**, giao diện điện ảnh Cinematic Glassmorphism với hiệu ứng **Ambient Glow**, tích hợp **2 chế độ tìm kiếm độc lập (Từ khóa & Gemini AI)**, và tối ưu hóa 100% cho việc triển khai trên **Vercel**.

---

## ✨ Điểm Nổi Bật Vượt Trội So Với Netflix

- 💎 **Chuẩn hình ảnh $\ge$ 1080p (Full HD / 4K):** Bộ lọc nguồn thông minh tự động ưu tiên các luồng phát tốc độ cao và độ sắc nét tối đa, loại bỏ hoàn toàn bản CAM/SD kém chất lượng.
- 🌌 **Hiệu ứng Hào quang Ambient Glow:** Đồng bộ màu sắc viền video ra nền đen xung quanh màn hình bằng GPU Canvas theo thời gian thực (như rạp IMAX tràn viền).
- 🔊 **Audio Booster (180% - 200%):** Tích hợp Web Audio API khuếch đại âm lượng thoại (Vocal Clarity), nghe rõ từng câu thoại ngay cả ban đêm mà không cần chỉnh to volume.
- 🧠 **Dual Search Engine (2 Chế độ tìm kiếm):**
  - **Chế độ 1 (Từ khóa):** Tra cứu tức thì tên phim, diễn viên, đạo diễn với Debounce & Autocomplete.
  - **Chế độ 2 (AI Semantic - Google Gemini):** Tìm theo cảm xúc, cốt truyện miêu tả bằng ngôn ngữ tự nhiên (Ví dụ: *"Phim du hành thời gian có plot twist bất ngờ"*).
- 🛡️ **Private Cinema (Local-First):** Lược bỏ hoàn toàn bình luận mạng xã hội rườm rà. Lịch sử xem dở (từng giây) và danh sách yêu thích được lưu trực tiếp trên trình duyệt, không cần đăng ký tài khoản.
- 📱 **Progressive Web App (PWA):** Tương thích mọi trình duyệt (Safari iOS, Chrome, Edge, Android, Smart TV), có thể bấm "Thêm vào màn hình chính" để mở full màn hình không viền như native app.

---

## ⌨️ Phím Tắt Điều Khiển CinePlayer Pro

| Phím tắt | Chức năng |
| :--- | :--- |
| `Space` hoặc `K` | Phát / Tạm dừng video |
| `F` | Toàn màn hình (Fullscreen) |
| `J` / `Mũi tên trái` | Tua lùi 10 giây |
| `L` / `Mũi tên phải` | Tua tiến 10 giây |
| `M` | Tắt / Bật tiếng (Mute) |
| `B` | Bật / Tắt Audio Booster (Kích âm lượng 180%) |
| `G` | Bật / Tắt Hào quang Ambient Glow |

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Development)

```bash
# 1. Cài đặt dependencies (nếu chưa có)
npm install

# 2. Tạo file biến môi trường .env.local (tùy chọn)
cp .env.example .env.local
# Điền GEMINI_API_KEY nếu muốn kích hoạt trí tuệ nhân tạo Gemini

# 3. Chạy server phát triển
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

---

## 🌐 Hướng Dẫn Deploy Lên Vercel (1-Click)

### Cách 1: Qua giao diện Vercel Dashboard (Khuyên dùng)
1. Đẩy mã nguồn lên tài khoản GitHub/GitLab của bạn:
   ```bash
   git add .
   git commit -m "feat: complete NovaFlix private cinema streaming platform"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Chọn repository vừa tạo.
3. Thêm biến môi trường:
   - `GEMINI_API_KEY`: Key lấy từ [Google AI Studio](https://aistudio.google.com).
4. Nhấn **Deploy**. Sau ~1 phút, bạn sẽ nhận được link web dạng `https://ten-du-an.vercel.app` mở được trên mọi thiết bị!

### Cách 2: Deploy trực tiếp bằng Vercel CLI
```bash
npm i -g vercel
vercel
```

## Cập nhật dữ liệu phim

Danh sách phim, danh mục và thông tin phim/tập phim dùng cache 300 giây (5 phút). Sau khi cache hết hạn, lượt truy cập tiếp theo kích hoạt lấy lại dữ liệu từ PhimAPI ở nền; các lượt truy cập sau khi hoàn tất sẽ nhận dữ liệu mới. Đây là cơ chế ISR của Next.js, không phải cron chạy khi không có người truy cập. Tìm kiếm tiếp tục lấy dữ liệu trực tiếp, không lưu cache.
