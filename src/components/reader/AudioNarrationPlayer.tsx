import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Loader2, ChevronDown, Settings2, X, RefreshCw } from 'lucide-react';
import { fetchGeminiSpeech, GEMINI_VOICES, GeminiVoiceName } from '../../services/geminiClient';

interface AudioNarrationPlayerProps {
  workTitle: string;
  chapterTitle: string;
  chapterContent: string;
  onParagraphChange?: (paragraphIndex: number) => void;
  onClose?: () => void;
}

export const AudioNarrationPlayer: React.FC<AudioNarrationPlayerProps> = ({
  workTitle,
  chapterTitle,
  chapterContent,
  onParagraphChange,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>('Kore');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState(0);
  const [useNativeFallback, setUseNativeFallback] = useState(false);
  const [statusText, setStatusText] = useState<string>('Ready to narrate');
  const [showSettings, setShowSettings] = useState(false);

  // Split chapter into readable prose paragraphs (skipping empty stubs)
  const paragraphs = React.useMemo(() => {
    return chapterContent
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 20);
  }, [chapterContent]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<number, string>>(new Map());
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoading(false);
    setStatusText('Stopped');
  };

  const playParagraphWithWebSpeech = (idx: number) => {
    if (!('speechSynthesis' in window)) {
      setStatusText('Browser speech synthesis not supported');
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = paragraphs[idx];
    if (!text) {
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setStatusText(`Narrating paragraph ${idx + 1} of ${paragraphs.length} (Native)`);
      if (onParagraphChange) onParagraphChange(idx);
    };

    utterance.onend = () => {
      if (isPlayingRef.current && idx + 1 < paragraphs.length) {
        setCurrentParagraphIdx(idx + 1);
        playParagraphWithWebSpeech(idx + 1);
      } else {
        setIsPlaying(false);
        setStatusText('Chapter finished');
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const playParagraph = async (idx: number) => {
    if (idx >= paragraphs.length) {
      setIsPlaying(false);
      setStatusText('Narration complete');
      return;
    }

    setCurrentParagraphIdx(idx);
    if (onParagraphChange) onParagraphChange(idx);

    if (useNativeFallback) {
      playParagraphWithWebSpeech(idx);
      return;
    }

    const textToRead = paragraphs[idx];
    setIsLoading(true);
    setStatusText(`Generating Gemini voice (${selectedVoice})...`);

    // Check memory cache for this paragraph
    const cachedUrl = audioCache.current.get(idx);
    if (cachedUrl) {
      playAudioBlob(cachedUrl, idx);
      return;
    }

    try {
      const speechRes = await fetchGeminiSpeech(textToRead, selectedVoice);
      const audioUrl = `data:${speechRes.mimeType};base64,${speechRes.audioBase64}`;
      audioCache.current.set(idx, audioUrl);
      playAudioBlob(audioUrl, idx);
    } catch (err: any) {
      console.warn('Gemini TTS failed, automatically falling back to browser speech:', err);
      setStatusText('Falling back to local speech engine...');
      setUseNativeFallback(true);
      playParagraphWithWebSpeech(idx);
    }
  };

  const playAudioBlob = (url: string, idx: number) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = url;
    audio.playbackRate = playbackRate;

    audio.oncanplay = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setStatusText(`Narrating paragraph ${idx + 1} of ${paragraphs.length} (Gemini)`);
      audio.play().catch(e => {
        console.warn('Audio play failed:', e);
        playParagraphWithWebSpeech(idx);
      });
    };

    audio.onended = () => {
      if (isPlayingRef.current && idx + 1 < paragraphs.length) {
        playParagraph(idx + 1);
      } else {
        setIsPlaying(false);
        setStatusText('Narration complete');
      }
    };

    audio.onerror = () => {
      console.warn('Audio decode error, using fallback');
      playParagraphWithWebSpeech(idx);
    };
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.pause();
      setIsPlaying(false);
      setStatusText('Paused');
    } else {
      if (audioRef.current && audioRef.current.src && !audioRef.current.ended) {
        audioRef.current.play();
        setIsPlaying(true);
        setStatusText(`Narrating paragraph ${currentParagraphIdx + 1}`);
      } else if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        playParagraph(currentParagraphIdx);
      }
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  return (
    <div className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-slideUp">
      <div className="bg-stone-900/95 dark:bg-[#090D16]/95 backdrop-blur-xl border border-stone-700/80 dark:border-slate-800 text-white rounded-2xl shadow-2xl p-3.5 sm:p-4 transition-all">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <span className="font-semibold text-white truncate">{chapterTitle}</span>
              <span className="text-stone-400 mx-1.5">·</span>
              <span className="text-stone-400 font-mono text-[11px]">{statusText}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors text-stone-300 ${showSettings ? 'text-amber-400 bg-white/10' : ''}`}
              title="Voice Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={() => {
                  stopPlayback();
                  onClose();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                title="Close Narration"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between pt-3 gap-3">
          {/* Left: Progress info */}
          <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
            <span>Para {currentParagraphIdx + 1} / {paragraphs.length}</span>
            <div className="w-16 sm:w-24 h-1 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((currentParagraphIdx + 1) / (paragraphs.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Center Playback Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentParagraphIdx > 0) {
                  stopPlayback();
                  playParagraph(currentParagraphIdx - 1);
                }
              }}
              disabled={currentParagraphIdx <= 0}
              className="px-2 py-1 text-[11px] font-mono rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
              title="Previous paragraph"
            >
              Prev
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={isLoading}
              className="p-2.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
              <span className="hidden sm:inline text-xs font-semibold">
                {isPlaying ? 'Pause' : 'Listen'}
              </span>
            </button>

            <button
              onClick={() => {
                if (currentParagraphIdx + 1 < paragraphs.length) {
                  stopPlayback();
                  playParagraph(currentParagraphIdx + 1);
                }
              }}
              disabled={currentParagraphIdx + 1 >= paragraphs.length}
              className="px-2 py-1 text-[11px] font-mono rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
              title="Next paragraph"
            >
              Next
            </button>

            <button
              onClick={stopPlayback}
              className="p-2 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Speed Pill */}
          <div className="flex items-center gap-1">
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  playbackRate === rate ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel Drawer */}
        {showSettings && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
                Gemini Narrator Voice
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {GEMINI_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVoice(v.id);
                      audioCache.current.clear();
                      if (isPlaying) {
                        stopPlayback();
                        playParagraph(currentParagraphIdx);
                      }
                    }}
                    className={`p-2 rounded-lg text-left border transition-all ${
                      selectedVoice === v.id && !useNativeFallback
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-white/10 text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-xs">{v.label}</div>
                    <div className="text-[10px] text-stone-400 truncate">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-1.5">
                Engine Selection
              </label>
              <button
                onClick={() => {
                  setUseNativeFallback(!useNativeFallback);
                  if (isPlaying) {
                    stopPlayback();
                  }
                }}
                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  useNativeFallback
                    ? 'border-blue-400 bg-blue-500/20 text-white'
                    : 'border-amber-400 bg-amber-500/20 text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">
                    {useNativeFallback ? 'Native Browser Speech' : 'Gemini AI Voice (TTS)'}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    {useNativeFallback ? 'Zero latency, instant local speech' : 'High-fidelity expressive literary cadence'}
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
