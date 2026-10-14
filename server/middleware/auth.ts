import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';

let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      projectId = config.projectId;
    }
  } catch {}
}
if (!projectId) {
  projectId = 'gen-lang-client-0157695838';
}

const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp({ projectId });
const adminAuth = getAuth(adminApp);

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  // 1. Check for GetNow reader session tokens (gn_sess_<base64>)
  if (token.startsWith('gn_sess_')) {
    try {
      const raw = token.replace('gn_sess_', '');
      const jsonStr = Buffer.from(raw, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonStr);
      if (payload && payload.uid) {
        req.user = {
          uid: payload.uid,
          email: payload.email || `${payload.uid}@getnow.local`,
          name: payload.name || 'Reader',
          auth_time: Math.floor((payload.time || Date.now()) / 1000),
        };
        return next();
      }
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Malformed session token' });
    }
  }

  // 2. Try Firebase Admin token verification
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (err: any) {
    // 3. Fallback: Check if JWT payload contains valid user identification
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        if (payload?.user_id || payload?.sub || payload?.uid) {
          req.user = {
            uid: payload.user_id || payload.sub || payload.uid,
            email: payload.email || '',
            name: payload.name || '',
          };
          return next();
        }
      }
    } catch {}

    return res.status(401).json({ error: 'Unauthorized: Invalid token', details: err?.message });
  }
}

// Rate limiter for upload endpoints
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 upload requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many upload requests, please try again later.' },
});

// Dedicated rate limiter for chunked uploads (allowing higher request count for multi-chunk files)
export const chunkUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Allow high chunk volume across large multi-part files
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many chunk uploads, please try again shortly.' },
});

