import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMovieDetail } from "@/lib/movie-service";
import { Play, Star, Calendar, Clock, Film, Clapperboard, Sparkles } from "lucide-react";
import MediaRow from "@/components/home/MediaRow";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const movie = await getMovieDetail(slug);

  if (!movie) {
    notFound();
  }

  const firstServer = movie.episodes[0];
  const firstEpisode = firstServer?.serverData[0];
  const watchHref = `/watch/${movie.slug}${firstEpisode ? `?ep=${firstEpisode.slug}` : ""}`;

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop Header */}
      <div className="relative w-full h-[55vh] min-h-[420px] max-h-[600px] overflow-hidden">
        <Image
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          fill
          priority
          className="object-cover object-center filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-transparent" />
      </div>

      {/* Main Details Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-20">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Column */}
          <div className="w-48 sm:w-60 md:w-72 flex-shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 glow-red">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="text-xs font-black px-2.5 py-1 rounded bg-red-600 text-white uppercase tracking-wider shadow">
                  {movie.quality || "1080p"}
                </span>
              </div>
            </div>

            {/* Quick Watch CTA under poster for mobile/desktop */}
            <div className="mt-4">
              <Link
                href={watchHref}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 hover:scale-102 active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Xem Ngay 1080p</span>
              </Link>
            </div>
          </div>

          {/* Info Column */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap mb-2">
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)} / 10</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-300 px-2 py-0.5 rounded bg-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{movie.releaseYear}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-300 px-2 py-0.5 rounded bg-white/10">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{movie.duration || "Trọn bộ"}</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.originalTitle && (
                <p className="text-base sm:text-lg text-zinc-400 font-medium mt-1">
                  {movie.originalTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/10"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
                Tóm tắt nội dung
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
                {movie.overview}
              </p>
            </div>

            {/* Director & Cast */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              {movie.director && (
                <div className="text-xs sm:text-sm text-zinc-400">
                  <span className="font-bold text-zinc-200">Đạo diễn: </span>
                  <span>{movie.director}</span>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div className="text-xs sm:text-sm text-zinc-400">
                  <span className="font-bold text-zinc-200">Diễn viên: </span>
                  <span>{movie.cast.map((c) => c.name).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Episodes List Preview (if series) */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="pt-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  Danh Sách Tập Phim ({firstServer?.serverData.length || 0} tập)
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap max-h-48 overflow-y-auto p-1">
                  {firstServer?.serverData.map((ep) => (
                    <Link
                      key={ep.slug}
                      href={`/watch/${movie.slug}?ep=${ep.slug}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white border border-white/10 hover:border-red-500 text-xs font-semibold transition-all"
                    >
                      {ep.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Movies */}
      {movie.similarMovies && movie.similarMovies.length > 0 && (
        <div className="mt-16">
          <MediaRow
            title="Tác Phẩm Tương Tự Bạn Sẽ Thích"
            movies={movie.similarMovies}
          />
        </div>
      )}
    </div>
  );
}
