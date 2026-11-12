"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Sparkles, Loader2, Film, BrainCircuit, ArrowRight } from "lucide-react";
import { MovieItem, AISearchResponse, SearchMode } from "@/types/movie";
import MovieCard from "@/components/home/MovieCard";

const AI_PROMPT_SUGGESTIONS = [
  "Tâm lý hack não twist bất ngờ ở phút cuối",
  "Du hành vũ trụ sâu thẳm, triết lý sinh tồn & tình cha con",
  "Hành động mãn nhãn giải trí cuối tuần kỹ xảo đỉnh cao",
  "Phim buồn da diết xem vào một buổi tối trời mưa",
  "Thế giới tương lai Cyberpunk hoang tàn và cô độc",
];

export default function SearchSection() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "ai" ? "ai" : "keyword";

  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [keyword, setKeyword] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MovieItem[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AISearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Xử lý tìm kiếm từ khóa với Debounce
  useEffect(() => {
    if (mode !== "keyword") return;
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
    }, 350);

    return () => clearTimeout(timer);
  }, [keyword, mode]);

  // Xử lý tìm kiếm AI Gemini
  const handleAISearch = async (promptToUse?: string) => {
    const query = promptToUse || aiPrompt;
    if (!query.trim() || loading) return;

    setLoading(true);
    setHasSearched(true);
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
      console.error("AI search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Mode Tabs */}
      <div className="flex items-center justify-center mb-8">
        <div className="p-1 rounded-2xl bg-zinc-900 border border-white/10 flex items-center shadow-xl">
          <button
            onClick={() => {
              setMode("keyword");
              setHasSearched(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "keyword"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Tìm Theo Từ Khóa</span>
          </button>

          <button
            onClick={() => {
              setMode("ai");
              setHasSearched(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "ai"
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Semantic Search (Gemini)</span>
          </button>
        </div>
      </div>

      {/* Input Box based on Mode */}
      <div className="max-w-3xl mx-auto">
        {mode === "keyword" ? (
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên phim, diễn viên, đạo diễn (ví dụ: Oppenheimer, Batman, Dune...)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 text-sm sm:text-base shadow-2xl transition-all"
              autoFocus
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAISearch();
                  }
                }}
                rows={3}
                placeholder="Mô tả cảm xúc, tình huống, hoặc bối cảnh phim bạn muốn xem (Ví dụ: 'Phim du hành vũ trụ không gian buồn da diết có plot twist')"
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-zinc-900/90 border border-purple-500/30 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 text-sm sm:text-base shadow-2xl transition-all resize-none"
                autoFocus
              />
              <Sparkles className="w-5 h-5 text-purple-400 absolute left-4 top-4" />
              <button
                onClick={() => handleAISearch()}
                disabled={loading || !aiPrompt.trim()}
                className="absolute right-3.5 bottom-3.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Khám phá</span>
              </button>
            </div>

            {/* AI Suggested Prompts Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                Gợi ý thử nghiệm:
              </span>
              {AI_PROMPT_SUGGESTIONS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAiPrompt(preset);
                    handleAISearch(preset);
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-zinc-900 hover:bg-purple-900/30 text-zinc-300 hover:text-purple-200 border border-white/5 hover:border-purple-500/30 transition-all text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Reason Card (if available) */}
      {aiAnalysis && (
        <div className="max-w-3xl mx-auto mt-8 p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900/80 to-zinc-950 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Phân tích cảm xúc & Tông màu điện ảnh:</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            "{aiAnalysis.vibeSummary}"
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {aiAnalysis.recommendationReason}
          </p>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
          <p className="text-sm">
            {mode === "ai"
              ? "AI Gemini đang phân tích ngữ cảnh và trích xuất danh sách phim 1080p phù hợp..."
              : "Đang tìm kiếm kho phim chuẩn rạp..."}
          </p>
        </div>
      )}

      {/* Search Results Grid */}
      {!loading && hasSearched && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-red-500" />
              Kết Quả Tìm Thấy ({results.length} tác phẩm chuẩn 1080p+)
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-base font-semibold">Không tìm thấy tác phẩm nào khớp với yêu cầu</p>
              <p className="text-xs text-zinc-600 mt-1">Hãy thử tìm với một từ khóa khác hoặc mô tả lại bằng AI</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
