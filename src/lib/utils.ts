import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes?: number | string): string {
  if (!minutes) return "Đang cập nhật";
  const num = typeof minutes === "string" ? parseInt(minutes, 10) : minutes;
  if (isNaN(num)) return String(minutes);
  const h = Math.floor(num / 60);
  const m = num % 60;
  if (h === 0) return `${m} phút`;
  return `${h}g ${m}p`;
}

export function formatSecondsToTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function cleanHtmlTags(str?: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
}
