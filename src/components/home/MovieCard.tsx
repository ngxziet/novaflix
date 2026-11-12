"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, memo } from "react";
import { Play, Star, Bookmark, Check } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { isFavorite, toggleFavorite } from "@/lib/storage";

interface MovieCardProps {
  movie: MovieItem;
  priority?: boolean;
}

function MovieCardComponent({ movie, priority = false }: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setImgSrc(movie.posterUrl);
    setSaved(isFavorite(movie.slug));
  }, [movie.posterUrl, movie.slug]);

  const handleToggleVault = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div className="group relative rounded-xl overflow-hidden bg-zinc-900/80 border border-white/5 hover:border-red-500/40 transition-transform duration-200 hover:-translate-y-1 flex flex-col h-full transform-gpu will-change-transform shadow-md">
      <Link href={`/movie/${movie.slug}`} className="relative aspect-[2/3] w-full overflow-hidden block bg-zinc-950">
        {/* Poster Image tối ưu kích thước và tải bất đồng bộ */}
        <Image
          src={imgSrc}
          alt={movie.title}
          fill
          loading={priority ? undefined : "lazy"}
          decoding="async"
          sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 220px"
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => {
            setImgSrc("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600");
          }}
        />

        {/* Gradient Shadow Overlay nhẹ */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/20 opacity-80 pointer-events-none" />

        {/* Quality Badge (1080p / 4K) */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider ${
              movie.quality === "4K"
                ? "bg-amber-500 text-black"
                : "bg-red-600 text-white"
            }`}
          >
            {movie.quality || "1080p"}
          </span>
        </div>

        {/* Star Rating Badge */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleToggleVault}
          className={`absolute bottom-2.5 right-2.5 z-30 p-1.5 rounded-lg border transition-all ${
            saved
              ? "bg-red-600 text-white border-red-500"
              : "bg-black/70 text-zinc-300 hover:text-white border-white/20 opacity-0 group-hover:opacity-100"
          }`}
          title={saved ? "Đã lưu vào kho" : "Lưu vào kho phim"}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </Link>

      {/* Info Section */}
      <div className="p-2.5 flex flex-col justify-between flex-1 bg-zinc-900/50">
        <Link href={`/movie/${movie.slug}`}>
          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
            {movie.title}
          </h3>
          {movie.originalTitle && (
            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-medium">
              {movie.originalTitle}
            </p>
          )}
        </Link>

        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>{movie.releaseYear}</span>
          <span className="text-zinc-600">•</span>
          <span className="truncate max-w-[100px]">
            {movie.genres[0] || "Điện ảnh"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(MovieCardComponent);
