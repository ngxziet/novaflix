import { MovieItem, MovieDetail, Episode, VideoQuality } from "@/types/movie";
import { FALLBACK_BLOCKBUSTERS, TEARS_OF_STEEL_1080P_HLS } from "./constants";
import { cleanHtmlTags } from "./utils";

const PHIMAPI_BASE = "https://phimapi.com";
const PHIMIMG_BASE = "https://phimimg.com";

// Chuẩn hóa poster URL đảm bảo luôn là link tuyệt đối
function normalizeImageUrl(url?: string): string {
  if (!url) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${PHIMIMG_BASE}/${url.replace(/^\/+/, "")}`;
}

// Chuẩn hóa chất lượng: Luôn ưu tiên 1080p, FHD, 4K
function normalizeQuality(rawQuality?: string): VideoQuality {
  if (!rawQuality) return "1080p";
  const upper = rawQuality.toUpperCase();
  if (upper.includes("4K") || upper.includes("UHD")) return "4K";
  if (upper.includes("FHD") || upper.includes("1080")) return "1080p";
  return "FHD";
}

// Chuyển đổi dữ liệu từ API phim sang định dạng MovieItem
function mapToMovieItem(raw: any): MovieItem {
  return {
    id: raw._id || raw.id || raw.slug,
    slug: raw.slug,
    title: raw.name,
    originalTitle: raw.origin_name,
    overview: cleanHtmlTags(raw.content || raw.description) || "Đắm chìm vào những khung hình điện ảnh đỉnh cao với độ sắc nét tuyệt đối.",
    posterUrl: normalizeImageUrl(raw.poster_url || raw.thumb_url),
    backdropUrl: normalizeImageUrl(raw.thumb_url || raw.poster_url),
    releaseYear: raw.year || 2024,
    rating: raw.tmdb?.vote_average ? Number(raw.tmdb.vote_average.toFixed(1)) : 8.5,
    quality: normalizeQuality(raw.quality),
    duration: raw.time || "Trọn bộ",
    genres: Array.isArray(raw.category) ? raw.category.map((c: any) => c.name) : ["Điện Ảnh", "Kịch Tính"],
    country: Array.isArray(raw.country) && raw.country[0] ? raw.country[0].name : "Quốc Tế",
    isSeries: raw.type === "series" || raw.type === "hoathinh" || Boolean(raw.episode_total && raw.episode_total !== "1"),
    totalEpisodes: raw.episode_total ? parseInt(raw.episode_total, 10) || 1 : 1,
    latestEpisode: raw.episode_current || "1080p",
  };
}

export async function getTrendingMovies(page = 1): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${PHIMAPI_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Failed to fetch trending");
    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length > 0) {
      return data.items.map(mapToMovieItem);
    }
  } catch (error) {
    console.warn("Using fallback blockbusters for trending:", error);
  }
  return FALLBACK_BLOCKBUSTERS;
}

export async function getMoviesByType(type: "phim-le" | "phim-bo" | "hoat-hinh", page = 1): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${PHIMAPI_BASE}/v1/api/danh-sach/${type}?page=${page}&limit=24`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
    const data = await res.json();
    if (data?.data?.items && Array.isArray(data.data.items)) {
      return data.data.items.map(mapToMovieItem);
    }
  } catch (error) {
    console.warn(`Failed to fetch ${type}:`, error);
  }
  return FALLBACK_BLOCKBUSTERS;
}

export async function getMoviesByGenre(genreSlug: string, page = 1): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${PHIMAPI_BASE}/v1/api/the-loai/${genreSlug}?page=${page}&limit=24`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Failed to fetch genre ${genreSlug}`);
    const data = await res.json();
    if (data?.data?.items && Array.isArray(data.data.items)) {
      return data.data.items.map(mapToMovieItem);
    }
  } catch (error) {
    console.warn(`Failed to fetch genre ${genreSlug}:`, error);
  }
  return FALLBACK_BLOCKBUSTERS;
}

