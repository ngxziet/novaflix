import { WatchHistoryItem, FavoriteMovieItem } from "@/types/movie";

const HISTORY_KEY = "novaflix_watch_history";
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
}

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  ambientGlow: true,
  audioBoost: false,
  audioBoostGain: 1.5,
  playbackSpeed: 1.0,
  subtitleSize: "medium",
  subtitleColor: "white",
  subtitleOffset: 0,
};

// --- QUẢN LÝ LỊCH SỬ XEM DỞ ---
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
    const history = getWatchHistory().filter((h) => h.slug !== item.slug);
    const percent = item.durationSeconds > 0
      ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
      : 0;

    const updated: WatchHistoryItem = {
      ...item,
      percent,
      updatedAt: Date.now(),
    };

    // Giữ tối đa 30 phim gần nhất
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
