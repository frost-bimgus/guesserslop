import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import {
  getChallengeForDate,
  getRandomPracticeChallenge,
  getTierForSr,
  type FinishGameResponse,
  type InitGameResponse,
  type PlayerStats,
  type RoundSubmitResponse,
} from '../../shared/api';

export const api = new Hono();

async function loadPlayerStats(username: string): Promise<{
  stats: PlayerStats;
  lastPlayedDay: string | null;
}> {
  const statsKey = `stats:${username}`;
  const [srRaw, streakRaw, lastPlayedDay] = await Promise.all([
    redis.hGet(statsKey, 'sr'),
    redis.hGet(statsKey, 'streak'),
    redis.hGet(statsKey, 'lastPlayedDay'),
  ]);

  const sr = srRaw ? Number(srRaw) : 0;
  const streak = streakRaw ? Number(streakRaw) : 0;
  const tier = getTierForSr(sr);

  return {
    stats: {
      sr,
      tierName: tier.tierName,
      tierEmoji: tier.tierEmoji,
      nextTierSr: tier.nextTierSr,
      streak,
    },
    lastPlayedDay: lastPlayedDay ?? null,
  };
}

api.get('/daily', async (c) => {
  const challenge = getChallengeForDate();
  const username = (await reddit.getCurrentUsername()) ?? 'redditor';

  const [prevScoreRaw, dailyBoard, allTimeBoard, playerRecord] = await Promise.all([
    redis.hGet(`scores:${challenge.dayId}`, username),
    redis.zRange(`leaderboard:${challenge.dayId}`, 0, 9, {
      by: 'rank',
      reverse: true,
    }),
    redis.zRange('leaderboard:alltime', 0, 9, {
      by: 'rank',
      reverse: true,
    }),
    loadPlayerStats(username),
  ]);

  const previousScore = prevScoreRaw ? Number(prevScoreRaw) : null;

  return c.json<InitGameResponse>({
    username,
    challenge,
    isRankedAvailable: previousScore === null,
    previousScore,
    playerStats: playerRecord.stats,
    leaderboard: dailyBoard.map((e) => ({ member: e.member, score: e.score })),
    allTimeLeaderboard: allTimeBoard.map((e) => ({ member: e.member, score: e.score })),
  });
});

api.get('/practice', (c) => {
  const challenge = getRandomPracticeChallenge(Math.floor(Math.random() * 1_000_000_000));
  return c.json({ challenge });
});

api.post('/round-submit', async (c) => {
  const { dayId, roundIndex, guessValue, clientScore, isRanked } = await c.req.json<{
    dayId: string;
    roundIndex: number;
    guessValue: string | number;
    clientScore: number;
    isRanked: boolean;
  }>();

  if (!isRanked) {
    return c.json<RoundSubmitResponse>({
      score: clientScore,
      totalPlays: 0,
      note: 'Practice Mode — unranked warm-up.',
    });
  }

  const crowdKey = `crowd:${dayId}:r${roundIndex}`;
  await redis.zIncrBy(crowdKey, String(guessValue), 1);

  const entries = await redis.zRange(crowdKey, 0, -1, {
    by: 'rank',
    reverse: true,
  });

  const totalPlays = entries.reduce((sum, e) => sum + e.score, 0);

  return c.json<RoundSubmitResponse>({
    score: clientScore,
    totalPlays,
    note: `Ranked guess #${totalPlays} logged today.`,
  });
});

api.post('/finish', async (c) => {
  const { dayId, totalScore, isRanked, shareComment } = await c.req.json<{
    dayId: string;
    totalScore: number;
    isRanked: boolean;
    shareComment?: string | undefined;
  }>();

  const username = (await reddit.getCurrentUsername()) ?? 'redditor';
  const existingScoreRaw = await redis.hGet(`scores:${dayId}`, username);
  const canRecordRanked = isRanked && existingScoreRaw === undefined;

  let srEarned = 0;

  if (canRecordRanked) {
    const { stats, lastPlayedDay } = await loadPlayerStats(username);
    const yesterdayId = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const newStreak =
      lastPlayedDay === yesterdayId
        ? stats.streak + 1
        : lastPlayedDay === dayId
          ? Math.max(1, stats.streak)
          : 1;

    const baseSr = Math.round(totalScore / 5);
    const streakBonus = Math.min(250, (newStreak - 1) * 50);
    srEarned = baseSr + streakBonus;
    const newSr = stats.sr + srEarned;

    await Promise.all([
      redis.hSet(`scores:${dayId}`, { [username]: String(totalScore) }),
      redis.zAdd(`leaderboard:${dayId}`, { member: username, score: totalScore }),
      redis.hSet(`stats:${username}`, {
        sr: String(newSr),
        streak: String(newStreak),
        lastPlayedDay: dayId,
      }),
      redis.zAdd('leaderboard:alltime', { member: username, score: newSr }),
    ]);
  }

  const [ascRank, totalPlayers, dailyBoard, allTimeBoard, latestPlayer] =
    await Promise.all([
      redis.zRank(`leaderboard:${dayId}`, username),
      redis.zCard(`leaderboard:${dayId}`),
      redis.zRange(`leaderboard:${dayId}`, 0, 9, { by: 'rank', reverse: true }),
      redis.zRange('leaderboard:alltime', 0, 9, { by: 'rank', reverse: true }),
      loadPlayerStats(username),
    ]);

  const rank =
    ascRank !== undefined && totalPlayers > 0 ? totalPlayers - ascRank : 1;

  let commentPosted = false;
  if (shareComment && context.postId) {
    try {
      await reddit.submitComment({
        id: context.postId,
        text: shareComment,
      });
      commentPosted = true;
    } catch (err) {
      console.error('Could not post scorecard comment:', err);
    }
  }

  return c.json<FinishGameResponse>({
    rank,
    totalPlayers: Math.max(1, totalPlayers),
    leaderboard: dailyBoard.map((e) => ({ member: e.member, score: e.score })),
    allTimeLeaderboard: allTimeBoard.map((e) => ({ member: e.member, score: e.score })),
    playerStats: latestPlayer.stats,
    srEarned,
    wasRankedRun: canRecordRanked,
    commentPosted,
  });
});