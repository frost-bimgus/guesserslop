import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort, reddit } from '@devvit/web/server';
import { getChallengeForDate } from '../shared/api';
import { api } from './routes/api';
import { forms } from './routes/forms';
import { menu } from './routes/menu';
import { triggers } from './routes/triggers';

const app = new Hono();
const internal = new Hono();

internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);

// Automatically posts a fresh daily Guesserslop thread at 00:00 UTC
internal.post('/scheduler/daily-post', async (c) => {
  const challenge = getChallengeForDate();
  const post = await reddit.submitCustomPost({
    title: `🗑️ Guesserslop #${challenge.dayNumber} — Daily 5-Round Slop (${challenge.dayId})`,
    entry: 'default',
  });

  console.log(`Auto-posted daily Guesserslop #${challenge.dayNumber}: ${post.id}`);
  return c.json({ status: 'ok', postId: post.id }, 200);
});

app.route('/api', api);
app.route('/internal', internal);

serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});