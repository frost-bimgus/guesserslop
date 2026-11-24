import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  DailyChallenge,
  FinishGameResponse,
  GameRound,
  InitGameResponse,
  OrderItem,
  PlayerStats,
  RoundSubmitResponse,
} from '../shared/api';

// --- Color Math Helpers ---
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function scoreHex(guessHex: string, targetHex: string): number {
  const g = hexToRgb(guessHex);
  const t = hexToRgb(targetHex);
  const dist = Math.sqrt(
    2 * (g.r - t.r) ** 2 + 4 * (g.g - t.g) ** 2 + 3 * (g.b - t.b) ** 2
  );
  const maxDist = 765;
  return Math.max(0, Math.round(1000 * (1 - dist / (maxDist * 0.65))));
}

function scoreOrder(orderedLabels: string[], items: OrderItem[]): number {
  let correctSlots = 0;
  orderedLabels.forEach((label, idx) => {
    const found = items.find((it) => it.label === label);
    if (found && found.rank === idx + 1) {
      correctSlots += 1;
    }
  });
  return correctSlots * 250;
}

function scoreRatio(guess: number, actual: number): number {
  const ratio = Math.min(guess, actual) / Math.max(guess, actual);
  return Math.max(0, Math.round(1000 * Math.pow(ratio, 2.2)));
}

function scoreYear(guessYear: number, actualYear: number): number {
  const diff = Math.abs(guessYear - actualYear);
  if (diff === 0) return 1000;
  return Math.max(0, Math.round(1000 - diff * 110));
}

function scoreToEmoji(score: number): string {
  if (score >= 900) return '🟩';
  if (score >= 700) return '🟨';
  if (score >= 450) return '🟧';
  return '🟥';
}

