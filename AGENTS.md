<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Android APK và link tải

- APK trong `android/` mở website production `https://novaflix-lyart.vercel.app/`. Thay đổi web được Vercel triển khai từ `main` và có hiệu lực khi mở lại app.
- Giữ application ID `io.github.ngxziet.novaflix`, khóa ký hiện tại và `versionCode` tăng dần để người dùng cài đè được. Khóa ký dùng GitHub Actions secrets của workflow `.github/workflows/android-apk.yml`.
- Nút **Tải APK** trên trang chủ trỏ tới `/download/android`. Endpoint chuyển tới tệp của phiên bản mới nhất trên GitHub Releases. Workflow tạo bản phát hành Android công khai có tệp `NovaFlix.apk` và đánh dấu bản đó là Latest. Giữ tên tệp và đường dẫn tải ổn định, đồng thời kiểm tra đúng phiên bản và tải được khi chưa đăng nhập sau khi đổi cách phát hành.
