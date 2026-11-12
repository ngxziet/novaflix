import type { Metadata, Viewport } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#07080b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NovaFlix - Private Cinema Experience (1080p FHD)",
  description: "Rạp phim cá nhân cao cấp chuẩn 1080p/4K với hiệu ứng Ambient Glow và tìm kiếm thông minh bằng Google Gemini AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NovaFlix",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#07080b] text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-red-600 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full pt-20 sm:pt-24 min-h-[calc(100vh-140px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
