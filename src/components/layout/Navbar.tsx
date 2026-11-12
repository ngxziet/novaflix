"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Film, Search, Bookmark, Sparkles, Tv, Clapperboard, MonitorPlay, Ghost, Globe } from "lucide-react";

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
    { href: "/movies", label: "Phim Lẻ", icon: Clapperboard },
    { href: "/series", label: "Phim Bộ", icon: Tv },
    { href: "/anime", label: "Hoạt Hình", icon: MonitorPlay },
    { href: "/the-loai/kinh-di", label: "Kinh Dị", icon: Ghost },
    { href: "/quoc-gia/han-quoc", label: "Phim Hàn", icon: Globe },
    { href: "/quoc-gia/trung-quoc", label: "Phim Trung", icon: Globe },
    { href: "/my-vault", label: "Kho Phim", icon: Bookmark },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#07080b]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-2.5"
          : "bg-gradient-to-b from-[#07080b]/95 via-[#07080b]/70 to-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-wider text-white flex items-center gap-1.5 leading-none">
                NOVA<span className="text-red-500">FLIX</span>
                <span className="text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                  1080p
                </span>
              </span>
              <span className="text-[9px] text-zinc-400 tracking-wider font-mono">PRIVATE CINEMA</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "text-white bg-white/15 shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Medium screens nav links (compact) */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navLinks.slice(0, 5).map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive ? "text-white bg-white/15" : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls: Dual Search Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            href="/search?mode=ai"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-purple-500/40 text-purple-200 hover:text-white hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            title="Tìm kiếm bằng trí tuệ nhân tạo Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Vibe Search</span>
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
            title="Tìm kiếm từ khóa"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Tìm kiếm</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
