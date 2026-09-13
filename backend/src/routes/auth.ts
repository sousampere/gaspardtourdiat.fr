import { Router } from 'express';
import {
  checkLoginAllowed,
  clearSession,
  isAuthenticated,
  issueSession,
  registerFailedLogin,
  registerSuccessfulLogin,
  verifyCredentials,
} from '../auth.js';

export const authRouter: Router = Router();

authRouter.post('/login', (req, res) => {
  const ip = req.ip ?? 'unknown';

  const gate = checkLoginAllowed(ip);
  if (!gate.allowed) {
    res.set('Retry-After', String(gate.retryAfterSeconds));
    res.status(429).json({
      error: `Too many attempts. Try again in ${Math.ceil(gate.retryAfterSeconds / 60)} minute(s).`,
    });
    return;
  }

  const body = req.body as { username?: unknown; password?: unknown };
  if (!verifyCredentials(body.username, body.password)) {
    registerFailedLogin(ip);
    // Deliberately vague: never reveal which half of the pair was wrong.
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  registerSuccessfulLogin(ip);
  issueSession(res, req);
  res.json({ authenticated: true });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ authenticated: false });
});

authRouter.get('/me', (req, res) => {
  res.json({ authenticated: isAuthenticated(req) });
});
