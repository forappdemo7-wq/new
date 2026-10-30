import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, BookOpen, Clock, Lightbulb, Compass, Copy, Check, Volume2, Loader2 } from 'lucide-react';
import { fetchGeminiAnnotation, fetchGeminiSpeech, TextAnnotationResult } from '../../services/geminiClient';

interface SmartAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  bookTitle?: string;
  authorName?: string;
  paragraphContext?: string;
}

export const SmartAnnotationModal: React.FC<SmartAnnotationModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  bookTitle,
  authorName,
  paragraphContext
}) => {
  const [annotation, setAnnotation] = useState<TextAnnotationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPronouncing, setIsPronouncing] = useState(false);

  const audioObjRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen || !selectedText) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setAnnotation(null);

    fetchGeminiAnnotation(selectedText, bookTitle, authorName, paragraphContext)
      .then((res) => {
        if (isMounted) {
          setAnnotation(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || 'Failed to analyze selected text.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (audioObjRef.current) {
        audioObjRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, selectedText, bookTitle, authorName, paragraphContext]);

  const handlePronounce = async () => {
    if (!selectedText) return;
    if (isPronouncing) {
      if (audioObjRef.current) {
        audioObjRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPronouncing(false);
      return;
    }

    setIsPronouncing(true);
    try {
      const speechRes = await fetchGeminiSpeech(selectedText, 'Kore', 'Clear, articulated pronunciation');
      const audio = new Audio(`data:${speechRes.mimeType};base64,${speechRes.audioBase64}`);
      audioObjRef.current = audio;
      audio.onended = () => setIsPronouncing(false);
      audio.onerror = () => setIsPronouncing(false);
      await audio.play();
    } catch {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(selectedText);
        u.onend = () => setIsPronouncing(false);
        u.onerror = () => setIsPronouncing(false);
        window.speechSynthesis.speak(u);
      } else {
        setIsPronouncing(false);
      }
    }
  };

  const handleCopy = () => {
    if (!annotation) return;
    const summary = `Phrase: "${annotation.termOrPhrase}"\nMeaning: ${annotation.simplifiedMeaning}\nContext: ${annotation.historicalEraContext || 'N/A'}\nSignificance: ${annotation.literarySignificance}\nSource: ${bookTitle} by ${authorName}`;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-xl bg-stone-900/95 dark:bg-[#0C0F17]/95 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  AI Contextual Annotator
                </h3>
                <p className="text-xs text-stone-400">
                  {bookTitle ? `Exploring "${bookTitle}"` : 'Literary & Historical Analysis'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Highlighted Term Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 block mb-0.5">
                  Highlighted Phrase
                </span>
                <p className="font-serif text-xl font-bold text-amber-200">
                  “{selectedText}”
                </p>
              </div>
              <button
                onClick={handlePronounce}
                disabled={isPronouncing}
                className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
                title="Listen to pronunciation"
              >
                {isPronouncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Pronounce</span>
              </button>
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-stone-700 border-t-amber-400 animate-spin" />
                <p className="text-xs font-mono text-stone-400">
                  Consulting Gemini for historical context & etymology...
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && !isLoading && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center space-y-2">
                <p>{error}</p>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    fetchGeminiAnnotation(selectedText, bookTitle, authorName, paragraphContext)
                      .then((res) => setAnnotation(res))
                      .catch((e) => setError(e.message))
                      .finally(() => setIsLoading(false));
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-semibold"
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Annotation Output */}
            {annotation && !isLoading && (
              <div className="space-y-5 text-sm">
                {/* 1. Direct Meaning */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                    <BookOpen className="w-4 h-4" />
                    <span>Plain-English Meaning</span>
                  </div>
                  <p className="text-stone-200 leading-relaxed bg-stone-800/50 p-3.5 rounded-xl border border-stone-800">
                    {annotation.simplifiedMeaning}
                  </p>
                </div>

                {/* 2. Historical & Era Context */}
                {annotation.historicalEraContext && annotation.historicalEraContext !== 'N/A' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>Historical & Era Context</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed bg-stone-800/50 p-3.5 rounded-xl border border-stone-800">
                      {annotation.historicalEraContext}
                    </p>
                  </div>
                )}

                {/* 3. Literary Significance */}
                {annotation.literarySignificance && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                      <Lightbulb className="w-4 h-4" />
                      <span>Literary & Thematic Significance</span>
                    </div>
                    <p className="text-stone-300 leading-relaxed bg-stone-800/50 p-3.5 rounded-xl border border-stone-800">
                      {annotation.literarySignificance}
                    </p>
                  </div>
                )}

                {/* 4. Etymology & Synonyms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {annotation.etymologyOrOrigin && (
                    <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-stone-400 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-amber-400" />
                        Etymology / Root
                      </span>
                      <p className="text-xs text-stone-300 font-serif italic">
                        {annotation.etymologyOrOrigin}
                      </p>
                    </div>
                  )}

                  {annotation.synonyms && annotation.synonyms.length > 0 && (
                    <div className="p-3 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-stone-400 block">
                        Modern Equivalents
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {annotation.synonyms.map((syn, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-stone-700/60 text-stone-200 text-xs font-medium"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/40 flex items-center justify-between">
            <button
              onClick={handleCopy}
              disabled={!annotation || isLoading}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied Summary</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-400" />
                  <span>Copy Annotation Note</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
