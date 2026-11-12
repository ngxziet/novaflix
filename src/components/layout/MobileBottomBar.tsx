"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Clapperboard, Tv, Search, Bookmark } from "lucide-react";

export default function MobileBottomBar() {
  const pathname = usePathname();

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-modal", { detail: { mode: "keyword" } }));
  };

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Film },
    { href: "/movies", label: "Phim lẻ", icon: Clapperboard },
    { href: "/series", label: "Phim bộ", icon: Tv },
    { href: "/my-vault", label: "Kho phim", icon: Bookmark },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#07080b]/90 backdrop-blur-xl border-t border-white/10 px-3 py-1.5 pb-safe shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Search Button */}
        <button
          onClick={handleOpenSearch}
          className="flex flex-col items-center gap-1 py-1 px-3 -mt-3.5"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-zinc-300 font-medium">Tìm kiếm</span>
        </button>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
