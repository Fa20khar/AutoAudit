import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Video, Sparkles, Film, Play, Pause, RotateCcw, Download, 
  Copy, Check, AlertCircle, Loader2, Maximize2, Smartphone, Monitor,
  Info, ExternalLink, ChevronRight, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export type AspectRatio = '16:9' | '9:16';

interface VeoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface VideoResult {
  id: string;
  prompt: string;
  aspectRatio: AspectRatio;
  videoUrl: string;
  model: string;
  createdAt: string;
  isSample?: boolean;
}

const PRESET_PROMPTS: Array<{ title: string; prompt: string; ratio: AspectRatio; tag: string }> = [
  {
    title: '360° Studio Showcase',
    tag: 'Showcase',
    ratio: '16:9',
    prompt: 'Cinematic 360-degree sweep around a midnight black Porsche 911 GT3 in a clean minimalist studio, spotlights reflecting off flawless ceramic coat paint, 4k photorealistic lighting.',
  },
  {
    title: 'Engine & Chassis Inspection',
    tag: 'Inspection',
    ratio: '16:9',
    prompt: 'Detailed mechanical walkthrough under the hood of a twin-turbo engine, macro camera pan over intake manifold, suspension struts, and brake calipers with automotive workshop lighting.',
  },
  {
    title: 'Vertical Mobile Garage Reel',
    tag: 'Mobile Reel',
    ratio: '9:16',
    prompt: 'Vertical 9:16 smartphone inspection walkthrough reviewing door panel gaps, laser-straight body lines, and front fascia of a luxury performance vehicle in a modern glass garage.',
  },
  {
    title: 'Odometer & Cockpit Scan',
    tag: 'Cockpit Scan',
    ratio: '9:16',
    prompt: 'Vertical portrait format cockpit scan showing leather sport steering wheel, illuminated digital instrument cluster with verified low mileage, and clean carbon fiber interior trim.',
  },
  {
    title: 'Scenic Sunset Test Drive',
    tag: 'Action',
    ratio: '16:9',
    prompt: 'Low-angle drone tracking shot of an all-wheel-drive luxury SUV driving dynamically along a winding coastal highway at sunset, cinematic motion blur and warm golden hour flares.',
  },
];

const LOADING_STEPS = [
  'Connecting to Veo 3 Video Engine (veo-3.1-fast-generate-preview)...',
  'Interpreting automotive prompt semantics & camera trajectory...',
  'Synthesizing 3D vehicle geometry and specular light physics...',
  'Rendering cinematic vehicle reflections & motion blur...',
  'Finalizing MP4 high-definition video encoding...',
];

