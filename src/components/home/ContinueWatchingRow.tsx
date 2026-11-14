"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Sparkles } from "lucide-react";
import { getWatchHistory } from "@/lib/storage";
import { WatchHistoryItem } from "@/types/movie";
import { formatSecondsToTime } from "@/lib/utils";

export default function ContinueWatchingRow() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-red-500" />
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
          Tiếp Tục Xem Dở
        </h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
          Local Storage
        </span>
      </div>

      <div
        className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {history.map((item) => {
          const watchUrl = `/watch/${item.slug}${item.episodeSlug ? `?ep=${item.episodeSlug}` : ""}`;
          return (
            <div
              key={item.slug}
              className="w-[240px] sm:w-[280px] flex-shrink-0 group rounded-xl overflow-hidden bg-zinc-900/80 border border-white/10 hover:border-red-500/40 transition-all flex flex-col justify-between"
            >
              <Link href={watchUrl} className="relative aspect-video w-full block overflow-hidden">
                <Image
                  src={item.backdropUrl || item.posterUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Progress Bar at the bottom of the thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                  <div
                    className="h-full bg-red-600"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </Link>

              <div className="p-3">
                <Link href={watchUrl}>
                  <h3 className="font-bold text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>
                </Link>

                <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-400">
                  <span className="text-red-400 font-medium">{item.episodeName || "Bản 1080p"}</span>
                  <span>
                    {formatSecondsToTime(item.progressSeconds)} / {formatSecondsToTime(item.durationSeconds)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
