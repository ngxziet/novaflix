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

export const revalidate = 1800; // Cập nhật lại dữ liệu mỗi 30 phút

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

      {/* Row: Phim Kinh Dị Rùng Rợn */}
      <MediaRow
        title="👻 Ám Ảnh & Kinh Dị Rùng Rợn"
        subtitle="Hồi hộp, thót tim với những bí ẩn kinh hoàng"
        movies={horrorMovies.slice(0, 14)}
        viewAllHref="/the-loai/kinh-di"
      />

      {/* Row: Phim Hàn Quốc K-Drama */}
      <MediaRow
        title="🌸 Phim Hàn Quốc Đặc Sắc (K-Drama)"
        subtitle="Tình cảm lãng mạn & kịch tính đỉnh cao từ xứ sở Kim Chi"
        movies={koreanMovies.slice(0, 14)}
        viewAllHref="/quoc-gia/han-quoc"
      />

      {/* Row: Phim Trung Quốc & Cổ Trang */}
      <MediaRow
        title="🏮 Phim Trung Quốc & Cổ Trang"
        subtitle="Kiếm hiệp, tiên hiệp và chuyện tình cổ trang huyền ảo"
        movies={chineseMovies.slice(0, 14)}
        viewAllHref="/quoc-gia/trung-quoc"
      />

      {/* Row: Tuyển Tập Bom Tấn Điển Hình */}
      <MediaRow
        title="🎬 Kiệt Tác Điện Ảnh Tuyển Chọn"
        subtitle="Hình ảnh sắc nét 4K & âm thanh sống động"
        movies={FALLBACK_BLOCKBUSTERS}
      />

      {/* Row: Phim Lẻ Đỉnh Cao */}
      <MediaRow
        title="🍿 Điện Ảnh Chiếu Rạp Mới"
        subtitle="Trọn bộ phim lẻ chuẩn rạp không quảng cáo"
        movies={singleMovies.slice(0, 14)}
        viewAllHref="/movies"
      />

      {/* Row: Hoạt Hình & Anime */}
      <MediaRow
        title="🎨 Hoạt Hình & Anime Nhật Bản"
        subtitle="Thế giới đồ họa đỉnh cao với màu sắc rực rỡ"
        movies={animeMovies.slice(0, 14)}
        viewAllHref="/anime"
      />
    </div>
  );
}
