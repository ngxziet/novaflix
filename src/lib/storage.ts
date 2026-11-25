import { WatchHistoryItem, FavoriteMovieItem } from "@/types/movie";

const HISTORY_KEY = "novaflix_watch_history";
const EPISODES_PROGRESS_KEY = "novaflix_episodes_progress";
const FAVORITES_KEY = "novaflix_favorites";
const SETTINGS_KEY = "novaflix_player_settings";

export interface PlayerSettings {
  ambientGlow: boolean;
  audioBoost: boolean;
  audioBoostGain: number; // 1.0 to 2.5
  playbackSpeed: number; // 0.25 to 3.0
  subtitleSize: "small" | "medium" | "large";
  subtitleColor: "white" | "yellow" | "cyan";
  subtitleOffset: number; // in seconds
  // Tự động hóa & Bỏ qua thông minh (Auto-next, Skip Opening, Ending, Quảng cáo)
  autoNextEpisode: boolean; // Tự động chuyển tiếp khi hết tập/phim
  autoSkipIntro: boolean; // Tự động bỏ qua đoạn mở đầu (Opening)
  introDuration: number; // Thời lượng đoạn mở đầu (giây, vd: 85)
  autoSkipOutro: boolean; // Tự động bỏ qua phần kết thúc (Ending)
  outroDuration: number; // Thời lượng phần kết thúc (giây, vd: 90)
  autoSkipAd: boolean; // Tự động bỏ qua quảng cáo đầu video
  adDuration: number; // Thời lượng quảng cáo đầu video (giây, vd: 30)
  volume: number; // 0 to 1
  fitMode: "contain" | "cover"; // Chứa trọn hoặc lấp đầy khung hình
}

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  ambientGlow: false,
  audioBoost: false,
  audioBoostGain: 1.5,
  playbackSpeed: 1.0,
  subtitleSize: "medium",
  subtitleColor: "white",
  subtitleOffset: 0,
  autoNextEpisode: true,
  autoSkipIntro: false,
  introDuration: 85,
  autoSkipOutro: false,
  outroDuration: 90,
  autoSkipAd: false,
  adDuration: 30,
  volume: 1.0,
  fitMode: "contain",
};

// --- QUẢN LÝ TIẾN TRÌNH XEM THEO TỪNG TẬP (PER-EPISODE) ---
function getAllEpisodeProgress(): Record<string, { progressSeconds: number; durationSeconds: number; updatedAt: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EPISODES_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getEpisodeProgress(movieSlug: string, episodeSlug?: string): number {
  if (typeof window === "undefined") return 0;
  const epKey = episodeSlug || "default";
  const fullKey = `${movieSlug}:${epKey}`;
  const all = getAllEpisodeProgress();
  const data = all[fullKey];
  if (!data) return 0;

  // Nếu xem đến sát hết (còn dưới 30s hoặc > 95%), coi như đã xem xong và bắt đầu lại từ đầu
  if (data.durationSeconds > 0 && data.progressSeconds >= data.durationSeconds - 30) {
    return 0;
  }
  return data.progressSeconds > 10 ? data.progressSeconds : 0;
}

// --- QUẢN LÝ LỊCH SỬ XEM DỞ TOÀN BỘ PHIM ---
export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchProgress(item: Omit<WatchHistoryItem, "updatedAt" | "percent">) {
  if (typeof window === "undefined") return;
  try {
    // 1. Lưu tiến độ riêng cho chính tập phim này
    const epKey = item.episodeSlug || "default";
    const fullKey = `${item.slug}:${epKey}`;
    const allEp = getAllEpisodeProgress();
    allEp[fullKey] = {
      progressSeconds: item.progressSeconds,
      durationSeconds: item.durationSeconds,
      updatedAt: Date.now(),
    };
    localStorage.setItem(EPISODES_PROGRESS_KEY, JSON.stringify(allEp));

    // 2. Cập nhật vào danh sách lịch sử phim gần nhất
    const history = getWatchHistory().filter((h) => h.slug !== item.slug);
    const percent = item.durationSeconds > 0
      ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
      : 0;

    const updated: WatchHistoryItem = {
      ...item,
      percent,
      updatedAt: Date.now(),
    };

    const newHistory = [updated, ...history].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (err) {
    console.warn("Could not save watch progress", err);
  }
}

export function getMovieProgress(slug: string): WatchHistoryItem | undefined {
  const history = getWatchHistory();
  return history.find((h) => h.slug === slug);
}

// --- QUẢN LÝ DANH SÁCH YÊU THÍCH (MY VAULT) ---
export function getFavorites(): FavoriteMovieItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(slug: string): boolean {
  return getFavorites().some((f) => f.slug === slug);
}

export function toggleFavorite(movie: Omit<FavoriteMovieItem, "addedAt">): boolean {
  if (typeof window === "undefined") return false;
  try {
    const favs = getFavorites();
    const exists = favs.some((f) => f.slug === movie.slug);
    let newFavs: FavoriteMovieItem[];
    if (exists) {
      newFavs = favs.filter((f) => f.slug !== movie.slug);
    } else {
      newFavs = [{ ...movie, addedAt: Date.now() }, ...favs];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    return !exists;
  } catch {
    return false;
  }
}

// --- CÀI ĐẶT TRÌNH PHÁT (CINEPLAYER SETTINGS) ---
export function getPlayerSettings(): PlayerSettings {
  if (typeof window === "undefined") return DEFAULT_PLAYER_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_PLAYER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_PLAYER_SETTINGS;
  } catch {
    return DEFAULT_PLAYER_SETTINGS;
  }
}

export function savePlayerSettings(settings: Partial<PlayerSettings>) {
  if (typeof window === "undefined") return;
  try {
    const current = getPlayerSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("Could not save player settings", err);
  }
}