export const App = () => {
  const [initData, setInitData] = useState<InitGameResponse | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<DailyChallenge | null>(null);
  const [isRankedRun, setIsRankedRun] = useState<boolean>(true);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  const [roundIdx, setRoundIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<RoundSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finishData, setFinishData] = useState<FinishGameResponse | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [boardTab, setBoardTab] = useState<'daily' | 'alltime'>('daily');

  // Per-round input states
  const [scaleCm, setScaleCm] = useState(10);
  const [hue, setHue] = useState(180);
  const [sat, setSat] = useState(70);
  const [light, setLight] = useState(50);
  const [orderedLabels, setOrderedLabels] = useState<string[]>([]);
  const [statGuess, setStatGuess] = useState(500);
  const [yearGuess, setYearGuess] = useState(1995);

  useEffect(() => {
    fetch('/api/daily')
      .then((r) => r.json())
      .then((data: InitGameResponse) => {
        setInitData(data);
        setActiveChallenge(data.challenge);
        setIsRankedRun(data.isRankedAvailable);
        setPlayerStats(data.playerStats);
        resetInputsForRound(data.challenge.rounds[0]!);
      })
      .catch(console.error);
  }, []);

  const resetInputsForRound = (round: GameRound) => {
    setRevealed(null);
    if (round.type === 'scale') {
      setScaleCm(round.minCm);
    } else if (round.type === 'hex') {
      setHue(180);
      setSat(70);
      setLight(50);
    } else if (round.type === 'order') {
      setOrderedLabels([]);
    } else if (round.type === 'stat') {
      setStatGuess(round.min);
    } else if (round.type === 'era') {
      setYearGuess(round.minYear);
    }
  };

  const startRandomPractice = async () => {
    const res = await fetch('/api/practice');
    const data: { challenge: DailyChallenge } = await res.json();
    setActiveChallenge(data.challenge);
    setIsRankedRun(false);
    setRoundIdx(0);
    setScores([]);
    setFinishData(null);
    resetInputsForRound(data.challenge.rounds[0]!);
  };

  if (!initData || !activeChallenge || !playerStats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111216] text-amber-400 font-mono">
        Loading today&apos;s slop...
      </div>
    );
  }

  const { username } = initData;
  const isFinished = roundIdx >= activeChallenge.rounds.length;
  const currentRound = activeChallenge.rounds[roundIdx];

  const handleToggleOrderItem = (label: string) => {
    if (revealed) return;
    setOrderedLabels((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handleLockIn = async () => {
    if (!currentRound || submitting) return;
    if (currentRound.type === 'order' && orderedLabels.length < 4) return;
    setSubmitting(true);

    let guessValue: string | number = '';
    let clientScore = 0;

    if (currentRound.type === 'scale') {
      guessValue = scaleCm;
      clientScore = scoreRatio(scaleCm, currentRound.actualCm);
    } else if (currentRound.type === 'hex') {
      const hex = hslToHex(hue, sat, light);
      guessValue = hex;
      clientScore = scoreHex(hex, currentRound.targetHex);
    } else if (currentRound.type === 'order') {
      guessValue = orderedLabels.join(' > ');
      clientScore = scoreOrder(orderedLabels, currentRound.items);
    } else if (currentRound.type === 'stat') {
      guessValue = statGuess;
      clientScore = scoreRatio(statGuess, currentRound.actual);
    } else if (currentRound.type === 'era') {
      guessValue = yearGuess;
      clientScore = scoreYear(yearGuess, currentRound.actualYear);
    }

    try {
      const res = await fetch('/api/round-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: activeChallenge.dayId,
          roundIndex: roundIdx,
          guessValue,
          clientScore,
          isRanked: isRankedRun,
        }),
      });
      const data: RoundSubmitResponse = await res.json();
      setRevealed(data);
      setScores((prev) => [...prev, data.score]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    const nextIdx = roundIdx + 1;
    setRoundIdx(nextIdx);
    if (nextIdx < activeChallenge.rounds.length) {
      resetInputsForRound(activeChallenge.rounds[nextIdx]!);
    } else {
      const totalScore = scores.reduce((a, b) => a + b, 0);
      const res = await fetch('/api/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: activeChallenge.dayId,
          totalScore,
          isRanked: isRankedRun,
        }),
      });
      const data: FinishGameResponse = await res.json();
      setFinishData(data);
      setPlayerStats(data.playerStats);
    }
  };

  const handleFlexComment = async () => {
    if (postingComment || finishData?.commentPosted) return;
    setPostingComment(true);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const grid = scores.map(scoreToEmoji).join('');
    const stats = finishData?.playerStats ?? playerStats;
    const modeTag = finishData?.wasRankedRun
      ? `Ranked #${finishData.rank}`
      : 'Practice Run';
    const shareComment = `🗑️ **Guesserslop #${initData.challenge.dayNumber}** — **${totalScore} / 5000**\n\n${grid}\n\n${stats.tierEmoji} **${stats.tierName}** (${stats.sr.toLocaleString()} SR) · 🔥 ${stats.streak}d streak · *(${modeTag})*`;

    try {
      const res = await fetch('/api/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: activeChallenge.dayId,
          totalScore,
          isRanked: false,
          shareComment,
        }),
      });
      const data: FinishGameResponse = await res.json();
      setFinishData(data);
    } finally {
      setPostingComment(false);
    }
  };

  // --- FINAL SCORECARD VIEW ---
  if (isFinished) {
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const latestStats = finishData?.playerStats ?? playerStats;
    const dailyBoard = finishData?.leaderboard ?? initData.leaderboard;
    const allTimeBoard = finishData?.allTimeLeaderboard ?? initData.allTimeLeaderboard;
    const activeBoard = boardTab === 'daily' ? dailyBoard : allTimeBoard;

    return (
      <div className="min-h-screen bg-[#111216] text-white p-4 flex flex-col items-center justify-between max-w-lg mx-auto">
        <div className="w-full text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono px-3 py-0.5 rounded-full bg-zinc-900 border border-zinc-700">
            <span>
              {finishData?.wasRankedRun
                ? `🏆 RANKED #${finishData.rank} OF ${finishData.totalPlayers}`
                : '🎯 PRACTICE RUN'}
            </span>
            <span>•</span>
            <span className="text-amber-400">🔥 {latestStats.streak}d streak</span>
          </div>

          <div className="text-4xl font-black text-white pt-1">
            {totalScore} <span className="text-lg text-zinc-400">/ 5000</span>
          </div>
          <div className="text-2xl tracking-widest">
            {scores.map(scoreToEmoji).join(' ')}
          </div>

          {/* Career Rank Tier Pill */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono pt-1">
            <span className="text-amber-300 font-bold">
              {latestStats.tierEmoji} {latestStats.tierName}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300">{latestStats.sr.toLocaleString()} SR</span>
            {finishData && finishData.srEarned > 0 && (
              <span className="text-emerald-400 font-bold">
                (+{finishData.srEarned} SR)
              </span>
            )}
          </div>
        </div>

        {/* Round Breakdown */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 space-y-1 my-2">
          {activeChallenge.rounds.map((r, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-zinc-300 truncate pr-2">
                {scoreToEmoji(scores[i] ?? 0)} {r.title.replace(/^ROUND \d+ · /, '')}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {scores[i] ?? 0} pts
              </span>
            </div>
          ))}
        </div>

        {/* Tabbed Leaderboard: Today's Ranked vs All-Time SR */}
        <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 space-y-2 mb-2">
          <div className="flex gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => setBoardTab('daily')}
              className={`flex-1 py-1 rounded-lg cursor-pointer transition ${
                boardTab === 'daily'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              📅 Today&apos;s Ranked
            </button>
            <button
              onClick={() => setBoardTab('alltime')}
              className={`flex-1 py-1 rounded-lg cursor-pointer transition ${
                boardTab === 'alltime'
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              👑 All-Time SR
            </button>
          </div>

          {activeBoard.length === 0 ? (
            <div className="text-xs font-mono text-zinc-500 text-center py-2">
              No Ranked runs logged yet today.
            </div>
          ) : (
            activeBoard.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.member}
                className={`flex justify-between text-xs font-mono ${
                  entry.member === username ? 'text-amber-400 font-bold' : 'text-zinc-300'
                }`}
              >
                <span>
                  #{idx + 1} u/{entry.member}
                </span>
                <span>
                  {entry.score.toLocaleString()} {boardTab === 'alltime' ? 'SR' : 'pts'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Bottom Buttons: Flex Comment + Endless Random Practice */}
        <div className="w-full space-y-2">
          <button
            onClick={handleFlexComment}
            disabled={postingComment || finishData?.commentPosted}
            className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110 disabled:opacity-60 cursor-pointer transition"
          >
            {finishData?.commentPosted
              ? '✅ Scorecard Posted in Comments!'
              : postingComment
                ? 'Posting Scorecard...'
                : '💬 Flex Scorecard in Comments'}
          </button>

          <button
            onClick={startRandomPractice}
            className="w-full py-2 rounded-xl font-mono font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer transition"
          >
            🎲 Play Random Practice Run (Unranked)
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE MINIGAME VIEW ---
  if (!currentRound) return null;

  const currentHex = hslToHex(hue, sat, light);
  const runningTotal = scores.reduce((a, b) => a + b, 0);
  const orderIncomplete = currentRound.type === 'order' && orderedLabels.length < 4;

  return (
    <div className="min-h-screen bg-[#111216] text-white p-4 flex flex-col justify-between max-w-lg mx-auto select-none">
      {/* Top HUD */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] font-mono">
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              isRankedRun
                ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {isRankedRun ? '🏆 RANKED' : '🎯 PRACTICE'}
          </span>
          <span className="text-zinc-400">
            {playerStats.tierEmoji} {playerStats.sr.toLocaleString()} SR · 🔥{' '}
            {playerStats.streak}d
          </span>
        </div>

        <div className="flex justify-between items-center text-xs font-mono pt-0.5">
          <span className="text-amber-400 font-bold">{currentRound.title}</span>
          <span className="text-zinc-400">
            {roundIdx + 1}/5 · <strong className="text-white">{runningTotal} pts</strong>
          </span>
        </div>

        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${((roundIdx + 1) / 5) * 100}%` }}
          />
        </div>
        <h2 className="text-base font-bold text-white leading-snug pt-1">
          {currentRound.prompt}
        </h2>
      </div>

      {/* Minigame Stage */}
      <div className="my-auto py-3">
        {/* 1. SCALE SLOP */}
        {currentRound.type === 'scale' && (() => {
          const maxScale = Math.max(
            currentRound.anchorCm,
            scaleCm,
            revealed ? currentRound.actualCm : 0
          );
          const anchorPx = Math.max(28, (currentRound.anchorCm / maxScale) * 140);
          const guessPx = Math.max(20, (scaleCm / maxScale) * 140);
          const actualPx = Math.max(20, (currentRound.actualCm / maxScale) * 140);

          return (
            <div className="space-y-4">
              <div className="h-44 bg-zinc-900 border border-zinc-800 rounded-xl flex items-end justify-center gap-6 p-4">
                <div className="flex flex-col items-center">
                  <div
                    style={{ width: anchorPx, height: anchorPx }}
                    className="bg-zinc-800 border border-zinc-600 rounded-lg flex items-center justify-center text-3xl transition-all"
                  >
                    {currentRound.anchorEmoji}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1.5">
                    {currentRound.anchorName} ({currentRound.anchorCm}cm)
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    style={{ width: guessPx, height: guessPx }}
                    className="bg-amber-500/20 border-2 border-amber-400 rounded-lg flex items-center justify-center text-3xl transition-all"
                  >
                    {currentRound.targetEmoji}
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 mt-1.5">
                    Your Guess: {scaleCm}cm
                  </span>
                </div>

                {revealed && (
                  <div className="flex flex-col items-center">
                    <div
                      style={{ width: actualPx, height: actualPx }}
                      className="bg-emerald-500/20 border-2 border-emerald-400 rounded-lg flex items-center justify-center text-3xl"
                    >
                      {currentRound.targetEmoji}
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 mt-1.5">
                      Actual: {currentRound.actualCm}cm
                    </span>
                  </div>
                )}
              </div>

              {!revealed && (
                <input
                  type="range"
                  min={currentRound.minCm}
                  max={currentRound.maxCm}
                  value={scaleCm}
                  onChange={(e) => setScaleCm(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              )}
            </div>
          );
        })()}

        {/* 2. HEX SLOP */}
        {currentRound.type === 'hex' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 font-mono">Hint: {currentRound.hint}</p>
            <div className="flex gap-3 h-28">
              <div
                className="flex-1 rounded-xl border border-zinc-700 flex flex-col items-center justify-center font-mono text-xs shadow-inner"
                style={{ backgroundColor: currentHex }}
              >
                <span className="bg-black/60 px-2 py-0.5 rounded text-white">
                  YOURS: {currentHex}
                </span>
              </div>
              {revealed && (
                <div
                  className="flex-1 rounded-xl border border-emerald-400 flex flex-col items-center justify-center font-mono text-xs"
                  style={{ backgroundColor: currentRound.targetHex }}
                >
                  <span className="bg-black/60 px-2 py-0.5 rounded text-emerald-300">
                    ACTUAL: {currentRound.targetHex}
                  </span>
                </div>
              )}
            </div>

            {!revealed && (
              <div className="space-y-2 bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-xs font-mono">
                <label className="flex justify-between">
                  <span>Hue ({hue}°)</span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={hue}
                    onChange={(e) => setHue(Number(e.target.value))}
                    className="w-48 accent-amber-400"
                  />
                </label>
                <label className="flex justify-between">
                  <span>Saturation ({sat}%)</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sat}
                    onChange={(e) => setSat(Number(e.target.value))}
                    className="w-48 accent-amber-400"
                  />
                </label>
                <label className="flex justify-between">
                  <span>Lightness ({light}%)</span>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={light}
                    onChange={(e) => setLight(Number(e.target.value))}
                    className="w-48 accent-amber-400"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* 3. ORDER SLOP */}
        {currentRound.type === 'order' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
              <span>Tap items 1 → 4 in exact order (tap again to undo)</span>
              {!revealed && orderedLabels.length > 0 && (
                <button
                  onClick={() => setOrderedLabels([])}
                  className="text-amber-400 underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-2">
              {currentRound.items.map((item) => {
                const pickedPos = orderedLabels.indexOf(item.label) + 1;
                const isCorrectSlot = revealed && pickedPos === item.rank;

                return (
                  <button
                    key={item.label}
                    disabled={Boolean(revealed)}
                    onClick={() => handleToggleOrderItem(item.label)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      revealed
                        ? isCorrectSlot
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
                          : 'bg-rose-500/15 border-rose-400 text-rose-200'
                        : pickedPos > 0
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono font-black text-xs flex items-center justify-center ${
                          pickedPos > 0
                            ? 'bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {pickedPos > 0 ? `#${pickedPos}` : '—'}
                      </span>
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>

                    {revealed && (
                      <span className="text-xs font-mono text-zinc-300">
                        True #{item.rank} ({item.detail})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. STAT / PRICE SLOP */}
        {currentRound.type === 'stat' && (() => {
          const isDecimal = !Number.isInteger(currentRound.step);
          const fineStep = isDecimal ? 0.1 : 1;
          const coarseStep =
            currentRound.step > fineStep ? currentRound.step : fineStep * 10;

          const adjustStat = (delta: number) => {
            setStatGuess((prev) => {
              const next = Math.min(
                currentRound.max,
                Math.max(currentRound.min, prev + delta)
              );
              return isDecimal ? Number(next.toFixed(1)) : Math.round(next);
            });
          };

          return (
            <div className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-black font-mono text-amber-400">
                {currentRound.prefix ?? ''}
                {statGuess.toLocaleString()} {currentRound.unit}
              </div>
              {!revealed ? (
                <div className="space-y-3">
                  <input
                    type="range"
                    min={currentRound.min}
                    max={currentRound.max}
                    step={fineStep}
                    value={statGuess}
                    onChange={(e) => setStatGuess(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => adjustStat(-coarseStep)}
                      className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 border border-zinc-700 cursor-pointer transition"
                    >
                      -{currentRound.prefix ?? ''}
                      {coarseStep.toLocaleString()}
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStat(-fineStep)}
                      className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-300 font-bold border border-zinc-700 cursor-pointer transition"
                    >
                      -{currentRound.prefix ?? ''}
                      {fineStep}
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStat(fineStep)}
                      className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-300 font-bold border border-zinc-700 cursor-pointer transition"
                    >
                      +{currentRound.prefix ?? ''}
                      {fineStep}
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustStat(coarseStep)}
                      className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 border border-zinc-700 cursor-pointer transition"
                    >
                      +{currentRound.prefix ?? ''}
                      {coarseStep.toLocaleString()}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    Actual: {currentRound.prefix ?? ''}
                    {currentRound.actual.toLocaleString()} {currentRound.unit}
                  </div>
                  <p className="text-xs text-zinc-400">{currentRound.fact}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* 5. ERA SLOP */}
        {currentRound.type === 'era' && (
          <div className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-4xl font-black font-mono text-amber-400">{yearGuess}</div>
            {!revealed ? (
              <>
                <input
                  type="range"
                  min={currentRound.minYear}
                  max={currentRound.maxYear}
                  value={yearGuess}
                  onChange={(e) => setYearGuess(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>{currentRound.minYear}</span>
                  <span>{currentRound.maxYear}</span>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  Actual Year: {currentRound.actualYear}
                </div>
                <p className="text-xs text-zinc-400">{currentRound.fact}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action / Reveal Banner */}
      <div className="space-y-2">
        {revealed && (
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-xl p-3 flex justify-between items-center">
            <div className="text-xs text-zinc-300 pr-2">{revealed.note}</div>
            <div className="text-lg font-black font-mono text-emerald-400 shrink-0">
              +{revealed.score}
            </div>
          </div>
        )}

        {!revealed ? (
          <button
            onClick={handleLockIn}
            disabled={submitting || orderIncomplete}
            className="w-full py-3.5 rounded-xl font-black text-sm tracking-wide bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-40 active:scale-[0.99] transition cursor-pointer"
          >
            {submitting
              ? 'LOCKING IN...'
              : orderIncomplete
                ? `SELECT ALL 4 IN ORDER (${orderedLabels.length}/4)`
                : 'LOCK IN GUESS'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-xl font-black text-sm tracking-wide bg-emerald-400 text-black hover:bg-emerald-300 active:scale-[0.99] transition cursor-pointer"
          >
            {roundIdx === 4 ? 'SEE FINAL SLOP SCORE →' : 'NEXT ROUND →'}
          </button>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);