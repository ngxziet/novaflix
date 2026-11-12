"use client";

import { useRef, memo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieItem } from "@/types/movie";
import MovieCard from "./MovieCard";

interface MediaRowProps {
  title: string;
  subtitle?: string;
  movies: MovieItem[];
  viewAllHref?: string;
}

function MediaRowComponent({ title, subtitle, movies, viewAllHref }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-7 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto group/row">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
            {title}
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            Xem tất cả
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        <button
          onClick={() => handleScroll("left")}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all active:scale-95"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 will-change-scroll"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[145px] sm:w-[175px] md:w-[200px] flex-shrink-0"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        <button
          onClick={() => handleScroll("right")}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/85 hover:bg-red-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all active:scale-95"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}

export default memo(MediaRowComponent);