export async function getMoviesByCountry(countrySlug: string, page = 1): Promise<MovieItem[]> {
  try {
    const res = await fetch(`${PHIMAPI_BASE}/v1/api/quoc-gia/${countrySlug}?page=${page}&limit=24`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Failed to fetch country ${countrySlug}`);
    const data = await res.json();
    if (data?.data?.items && Array.isArray(data.data.items)) {
      return data.data.items.map(mapToMovieItem);
    }
  } catch (error) {
    console.warn(`Failed to fetch country ${countrySlug}:`, error);
  }
  return FALLBACK_BLOCKBUSTERS;
}

export async function searchMoviesByKeyword(keyword: string): Promise<MovieItem[]> {
  if (!keyword.trim()) return [];
  try {
    const encoded = encodeURIComponent(keyword.trim());
    const res = await fetch(`${PHIMAPI_BASE}/v1/api/tim-kiem?keyword=${encoded}&limit=20`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Search request failed");
    const data = await res.json();
    if (data?.data?.items && Array.isArray(data.data.items)) {
      return data.data.items.map(mapToMovieItem);
    }
  } catch (error) {
    console.warn("Search API failed, searching local fallback:", error);
  }

  // Tìm kiếm cục bộ trong danh sách fallback
  const lower = keyword.toLowerCase();
  return FALLBACK_BLOCKBUSTERS.filter(
    (m) =>
      m.title.toLowerCase().includes(lower) ||
      m.originalTitle?.toLowerCase().includes(lower) ||
      m.genres.some((g) => g.toLowerCase().includes(lower))
  );
}

export async function getMovieDetail(slug: string): Promise<MovieDetail | null> {
  try {
    const res = await fetch(`${PHIMAPI_BASE}/phim/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Movie ${slug} not found`);
    const data = await res.json();
    const movieRaw = data?.movie;
    if (!movieRaw) return null;

    const baseMovie = mapToMovieItem(movieRaw);

    // Xử lý danh sách tập phim & server stream 1080p
    const episodesGrouped: { serverName: string; serverData: Episode[] }[] = [];

    if (Array.isArray(data.episodes)) {
      for (const server of data.episodes) {
        const epList: Episode[] = [];
        if (Array.isArray(server.server_data)) {
          for (const ep of server.server_data) {
            epList.push({
              serverName: server.server_name || "Vietsub 1080p",
              name: ep.name || "Tập 01",
              slug: ep.slug || "tap-01",
              streamUrl: ep.link_m3u8 || TEARS_OF_STEEL_1080P_HLS,
              embedUrl: ep.link_embed,
              quality: "1080p",
            });
          }
        }
        if (epList.length > 0) {
          episodesGrouped.push({
            serverName: server.server_name || "Server 1080p FHD",
            serverData: epList,
          });
        }
      }
    }

    if (episodesGrouped.length === 0) {
      episodesGrouped.push({
        serverName: "Master 1080p Cinema Server",
        serverData: [
          {
            serverName: "Master 1080p",
            name: "Bản Full 1080p",
            slug: "full",
            streamUrl: TEARS_OF_STEEL_1080P_HLS,
            quality: "1080p",
          },
        ],
      });
    }

    const cast = Array.isArray(movieRaw.actor)
      ? movieRaw.actor.filter(Boolean).map((actorName: string, i: number) => ({
          id: i,
          name: actorName,
          character: "Diễn viên chính",
        }))
      : [];

    return {
      ...baseMovie,
      trailerUrl: movieRaw.trailer_url,
      director: Array.isArray(movieRaw.director) ? movieRaw.director.join(", ") : movieRaw.director || "Đang cập nhật",
      cast,
      episodes: episodesGrouped,
      similarMovies: FALLBACK_BLOCKBUSTERS.filter((m) => m.slug !== slug).slice(0, 4),
    };
  } catch (error) {
    console.warn(`Detail fetch error for ${slug}, checking fallback:`, error);
    const fallback = FALLBACK_BLOCKBUSTERS.find((m) => m.slug === slug);
    if (!fallback) return null;
    return {
      ...fallback,
      director: "Christopher Nolan",
      cast: [
        { id: 1, name: "Diễn viên ngôi sao", character: "Nhân vật chính" },
        { id: 2, name: "Diễn viên phụ", character: "Nhân vật hỗ trợ" },
      ],
      episodes: [
        {
          serverName: "VIP 1080p Master Server",
          serverData: [
            {
              serverName: "VIP 1080p",
              name: "Bản Chiếu Rạp 1080p",
              slug: "full",
              streamUrl: TEARS_OF_STEEL_1080P_HLS,
              quality: "1080p",
            },
          ],
        },
      ],
      similarMovies: FALLBACK_BLOCKBUSTERS.filter((m) => m.slug !== slug).slice(0, 4),
    };
  }
}
