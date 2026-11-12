import { NextRequest, NextResponse } from "next/server";
import { searchMoviesByKeyword } from "@/lib/movie-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ items: [] });
  }

  const items = await searchMoviesByKeyword(query);
  return NextResponse.json({ items });
}
