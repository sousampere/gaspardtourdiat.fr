import { Router } from 'express';
import { getProject, getStats, listProjects, reorderProjects, syncProjects, updateProject } from '../projects.js';
import type { ProjectPatch } from '../projects.js';
import {
  BadSetting,
  deleteContentSetting,
  listContentSettings,
  saveContentSettings,
} from '../settings.js';

export const adminRouter: Router = Router();

const NUMERIC_ID = /^\d+$/;

adminRouter.get('/projects', async (_req, res) => {
  const projects = await listProjects({ includeHidden: true, includeForks: true });
  res.json({ projects, count: projects.length });
});

adminRouter.get('/stats', async (_req, res) => {
  res.json(await getStats());
});

adminRouter.patch('/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!NUMERIC_ID.test(id)) {
    res.status(400).json({ error: 'Project id must be numeric' });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const patch: ProjectPatch = {};

  if (typeof body.pinned === 'boolean') patch.pinned = body.pinned;
  if (typeof body.hidden === 'boolean') patch.hidden = body.hidden;
  if (typeof body.sortOrder === 'number' && Number.isInteger(body.sortOrder)) patch.sortOrder = body.sortOrder;
  if (body.displayName === null || typeof body.displayName === 'string') {
    patch.displayName = normaliseText(body.displayName, 255);
  }
  if (body.customDescription === null || typeof body.customDescription === 'string') {
    patch.customDescription = normaliseText(body.customDescription, 5000);
  }

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: 'No supported field provided' });
    return;
  }

  const updated = await updateProject(id, patch);
  if (!updated) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project: updated });
});

adminRouter.post('/projects/reorder', async (req, res) => {
  const body = req.body as { ids?: unknown };
  if (!Array.isArray(body.ids) || !body.ids.every((id) => typeof id === 'string' && NUMERIC_ID.test(id))) {
    res.status(400).json({ error: 'Body must be { ids: string[] } of numeric ids' });
    return;
  }
  await reorderProjects(body.ids as string[]);
  res.json({ projects: await listProjects({ includeHidden: true, includeForks: true }) });
});

adminRouter.post('/sync', async (_req, res) => {
  const result = await syncProjects();
  res.json({ result, projects: await listProjects({ includeHidden: true, includeForks: true }) });
});

adminRouter.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!NUMERIC_ID.test(id)) {
    res.status(400).json({ error: 'Project id must be numeric' });
    return;
  }
  const project = await getProject(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json({ project });
});

/* -------------------------------------------------------------------------- */
/*  Editable site content                                                     */
/* -------------------------------------------------------------------------- */

adminRouter.get('/settings', async (_req, res) => {
  res.json({ settings: await listContentSettings() });
});

/**
 * Partial update. Only the keys present in the body are touched; sending an
 * explicit `null` for a key clears its override and restores the default.
 */
adminRouter.put('/settings', async (req, res) => {
  const body = req.body as { settings?: unknown };
  if (typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings)) {
    res.status(400).json({ error: 'Body must be { settings: { path: value } }' });
    return;
  }

  try {
    const settings = await saveContentSettings(body.settings as Record<string, unknown>);
    res.json({ settings });
  } catch (error) {
    if (error instanceof BadSetting) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
});

adminRouter.delete('/settings/:key', async (req, res) => {
  try {
    await deleteContentSetting(req.params.key);
  } catch (error) {
    if (error instanceof BadSetting) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }
  res.json({ settings: await listContentSettings() });
});

/** Trims, caps the length and turns empty strings into `null` (clears the override). */
function normaliseText(value: string | null, maxLength: number): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}
