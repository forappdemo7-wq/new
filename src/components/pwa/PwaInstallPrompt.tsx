import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, Monitor, X, Share, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global listener so events aren't missed regardless of which component mounts first
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((fn) => fn(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
}

export interface PwaInstallPromptProps {
  variant?: 'navbar' | 'sidebar' | 'mobile';
  className?: string;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if already running in standalone / PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const onPromptChange = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
      if (!prompt && isStandalone) {
        setIsInstalled(true);
      }
    };

    promptListeners.add(onPromptChange);
    return () => {
      promptListeners.delete(onPromptChange);
    };
  }, []);

  const handleInstallClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowGuideModal(true);
      }
    } else {
      // Show instructional guide modal for iOS, Safari, or browsers without direct prompt event
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* ── NAVBAR VARIANT (Matches Top Header from Image 1) ── */}
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          title="Install wanna read? App for Offline Reading"
          aria-label="Install App for Offline Reading"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs ${className}`}
        >
          {isInstalled ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="uppercase tracking-wider text-[10px]">App Installed</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="uppercase tracking-wider text-[10px]">Install App</span>
            </>
          )}
        </button>
      )}

      {/* ── SIDEBAR VARIANT (Matches Section from Image 2) ── */}
      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          title="Install wanna read? App for offline reading"
          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800/60 transition-all cursor-pointer group ${className}`}
        >
          {isInstalled ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium text-stone-800 dark:text-stone-200">App Installed</span>
              <span className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              <span>Install App</span>
              <span className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Offline
              </span>
            </>
          )}
        </button>
      )}

      {/* ── MOBILE DRAWER VARIANT ── */}
      {variant === 'mobile' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs font-semibold cursor-pointer transition-all ${className}`}
        >
          <div className="flex items-center gap-2.5">
            {isInstalled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>{isInstalled ? 'App Installed on Device' : 'Install wanna read? App'}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
            {isInstalled ? 'Ready' : 'PWA'}
          </span>
        </button>
      )}

      {/* ── INSTALLATION GUIDANCE MODAL ── */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1A1D26] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                {isIOS ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white">
                  Install wanna read?
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Read books & comics completely offline
                </p>
              </div>
            </div>

            {isInstalled ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Already Installed!</span>
                </div>
                <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 leading-relaxed">
                  wanna read? is already installed on this device. You can launch it directly from your home screen or applications menu.
                </p>
              </div>
            ) : isIOS ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Install to your home screen for instant full-screen reading without Safari browser bars.</span>
                </div>
                <ol className="text-xs text-stone-700 dark:text-stone-300 space-y-2 list-decimal list-inside leading-relaxed bg-stone-50 dark:bg-stone-900/50 p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-800">
                  <li>
                    Tap the <strong className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"><Share className="w-3.5 h-3.5 inline" /> Share</strong> button at the bottom of Safari.
                  </li>
                  <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner to finish.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-2">
                  <p className="leading-relaxed">
                    You can install <strong>wanna read?</strong> directly through your web browser:
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-[11px] text-stone-600 dark:text-stone-400">
                    <li>
                      <strong>Chrome / Edge:</strong> Click the <Download className="w-3 h-3 inline text-amber-600 mx-0.5" /> Install icon in the address bar (top right), or click <strong>⋮ → Install wanna read?</strong>
                    </li>
                    <li>
                      <strong>Android:</strong> Tap <strong>⋮ Menu → Add to Home screen</strong> or <strong>Install app</strong>.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              {isInstalled ? 'Done' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallPrompt;
