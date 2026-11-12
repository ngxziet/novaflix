import {
  getTrendingMovies,
  getMoviesByType,
  getMoviesByGenre,
  getMoviesByCountry,
} from "@/lib/movie-service";
import HeroSpotlight from "@/components/home/HeroSpotlight";
import MediaRow from "@/components/home/MediaRow";
import ContinueWatchingRow from "@/components/home/ContinueWatchingRow";
import { FALLBACK_BLOCKBUSTERS } from "@/lib/constants";

export const revalidate = 1800;

export default async function HomePage() {
  const [trending, singleMovies, horrorMovies, koreanMovies, chineseMovies, animeMovies] =
    await Promise.all([
      getTrendingMovies(1),
      getMoviesByType("phim-le", 1),
      getMoviesByGenre("kinh-di", 1),
      getMoviesByCountry("han-quoc", 1),
      getMoviesByCountry("trung-quoc", 1),
      getMoviesByType("hoat-hinh", 1),
    ]);

  const heroMovie = trending[0] || FALLBACK_BLOCKBUSTERS[0];

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Spotlight Header */}
      <HeroSpotlight movie={heroMovie} />

      {/* Continue Watching (Local Storage First) */}
      <ContinueWatchingRow />

      {/* Row: Phim Mới Cập Nhật */}
      <MediaRow
        title="Phim Mới Cập Nhật"
        subtitle="Bản phát hành chuẩn 1080p Full HD nét nhất"
        movies={trending.slice(1, 15)}
        viewAllHref="/movies"
      />

      {/* Row: Phim Kinh Dị & Giật Gân */}
      <MediaRow
        title="Phim Kinh Dị & Giật Gân"
        subtitle="Hồi hộp, bí ẩn và căng thẳng tâm lý"
        movies={horrorMovies.slice(0, 14)}
        viewAllHref="/the-loai/kinh-di"
      />

      {/* Row: Điện Ảnh Hàn Quốc */}
      <MediaRow
        title="Điện Ảnh Hàn Quốc"
        subtitle="Phim truyền hình & kịch tính Hàn Quốc mới nhất"
        movies={koreanMovies.slice(0, 14)}
        viewAllHref="/quoc-gia/han-quoc"
      />

      {/* Row: Phim Cổ Trang & Trung Quốc */}
      <MediaRow
        title="Phim Truyền Hình Trung Quốc"
        subtitle="Cổ trang, kiếm hiệp và tình cảm truyền hình"
        movies={chineseMovies.slice(0, 14)}
        viewAllHref="/quoc-gia/trung-quoc"
      />

      {/* Row: Tuyển Tập Điển Hình 4K */}
      <MediaRow
        title="Kiệt Tác Điện Ảnh 4K"
        subtitle="Hình ảnh sắc nét tối đa và âm thanh nguyên bản"
        movies={FALLBACK_BLOCKBUSTERS}
      />

      {/* Row: Phim Lẻ Chiếu Rạp */}
      <MediaRow
        title="Phim Lẻ Chiếu Rạp"
        subtitle="Trọn bộ phim lẻ phát hành rạp không quảng cáo"
        movies={singleMovies.slice(0, 14)}
        viewAllHref="/movies"
      />

      {/* Row: Hoạt Hình & Anime */}
      <MediaRow
        title="Hoạt Hình & Anime"
        subtitle="Tuyển tập hoạt hình 3D & anime chất lượng cao"
        movies={animeMovies.slice(0, 14)}
        viewAllHref="/anime"
      />
    </div>
  );
}
