import { notFound } from "next/navigation";
import Link from "next/link";
import { getMovieDetail } from "@/lib/movie-service";
import CinePlayer from "@/components/player/CinePlayer";
import MediaRow from "@/components/home/MediaRow";
import { Film, Server, Layers, Keyboard, Sparkles } from "lucide-react";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ep?: string; server?: string }>;
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug } = await params;
  const { ep, server } = await searchParams;

  const movie = await getMovieDetail(slug);
  if (!movie) {
    notFound();
  }

  // Chọn server & tập phim
  const selectedServerIndex = server ? parseInt(server, 10) : 0;
  const activeServer = movie.episodes[selectedServerIndex] || movie.episodes[0];
  const activeEpisodes = activeServer?.serverData || [];

  const currentEpisode = ep
    ? activeEpisodes.find((e) => e.slug === ep) || activeEpisodes[0]
    : activeEpisodes[0];

  if (!currentEpisode) {
    notFound();
  }

  return (
    <div className="min-h-screen pb-20 pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Player Section with Ambient Glow */}
      <div className="relative z-20">
        <CinePlayer
          movieSlug={movie.slug}
          movieTitle={movie.title}
          posterUrl={movie.backdropUrl || movie.posterUrl}
          episode={currentEpisode}
        />
      </div>

      {/* Info & Navigation below player */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Movie Info & Servers */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                {currentEpisode.quality || "1080p"} FHD
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                {activeServer.serverName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {movie.title} - <span className="text-red-500">{currentEpisode.name}</span>
            </h1>

            {movie.originalTitle && (
              <p className="text-sm text-zinc-400 mt-1">{movie.originalTitle}</p>
            )}
          </div>

          {/* Server Switcher */}
          {movie.episodes.length > 1 && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Server className="w-4 h-4 text-red-500" />
                <span>Chọn Nguồn Phát Dự Phòng (Đều chuẩn 1080p):</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {movie.episodes.map((s, idx) => (
                  <Link
                    key={s.serverName}
                    href={`/watch/${movie.slug}?server=${idx}&ep=${currentEpisode.slug}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      idx === selectedServerIndex
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {s.serverName}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Episode Selector */}
          {activeEpisodes.length > 1 && (
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Chọn Tập Phim ({activeEpisodes.length} tập):</span>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto pr-1">
                {activeEpisodes.map((item) => {
                  const isActive = item.slug === currentEpisode.slug;
                  return (
                    <Link
                      key={item.slug}
                      href={`/watch/${movie.slug}?server=${selectedServerIndex}&ep=${item.slug}`}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/40"
                          : "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overview */}
          <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/30 p-4 rounded-xl border border-white/5">
            <h3 className="text-white font-bold mb-1">Nội dung tác phẩm</h3>
            <p>{movie.overview}</p>
          </div>
        </div>

        {/* Right Column: Keyboard Shortcuts Cheat Sheet */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Keyboard className="w-4 h-4 text-red-500" />
            <span>Phím Tắt Điều Khiển Chuyên Nghiệp</span>
          </div>
          <div className="space-y-2.5 text-xs text-zinc-300 font-mono">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Phát / Tạm dừng</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">Space / K</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Toàn màn hình</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">F</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Tua Lùi / Tiến 10s</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">J / L</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Tắt tiếng</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/10">M</kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-amber-400">Audio Boost (180%)</span>
              <kbd className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">B</kbd>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-cyan-400">Bật/Tắt Ambient Glow</span>
              <kbd className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">G</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Movies */}
      {movie.similarMovies && (
        <div className="mt-16">
          <MediaRow
            title="Đề Xuất Phim Tiếp Theo"
            movies={movie.similarMovies}
          />
        </div>
      )}
    </div>
  );
}
