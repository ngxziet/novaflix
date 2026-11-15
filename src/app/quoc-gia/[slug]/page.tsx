import { notFound } from "next/navigation";
import { getMoviesByCountry } from "@/lib/movie-service";
import MovieCard from "@/components/home/MovieCard";
import { Globe } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const COUNTRY_NAMES: Record<string, string> = {
  "han-quoc": "Phim Hàn Quốc Tuyển Chọn (K-Drama)",
  "trung-quoc": "Phim Trung Quốc & Cổ Trang",
  "au-my": "Phim Âu Mỹ & Hollywood Bom Tấn",
  "nhat-ban": "Phim Nhật Bản & Live Action",
  "thai-lan": "Phim Thái Lan Kịch Tính & Hài Hước",
  "hong-kong": "Phim Hồng Kông Kinh Điển",
  "viet-nam": "Điện Ảnh Việt Nam",
};

export const revalidate = 300;

export default async function CountryPage({ params }: PageProps) {
  const { slug } = await params;
  const movies = await getMoviesByCountry(slug, 1);

  if (!movies || movies.length === 0) {
    notFound();
  }

  const title = COUNTRY_NAMES[slug] || `Quốc Gia: ${slug.replace("-", " ").toUpperCase()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Các tác phẩm điện ảnh xuất sắc nhất đạt chuẩn 1080p Full HD
            </p>
          </div>
        </div>

        {/* Quick Country Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {Object.entries(COUNTRY_NAMES).map(([key, name]) => (
            <Link
              key={key}
              href={`/quoc-gia/${key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                key === slug
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
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
