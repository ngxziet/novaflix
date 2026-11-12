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
  Volume1,
  Settings,
  Sliders,
  Upload,
  Check,
  Zap,
} from "lucide-react";
import { Episode, VideoQuality } from "@/types/movie";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [audioBoost, setAudioBoost] = useState(false);

  // Subtitles
  const [customSubtitleUrl, setCustomSubtitleUrl] = useState<string | null>(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0); // seconds
  const [subtitleSize, setSubtitleSize] = useState<"small" | "medium" | "large">("medium");

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Khởi tạo cài đặt người dùng từ LocalStorage
  useEffect(() => {
    const s = getPlayerSettings();
    setAmbientGlow(s.ambientGlow);
    setAudioBoost(s.audioBoost);
    setPlaybackSpeed(s.playbackSpeed);
  }, []);

  // Thiết lập luồng phát Video (HLS.js hoặc Native)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    const streamUrl = episode.streamUrl;

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Khôi phục vị trí xem dở
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
      // Native Safari iOS / macOS
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

  // Ambient Glow Canvas Engine (Mô phỏng rạp chiếu tràn viền)
  useEffect(() => {
    if (!ambientGlow) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let lastDraw = 0;

    const renderGlow = (timestamp: number) => {
      if (timestamp - lastDraw > 80 && !video.paused && !video.ended) {
        lastDraw = timestamp;
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch {
          // Cross-origin canvas draw might be blocked on some embeds
        }
      }
      animId = requestAnimationFrame(renderGlow);
    };

    animId = requestAnimationFrame(renderGlow);
    return () => cancelAnimationFrame(animId);
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

  // Điều khiển Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    initAudioBooster();
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Tua 10 giây
  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
  };

  // Chuyển đổi toàn màn hình
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input
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

  // Xử lý ẩn/hiện thanh điều khiển khi di chuột
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Xử lý upload file phụ đề ngoài (.srt / .vtt)
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSubtitleUrl(url);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group select-none"
    >
      {/* Ambient Glow Canvas Layer */}
      {ambientGlow && (
        <canvas
          ref={canvasRef}
          width={64}
          height={36}
          className="absolute inset-0 w-full h-full object-cover filter blur-[90px] opacity-60 scale-110 pointer-events-none transition-opacity duration-700"
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        poster={posterUrl}
        onClick={togglePlay}
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

      {/* Top Bar Info (Visible on hover) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 z-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider shadow">
            {episode.quality || "1080p"} FHD
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
            {movieTitle} <span className="text-zinc-400 font-normal">({episode.name})</span>
          </h2>
        </div>

        {/* Ambient & Boost Badges */}
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

      {/* Center Play/Pause Large Indicator on Click */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-20 bg-black/30 cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="relative group/scrubber cursor-pointer flex items-center h-4">
          <input
            type="range"
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
          {/* Left: Play/Pause, Rewind, Forward, Time */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-red-400 transition-colors"
              title={isPlaying ? "Tạm dừng (Space)" : "Phát (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 hover:text-red-400 transition-colors"
              title="Lùi 10s (J)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 hover:text-red-400 transition-colors"
              title="Tiến 10s (L)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
                className="p-1.5 hover:text-red-400 transition-colors"
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

            {/* Time Stamp */}
            <div className="text-xs font-mono text-zinc-300">
              {formatSecondsToTime(currentTime)} / {formatSecondsToTime(duration)}
            </div>
          </div>

          {/* Right: Audio Boost, Ambient Glow, Settings, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Booster Button */}
            <button
              onClick={toggleAudioBoost}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                audioBoost
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                  : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
              }`}
              title="Kích âm lượng lên 180% & làm rõ giọng nói (Phím B)"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Audio Boost</span>
            </button>

            {/* Ambient Glow Toggle Button */}
            <button
              onClick={() => {
                setAmbientGlow(!ambientGlow);
                savePlayerSettings({ ambientGlow: !ambientGlow });
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                ambientGlow
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                  : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400"
              }`}
              title="Bật/Tắt Hào Quang Ambient Glow (Phím G)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ambient</span>
            </button>

            {/* Settings Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 hover:text-red-400 transition-colors"
                title="Tùy chỉnh tốc độ & phụ đề"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute bottom-10 right-0 w-64 p-4 rounded-xl bg-zinc-950/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 text-xs space-y-4">
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

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-red-400 transition-colors"
              title="Toàn màn hình (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
