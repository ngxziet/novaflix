"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles, X, Loader2, Play, Star, ArrowRight } from "lucide-react";
import { MovieItem, AISearchResponse, SearchMode } from "@/types/movie";

const AI_PROMPT_SUGGESTIONS = [
  "Tâm lý hack não twist bất ngờ ở phút cuối",
  "Du hành vũ trụ sâu thẳm, triết lý sinh tồn & tình cha con",
  "Hành động dồn dập kỹ xảo đỉnh cao giải trí cuối tuần",
  "Phim buồn da diết xem vào một buổi tối trời mưa",
];

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [keyword, setKeyword] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MovieItem[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AISearchResponse | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Lắng nghe sự kiện mở modal từ Navbar hoặc phím tắt Ctrl+K / /
  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true);
      if (e.detail?.mode) {
        setMode(e.detail.mode);
      }
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

  // Tự động focus vào ô tìm kiếm khi mở modal
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

  // Debounced keyword search
  useEffect(() => {
    if (mode !== "keyword" || !keyword.trim()) {
      if (mode === "keyword") setResults([]);
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
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, mode]);

  // AI Semantic search
  const handleAISearch = async (promptToUse?: string) => {
    const query = promptToUse || aiPrompt;
    if (!query.trim() || loading) return;

    setLoading(true);
    setResults([]);
    setAiAnalysis(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });
      const data: AISearchResponse = await res.json();
      setAiAnalysis(data);
      setResults(data.matchedMovies || []);
    } catch (err) {
      console.error("AI search error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 md:pt-16 bg-black/80 backdrop-blur-md transition-all">
      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0b0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header with Tabs & Close */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/5">
            <button
              onClick={() => {
                setMode("keyword");
                setResults([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "keyword"
                  ? "bg-red-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Từ Khóa</span>
            </button>

            <button
              onClick={() => {
                setMode("ai");
                setResults([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "ai"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>AI Vibe (Gemini)</span>
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Area */}
        <div className="p-4 sm:p-5 border-b border-white/5 bg-zinc-950/40">
          {mode === "keyword" ? (
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập tên phim, diễn viên hoặc đạo diễn..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm sm:text-base transition-all"
              />
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAISearch();
                    }
                  }}
                  placeholder="Mô tả cảm xúc hoặc cốt truyện (Ví dụ: phim trinh thám hack não bối cảnh tuyết)"
                  className="w-full pl-11 pr-24 py-3 rounded-xl bg-zinc-900 border border-purple-500/30 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 text-sm sm:text-base transition-all"
                />
                <Sparkles className="w-5 h-5 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  onClick={() => handleAISearch()}
                  disabled={loading || !aiPrompt.trim()}
                  className="absolute right-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  <span>Tìm</span>
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {AI_PROMPT_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAiPrompt(preset);
                      handleAISearch(preset);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-purple-300 border border-white/5 transition-all text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* AI Analysis Reason Banner */}
          {aiAnalysis && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs">
              <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gợi ý theo cảm xúc: &quot;{aiAnalysis.vibeSummary}&quot;</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{aiAnalysis.recommendationReason}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs">Đang tìm kiếm kho phim chuẩn 1080p...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-xs sm:text-sm font-medium">
                {keyword || aiPrompt
                  ? "Không tìm thấy tác phẩm nào phù hợp"
                  : "Gõ từ khóa hoặc mô tả để tìm kiếm tức thì không cần rời trang"}
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
                  className="group rounded-xl overflow-hidden bg-zinc-900/90 border border-white/5 hover:border-red-500/40 transition-all flex flex-col"
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
