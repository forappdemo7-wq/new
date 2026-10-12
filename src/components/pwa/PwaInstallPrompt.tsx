import React, { useState, useEffect } from 'react';
import { Download, Check, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  // If no prompt event and not iOS, render nothing or a quiet offline indicator
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install wanna read? App for Offline Reading"
        aria-label="Install App for Offline Reading"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-stone-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="uppercase tracking-wider text-[10px]">Install App</span>
      </button>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  Install wanna read? on iOS
                </h3>
                <p className="text-[11px] font-sans text-stone-500">Read offline from your Home Screen</p>
              </div>
            </div>

            <ol className="text-xs text-stone-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Tap the <strong>Share</strong> icon in Safari's bottom toolbar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Open <strong>wanna read?</strong> from your home screen for full offline access!</li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default PwaInstallPrompt;
