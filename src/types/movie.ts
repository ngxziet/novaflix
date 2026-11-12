export type VideoQuality = "1080p" | "4K" | "FHD";

export interface MovieItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  releaseYear: number | string;
  rating: number; // e.g. 8.5
  quality: VideoQuality;
  duration?: string; // e.g. "2h 15m" or "45m/tập"
  genres: string[];
  country?: string;
  isSeries?: boolean;
  totalEpisodes?: number;
  latestEpisode?: string;
}

export interface Episode {
  serverName: string;
  name: string; // e.g. "Tập 01", "Full"
  slug: string;
  streamUrl: string; // Link m3u8 chuẩn HLS
  backupStreamUrl?: string;
  embedUrl?: string;
  quality: VideoQuality;
}

export interface MovieDetail extends MovieItem {
  trailerUrl?: string; // YouTube embed / key
  director?: string;
  cast: {
    id?: string | number;
    name: string;
    character?: string;
    profileUrl?: string;
  }[];
  episodes: {
    serverName: string;
    serverData: Episode[];
  }[];
  similarMovies?: MovieItem[];
}

export interface WatchHistoryItem {
  movieId: string;
  slug: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  episodeName?: string;
  episodeSlug?: string;
  progressSeconds: number;
  durationSeconds: number;
  percent: number;
  updatedAt: number;
}

export interface FavoriteMovieItem {
  movieId: string;
  slug: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  rating: number;
  releaseYear: number | string;
  quality: VideoQuality;
  addedAt: number;
}

export type SearchMode = "keyword" | "ai";

export interface AISearchResponse {
  vibeSummary: string;
  recommendationReason: string;
  keywords: string[];
  matchedMovies: MovieItem[];
}
