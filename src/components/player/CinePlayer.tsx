"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
import { Episode } from "@/types/movie";
import {
  getPlayerSettings,
  savePlayerSettings,
  saveWatchProgress,
  getMovieProgress,
} from "@/lib/storage";
import { formatSecondsToTime } from "@/lib/utils";

interface CinePlayerProps {
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
  episode: Episode;
  onNextEpisode?: () => void;
}

export default function CinePlayer({
  movieSlug,
  movieTitle,
  posterUrl,
  episode,
  onNextEpisode,
}: CinePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Web Audio API refs for Audio Booster
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioConnectedRef = useRef(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState<"none" | "native" | "fallback">("none");
  const isFullscreen = fullscreenMode !== "none";
  const [showControls, setShowControls] = useState(true);
  const [controlsActivity, setControlsActivity] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [audioBoost, setAudioBoost] = useState(false);

  // Subtitles
  const [customSubtitleUrl, setCustomSubtitleUrl] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo cài đặt người dùng từ LocalStorage
  useEffect(() => {
    const s = getPlayerSettings();
    setAmbientGlow(s.ambientGlow);
    setAudioBoost(s.audioBoost);
    setPlaybackSpeed(s.playbackSpeed);
  }, []);

  // Thiết lập luồng phát Video (HLS.js tối ưu chống giật)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    const streamUrl = episode.streamUrl;

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Tắt low-latency để tăng dung lượng buffer VOD chống giật
        backBufferLength: 90,
        maxBufferLength: 60, // Tải trước 60 giây video để chạy mượt
        maxMaxBufferLength: 300,
        maxBufferSize: 60 * 1000 * 1000, // 60MB bộ nhớ đệm
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const savedProg = getMovieProgress(movieSlug);
        if (savedProg && savedProg.progressSeconds > 10 && savedProg.progressSeconds < (savedProg.durationSeconds - 30)) {
          video.currentTime = savedProg.progressSeconds;
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      const savedProg = getMovieProgress(movieSlug);
      if (savedProg && savedProg.progressSeconds > 10) {
        video.currentTime = savedProg.progressSeconds;
      }
    } else {
      video.src = streamUrl;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [episode.streamUrl, movieSlug]);

  // Audio Booster (Web Audio API)
  const initAudioBooster = useCallback(() => {
    if (audioConnectedRef.current || !videoRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(videoRef.current);
      const gainNode = ctx.createGain();

      gainNode.gain.value = audioBoost ? 1.8 : 1.0;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioCtxRef.current = ctx;
      gainNodeRef.current = gainNode;
      audioConnectedRef.current = true;
    } catch (err) {
      console.warn("Audio Context init warning:", err);
    }
  }, [audioBoost]);

  const toggleAudioBoost = () => {
    initAudioBooster();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    const nextState = !audioBoost;
    setAudioBoost(nextState);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextState ? 1.8 : 1.0;
    }
    savePlayerSettings({ audioBoost: nextState });
  };

  // Ambient Glow Canvas Engine: Tối ưu với chu kỳ 600ms (giảm 85% tải GPU)
  useEffect(() => {
    if (!ambientGlow) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let intervalId: NodeJS.Timeout;

    const captureColor = () => {
      if (!video.paused && !video.ended && video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {
          // Bỏ qua nếu cross-origin CORS chặn canvas
        }
      }
    };

    intervalId = setInterval(captureColor, 600);
    return () => clearInterval(intervalId);
  }, [ambientGlow]);

  // Tự động lưu tiến độ xem
  useEffect(() => {
    if (currentTime > 5 && duration > 0) {
      const timer = setTimeout(() => {
        saveWatchProgress({
          movieId: movieSlug,
          slug: movieSlug,
          title: movieTitle,
          posterUrl,
          episodeName: episode.name,
          episodeSlug: episode.slug,
          progressSeconds: Math.floor(currentTime),
          durationSeconds: Math.floor(duration),
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentTime, duration, movieSlug, movieTitle, posterUrl, episode.name, episode.slug]);

  // Playback state follows media events, including rejected play requests.
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    initAudioBooster();
    if (video.paused) {
      void video.play().catch(() => setShowControls(true));
    } else {
      video.pause();
    }
  };

  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
  };

  const toggleFullscreen = async () => {
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
      // Keep the custom controls on browsers without the Fullscreen API.
      setFullscreenMode("fallback");
    }
  };

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
        // Portrait touch screens use the CSS landscape fallback below.
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
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
          setAmbientGlow((prev) => {
            savePlayerSettings({ ambientGlow: !prev });
            return !prev;
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleFullscreen]);

  const revealControls = () => {
    setShowControls(true);
    setControlsActivity((activity) => activity + 1);
  };

  useEffect(() => {
    if (!showControls || !isPlaying || showSettings) return;
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3500);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isPlaying, showSettings, controlsActivity]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch-generated mouse events must not reveal a hidden button before its tap.
    if (event.pointerType !== "mouse") return;
    revealControls();
  };

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSubtitleUrl(url);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onClick={revealControls}
      onFocusCapture={revealControls}
      className={`cine-player relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none ${isFullscreen ? "cine-player-fullscreen" : ""}`}
    >
      <div className="cine-player-surface relative w-full h-full">
        {/* Ambient Glow Canvas Layer (Transition 600ms siêu mượt) */}
        {ambientGlow && (
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          poster={posterUrl}
          onClick={revealControls}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onNextEpisode) onNextEpisode();
          }}
          className="relative w-full h-full object-contain z-10 cursor-pointer"
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

        {/* Top Bar Info */}
        <div
          className={`absolute top-0 left-0 right-0 p-4 sm:p-6 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="shrink-0 text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider shadow">
              {episode.quality || "1080p"} FHD
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              {movieTitle} <span className="text-zinc-400 font-normal">({episode.name})</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {audioBoost && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Zap className="w-3 h-3 fill-amber-300" />
                Audio Boost 180%
              </span>
            )}
            {ambientGlow && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <Sparkles className="w-3 h-3" />
                Ambient Glow ON
              </span>
            )}
          </div>
        </div>

        {/* Center Play Indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30 pointer-events-none">
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Phát video"
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 transition-transform pointer-events-auto"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          </div>
        )}

        {/* Bottom Controls Bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-2 py-1 sm:p-6 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          inert={!showControls}
          onClick={(event) => {
            event.stopPropagation();
            revealControls();
          }}
        >
          {/* Scrubber Progress Bar */}
          <div className="relative group/scrubber cursor-pointer flex items-center h-4">
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
            <div className="flex min-w-0 items-center gap-0 sm:gap-4">
              <button
                onClick={togglePlay}
                className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
                title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={() => skipTime(-10)}
                className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
                title="Lùi 10s (J)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipTime(10)}
                className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
                title="Tiến 10s (L)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (videoRef.current) videoRef.current.muted = !isMuted;
                  }}
                  className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
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
                    setVolume(val);
                    setIsMuted(false);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hidden sm:block"
                />
              </div>

              <div className="whitespace-nowrap text-[10px] sm:text-xs font-mono text-zinc-300">
                {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0 sm:gap-3">
              <button
                onClick={toggleAudioBoost}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  audioBoost
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
                }`}
                title="Kích âm lượng lên 180% & làm rõ giọng nói (Phím B)"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden md:inline">Audio Boost</span>
              </button>

              <button
                onClick={() => {
                  setAmbientGlow(!ambientGlow);
                  savePlayerSettings({ ambientGlow: !ambientGlow });
                }}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  ambientGlow
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                    : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400"
                }`}
                title="Bật/Tắt Hào Quang Ambient Glow (Phím G)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ambient</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
                  title="Tùy chỉnh tốc độ & phụ đề"
                  aria-expanded={showSettings}
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="cine-player-settings absolute bottom-10 -right-9 w-60 overflow-y-auto sm:right-0 sm:w-64 p-3 sm:p-4 rounded-xl bg-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 text-xs space-y-4">
                    <div className="flex flex-wrap gap-2 sm:hidden">
                      <button onClick={() => {
                        setIsMuted(!isMuted);
                        if (videoRef.current) videoRef.current.muted = !isMuted;
                      }} className="rounded bg-zinc-800 px-2 py-2" aria-pressed={isMuted}>
                        {isMuted ? "Bật tiếng" : "Tắt tiếng"}
                      </button>
                      <button onClick={toggleAudioBoost} aria-pressed={audioBoost} className="rounded bg-zinc-800 px-2 py-2">Kích âm</button>
                      <button onClick={() => {
                        setAmbientGlow(!ambientGlow);
                        savePlayerSettings({ ambientGlow: !ambientGlow });
                      }} aria-pressed={ambientGlow} className="rounded bg-zinc-800 px-2 py-2">Hào quang</button>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-200 block mb-2">Tốc độ phát:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackSpeed(speed);
                              if (videoRef.current) videoRef.current.playbackRate = speed;
                              savePlayerSettings({ playbackSpeed: speed });
                            }}
                            className={`py-1 rounded font-semibold ${
                              playbackSpeed === speed
                                ? "bg-red-600 text-white"
                                : "bg-zinc-900 text-zinc-400 hover:text-white"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-zinc-200 block mb-1">Tải file phụ đề ngoài:</span>
                      <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 cursor-pointer text-zinc-300">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Chọn file (.vtt, .srt)</span>
                        <input
                          type="file"
                          accept=".vtt,.srt"
                          onChange={handleSubtitleUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="inline-flex min-w-9 min-h-9 items-center justify-center p-1.5 hover:text-red-400 transition-colors"
                title={isFullscreen ? "Thoát toàn màn hình (F)" : "Toàn màn hình (F)"}
                aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                aria-pressed={isFullscreen}
                style={{ flexShrink: 0 }}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
