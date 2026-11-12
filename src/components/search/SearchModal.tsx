"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2, Play, Star } from "lucide-react";
import { MovieItem } from "@/types/movie";

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MovieItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe phím tắt Ctrl+K hoặc sự kiện mở
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("open-search-modal", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-search-modal", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Tự động focus ô tìm kiếm khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  // Tìm kiếm tức thì với Debounce
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 md:pt-16 bg-black/80 backdrop-blur-md transition-all">
      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-zinc-950">
          <Search className="w-5 h-5 text-red-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập tên phim, diễn viên hoặc đạo diễn cần tìm..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm sm:text-base"
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              className="text-xs text-zinc-500 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-white/5"
            >
              Xóa
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs">Đang tìm trong kho phim 1080p...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !keyword && (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-xs sm:text-sm font-medium">
                Gõ tên phim bất kỳ để hiển thị kết quả ngay lập tức
              </p>
            </div>
          )}

          {!loading && keyword && results.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-xs sm:text-sm font-medium">
                Không tìm thấy phim nào khớp với &quot;{keyword}&quot;
              </p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => setIsOpen(false)}
                  className="group rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-red-500/40 transition-all flex flex-col"
                >
                  <Link href={`/movie/${movie.slug}`} className="relative aspect-[2/3] w-full block overflow-hidden">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 140px, 180px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
                        {movie.quality || "1080p"}
                      </span>
                    </div>
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 px-1 py-0.5 rounded text-[10px] font-bold text-amber-400">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  </Link>

                  <div className="p-2 flex flex-col justify-between flex-1">
                    <Link href={`/movie/${movie.slug}`}>
                      <h4 className="font-bold text-xs text-zinc-100 line-clamp-1 group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </h4>
                    </Link>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{movie.releaseYear}</span>
                      <Link
                        href={`/watch/${movie.slug}`}
                        className="p-1 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                        title="Xem ngay"
                      >
                        <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
