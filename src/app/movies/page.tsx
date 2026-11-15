import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Clapperboard } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Kho Phim Lẻ Chuẩn 1080p - NovaFlix",
  description: "Trọn bộ phim lẻ điện ảnh chiếu rạp độ phân giải tối thiểu 1080p Full HD.",
};

export const revalidate = 300;

export default async function MoviesPage() {
  const movies = await getMoviesByType("phim-le", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Clapperboard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                Phim Lẻ Điện Ảnh
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                1080p Certified
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tuyển tập phim lẻ chiếu rạp với độ nét cao nhất, âm thanh sống động
            </p>
          </div>
        </div>

        {/* Quick Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/the-loai/kinh-di"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Kinh Dị
          </Link>
          <Link
            href="/the-loai/hanh-dong"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Hành Động
          </Link>
          <Link
            href="/quoc-gia/au-my"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Âu Mỹ
          </Link>
          <Link
            href="/quoc-gia/han-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Hàn Quốc
          </Link>
          <Link
            href="/quoc-gia/trung-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            Trung Quốc
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
