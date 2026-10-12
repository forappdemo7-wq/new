import React from 'react';

interface PaperFoldLoaderProps {
  statusText?: string;
  progressPercent?: number;
}

export const PaperFoldLoader: React.FC<PaperFoldLoaderProps> = ({
  statusText = 'Querying global public domain archives...',
  progressPercent
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1A1918]/90 border border-amber-500/20 p-6 text-stone-200 shadow-xl backdrop-blur-md">
      {/* Subtle ambient gradient backdrop */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* Animated Page-Folding Book Vector Icon */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          {/* Pulsing Outer Ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 animate-pulse border border-amber-400/30" />

          {/* Page Flip SVG Animation */}
          <svg
            className="w-8 h-8 text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Left Cover */}
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H12v18H6.5A2.5 2.5 0 0 1 4 19.5z" />
            {/* Right Cover */}
            <path d="M20 19.5v-15A2.5 2.5 0 0 0 17.5 2H12v18h5.5a2.5 2.5 0 0 0 2.5-.5z" />
            {/* Flipping Page Arc 1 */}
            <path
              d="M12 4c2.5-1.5 5.5-1 7 0"
              className="animate-[bounce_2s_infinite] opacity-75"
            />
            {/* Flipping Page Arc 2 */}
            <path
              d="M12 8c-2.5-1.5-5.5-1-7 0"
              className="animate-[pulse_1.5s_infinite] opacity-50"
            />
          </svg>
        </div>

        {/* Text & Progress Status */}
        <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-semibold">
              Live Ingestion Engine
            </span>
          </div>

          <p className="text-sm font-serif font-medium text-stone-100 truncate">
            {statusText}
          </p>

          {/* Minimalist Progress Track */}
          <div className="w-full bg-stone-800/80 rounded-full h-1.5 overflow-hidden border border-stone-700/50 mt-1">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300 ease-out animate-pulse"
              style={{ width: `${progressPercent !== undefined ? progressPercent : 75}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
