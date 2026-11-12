"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Film } from "lucide-react";
import { MovieItem } from "@/types/movie";
import MovieCard from "@/components/home/MovieCard";

export default function SearchSection() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MovieItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        setResults(data.items || []);
      } catch (err) {
        console.error("Keyword search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Input Box */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập tên phim, diễn viên hoặc đạo diễn cần tìm..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm sm:text-base shadow-xl transition-all"
            autoFocus
          />
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Loader2 className="w-7 h-7 animate-spin text-red-500 mb-2" />
          <p className="text-xs">Đang tìm kiếm kho phim...</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              Kết Quả Tìm Kiếm ({results.length} tác phẩm)
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-sm font-semibold">Không tìm thấy tác phẩm nào</p>
              <p className="text-xs text-zinc-600 mt-1">Hãy thử tìm với một từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
