import './index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getChallengeForDate } from '../shared/api';

export const Splash = () => {
  const challenge = getChallengeForDate();

  return (
    <div className="flex flex-col justify-between items-center min-h-screen p-5 bg-[#111216] text-white select-none">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
        <span>🗑️ Daily Slop #{challenge.dayNumber}</span>
        <span>•</span>
        <span>5 Rounds · 60s</span>
      </div>

      <div className="flex flex-col items-center text-center max-w-md my-auto gap-3">
        <div className="text-5xl">🦫🎨📊🕰️</div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">
          GUESSERSLOP
        </h1>
        <p className="text-sm text-zinc-300 leading-relaxed">
          5 rapid-fire browser guessing parodies in 60 seconds: resize capybaras, mix Shrek green from memory, and hit the exact Reddit Hive median.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <button
          className="w-full py-3.5 px-6 rounded-xl font-black text-base tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          PLAY TODAY&apos;S SLOP →
        </button>
        <span className="text-[11px] text-zinc-500 font-mono">
          Playing as u/{context.username ?? 'redditor'}
        </span>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);