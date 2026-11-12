import Link from "next/link";
import { Film, ShieldCheck, Sparkles, MonitorPlay } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-[#050608] text-zinc-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-bold tracking-wide flex items-center gap-2">
              NovaFlix Private Cinema
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1080p Verified
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rạp phim cá nhân cao cấp - Không quảng cáo - Không mạng xã hội rác
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local-First Privacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Gemini AI Discovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MonitorPlay className="w-4 h-4 text-cyan-400" />
            <span>CinePlayer Pro</span>
          </div>
        </div>

        <div className="text-xs text-zinc-600 text-center md:text-right">
          © {new Date().getFullYear()} NovaFlix. Optimized for Vercel & PWA.
        </div>
      </div>
    </footer>
  );
}
