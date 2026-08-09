// OAuth PKCE scaffolding — FALLOW-SPEC.md §8. Public client, no secret, no
// server; tokens live in IndexedDB; calendar contents are fetched client-side
// and never transmitted anywhere.
//
// Providers activate only when a client id is configured at build time
// (VITE_GOOGLE_CLIENT_ID / VITE_MS_CLIENT_ID). Without one, the .ics import
// path carries calendar duty — it is first-class, not a fallback UI state.

import { db } from '../db/db';

export interface OAuthProvider {
  key: 'google' | 'microsoft';
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientId: string | undefined;
}

export const PROVIDERS: OAuthProvider[] = [
  {
    key: 'google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined,
  },
  {
    key: 'microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scope: 'Calendars.Read offline_access',
    clientId: import.meta.env.VITE_MS_CLIENT_ID as string | undefined,
  },
];

export function configuredProviders(): OAuthProvider[] {
  return PROVIDERS.filter((p) => Boolean(p.clientId));
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function beginAuth(provider: OAuthProvider): Promise<void> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(verifierBytes);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  await db.kv.put({ key: `pkce-${provider.key}`, value: verifier });

  const params = new URLSearchParams({
    client_id: provider.clientId!,
    response_type: 'code',
    redirect_uri: window.location.origin + window.location.pathname,
    scope: provider.scope,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: provider.key,
  });
  window.location.assign(`${provider.authUrl}?${params}`);
}

export async function completeAuth(provider: OAuthProvider, code: string): Promise<boolean> {
  const row = await db.kv.get(`pkce-${provider.key}`);
  const verifier = row?.value as string | undefined;
  if (!verifier) return false;
  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: provider.clientId!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: window.location.origin + window.location.pathname,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) return false;
  const tokens = await res.json();
  await db.kv.put({ key: `tokens-${provider.key}`, value: tokens });
  await db.kv.delete(`pkce-${provider.key}`);
  return true;
}
