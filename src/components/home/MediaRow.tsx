"use client";

import { useRef } from "react";
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

export default function MediaRow({ title, subtitle, movies, viewAllHref }: MediaRowProps) {
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
    <section className="relative my-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto group/row">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
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
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll("left")}
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-red-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all active:scale-95"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Movies Container */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[160px] sm:w-[190px] md:w-[220px] flex-shrink-0"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll("right")}
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-red-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all active:scale-95"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
