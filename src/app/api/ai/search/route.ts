import { NextRequest, NextResponse } from "next/server";
import { performAISemanticSearch } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập mô tả hoặc cảm xúc cần tìm phim" },
        { status: 400 }
      );
    }

    const result = await performAISemanticSearch(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Search route error:", error);
    return NextResponse.json(
      { error: "Không thể phân tích yêu cầu AI vào lúc này" },
      { status: 500 }
    );
  }
}
