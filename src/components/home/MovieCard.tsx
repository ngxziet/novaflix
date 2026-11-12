"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Play, Star, Bookmark, Check } from "lucide-react";
import { MovieItem } from "@/types/movie";
import { isFavorite, toggleFavorite } from "@/lib/storage";

interface MovieCardProps {
  movie: MovieItem;
  priority?: boolean;
}

export default function MovieCard({ movie, priority = false }: MovieCardProps) {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl);
  const [saved, setSaved] = useState(() => isFavorite(movie.slug));

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
    <div className="group relative rounded-xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-red-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/10 hover:-translate-y-1.5 flex flex-col">
      <Link href={`/movie/${movie.slug}`} className="relative aspect-[2/3] w-full overflow-hidden block">
        {/* Poster Image */}
        <Image
          src={imgSrc}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => {
            setImgSrc("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600");
          }}
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Quality Badge (1080p / 4K) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md backdrop-blur-md uppercase tracking-wider ${
              movie.quality === "4K"
                ? "bg-amber-500/90 text-black border border-amber-300"
                : "bg-red-600/90 text-white border border-red-400/30"
            }`}
          >
            {movie.quality || "1080p"}
          </span>
        </div>

        {/* Star Rating Badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 text-[11px] font-bold text-amber-400">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleToggleVault}
          className={`absolute bottom-3 right-3 z-30 p-2 rounded-lg backdrop-blur-md border transition-all ${
            saved
              ? "bg-red-600 text-white border-red-500"
              : "bg-black/60 text-zinc-300 hover:text-white border-white/15 opacity-0 group-hover:opacity-100"
          }`}
          title={saved ? "Đã lưu vào kho" : "Lưu vào kho phim"}
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </Link>

      {/* Info Info Section */}
      <div className="p-3 flex flex-col justify-between flex-1">
        <Link href={`/movie/${movie.slug}`}>
          <h3 className="font-bold text-sm text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
            {movie.title}
          </h3>
          {movie.originalTitle && (
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-medium">
              {movie.originalTitle}
            </p>
          )}
        </Link>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
          <span>{movie.releaseYear}</span>
          <span className="text-zinc-600">•</span>
          <span className="truncate max-w-[120px]">
            {movie.genres[0] || "Điện ảnh"}
          </span>
        </div>
      </div>
    </div>
  );
}
