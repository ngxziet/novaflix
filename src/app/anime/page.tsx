import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { MonitorPlay, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Kho Hoạt Hình & Anime - NovaFlix",
  description: "Tuyển tập anime và hoạt hình 3D đỉnh cao sắc nét chuẩn 1080p.",
};

export const revalidate = 3600;

export default async function AnimePage() {
  const movies = await getMoviesByType("hoat-hinh", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header with clear separation and filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Hoạt Hình & Anime Tuyển Chọn
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-600/20 text-pink-400 border border-pink-500/30">
                1080p FHD
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Thế giới đồ họa đỉnh cao với màu sắc rực rỡ và cảm xúc thăng hoa
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/quoc-gia/nhat-ban"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            🇯🇵 Anime Nhật Bản
          </Link>
          <Link
            href="/quoc-gia/trung-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            🇨🇳 Hoạt Hình 3D Trung Quốc
          </Link>
          <Link
            href="/the-loai/kinh-di"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            👻 Anime Kinh Dị
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
