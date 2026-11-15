import { notFound } from "next/navigation";
import { getMoviesByGenre } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Film } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const GENRE_NAMES: Record<string, string> = {
  "kinh-di": "Phim Kinh Dị Rùng Rợn",
  "hanh-dong": "Phim Hành Động Kịch Tính",
  "tinh-cam": "Phim Tình Cảm Lãng Mạn",
  "khoa-hoc-vien-tuong": "Phim Khoa Học Viễn Tưởng",
  "vien-tuong": "Phim Viễn Tưởng",
  "tam-ly": "Phim Tâm Lý Kịch Tính",
  "hai-huoc": "Phim Hài Hước Giải Trí",
  "co-trang": "Phim Cổ Trang & Kiếm Hiệp",
  "hinh-su": "Phim Tội Phạm & Hình Sự",
  "phieu-luu": "Phim Phiêu Lưu Kỳ Thú",
  "chien-tranh": "Phim Chiến Tranh & Quân Sự",
  "hoat-hinh": "Phim Hoạt Hình & Anime",
};

export const revalidate = 300;

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params;
  const movies = await getMoviesByGenre(slug, 1);

  if (!movies || movies.length === 0) {
    notFound();
  }

  const title = GENRE_NAMES[slug] || `Thể Loại: ${slug.replace("-", " ").toUpperCase()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Tuyển tập phim chuẩn 1080p sắc nét, âm thanh sống động
            </p>
          </div>
        </div>

        {/* Quick Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {Object.entries(GENRE_NAMES).slice(0, 6).map(([key, name]) => (
            <Link
              key={key}
              href={`/the-loai/${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                key === slug
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {name.replace("Phim ", "")}
            </Link>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
