"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Film, Search, Bookmark, Sparkles, Tv, Clapperboard, MonitorPlay } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Trang Chủ", icon: Film },
    { href: "/movies", label: "Phim Lẻ 1080p", icon: Clapperboard },
    { href: "/series", label: "Phim Bộ", icon: Tv },
    { href: "/anime", label: "Hoạt Hình", icon: MonitorPlay },
    { href: "/my-vault", label: "Kho Phim", icon: Bookmark },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#07080b]/90 backdrop-blur-md border-b border-white/10 shadow-2xl py-3"
          : "bg-gradient-to-b from-[#07080b]/90 via-[#07080b]/40 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white flex items-center gap-1.5">
                NOVA<span className="text-red-500">FLIX</span>
                <span className="text-[10px] font-semibold tracking-widest px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  1080p
                </span>
              </span>
              <span className="text-[10px] text-zinc-400 tracking-wider font-mono">PRIVATE CINEMA</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls: Dual Search Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/search?mode=ai"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-purple-500/40 text-purple-200 hover:text-white hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            title="Tìm kiếm bằng trí tuệ nhân tạo Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Vibe Search</span>
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
            title="Tìm kiếm từ khóa"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Tìm phim...</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
