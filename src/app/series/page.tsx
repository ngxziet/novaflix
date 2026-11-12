import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Tv } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Kho Phim Bộ Thịnh Hành - NovaFlix",
  description: "Trọn bộ phim truyền hình, series nhiều tập chất lượng cao.",
};

export const revalidate = 3600;

export default async function SeriesPage() {
  const movies = await getMoviesByType("phim-bo", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Phim Bộ Dài Tập Đặc Sắc
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30">
                Full Tập Vietsub
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Cập nhật nhanh nhất đầy đủ các tập, thuyết minh và phụ đề Vietsub
            </p>
          </div>
        </div>

        {/* Quick Country Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/quoc-gia/han-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            🇰🇷 Phim Hàn Quốc
          </Link>
          <Link
            href="/quoc-gia/trung-quoc"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            🇨🇳 Cổ Trang Trung Quốc
          </Link>
          <Link
            href="/quoc-gia/au-my"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            🇺🇸 Series Âu Mỹ
          </Link>
          <Link
            href="/the-loai/tinh-cam"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 whitespace-nowrap hover:bg-zinc-800 transition-all"
          >
            ❤️ Tình Cảm
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
