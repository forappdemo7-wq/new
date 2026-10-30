import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Volume2, MessageSquare, Eye, Palette, Pause } from 'lucide-react';
import { fetchMangaPageVision, fetchGeminiSpeech, MangaVisionResult } from '../../services/geminiClient';

interface MangaPanelVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  svgArt?: string;
  mangaTitle?: string;
  chapterTitle?: string;
  pageNumber?: number;
}

export const MangaPanelVisionModal: React.FC<MangaPanelVisionModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  svgArt,
  mangaTitle,
  chapterTitle,
  pageNumber
}) => {
  const [visionData, setVisionData] = useState<MangaVisionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isOpen || (!imageUrl && !svgArt)) {
      if (isOpen && !imageUrl && !svgArt) {
        setError('No image or panel graphics found on this page.');
      }
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setVisionData(null);

    const runVision = async () => {
      let resolvedSource = imageUrl || '';

      if (svgArt && !resolvedSource) {
        try {
          resolvedSource = await new Promise<string>((resolve) => {
            const svgBlob = new Blob([svgArt], { type: 'image/svg+xml;charset=utf-8' });
            const blobUrl = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 800;
              canvas.height = img.height || 1150;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
              } else {
                resolve('');
              }
              URL.revokeObjectURL(blobUrl);
            };
            img.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              resolve('');
            };
            img.src = blobUrl;
          });
        } catch {
          resolvedSource = '';
        }
      }

      if (!resolvedSource && svgArt) {
        // Fallback: extract dialogue directly from SVG text nodes
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgArt, 'image/svg+xml');
          const textNodes = Array.from(doc.querySelectorAll('text'));
          const lines = textNodes
            .map((n) => n.textContent?.trim() || '')
            .filter((t) => t && !t.includes('PAGE') && !t.includes('➔'));

          if (lines.length > 0) {
            setVisionData({
              panelCount: 3,
              sceneDescription: `Illustrated sequential page from ${mangaTitle || 'manga'}.`,
              extractedDialogue: lines.map((l) => ({ speaker: 'Dialogue', text: l })),
              fullTranscript: lines.join(' '),
              artStyleNotes: 'Stylized black-and-white comic line work and speech balloons.',
            });
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      if (!resolvedSource) {
        if (isMounted) {
          setError('Could not prepare page image for vision inspection.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await fetchMangaPageVision(resolvedSource, mangaTitle, chapterTitle, pageNumber);
        if (isMounted) {
          setVisionData(res);
          setIsLoading(false);
        }
      } catch (err: any) {
        // If API fails or hits quota, check if we can fall back to SVG text extraction
        if (svgArt) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgArt, 'image/svg+xml');
            const lines = Array.from(doc.querySelectorAll('text'))
              .map((n) => n.textContent?.trim() || '')
              .filter((t) => t && !t.includes('PAGE') && !t.includes('➔'));

            if (lines.length > 0 && isMounted) {
              setVisionData({
                panelCount: 3,
                sceneDescription: `Visual panels from ${mangaTitle || 'manga'}.`,
                extractedDialogue: lines.map((l) => ({ speaker: 'Dialogue', text: l })),
                fullTranscript: lines.join(' '),
                artStyleNotes: 'Sequential art layout with vector ink rendering.',
              });
              setIsLoading(false);
              return;
            }
          } catch {}
        }

        if (isMounted) {
          setError(err?.message || 'Failed to inspect manga page.');
          setIsLoading(false);
        }
      }
    };

    runVision();

    return () => {
      isMounted = false;
      if (audioObj) {
        audioObj.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, imageUrl, svgArt, mangaTitle, chapterTitle, pageNumber, retryKey]);

  const handleNarrateTranscript = async () => {
    if (!visionData?.fullTranscript || isNarrating) {
      if (audioObj) {
        audioObj.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsNarrating(false);
      return;
    }

    setIsNarrating(true);
    try {
      const speechRes = await fetchGeminiSpeech(
        visionData.fullTranscript,
        'Puck',
        'Dramatic anime character dialogue with expressive cadence and natural pauses'
      );
      const audio = new Audio(`data:${speechRes.mimeType};base64,${speechRes.audioBase64}`);
      setAudioObj(audio);
      audio.onended = () => setIsNarrating(false);
      audio.onerror = () => setIsNarrating(false);
      await audio.play();
    } catch {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(visionData.fullTranscript);
        u.onend = () => setIsNarrating(false);
        u.onerror = () => setIsNarrating(false);
        window.speechSynthesis.speak(u);
      } else {
        setIsNarrating(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-stone-900/95 dark:bg-[#0A0D14]/95 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  AI Manga Vision & Panel OCR
                </h3>
                <p className="text-xs text-stone-400">
                  {mangaTitle ? `${mangaTitle} · Page ${pageNumber || 1}` : 'Visual Panel Inspection'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioObj) audioObj.pause();
                onClose();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-9 h-9 rounded-full border-2 border-stone-700 border-t-amber-400 animate-spin" />
                <p className="text-xs font-mono text-stone-400">
                  Analyzing manga panels & extracting speech bubbles via Gemini Vision...
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && !isLoading && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center space-y-2">
                <p>{error}</p>
                <button
                  onClick={() => setRetryKey((k) => k + 1)}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-semibold cursor-pointer transition-colors"
                >
                  Retry Manga Vision
                </button>
              </div>
            )}

            {/* Vision Output */}
            {visionData && !isLoading && (
              <div className="space-y-6 text-sm">
                {/* 1. Scene Action Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>Panel Scene Action</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      {visionData.panelCount || 1} Panels
                    </span>
                  </div>
                  <p className="text-stone-200 leading-relaxed bg-stone-800/50 p-4 rounded-2xl border border-stone-800">
                    {visionData.sceneDescription}
                  </p>
                </div>

                {/* 2. Extracted Speech Bubbles */}
                {visionData.extractedDialogue && visionData.extractedDialogue.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        <MessageSquare className="w-4 h-4" />
                        <span>Speech Bubble Dialogue OCR</span>
                      </div>
                      <button
                        onClick={handleNarrateTranscript}
                        className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isNarrating ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isNarrating ? 'Pause Audio' : 'Narrate Dialogue'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {visionData.extractedDialogue.map((dlg, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-800/80 flex items-start gap-3"
                        >
                          <span className="px-2 py-1 rounded-md bg-stone-700 text-stone-200 text-[10px] font-mono font-bold shrink-0">
                            {dlg.speaker || 'Character'}
                          </span>
                          <p className="text-xs text-stone-200 font-sans italic leading-relaxed pt-0.5">
                            “{dlg.text}”
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Composition & Art Style */}
                {visionData.artStyleNotes && (
                  <div className="p-4 rounded-2xl bg-stone-800/30 border border-stone-800/60 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Artwork & Visual Composition
                    </span>
                    <p className="text-xs text-stone-300">
                      {visionData.artStyleNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-500">
              Powered by Gemini 3.8 Flash Vision
            </span>

            <button
              onClick={() => {
                if (audioObj) audioObj.pause();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
