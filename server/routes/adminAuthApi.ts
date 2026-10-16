/**
 * Server API Route for Administrator Authentication
 * Securely verifies administrator credentials without exposing passwords in client code.
 */

import { Request, Response, Router } from 'express';
import crypto from 'crypto';

export const adminAuthApiRouter = Router();

// Master credential SHA-256 hash
// Plaintext password is NEVER hardcoded in client or server code files
const DEFAULT_ADMIN_PASSWORD_HASH = '3ad044e69394de02261615682ba37757ff5033c0ec067634849da0896f631c60';

// In-memory runtime override if changed dynamically during server lifetime
let runtimeAdminPasswordHash: string | null = null;

const VALID_ADMIN_IDENTIFIERS = new Set([
  'admin',
  'admin@getnow.org',
  'administrator',
  'curator',
  'system'
]);

function hashSha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * POST /api/admin/verify
 * Verifies admin credentials securely on the server
 */
adminAuthApiRouter.post('/verify', (req: Request, res: Response) => {
  try {
    const { adminId, password } = req.body || {};
    const cleanId = (adminId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return res.status(400).json({ success: false, error: 'Administrator ID or Email is required.' });
    }
    if (!cleanPass) {
      return res.status(400).json({ success: false, error: 'Administrator password is required.' });
    }

    const isRecognized = VALID_ADMIN_IDENTIFIERS.has(cleanId) || cleanId.startsWith('admin@');
    if (!isRecognized) {
      return res.status(403).json({ success: false, error: `Access Denied: "${adminId}" is not recognized as an Administrator ID.` });
    }

    const inputHash = hashSha256(cleanPass);

    // 1. Check runtime override if set
    if (runtimeAdminPasswordHash && inputHash === runtimeAdminPasswordHash) {
      return res.json({ success: true, message: 'Administrator authentication verified.' });
    }

    // 2. Check environment variable override if provided
    const envAdminPass = process.env.ADMIN_PASSWORD;
    if (envAdminPass && (cleanPass === envAdminPass.trim() || inputHash === hashSha256(envAdminPass.trim()))) {
      return res.json({ success: true, message: 'Administrator authentication verified.' });
    }

    // 3. Check default master hash
    if (inputHash === DEFAULT_ADMIN_PASSWORD_HASH) {
      return res.json({ success: true, message: 'Administrator authentication verified.' });
    }

    return res.status(401).json({ success: false, error: 'Access Denied: Incorrect Administrator Password.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Internal authentication error.' });
  }
});

/**
 * POST /api/admin/change-password
 * Updates the administrator password hash at runtime
 */
adminAuthApiRouter.post('/change-password', (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const cleanCurrent = (currentPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (!cleanNew || cleanNew.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
    }

    // If current password provided, verify it first
    if (cleanCurrent) {
      const currentHash = hashSha256(cleanCurrent);
      const activeHash = runtimeAdminPasswordHash || (process.env.ADMIN_PASSWORD ? hashSha256(process.env.ADMIN_PASSWORD.trim()) : DEFAULT_ADMIN_PASSWORD_HASH);
      if (currentHash !== activeHash && cleanCurrent !== (process.env.ADMIN_PASSWORD || '')) {
        return res.status(401).json({ success: false, error: 'Current password verification failed.' });
      }
    }

    runtimeAdminPasswordHash = hashSha256(cleanNew);
    return res.json({ success: true, message: 'Administrator password successfully updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Internal error.' });
  }
});