export const VeoVideoModal: React.FC<VeoVideoModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
}) => {
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<VideoResult | null>(null);
  const [history, setHistory] = useState<VideoResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isQuotaAlert, setIsQuotaAlert] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sampleList, setSampleList] = useState<Record<AspectRatio, any[]>>({ '16:9': [], '9:16': [] });

  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialPrompt
  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Load sample videos on mount
  useEffect(() => {
    api.getVideoSamples()
      .then((res) => {
        if (res?.samples) {
          setSampleList(res.samples);
          // Set initial demo video if none active
          if (!currentVideo && res.samples['16:9']?.[0]) {
            const first = res.samples['16:9'][0];
            setCurrentVideo({
              id: first.id,
              prompt: first.prompt,
              aspectRatio: '16:9',
              videoUrl: first.url,
              model: 'veo-3.1-fast-generate-preview',
              createdAt: 'Demo Showcase',
              isSample: true,
            });
          }
        }
      })
      .catch(() => {
        // Ignore background fetch error
      });
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Timer and step progression during generation
  useEffect(() => {
    if (isGenerating) {
      setElapsedSeconds(0);
      setLoadingStepIndex(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          const nextStep = Math.min(Math.floor(next / 6), LOADING_STEPS.length - 1);
          setLoadingStepIndex(nextStep);
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating]);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleStartGeneration = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      showToast({ title: 'Prompt Required', message: 'Please describe the vehicle video you would like to generate.', type: 'info' });
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setIsQuotaAlert(false);

    try {
      const startRes = await api.generateVideo(cleanPrompt, aspectRatio, '720p');

      // Check if server indicated quota error or returned fallback
      if (!startRes.success) {
        if (startRes.isQuotaError) {
          setIsQuotaAlert(true);
          setErrorMessage(startRes.error || 'Gemini Veo API rate limit reached.');
          // Auto-load a matching aspect-ratio sample video for immediate preview
          const samples = sampleList[aspectRatio] || [];
          if (samples.length > 0) {
            const fallbackSample = samples[0];
            setCurrentVideo({
              id: `fallback-${Date.now()}`,
              prompt: cleanPrompt,
              aspectRatio: aspectRatio,
              videoUrl: fallbackSample.url,
              model: 'veo-3.1-fast-generate-preview (Preview Sample)',
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSample: true,
            });
            showToast({ title: 'Demo Preview', message: 'Showing sample demo video due to API rate limit.', type: 'info' });
          }
          setIsGenerating(false);
          return;
        }
        throw new Error(startRes.error || 'Failed to start video generation');
      }

      const operationName = startRes.operationName;
      if (!operationName) {
        throw new Error('No operation name returned from Veo 3 engine.');
      }

      // Poll status every 4 seconds
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await api.pollVideoStatus(operationName);

          if (statusRes.error) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsGenerating(false);
            setErrorMessage(statusRes.error);
            showToast({ title: 'Generation Error', message: statusRes.error, type: 'error' });
            return;
          }

          if (statusRes.done) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsGenerating(false);

            const downloadUrl = statusRes.downloadUrl || `/api/video-download?operationName=${encodeURIComponent(operationName)}`;
            const newVideo: VideoResult = {
              id: `video-${Date.now()}`,
              prompt: cleanPrompt,
              aspectRatio: aspectRatio,
              videoUrl: downloadUrl,
              model: 'veo-3.1-fast-generate-preview',
              createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setCurrentVideo(newVideo);
            setHistory((prev) => [newVideo, ...prev]);
            showToast({ title: 'Video Ready', message: 'Veo 3 video generation complete!', type: 'success' });
          }
        } catch {
          // Continue polling on transient errors
        }
      }, 4000);

    } catch (err: any) {
      setIsGenerating(false);
      const msg = err?.message || 'Failed to generate video.';
      setErrorMessage(msg);
      if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        setIsQuotaAlert(true);
      }
      showToast({ title: 'Generation Failed', message: msg, type: 'error' });
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setPrompt(preset.prompt);
    setAspectRatio(preset.ratio);
    setErrorMessage(null);
  };

  const handleLoadSample = (sample: any, ratio: AspectRatio) => {
    const videoResult: VideoResult = {
      id: sample.id,
      prompt: sample.prompt,
      aspectRatio: ratio,
      videoUrl: sample.url,
      model: 'veo-3.1-fast-generate-preview',
      createdAt: 'Demo Showcase',
      isSample: true,
    };
    setCurrentVideo(videoResult);
    setPrompt(sample.prompt);
    setAspectRatio(ratio);
    setErrorMessage(null);
    showToast({ title: 'Demo Clip Loaded', message: `Loaded "${sample.title}" (${ratio})`, type: 'info' });
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-label="AutoAudit Veo 3 Video Studio"
    >
      <div 
        className="relative w-full max-w-5xl bg-[#07111F] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#0B1728] border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
              <Video className="w-5 h-5" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AutoAudit Veo 3 Video Studio
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  veo-3.1-fast-generate-preview
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  Aspect Ratios 16:9 & 9:16
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-definition automotive inspection sweeps and dynamic showcase videos directly from text prompts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close Veo 3 Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body: Split View (Controls on Left, Video Player on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
          
          {/* Left Column: Prompt Input & Generation Settings (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 space-y-5 bg-[#081324]/50 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Aspect Ratio Selector (Strictly 16:9 Landscape or 9:16 Portrait) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>Aspect Ratio</span>
                    <span className="text-[10px] font-normal text-slate-500">(Required)</span>
                  </label>
                  <span className="text-[11px] font-mono text-purple-400 font-semibold">
                    {aspectRatio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>16:9 Landscape</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>9:16 Portrait</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {aspectRatio === '16:9' 
                    ? '16:9 is ideal for widescreen desktop displays, YouTube videos, and showroom walkthroughs.'
                    : '9:16 is optimized for vertical mobile phone screens, Instagram reels, and quick mobile inspection reviews.'}
                </p>
              </div>

              {/* Text Prompt Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="veo-prompt-input" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Video Prompt
                  </label>
                  <div className="flex items-center gap-2">
                    {prompt && (
                      <button
                        type="button"
                        onClick={handleCopyPrompt}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {prompt.length} chars
                    </span>
                  </div>
                </div>

                <textarea
                  id="veo-prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your vehicle scene (e.g., 'Cinematic 360-degree sweep around a midnight black Porsche 911 GT3 in a clean studio with photorealistic lighting...')"
                  className="w-full bg-[#0A1628] border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none font-sans"
                  disabled={isGenerating}
                />
              </div>

              {/* Curated Automotive Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Quick Automotive Inspiration
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PROMPTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      disabled={isGenerating}
                      className={`text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        prompt === preset.prompt
                          ? 'bg-purple-950/60 border-purple-500 text-purple-200 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 font-bold">
                        {preset.ratio}
                      </span>
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quota / Error Banner */}
              {errorMessage && (
                <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  isQuotaAlert 
                    ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' 
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-semibold">{errorMessage}</p>
                    {isQuotaAlert && (
                      <p className="text-[11px] text-slate-400">
                        You can still preview high-definition demo clips below in both 16:9 and 9:16 aspect ratios.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 space-y-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleStartGeneration}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isGenerating || !prompt.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-900/30'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Generating with Veo 3 ({elapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Video ({aspectRatio})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Model: <strong className="text-slate-400 font-mono">veo-3.1-fast-generate-preview</strong></span>
                <span>Format: <strong className="text-slate-400 font-mono">{aspectRatio} MP4</strong></span>
              </div>
            </div>

          </div>

          {/* Right Column: Video Canvas & Playback Display (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-[#050C17] flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Video Output Canvas
                  </span>
                </div>
                {currentVideo && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    currentVideo.aspectRatio === '16:9'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  }`}>
                    {currentVideo.aspectRatio} Ratio
                  </span>
                )}
              </div>

              {/* Video Display Container */}
              <div className="relative rounded-2xl bg-black border border-slate-800/90 overflow-hidden flex items-center justify-center shadow-2xl min-h-[300px] sm:min-h-[380px]">
                
                {/* Generation Loading Overlay */}
                {isGenerating ? (
                  <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-200">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xl animate-pulse">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                      <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin" />
                    </div>

                    <div className="space-y-1.5 max-w-sm">
                      <h4 className="text-sm font-bold text-white">
                        Synthesizing Video with Veo 3
                      </h4>
                      <p className="text-xs text-purple-300 font-medium">
                        {LOADING_STEPS[loadingStepIndex]}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Elapsed time: {elapsedSeconds}s · Rendering fluid camera movements & automotive reflections
                      </p>
                    </div>

                    {/* Progress Bar Visualizer */}
                    <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(((loadingStepIndex + 1) / LOADING_STEPS.length) * 100, 95)}%` }}
                      />
                    </div>
                  </div>
                ) : currentVideo ? (
                  /* Rendered Video Player */
                  <div className={`relative flex items-center justify-center w-full h-full p-2 ${
                    currentVideo.aspectRatio === '9:16' ? 'max-w-[260px] mx-auto py-3' : 'w-full'
                  }`}>
                    <video
                      ref={videoRef}
                      src={currentVideo.videoUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className={`rounded-xl shadow-2xl object-cover bg-black ${
                        currentVideo.aspectRatio === '9:16'
                          ? 'aspect-[9/16] w-full max-h-[460px] border-2 border-slate-700'
                          : 'aspect-[16/9] w-full max-h-[420px] border border-slate-800'
                      }`}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />

                    {/* Watermark Tag */}
                    <div className="absolute top-4 left-4 pointer-events-none bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Veo 3 · {currentVideo.aspectRatio}</span>
                    </div>

                    {/* Video Player Floating Overlay Controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/15 text-white">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded hover:bg-white/20 cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? 'Muted' : 'Audio'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Placeholder Canvas */
                  <div className="p-8 text-center space-y-3 text-slate-500">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-400">
                      <Film className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Ready to Generate</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Select an aspect ratio (16:9 or 9:16), enter a prompt, and click Generate to run Veo 3.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Video Metadata Card */}
              {currentVideo && (
                <div className="p-3 bg-[#0A1628] rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-white truncate max-w-[280px]">
                      {currentVideo.isSample ? 'AutoAudit Showcase Clip' : 'Generated Video'}
                    </span>
                    <span className="font-mono text-purple-400">{currentVideo.createdAt}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2 italic">
                    "{currentVideo.prompt}"
                  </p>
                </div>
              )}

              {/* Sample Videos Switcher (Quickly explore 16:9 vs 9:16) */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Explore Pre-Rendered Veo 3 Demos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {/* 16:9 Samples */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-blue-400" />
                      <span>16:9 Landscape Demos</span>
                    </span>
                    {(sampleList['16:9'] || []).slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleLoadSample(s, '16:9')}
                        className={`w-full text-left p-2 rounded-lg text-[11px] border transition-all cursor-pointer flex items-center justify-between ${
                          currentVideo?.id === s.id
                            ? 'bg-blue-950/50 border-blue-500 text-blue-200'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{s.title}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* 9:16 Samples */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-pink-400" />
                      <span>9:16 Portrait Demos</span>
                    </span>
                    {(sampleList['9:16'] || []).slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleLoadSample(s, '9:16')}
                        className={`w-full text-left p-2 rounded-lg text-[11px] border transition-all cursor-pointer flex items-center justify-between ${
                          currentVideo?.id === s.id
                            ? 'bg-pink-950/50 border-pink-500 text-pink-200'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">{s.title}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions for Video */}
            {currentVideo && (
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
                <a
                  href={currentVideo.videoUrl}
                  download={`autoaudit-veo-${currentVideo.aspectRatio.replace(':', '-')}.mp4`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download MP4</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
