"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Play, Info, Star, Sparkles, Check, Bookmark } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { isFavorite, toggleFavorite } from "@/lib/storage";

interface HeroSpotlightProps {
  movie: MovieItem;
}

export default function HeroSpotlight({ movie }: HeroSpotlightProps) {
  const [backdropSrc, setBackdropSrc] = useState(movie.backdropUrl || movie.posterUrl);
  const [saved, setSaved] = useState(() => isFavorite(movie.slug));

  const handleToggleVault = () => {
    const nextState = toggleFavorite({
      movieId: movie.id,
      slug: movie.slug,
      title: movie.title,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      rating: movie.rating,
      releaseYear: movie.releaseYear,
      quality: movie.quality,
    });
    setSaved(nextState);
  };

  return (
    <div className="relative w-full min-h-[580px] sm:h-[80vh] sm:min-h-[640px] max-h-[850px] overflow-hidden flex flex-col justify-end pt-24 pb-14 sm:pb-20">
      {/* High-res Backdrop with Fallback */}
      <Image
        src={backdropSrc}
        alt={movie.title}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center filter brightness-[0.7]"
        onError={() => {
          setBackdropSrc("https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600");
        }}
      />

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/70 to-transparent w-full md:w-3/4 pointer-events-none" />

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 z-20 space-y-4">
        {/* Quality & Rating Tags */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded bg-red-600 text-white shadow-lg shadow-red-600/30 border border-red-400/40">
            <Sparkles className="w-3 h-3" />
            {movie.quality || "1080p"} CHUẨN RẠP
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{movie.rating.toFixed(1)} Điểm</span>
          </div>

          <span className="text-xs text-zinc-300 font-medium px-2 py-1 rounded bg-white/10 backdrop-blur-md">
            {movie.releaseYear}
          </span>

          <span className="text-xs text-zinc-300 font-medium px-2 py-1 rounded bg-white/10 backdrop-blur-md">
            {movie.duration || "Bản Đầy Đủ"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-xl max-w-3xl">
          {movie.title}
        </h1>

        {movie.originalTitle && (
          <p className="text-sm sm:text-base text-zinc-300 font-semibold tracking-wide drop-shadow">
            {movie.originalTitle}
          </p>
        )}

        {/* Overview */}
        <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed max-w-xl">
          {movie.overview}
        </p>

        {/* Genres Tags */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {movie.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-white/10"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-4 pt-3 flex-wrap">
          <Link
            href={`/watch/${movie.slug}`}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Xem Phim 1080p</span>
          </Link>

          <Link
            href={`/movie/${movie.slug}`}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/15 hover:scale-105 active:scale-95 transition-all"
          >
            <Info className="w-4 h-4" />
            <span>Thông Tin Chi Tiết</span>
          </Link>

          <button
            onClick={handleToggleVault}
            className={`p-3 rounded-xl backdrop-blur-md border transition-all ${
              saved
                ? "bg-red-600/80 text-white border-red-500"
                : "bg-white/10 hover:bg-white/20 text-zinc-200 border-white/15"
            }`}
            title={saved ? "Đã lưu vào kho" : "Lưu vào kho phim của tôi"}
          >
            {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
