import { Router } from 'express';
import { countProjects, getStats, listProjects } from '../projects.js';
import { listContentSettings } from '../settings.js';

export const publicRouter: Router = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

/**
 * Public project listing. Forks are hidden unless explicitly requested, and
 * anything the admin hid is never returned.
 */
publicRouter.get('/projects', async (req, res) => {
  const includeForks = req.query.forks === 'true';
  const projects = await listProjects({ includeForks });
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ projects, count: projects.length });
});

publicRouter.get('/stats', async (_req, res) => {
  const [stats, cachedProjects] = await Promise.all([getStats(), countProjects()]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ ...stats, cachedProjects });
});

/**
 * Admin overrides for the site's text content. Only the fields that were
 * changed are present; anything absent keeps the value compiled into the
 * frontend, so an empty response means "the site as shipped".
 */
publicRouter.get('/settings', async (_req, res) => {
  // Revalidate rather than cache: an admin edit should be visible on the next
  // load, not up to a minute later.
  res.set('Cache-Control', 'no-cache');
  res.json({ settings: await listContentSettings() });
});
