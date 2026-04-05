const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function createSessionToken(): string {
  return crypto.randomUUID()
}

export function createSessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_MS)
}

export function createSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
  }
}
