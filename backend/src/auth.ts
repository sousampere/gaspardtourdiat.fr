import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

export const SESSION_COOKIE = 'gtd_session';

export interface SessionPayload {
  sub: string;
  role: 'admin';
}

/**
 * Hashing both operands first guarantees `timingSafeEqual` always receives
 * equally-sized buffers, whatever the input length.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const left = createHash('sha256').update(a, 'utf8').digest();
  const right = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(left, right);
}

export function verifyCredentials(username: unknown, password: unknown): boolean {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  // Evaluate both comparisons so a wrong username and a wrong password take
  // the same amount of time.
  const userMatches = constantTimeEquals(username, config.adminUser);
  const passwordMatches = constantTimeEquals(password, config.adminPassword);
  return userMatches && passwordMatches;
}

export function issueSession(res: Response, req: Request): void {
  const token = jwt.sign({ sub: config.adminUser, role: 'admin' } satisfies SessionPayload, config.jwtSecret, {
    expiresIn: config.sessionTtlSeconds,
    issuer: 'gaspardtourdiat.fr',
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // `secure` is derived from the actual request scheme so the panel also
    // works on plain http://localhost during development, and still gets a
    // Secure cookie once the site is served over TLS.
    secure: req.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function readSession(req: Request): SessionPayload | null {
  const token = (req.cookies as Record<string, string> | undefined)?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { issuer: 'gaspardtourdiat.fr' });
    if (typeof decoded === 'string' || !decoded.sub) return null;
    return { sub: String(decoded.sub), role: 'admin' };
  } catch {
    return null;
  }
}

export function isAuthenticated(req: Request): boolean {
  return readSession(req) !== null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

/* -------------------------------------------------------------------------- */
/*  Login throttling                                                          */
/* -------------------------------------------------------------------------- */

interface Attempt {
  count: number;
  firstAt: number;
  blockedUntil: number;
}

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

// Keep the map from growing without bound on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now - entry.firstAt > WINDOW_MS && now > entry.blockedUntil) attempts.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function checkLoginAllowed(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const entry = attempts.get(ip);
  if (!entry) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();
  if (entry.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  if (now - entry.firstAt > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function registerFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now, blockedUntil: 0 });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    entry.count = 0;
    entry.firstAt = now;
  }
}

export function registerSuccessfulLogin(ip: string): void {
  attempts.delete(ip);
}
