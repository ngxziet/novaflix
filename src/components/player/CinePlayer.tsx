"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Sparkles,
  Sliders,
  Upload,
  Zap,
  Loader2,
  SkipForward,
  SkipBack,
  FastForward,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  PictureInPicture2,
  Tv,
} from "lucide-react";
import { Episode, MovieItem } from "@/types/movie";
import {
  DEFAULT_PLAYER_SETTINGS,
  getPlayerSettings,
  savePlayerSettings,
  saveWatchProgress,
  getEpisodeProgress,
  type PlayerSettings,
} from "@/lib/storage";
import { formatSecondsToTime } from "@/lib/utils";

const PROGRESS_SAVE_INTERVAL_MS = 15_000;
const CONTROLS_HIDE_DELAY_MS = 3_500;
const serverPreferences = { settings: DEFAULT_PLAYER_SETTINGS, isPipSupported: false };

function subscribeToInitialPreferences() {
  return () => {};
}

function subscribeToVisibility(listener: () => void) {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}

interface CinePlayerProps {
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
  episode: Episode;
  episodes?: Episode[];
  selectedServerIndex?: number;
  similarMovies?: MovieItem[];
  onNextEpisode?: () => void;
}

export default function CinePlayer({
  movieSlug,
  movieTitle,
  posterUrl,
  episode,
  episodes,
  selectedServerIndex = 0,
  similarMovies = [],
  onNextEpisode,
}: CinePlayerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPageVisible = useSyncExternalStore(
    subscribeToVisibility,
    () => !document.hidden,
    () => true
  );

  // Web Audio API refs for Audio Booster
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Danh sách tập & xác định tập kế tiếp / tập trước / phim gợi ý
  const episodesList = episodes && episodes.length > 0 ? episodes : [episode];
  const currentEpIndex = episodesList.findIndex((e) => e.slug === episode.slug);
  const hasNextEp = currentEpIndex >= 0 && currentEpIndex < episodesList.length - 1;
  const nextEp = hasNextEp ? episodesList[currentEpIndex + 1] : null;
  const hasPrevEp = currentEpIndex > 0;
  const prevEp = hasPrevEp ? episodesList[currentEpIndex - 1] : null;
  const nextMovie = !hasNextEp && similarMovies.length > 0 ? similarMovies[0] : null;

  const [browserPreferences] = useState(() => ({
    settings: getPlayerSettings(),
    isPipSupported: typeof document !== "undefined" && document.pictureInPictureEnabled === true,
  }));
  const { settings: initialSettings, isPipSupported } = useSyncExternalStore(
    subscribeToInitialPreferences,
    () => browserPreferences,
    () => serverPreferences
  );
  const [settingsChanges, setSettingsChanges] = useState<Partial<PlayerSettings>>({});
  const {
    volume: storedVolume, fitMode: storedFitMode, ambientGlow, audioBoost, playbackSpeed,
    autoNextEpisode, autoSkipIntro, introDuration, autoSkipOutro, outroDuration, autoSkipAd, adDuration,
  } = { ...initialSettings, ...settingsChanges };
  const volume = storedVolume ?? 1;
  const fitMode = storedFitMode ?? "contain";
  const updateSettings = useCallback((changes: Partial<PlayerSettings>) => {
    setSettingsChanges((previous) => ({ ...previous, ...changes }));
    savePlayerSettings(changes);
  }, []);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<"none" | "native" | "fallback">("none");
  const isFullscreen = fullscreenMode !== "none";
  const [showControls, setShowControls] = useState(true);
  const lastControlsActivityRef = useRef(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvancedTiming, setShowAdvancedTiming] = useState(false);

  // Phản hồi cử chỉ chạm đúp (Double-tap to seek trên mobile/tablet)
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<"left" | "right" | null>(null);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  // Subtitles
  const [customSubtitleUrl, setCustomSubtitleUrl] = useState<string | null>(null);

  // Toast thông báo trong player
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Overlay chuyển tập / phim tiếp theo & Đếm ngược
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const sourceId = `${movieSlug}:${episode.slug}:${episode.streamUrl}`;
  const [previousSourceId, setPreviousSourceId] = useState(sourceId);
  if (sourceId !== previousSourceId) {
    setPreviousSourceId(sourceId);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsBuffering(false);
    setShowControls(true);
    setShowNextOverlay(false);
    setCountdown(null);
  }

  // Refs cờ đánh dấu đã auto-skip trong tập hiện tại
  const hasAutoSkippedOutroRef = useRef(false);

  // Screen Wake Lock API: Giữ màn hình điện thoại luôn sáng khi đang xem phim
  useEffect(() => {
    if (!isPlaying || isBuffering || !isPageVisible || !("wakeLock" in navigator)) return;

    let wakeLock: WakeLockSentinel | null = null;
    let cancelled = false;
    void navigator.wakeLock.request("screen").then((lock) => {
      if (cancelled || document.hidden) return lock.release();
      wakeLock = lock;
    }).catch(() => {
      // Trình duyệt có thể từ chối khi thiết bị đang tiết kiệm pin.
    });

    return () => {
      cancelled = true;
      if (wakeLock && !wakeLock.released) void wakeLock.release().catch(() => {});
    };
  }, [isPlaying, isBuffering, isPageVisible]);

  // Điều hướng chuyển tập / phim tiếp theo
  const goToNext = useCallback(() => {
    setShowNextOverlay(false);
    setCountdown(null);
    if (onNextEpisode) {
      onNextEpisode();
      return;
    }
    if (nextEp) {
      router.push(`/watch/${movieSlug}?server=${selectedServerIndex}&ep=${nextEp.slug}`);
    } else if (nextMovie) {
      router.push(`/watch/${nextMovie.slug}`);
    }
  }, [onNextEpisode, nextEp, nextMovie, movieSlug, selectedServerIndex, router]);

  const goToPrev = useCallback(() => {
    if (prevEp) {
      router.push(`/watch/${movieSlug}?server=${selectedServerIndex}&ep=${prevEp.slug}`);
    }
  }, [prevEp, movieSlug, selectedServerIndex, router]);

  // Bắt đầu đếm ngược chuyển tập
  const startNextCountdown = useCallback(() => {
    if (!hasNextEp && !nextMovie) return;
    setShowNextOverlay(true);
    if (autoNextEpisode) {
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  }, [hasNextEp, nextMovie, autoNextEpisode]);

  // Xử lý đếm ngược chuyển tiếp tập mới
  useEffect(() => {
    if (countdown === null || !isPageVisible) return;
    if (countdown <= 0) {
      const timer = setTimeout(() => {
        goToNext();
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, goToNext, isPageVisible]);

  // Bỏ qua quảng cáo (Skip Ad)
  const handleSkipAd = useCallback(() => {
    if (!videoRef.current) return;
    const target = Math.min(duration || 99999, videoRef.current.currentTime + adDuration);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    showToast("Đã bỏ qua quảng cáo");
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
  }, [adDuration, duration, showToast]);

  // Bỏ qua đoạn mở đầu (Skip Intro)
  const handleSkipIntro = useCallback(() => {
    if (!videoRef.current) return;
    const target = videoRef.current.currentTime < introDuration ? introDuration : videoRef.current.currentTime + introDuration;
    const finalTime = Math.min(duration || 99999, target);
    videoRef.current.currentTime = finalTime;
    setCurrentTime(finalTime);
    showToast("Đã bỏ qua đoạn mở đầu");
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
  }, [introDuration, duration, showToast]);

  // Bỏ qua đoạn kết thúc (Skip Ending)
  const handleSkipEnding = useCallback(() => {
    if (hasNextEp || nextMovie) {
      startNextCountdown();
    } else if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = duration;
      showToast("Đã đến phần kết thúc");
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
  }, [hasNextEp, nextMovie, duration, startNextCountdown, showToast]);

  // Bật/tắt Picture-in-Picture
  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      showToast("Trình duyệt không cho phép mở cửa sổ thu nhỏ");
    }
  }, [showToast]);

  // Lưu định kỳ khi đang phát và lưu lần cuối trước khi rời tập.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hasPlayed = false;
    let lastSavedTime = -1;
    let lastSavedAt = performance.now();
    const saveProgress = () => {
      const time = Math.floor(video.currentTime);
      const length = Math.floor(video.duration);
      if (!hasPlayed || time <= 5 || !Number.isFinite(length) || length <= 0 || time === lastSavedTime) return;

      saveWatchProgress({
        movieId: movieSlug,
        slug: movieSlug,
        title: movieTitle,
        posterUrl,
        episodeName: episode.name,
        episodeSlug: episode.slug,
        progressSeconds: time,
        durationSeconds: length,
      });
      lastSavedTime = time;
      lastSavedAt = performance.now();
    };
    const trackPlayback = () => { hasPlayed = true; };
    const handleTimeUpdate = () => {
      if (!video.paused && performance.now() - lastSavedAt >= PROGRESS_SAVE_INTERVAL_MS) saveProgress();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) saveProgress();
    };

    video.addEventListener("playing", trackPlayback);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", saveProgress);
    video.addEventListener("ended", saveProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveProgress);
    return () => {
      saveProgress();
      video.removeEventListener("playing", trackPlayback);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", saveProgress);
      video.removeEventListener("ended", saveProgress);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveProgress);
    };
  }, [movieSlug, movieTitle, posterUrl, episode.name, episode.slug, episode.streamUrl]);

  // Thiết lập luồng phát Video (HLS.js tối ưu chống giật & khôi phục đúng tập)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    const streamUrl = episode.streamUrl;
    hasAutoSkippedOutroRef.current = false;

    const restoreProgress = () => {
      const savedProg = getEpisodeProgress(movieSlug, episode.slug);
      if (savedProg > 10) {
        video.currentTime = savedProg;
        return;
      }

      const settings = getPlayerSettings();
      if (settings.autoSkipAd && settings.adDuration > 0) {
        video.currentTime = settings.adDuration;
        showToast("Đã tự động bỏ qua quảng cáo đầu phim");
      } else if (settings.autoSkipIntro && settings.introDuration > 0) {
        video.currentTime = settings.introDuration;
        showToast("Đã tự động bỏ qua phần mở đầu");
      }
    };

    const syncBuffering = () => {
      if (document.pictureInPictureElement === video ||
          (!document.hidden && (!video.paused || video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA))) {
        hls?.resumeBuffering();
      } else {
        hls?.pauseBuffering();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && document.pictureInPictureElement !== video) video.pause();
      syncBuffering();
    };

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 45,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.once(Hls.Events.MANIFEST_PARSED, () => {
        restoreProgress();
        syncBuffering();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              syncBuffering();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      video.addEventListener("loadedmetadata", restoreProgress, { once: true });
      video.src = streamUrl;
    }

    const bufferingEvents = ["play", "pause", "seeking", "seeked", "loadeddata", "ended", "enterpictureinpicture"];
    if (hls) {
      for (const event of bufferingEvents) video.addEventListener(event, syncBuffering);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    video.addEventListener("leavepictureinpicture", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.removeEventListener("leavepictureinpicture", handleVisibilityChange);
      video.removeEventListener("loadedmetadata", restoreProgress);
      if (hls) {
        for (const event of bufferingEvents) video.removeEventListener(event, syncBuffering);
        hls.destroy();
      } else {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [episode.streamUrl, episode.slug, movieSlug, showToast]);

  // Khôi phục mức âm lượng đã lưu
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultPlaybackRate = playbackSpeed;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => () => {
    if (customSubtitleUrl) URL.revokeObjectURL(customSubtitleUrl);
  }, [customSubtitleUrl]);

  // Bộ khuếch đại âm thanh Web Audio API (Boost 180%)
  const initAudioBooster = useCallback(() => {
    if (audioCtxRef.current || !videoRef.current) return;

    let ctx: AudioContext | undefined;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AudioCtx();
      const gain = ctx.createGain();
      const source = ctx.createMediaElementSource(videoRef.current);

      gain.gain.value = 1.8;
      source.connect(gain);
      gain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    } catch {
      void ctx?.close().catch(() => {});
    }
  }, []);

  useEffect(() => () => {
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    gainNodeRef.current = null;
    void ctx?.close().catch(() => {});
  }, []);

  const toggleAudioBoost = useCallback(() => {
    const next = !audioBoost;
    if (next && videoRef.current && !videoRef.current.paused) initAudioBooster();
    updateSettings({ audioBoost: next });
    const ctx = audioCtxRef.current;
    if (ctx) gainNodeRef.current?.gain.setTargetAtTime(next ? 1.8 : 1.0, ctx.currentTime, 0.05);
  }, [audioBoost, initAudioBooster, updateSettings]);

  // Chỉ lấy mẫu khung hình khi video thực sự đang phát và trang còn hiển thị.
  useEffect(() => {
    if (!ambientGlow || !isPlaying || isBuffering || !isPageVisible) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) return;

    const updateGlow = () => {
      if (document.hidden || video.paused || video.ended || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch {
        // Tránh lỗi CORS từ remote m3u8 nếu có
      }
    };

    updateGlow();
    const intervalId = setInterval(updateGlow, 1000);

    return () => clearInterval(intervalId);
  }, [ambientGlow, isPlaying, isBuffering, isPageVisible]);

  // Điều khiển Play/Pause đồng bộ với video element
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (audioBoost) initAudioBooster();
      const ctx = audioCtxRef.current;
      if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
      void video.play().catch(() => setShowControls(true));
    } else {
      video.pause();
    }
  }, [audioBoost, initAudioBooster]);

  const skipTime = useCallback((amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
  }, [duration]);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (isFullscreen) {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen().catch(() => {});
      } else {
        setFullscreenMode("none");
      }
      return;
    }

    setShowControls(true);
    try {
      await container.requestFullscreen();
      setFullscreenMode("native");
    } catch {
      setFullscreenMode("fallback");
    }
  }, [isFullscreen]);

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreenMode(document.fullscreenElement === containerRef.current ? "native" : "none");
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape") => Promise<void>;
    };
    let cancelled = false;
    let locked = false;
    if (fullscreenMode === "native" && orientation?.lock) {
      void orientation.lock("landscape").then(() => {
        if (cancelled) orientation.unlock();
        else locked = true;
      }).catch(() => {
        // Fallback xoay ngang bằng CSS
      });
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fullscreenMode === "fallback") setFullscreenMode("none");
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => {
      cancelled = true;
      if (locked) orientation.unlock();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", exitOnEscape);
    };
  }, [fullscreenMode, isFullscreen]);

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === "Space" || e.key === " " || e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          goToNext();
          break;
        case "p":
          e.preventDefault();
          goToPrev();
          break;
        case "i":
          e.preventDefault();
          handleSkipIntro();
          break;
        case "e":
          e.preventDefault();
          handleSkipEnding();
          break;
        case "a":
          e.preventDefault();
          handleSkipAd();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          setIsMuted((prev) => {
            if (videoRef.current) videoRef.current.muted = !prev;
            return !prev;
          });
          break;
        case "j":
        case "arrowleft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "l":
        case "arrowright":
          e.preventDefault();
          skipTime(10);
          break;
        case "b":
          e.preventDefault();
          toggleAudioBoost();
          break;
        case "g":
          e.preventDefault();
          updateSettings({ ambientGlow: !ambientGlow });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    goToNext,
    goToPrev,
    handleSkipIntro,
    handleSkipEnding,
    handleSkipAd,
    toggleFullscreen,
    skipTime,
    toggleAudioBoost,
    ambientGlow,
    updateSettings,
  ]);

  const revealControls = () => {
    lastControlsActivityRef.current = performance.now();
    if (!showControls) setShowControls(true);
  };

  useEffect(() => {
    if (!showControls || !isPlaying || showSettings) return;
    lastControlsActivityRef.current = performance.now();
    const hideControlsWhenIdle = () => {
      const remaining = CONTROLS_HIDE_DELAY_MS - (performance.now() - lastControlsActivityRef.current);
      if (remaining > 0) timer = setTimeout(hideControlsWhenIdle, remaining);
      else setShowControls(false);
    };
    let timer = setTimeout(hideControlsWhenIdle, CONTROLS_HIDE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showControls, isPlaying, showSettings]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    revealControls();
  };

  // Cử chỉ chạm / Click thông minh: Double-tap không gây chớp nháy controls
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".controls-interactive")) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const now = Date.now();
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    // Kiểm tra chạm đúp (Double-tap trong vòng 280ms)
    if (lastTapRef.current && now - lastTapRef.current.time < 280 && Math.abs(clickX - lastTapRef.current.x) < 90) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = null;

      if (clickX < width * 0.38) {
        // Chạm đúp bên trái -> Tua lùi 10s
        skipTime(-10);
        setDoubleTapFeedback("left");
        if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = setTimeout(() => setDoubleTapFeedback(null), 650);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);
        return;
      } else if (clickX > width * 0.62) {
        // Chạm đúp bên phải -> Tua tiến 10s
        skipTime(10);
        setDoubleTapFeedback("right");
        if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = setTimeout(() => setDoubleTapFeedback(null), 650);
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(25);
        return;
      }
    }

    lastTapRef.current = { time: now, x: clickX };

    if (isTouch) {
      // Nếu chạm vào 2 bên mép, delay 200ms để đợi double-tap; chạm ở giữa thì toggle ngay lập tức
      if (clickX < width * 0.38 || clickX > width * 0.62) {
        if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = setTimeout(() => {
          setShowControls((prev) => !prev);
        }, 200);
      } else {
        setShowControls((prev) => !prev);
      }
    } else {
      togglePlay();
      revealControls();
    }
  };

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSubtitleUrl(url);
    showToast("Đã tải phụ đề ngoài thành công");
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onClick={handleContainerClick}
      onFocusCapture={revealControls}
      className={`cine-player relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none cursor-pointer ${
        isFullscreen ? "cine-player-fullscreen" : ""
      }`}
    >
      <div className="cine-player-surface relative w-full h-full">
        {/* Ambient Glow Canvas Layer */}
        {ambientGlow && isPlaying && isPageVisible && (
          <canvas
            ref={canvasRef}
            width={32}
            height={18}
            className="absolute inset-0 w-full h-full object-cover filter blur-[60px] opacity-50 scale-105 pointer-events-none transition-all duration-700 ease-out"
          />
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          poster={posterUrl}
          onPlay={() => {
            if (audioBoost) initAudioBooster();
            const ctx = audioCtxRef.current;
            if (ctx) void ctx.resume().catch(() => {});
            setIsPlaying(true);
          }}
          onPause={() => {
            const ctx = audioCtxRef.current;
            if (ctx?.state === "running") void ctx.suspend().catch(() => {});
            setIsPlaying(false);
            setIsBuffering(false);
            setShowControls(true);
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsPlaying(true);
            setIsBuffering(false);
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const cur = videoRef.current.currentTime;
              const dur = videoRef.current.duration;
              const displayedTime = Math.floor(cur);
              if (displayedTime !== currentTime) setCurrentTime(displayedTime);

              // Tự động bỏ qua kết thúc (Auto-skip Outro) nếu được bật
              if (
                autoSkipOutro &&
                dur > 180 &&
                cur >= dur - outroDuration &&
                !hasAutoSkippedOutroRef.current &&
                (hasNextEp || nextMovie)
              ) {
                hasAutoSkippedOutroRef.current = true;
                showToast("Tự động chuyển tiếp khi hết nội dung chính");
                startNextCountdown();
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (hasNextEp || nextMovie) {
              startNextCountdown();
            } else if (onNextEpisode) {
              onNextEpisode();
            }
          }}
          className={`relative w-full h-full z-10 ${
            fitMode === "cover" ? "object-cover" : "object-contain"
          }`}
        >
          {customSubtitleUrl && (
            <track
              kind="subtitles"
              label="Phụ đề tải lên"
              src={customSubtitleUrl}
              default
            />
          )}
        </video>

        {/* Hiệu ứng gợn sóng khi chạm đúp trên điện thoại (Double-Tap Ripple) */}
        {doubleTapFeedback === "left" && (
          <div className="absolute left-0 top-0 bottom-0 w-1/3 z-30 pointer-events-none flex items-center justify-center bg-white/5 rounded-r-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-white drop-shadow-lg">
              <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/20 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold font-mono mt-1">-10s</span>
            </div>
          </div>
        )}
        {doubleTapFeedback === "right" && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 z-30 pointer-events-none flex items-center justify-center bg-white/5 rounded-l-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-white drop-shadow-lg">
              <RotateCw className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/20 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold font-mono mt-1">+10s</span>
            </div>
          </div>
        )}

        {/* Toast Notification trong Player */}
        {toastMessage && (
          <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-35 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full sm:rounded-xl bg-zinc-900/90 text-white border border-white/10 shadow-2xl backdrop-blur-md text-[11px] sm:text-xs font-semibold flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
            <Sparkles className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center z-25 pointer-events-none">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 animate-spin" />
          </div>
        )}

        {/* Nút Skip nổi 1-chạm (Tự động thích ứng vị trí khi ẩn/hiện thanh điều khiển) */}
        <div
          className={`absolute right-3 sm:right-6 z-25 flex flex-col items-end gap-2 pointer-events-auto transition-all duration-300 ${
            showControls ? "bottom-14 sm:bottom-20" : "bottom-3 sm:bottom-6"
          }`}
        >
          {/* Nút Bỏ qua Quảng cáo (Hiện trong 60 giây đầu) */}
          {isPlaying && currentTime >= 0 && currentTime <= 60 && duration > 60 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkipAd();
              }}
              className="controls-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-full sm:rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer backdrop-blur"
              title="Bỏ qua quảng cáo nhà cái (+30s, Phím A)"
            >
              <Zap className="w-3.5 h-3.5 fill-black shrink-0" />
              <span>Bỏ qua QC</span>
            </button>
          )}

          {/* Nút Bỏ qua Mở đầu (Intro) */}
          {isPlaying && currentTime >= 5 && currentTime <= Math.max(introDuration + 20, 120) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkipIntro();
              }}
              className="controls-interactive flex items-center gap-1.5 px-3.5 py-1.5 rounded-full sm:rounded-xl bg-black/75 hover:bg-black/90 text-white font-bold text-xs border border-white/20 shadow-xl active:scale-95 transition-all cursor-pointer backdrop-blur"
              title="Bỏ qua đoạn mở đầu / bài hát (Phím I)"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Bỏ qua mở đầu</span>
            </button>
          )}

          {/* Nút Bỏ qua Kết thúc (Outro / Ending) */}
          {duration > 180 && currentTime >= duration - outroDuration && !showNextOverlay && (hasNextEp || nextMovie) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkipEnding();
              }}
              className="controls-interactive flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full sm:rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-2xl shadow-red-600/50 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="Bỏ qua đoạn kết & chuyển sang tập mới (Phím E)"
            >
              <SkipForward className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>{hasNextEp ? "Tập tiếp" : "Phim tiếp"}</span>
            </button>
          )}
        </div>

        {/* Overlay Chuyển tiếp tập / phim tiếp theo khi hết phim (Tối ưu cho cả Mobile & Desktop) */}
        {showNextOverlay && (hasNextEp || nextMovie) && (
          <div
            className="controls-interactive absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-white pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-[92%] sm:max-w-md bg-zinc-900/95 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-red-500 font-black mb-1 sm:mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{hasNextEp ? "Tập Phim Tiếp Theo" : "Đề Xuất Phim Mới"}</span>
              </div>

              <h3 className="text-base sm:text-xl font-black text-white line-clamp-1 mb-1">
                {hasNextEp ? `${movieTitle} - ${nextEp?.name}` : nextMovie?.title}
              </h3>

              {nextMovie && !hasNextEp && (
                <p className="text-[11px] sm:text-xs text-zinc-400 mb-2 sm:mb-4 line-clamp-2">
                  {nextMovie.overview || "Thưởng thức tác phẩm tiếp theo được đề xuất phù hợp cho bạn."}
                </p>
              )}

              {/* Countdown trạng thái */}
              {countdown !== null && (
                <div className="my-2 sm:my-3 flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 animate-spin" />
                  <span>
                    Tự động phát sau <span className="text-red-500 font-bold text-sm sm:text-base">{countdown}</span> giây...
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full mt-2">
                <button
                  onClick={() => {
                    setShowNextOverlay(false);
                    setCountdown(null);
                  }}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {countdown !== null ? "Hủy" : "Ở lại"}
                </button>
                <button
                  onClick={goToNext}
                  className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/40 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Phát ngay</span>
                </button>
              </div>

              {/* Nút gạt tự động chuyển tập */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between w-full text-[11px] sm:text-xs text-zinc-400">
                <span>Tự động chuyển tập</span>
                <button
                  onClick={() => {
                    const next = !autoNextEpisode;
                    updateSettings({ autoNextEpisode: next });
                    if (!next) {
                      setCountdown(null);
                    } else if (countdown === null) {
                      setCountdown(5);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer ${
                    autoNextEpisode ? "bg-red-600/30 text-red-400 border border-red-500/30" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {autoNextEpisode ? "BẬT" : "TẮT"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Bar Info */}
        <div
          className={`controls-interactive absolute top-0 left-0 right-0 p-3 sm:p-6 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="shrink-0 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider shadow">
              {episode.quality || "1080p"} FHD
            </span>
            <h2 className="text-xs sm:text-base font-bold text-white line-clamp-1">
              {movieTitle} <span className="text-zinc-400 font-normal">({episode.name})</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {audioBoost && (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-300" />
                <span className="hidden sm:inline">Audio Boost</span> 180%
              </span>
            )}
            {ambientGlow && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <Sparkles className="w-3 h-3" />
                Ambient ON
              </span>
            )}
          </div>
        </div>

        {/* Center Big Play Button (Khi dừng phát) */}
        {!isPlaying && !showNextOverlay && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label="Phát video"
              className="controls-interactive w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-transform pointer-events-auto cursor-pointer"
            >
              <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-white ml-0.5" />
            </button>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div
          className={`controls-interactive absolute bottom-0 left-0 right-0 px-2 py-1.5 sm:p-6 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-1.5 sm:gap-2 transition-opacity duration-300 ${
            showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrubber Progress Bar */}
          <div className="relative group/scrubber cursor-pointer flex items-center h-3 sm:h-4">
            <input
              type="range"
              aria-label="Tiến độ phát"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full h-1 group-hover/scrubber:h-2 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-red-600 transition-all"
            />
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex min-w-0 items-center gap-0.5 sm:gap-3">
              {/* Nút Tập Trước */}
              {hasPrevEp && (
                <button
                  onClick={goToPrev}
                  className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-red-400 transition-colors cursor-pointer"
                  title={`Tập trước: ${prevEp?.name} (Phím P)`}
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>
              )}

              {/* Nút Phát / Tạm dừng */}
              <button
                onClick={togglePlay}
                className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-red-400 transition-colors cursor-pointer"
                title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              {/* Nút Tập Tiếp Theo */}
              {(hasNextEp || nextMovie) && (
                <button
                  onClick={goToNext}
                  className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-red-400 transition-colors cursor-pointer"
                  title={hasNextEp ? `Tập tiếp theo: ${nextEp?.name} (Phím N)` : `Phim tiếp theo: ${nextMovie?.title} (Phím N)`}
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              )}

              {/* Tua lùi 10s */}
              <button
                onClick={() => skipTime(-10)}
                className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-red-400 transition-colors cursor-pointer"
                title="Lùi 10s (J)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Tua tiến 10s */}
              <button
                onClick={() => skipTime(10)}
                className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-red-400 transition-colors cursor-pointer"
                title="Tiến 10s (L)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Nút Bỏ qua QC nhanh trên thanh điều khiển */}
              <button
                onClick={handleSkipAd}
                className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1 hover:text-amber-400 text-zinc-300 transition-colors cursor-pointer"
                title="Bỏ qua quảng cáo trực tiếp (+30s, Phím A)"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400/30" />
                <span className="text-[10px] font-bold ml-0.5">QC</span>
              </button>

              {/* Điều khiển Âm lượng (Desktop) */}
              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                  }}
                  className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors cursor-pointer"
                  title="Âm lượng (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setIsMuted(false);
                    updateSettings({ volume: val });
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hidden sm:block"
                />
              </div>

              {/* Thời gian phát */}
              <div className="whitespace-nowrap text-[10px] sm:text-xs font-mono text-zinc-300 ml-1">
                {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {/* Nút Audio Boost (Desktop) */}
              <button
                onClick={toggleAudioBoost}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  audioBoost
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
                }`}
                title="Kích âm lượng lên 180% & làm rõ giọng nói (Phím B)"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden md:inline">Audio Boost</span>
              </button>

              {/* Nút Ambient Glow (Desktop) */}
              <button
                onClick={() => {
                  updateSettings({ ambientGlow: !ambientGlow });
                }}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  ambientGlow
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                    : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400"
                }`}
                title="Bật/Tắt Hào Quang Ambient Glow (Phím G)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ambient</span>
              </button>

              {/* Nút Picture-in-Picture (Cửa sổ nổi thu nhỏ) */}
              {isPipSupported && (
                <button
                  onClick={togglePip}
                  className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors cursor-pointer"
                  title="Cửa sổ thu nhỏ (Picture-in-Picture)"
                  aria-label="Cửa sổ thu nhỏ"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>
              )}

              {/* Nút Menu Cài đặt Chuyên Nghiệp */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors cursor-pointer"
                  title="Cài đặt phát & Bỏ qua thông minh"
                  aria-expanded={showSettings}
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              {/* Nút Toàn màn hình */}
              <button
                onClick={toggleFullscreen}
                className="inline-flex min-w-8 min-h-8 sm:min-w-9 sm:min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors cursor-pointer"
                title={isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                aria-pressed={isFullscreen}
                style={{ flexShrink: 0 }}
              >
                {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Cài Đặt: Chống tràn/cắt góc tuyệt đối (Mobile Bottom Sheet + Desktop Dropdown an toàn) */}
        {showSettings && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm sm:absolute sm:inset-auto sm:bottom-12 sm:right-0 sm:bg-transparent sm:backdrop-blur-none flex flex-col justify-end sm:block pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(false);
            }}
          >
            <div
              className="w-full sm:w-84 max-h-[85vh] sm:max-h-[min(420px,calc(100%-3.5rem))] overflow-y-auto p-5 sm:p-4 rounded-t-3xl sm:rounded-2xl bg-zinc-950/98 sm:bg-zinc-950/95 border-t sm:border border-white/10 shadow-2xl backdrop-blur-xl text-xs space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle kéo trên điện thoại */}
              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto sm:hidden mb-2" />

              {/* Header Cài đặt */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-white text-sm">Cài Đặt Trình Phát</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Điều khiển Âm thanh & Hiệu ứng trên Mobile */}
              <div className="grid grid-cols-2 gap-2 sm:hidden pb-1">
                <button
                  onClick={toggleAudioBoost}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
                    audioBoost ? "bg-amber-500 text-black shadow-lg" : "bg-zinc-900 text-zinc-300 border border-white/5"
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Kích âm 180%</span>
                </button>
                <button
                  onClick={() => {
                    updateSettings({ ambientGlow: !ambientGlow });
                  }}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
                    ambientGlow ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40" : "bg-zinc-900 text-zinc-300 border border-white/5"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Hào quang</span>
                </button>
              </div>

              {/* Mục 1: Tỉ lệ hiển thị khung hình (Fit / Cover) */}
              <div>
                <span className="font-bold text-zinc-200 block mb-1.5 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Khung hình hiển thị:</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateSettings({ fitMode: "contain" });
                    }}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer text-center ${
                      fitMode === "contain"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    Chứa trọn (Chuẩn)
                  </button>
                  <button
                    onClick={() => {
                      updateSettings({ fitMode: "cover" });
                    }}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer text-center ${
                      fitMode === "cover"
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    Lấp đầy (Cắt viền đen)
                  </button>
                </div>
              </div>

              {/* Mục 2: Tốc độ phát */}
              <div>
                <span className="font-bold text-zinc-200 block mb-1.5">Tốc độ phát:</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        updateSettings({ playbackSpeed: speed });
                      }}
                      className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        playbackSpeed === speed
                          ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* BỘ TỰ ĐỘNG THÔNG MINH (Chỉ cần 1 chạm bật/tắt - Áp dụng cho mọi phim vĩnh viễn) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tự Động Hóa Thông Minh (Áp dụng mọi phim)</span>
                </div>

                {/* Switch 1: Tự động chuyển tập */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div>
                    <span className="font-bold text-zinc-200 block text-xs">Tự động chuyển tập</span>
                    <span className="text-[10px] text-zinc-400">Tự phát tập/phim kế tiếp khi hết</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoNextEpisode;
                      updateSettings({ autoNextEpisode: next });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      autoNextEpisode ? "bg-red-600 shadow-md shadow-red-600/30" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        autoNextEpisode ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2: Bỏ qua Mở đầu */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div>
                    <span className="font-bold text-zinc-200 block text-xs">Tự động bỏ qua mở đầu (Intro)</span>
                    <span className="text-[10px] text-zinc-400">Tự động lướt qua nhạc giới thiệu</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoSkipIntro;
                      updateSettings({ autoSkipIntro: next });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      autoSkipIntro ? "bg-red-600 shadow-md shadow-red-600/30" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        autoSkipIntro ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 3: Bỏ qua Quảng cáo */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div>
                    <span className="font-bold text-amber-300 block text-xs">Tự động bỏ qua QC đầu video</span>
                    <span className="text-[10px] text-zinc-400">Tự động lướt qua clip quảng cáo nhà cái</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoSkipAd;
                      updateSettings({ autoSkipAd: next });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      autoSkipAd ? "bg-amber-500 shadow-md shadow-amber-500/30" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        autoSkipAd ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 4: Bỏ qua Phần kết */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div>
                    <span className="font-bold text-zinc-200 block text-xs">Tự động bỏ qua phần kết (Outro)</span>
                    <span className="text-[10px] text-zinc-400">Chuyển tập ngay khi hết nội dung chính</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoSkipOutro;
                      updateSettings({ autoSkipOutro: next });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      autoSkipOutro ? "bg-red-600 shadow-md shadow-red-600/30" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        autoSkipOutro ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tùy Chỉnh Giây Nâng Cao (Thu gọn mặc định để người dùng không phải bận tâm) */}
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => setShowAdvancedTiming(!showAdvancedTiming)}
                  className="w-full flex items-center justify-between text-zinc-400 hover:text-zinc-200 text-[11px] py-1 cursor-pointer"
                >
                  <span>Tùy chỉnh số giây chi tiết (Mặc định đã tối ưu)</span>
                  {showAdvancedTiming ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAdvancedTiming && (
                  <div className="space-y-3 pt-2 text-[11px]">
                    <div>
                      <span className="text-zinc-400 block mb-1">Thời lượng Mở đầu (Intro):</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[60, 85, 90, 120].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => {
                              updateSettings({ introDuration: sec });
                            }}
                            className={`py-1 rounded font-bold ${
                              introDuration === sec ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block mb-1">Thời lượng QC đầu video:</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[15, 30, 45].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => {
                              updateSettings({ adDuration: sec });
                            }}
                            className={`py-1 rounded font-bold ${
                              adDuration === sec ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-400 block mb-1">Thời lượng Phần kết (Outro):</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[60, 90, 120].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => {
                              updateSettings({ outroDuration: sec });
                            }}
                            className={`py-1 rounded font-bold ${
                              outroDuration === sec ? "bg-red-600 text-white" : "bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tải phụ đề ngoài */}
              <div className="pt-2 border-t border-white/5">
                <span className="font-bold text-zinc-200 block mb-1">Tải file phụ đề (.vtt, .srt):</span>
                <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 cursor-pointer text-zinc-300 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn tệp phụ đề</span>
                  <input
                    type="file"
                    accept=".vtt,.srt"
                    onChange={handleSubtitleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
