import { createHash, randomBytes } from 'node:crypto';

export interface IssuedSession {
  token: string;
  hash: string;
  expiresAt: Date;
}

const SESSION_TTL_DAYS = 30;

export function issueSession(): IssuedSession {
  const token = `nbd_${randomBytes(32).toString('hex')}`;
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, hash, expiresAt };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOauthState() {
  const verifier = randomBytes(32).toString('base64url');
  const state = randomBytes(16).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { state, verifier, challenge };
}

export function parseBearer(header?: string): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

