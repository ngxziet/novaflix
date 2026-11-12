import { GoogleGenAI } from "@google/genai";
import { MovieItem, AISearchResponse } from "@/types/movie";
import { searchMoviesByKeyword } from "./movie-service";
import { FALLBACK_BLOCKBUSTERS } from "./constants";

export async function performAISemanticSearch(prompt: string): Promise<AISearchResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
Bạn là một chuyên gia điện ảnh AI cao cấp của nền tảng xem phim NovaFlix.
Nhiệm vụ của bạn: Người dùng nhập vào một cảm xúc, bối cảnh, hoặc miêu tả cốt truyện mơ hồ/ngôn ngữ tự nhiên (ví dụ: "phim tâm lý twist bất ngờ bối cảnh tuyết", "phim phiêu lưu không gian cảm động tình cha con").
Hãy phân tích và trả về định dạng JSON thuần túy (không bọc trong markdown code fence, hoặc bọc trong { ... } hợp lệ) với cấu trúc sau:
{
  "vibeSummary": "Tóm tắt ngắn gọn cảm xúc/tông màu người xem đang tìm kiếm (1-2 câu tiếng Việt)",
  "recommendationReason": "Lời bình điện ảnh sâu sắc giải thích vì sao phong cách phim này thỏa mãn đúng tâm trạng đó (2-3 câu tiếng Việt)",
  "suggestedMovieTitles": ["Tên phim 1", "Tên phim 2", "Tên phim 3", "Tên phim 4"],
  "searchKeywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nYêu cầu của người dùng: "${prompt}"` }] }
        ],
      });

      const text = response.text || "";
      // Clean potential markdown fences ```json ... ```
      const cleanedJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Tra cứu các tựa phim mà Gemini đề xuất từ kho dữ liệu
      const searchPromises = (parsed.suggestedMovieTitles || []).map((title: string) =>
        searchMoviesByKeyword(title)
      );
      const searchResults = await Promise.all(searchPromises);
      const flatMovies: MovieItem[] = [];
      const seenSlugs = new Set<string>();

      for (const list of searchResults) {
        for (const m of list) {
          if (!seenSlugs.has(m.slug)) {
            seenSlugs.add(m.slug);
            flatMovies.push(m);
          }
        }
      }

      // Nếu không tìm thấy phim cụ thể, dùng keywords tìm thêm
      if (flatMovies.length === 0 && parsed.searchKeywords?.length > 0) {
        for (const kw of parsed.searchKeywords) {
          const kwResults = await searchMoviesByKeyword(kw);
          for (const m of kwResults) {
            if (!seenSlugs.has(m.slug)) {
              seenSlugs.add(m.slug);
              flatMovies.push(m);
            }
          }
        }
      }

      return {
        vibeSummary: parsed.vibeSummary || "Phù hợp với tâm trạng điện ảnh của bạn",
        recommendationReason: parsed.recommendationReason || "Được AI Gemini tuyển chọn dựa trên cốt truyện và bầu không khí tác phẩm.",
        keywords: parsed.searchKeywords || [prompt],
        matchedMovies: flatMovies.length > 0 ? flatMovies : FALLBACK_BLOCKBUSTERS.slice(0, 4),
      };
    } catch (error) {
      console.warn("Gemini API call failed, falling back to local semantic analyzer:", error);
    }
  }

  // Fallback Semantic Analyzer khi chưa cấu hình GEMINI_API_KEY
  return fallbackSemanticAnalyzer(prompt);
}

async function fallbackSemanticAnalyzer(prompt: string): Promise<AISearchResponse> {
  const p = prompt.toLowerCase();
  let vibeSummary = "Phân tích ngữ nghĩa theo yêu cầu của bạn";
  let recommendationReason = "Hệ thống đã nhận diện các yếu tố cốt truyện, tâm lý và bối cảnh để lọc ra các tác phẩm chuẩn 1080p sắc nét nhất.";
  let targetKeywords: string[] = [];

  if (p.includes("không gian") || p.includes("vũ trụ") || p.includes("du hành") || p.includes("hố đen")) {
    vibeSummary = "Không gian vô tận, triết lý sinh tồn & tình cảm con người";
    recommendationReason = "Những chuyến du hành vượt thời gian và chiều không gian, nơi số phận nhân loại đan xen cùng tình phụ tử sâu sắc.";
    targetKeywords = ["Interstellar", "Dune", "Vũ trụ", "Hành tinh"];
  } else if (p.includes("tâm lý") || p.includes("twist") || p.includes("hack não") || p.includes("bất ngờ")) {
    vibeSummary = "Căng thẳng tâm lý nghẹt thở & cú lừa ngoạn mục";
    recommendationReason = "Tác phẩm đưa người xem vào mê cung của tâm trí, nơi sự thật và ảo giác đan xen cho đến giây phút cuối cùng.";
    targetKeywords = ["Shutter Island", "Oppenheimer", "Inception", "Kinh dị"];
  } else if (p.includes("hành động") || p.includes("bắn súng") || p.includes("đua xe") || p.includes("chiến đấu")) {
    vibeSummary = "Tiết tấu dồn dập, kỹ xảo mãn nhãn & âm thanh bùng nổ";
    recommendationReason = "Dành cho những phút giây giải trí đỉnh cao với các pha cận chiến và rượt đuổi nghẹt thở chuẩn 1080p.";
    targetKeywords = ["Batman", "Spider-Man", "Hành động"];
  } else {
    vibeSummary = `Khám phá điện ảnh theo vibe: "${prompt}"`;
    recommendationReason = "Các tác phẩm có phong cách nghệ thuật độc đáo, hình ảnh sắc nét và chiều sâu cảm xúc được tuyển chọn cho bạn.";
    targetKeywords = [prompt, "Bom tấn", "Điện ảnh"];
  }

  const searchPromises = targetKeywords.map((k) => searchMoviesByKeyword(k));
  const results = await Promise.all(searchPromises);
  const flatMovies: MovieItem[] = [];
  const seenSlugs = new Set<string>();

  for (const list of results) {
    for (const m of list) {
      if (!seenSlugs.has(m.slug)) {
        seenSlugs.add(m.slug);
        flatMovies.push(m);
      }
    }
  }

  return {
    vibeSummary,
    recommendationReason,
    keywords: targetKeywords,
    matchedMovies: flatMovies.length > 0 ? flatMovies.slice(0, 8) : FALLBACK_BLOCKBUSTERS,
  };
}
