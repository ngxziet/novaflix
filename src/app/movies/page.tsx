import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Clapperboard } from "lucide-react";

export const metadata = {
  title: "Kho Phim Lẻ Chuẩn 1080p - NovaFlix",
  description: "Trọn bộ phim lẻ điện ảnh chiếu rạp độ phân giải tối thiểu 1080p Full HD.",
};

export const revalidate = 3600;

export default async function MoviesPage() {
  const movies = await getMoviesByType("phim-le", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
          <Clapperboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Phim Lẻ Điện Ảnh (1080p FHD)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Tuyển tập phim lẻ chiếu rạp với độ nét cao nhất, âm thanh sống động
          </p>
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
