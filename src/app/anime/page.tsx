import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { MonitorPlay } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Kho Hoạt Hình & Anime - NovaFlix",
  description: "Tuyển tập anime và hoạt hình 3D đỉnh cao sắc nét chuẩn 1080p.",
};

export const revalidate = 3600;

export default async function AnimePage() {
  const movies = await getMoviesByType("hoat-hinh", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <MonitorPlay className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                Hoạt Hình & Anime Tuyển Chọn
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                1080p
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Đồ họa sắc nét, âm thanh sống động và cảm xúc trọn vẹn
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/quoc-gia/nhat-ban"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Anime Nhật Bản
          </Link>
          <Link
            href="/quoc-gia/trung-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Hoạt Hình 3D
          </Link>
          <Link
            href="/the-loai/kinh-di"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Kinh Dị
          </Link>
        </div>
      </div>

      {/* Grid: 2 cols on mobile, 3-4 on tablet, 5-6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
