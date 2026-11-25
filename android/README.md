# NovaFlix cho Android

## Cài APK

Chọn **Tải APK** trên trang chủ NovaFlix hoặc dùng [link tải APK mới nhất](https://github.com/ngxziet/novaflix/releases/latest/download/NovaFlix.apk). Bản APK hỗ trợ Android 8.0 (API 26) trở lên. Mở `NovaFlix.apk` trên điện thoại và xác nhận cài đặt. Nếu Android hỏi, cho phép ứng dụng đang mở tệp cài APK từ nguồn này. Xem phim cần kết nối mạng.

## Cập nhật

- **Thay đổi giao diện, API và trình phát web.** Vercel triển khai các commit trên `main` đến `https://novaflix-lyart.vercel.app/`. APK mở địa chỉ production này, nên khi đóng rồi mở lại NovaFlix, điện thoại tải bản web đã triển khai ngay cả khi vẫn dùng APK cũ.
- **Thay đổi trong thư mục `android/`.** Workflow tự build APK đã ký và phát hành lên GitHub Releases sau khi thay đổi lên `main`. Tải lại từ nút **Tải APK** trên trang chủ rồi cài đè lên bản đang dùng. Có thể tạo bản mới từ **Run workflow** trên `main`. [Workflow Android APK](https://github.com/ngxziet/novaflix/actions/workflows/android-apk.yml)

Giữ application ID `io.github.ngxziet.novaflix` và cùng khóa ký giữa các bản. Workflow tăng `versionCode` theo số lần chạy để Android nhận bản mới. Workflow dùng hai GitHub Actions secrets `NOVAFLIX_KEYSTORE_BASE64` và `NOVAFLIX_KEYSTORE_PASSWORD`. Sao lưu khóa ký và mật khẩu ở nơi an toàn để sau này tiếp tục phát hành bản cập nhật.

## Build cục bộ

Cần JDK 17 trở lên, Android SDK Platform 35 và Build Tools 35.0.0. Đặt `JAVA_HOME` và `ANDROID_HOME`, rồi chạy trong thư mục `android`.

```powershell
.\gradlew.bat :app:assembleDebug :app:lintDebug
```

Bản debug có application ID riêng và có thể cài song song để thử nghiệm. Để build bản cập nhật, đặt `NOVAFLIX_KEYSTORE_FILE` thành đường dẫn tuyệt đối của keystore PKCS12 và `NOVAFLIX_KEYSTORE_PASSWORD` thành mật khẩu của khóa với alias `novaflix`, rồi chạy `assembleRelease`. Chọn `-PnovaVersionCode` lớn hơn mã phiên bản trên máy đích khi phát hành bản cập nhật thủ công. APK nằm trong `app/build/outputs/apk/release/`.
