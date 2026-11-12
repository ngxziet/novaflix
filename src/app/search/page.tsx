import { Suspense } from "react";
import SearchSection from "@/components/search/SearchSection";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Tìm Kiếm Kép: Từ Khóa & AI Gemini - NovaFlix",
  description: "Tìm kiếm phim bằng từ khóa chính xác hoặc bằng cảm xúc & ngữ cảnh với trợ lý Gemini AI.",
};

export default function SearchPage() {
  return (
    <div className="min-h-screen pt-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        }
      >
        <SearchSection />
      </Suspense>
    </div>
  );
}
