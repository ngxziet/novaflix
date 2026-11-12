import { getTrendingMovies, getMoviesByType } from "@/lib/movie-service";
import HeroSpotlight from "@/components/home/HeroSpotlight";
import MediaRow from "@/components/home/MediaRow";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import { FALLBACK_BLOCKBUSTERS } from "@/lib/constants";

export const revalidate = 1800; // Cập nhật lại dữ liệu mỗi 30 phút

export default async function HomePage() {
  const [trending, singleMovies, seriesMovies, animeMovies] = await Promise.all([
    getTrendingMovies(1),
    getMoviesByType("phim-le", 1),
    getMoviesByType("phim-bo", 1),
    getMoviesByType("hoat-hinh", 1),
  ]);

  const heroMovie = trending[0] || FALLBACK_BLOCKBUSTERS[0];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Spotlight Header */}
      <HeroSpotlight movie={heroMovie} />

      {/* Continue Watching (Local Storage First) */}
      <ContinueWatchingRow />

      {/* Row: Phim Mới Cập Nhật Chuẩn 1080p */}
      <MediaRow
        title="Phim Mới Cập Nhật (1080p FHD)"
        subtitle="Các tác phẩm vừa được cập nhật bản nét nhất"
        movies={trending.slice(1, 15)}
        viewAllHref="/movies"
      />

      {/* Row: Tuyển Tập Bom Tấn Điển Hình */}
      <MediaRow
        title="Kiệt Tác Điện Ảnh Tuyển Chọn"
        subtitle="Hình ảnh sắc nét 4K & âm thanh sống động"
        movies={FALLBACK_BLOCKBUSTERS}
      />

      {/* Row: Phim Lẻ Đỉnh Cao */}
      <MediaRow
        title="Điện Ảnh Chiếu Rạp"
        subtitle="Trọn bộ phim lẻ chuẩn rạp không quảng cáo"
        movies={singleMovies.slice(0, 14)}
        viewAllHref="/movies"
      />

      {/* Row: Phim Bộ Thịnh Hành */}
      <MediaRow
        title="Phim Bộ Dài Tập Đặc Sắc"
        subtitle="Cập nhật nhanh nhất đầy đủ các tập"
        movies={seriesMovies.slice(0, 14)}
        viewAllHref="/series"
      />

      {/* Row: Hoạt Hình & Anime */}
      <MediaRow
        title="Hoạt Hình & Anime Tuyển Chọn"
        subtitle="Thế giới đồ họa đỉnh cao với màu sắc rực rỡ"
        movies={animeMovies.slice(0, 14)}
        viewAllHref="/anime"
      />
    </div>
  );
}
