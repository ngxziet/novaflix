import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { MonitorPlay } from "lucide-react";

export const metadata = {
  title: "Kho Hoạt Hình & Anime - NovaFlix",
  description: "Tuyển tập anime và hoạt hình 3D đỉnh cao sắc nét.",
};

export const revalidate = 3600;

export default async function AnimePage() {
  const movies = await getMoviesByType("hoat-hinh", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
          <MonitorPlay className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Hoạt Hình & Anime Tuyển Chọn
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Thế giới đồ họa đỉnh cao với màu sắc rực rỡ và cảm xúc thăng hoa
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
