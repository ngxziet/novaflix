"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Clock, Trash2, Play, Star, Film } from "lucide-react";
import { getFavorites, getWatchHistory, toggleFavorite } from "@/lib/storage";
import { FavoriteMovieItem, WatchHistoryItem } from "@/types/movie";
import { formatSecondsToTime } from "@/lib/utils";

export default function MyVaultPage() {
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");
  const [favorites, setFavorites] = useState<FavoriteMovieItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(getWatchHistory());
  }, []);

  const handleRemoveFavorite = (slug: string) => {
    const movie = favorites.find((f) => f.slug === slug);
    if (movie) {
      toggleFavorite(movie);
      setFavorites(getFavorites());
    }
  };

  const handleClearHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?")) {
      localStorage.removeItem("novaflix_watch_history");
      setHistory([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-red-500" />
            <span>Kho Phim Của Bạn</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Lưu trữ cục bộ bảo mật trên thiết bị (Local-First Privacy), không cần tài khoản
          </p>
        </div>

        {/* Tab switch */}
        <div className="p-1 rounded-xl bg-zinc-900 border border-white/10 flex items-center self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "favorites"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Phim Đã Lưu ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Xem Dở ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Favorites Content */}
      {activeTab === "favorites" && (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
              <Film className="w-12 h-12 text-zinc-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">Chưa có phim nào trong kho lưu</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Nhấn vào biểu tượng Bookmark trên bất kỳ poster phim nào để lưu vào đây
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors shadow-lg"
              >
                Khám phá phim ngay
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favorites.map((m) => (
                <div
                  key={m.slug}
                  className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between"
                >
                  <Link href={`/movie/${m.slug}`} className="relative aspect-[2/3] w-full block overflow-hidden">
                    <Image
                      src={m.posterUrl}
                      alt={m.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
                        {m.quality || "1080p"}
                      </span>
                    </div>
                  </Link>

                  <div className="p-3 flex flex-col justify-between flex-1">
                    <Link href={`/movie/${m.slug}`}>
                      <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                        {m.title}
                      </h4>
                    </Link>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{m.rating.toFixed(1)}</span>
                      </div>

                      <button
                        onClick={() => handleRemoveFavorite(m.slug)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Xóa khỏi kho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Content */}
      {activeTab === "history" && (
        <div>
          {history.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearHistory}
                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa sạch lịch sử</span>
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
              <Clock className="w-12 h-12 text-zinc-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">Chưa có lịch sử xem dở</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Khi bạn bắt đầu xem bất kỳ phim nào, tiến trình từng giây sẽ tự động lưu tại đây
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {history.map((item) => (
                <div
                  key={item.slug}
                  className="group rounded-xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between"
                >
                  <Link href={`/watch/${item.slug}`} className="relative aspect-video w-full block overflow-hidden">
                    <Image
                      src={item.backdropUrl || item.posterUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Progress */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </Link>

                  <div className="p-3">
                    <Link href={`/watch/${item.slug}`}>
                      <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                        {item.title}
                      </h4>
                    </Link>
                    <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                      <span className="text-red-400 font-medium">{item.episodeName || "1080p"}</span>
                      <span>
                        {formatSecondsToTime(item.progressSeconds)} / {formatSecondsToTime(item.durationSeconds)} ({item.percent}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
