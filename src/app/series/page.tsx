import { getMoviesByType } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Tv } from "lucide-react";

export const metadata = {
  title: "Kho Phim Bộ Thịnh Hành - NovaFlix",
  description: "Trọn bộ phim truyền hình, series nhiều tập chất lượng cao.",
};

export const revalidate = 3600;

export default async function SeriesPage() {
  const movies = await getMoviesByType("phim-bo", 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
          <Tv className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Phim Bộ Dài Tập Đặc Sắc
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Cập nhật nhanh nhất đầy đủ các tập, thuyết minh và phụ đề Vietsub
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
