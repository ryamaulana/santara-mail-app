import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { decrypt, getSessionCookie, type SessionPayload } from "@/lib/session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

// Optimistic check (cookie only, no DB hit) — memoized per request via React's cache.
export const verifySession = cache(
  async (): Promise<SessionPayload | null> => {
    const cookie = await getSessionCookie();
    if (!cookie) return null;
    const session = await decrypt(cookie);
    if (!session?.userId) return null;
    return session;
  }
);

// Secure check (hits the DB, catches disabled/deleted accounts immediately
// instead of waiting for the cookie to expire) — use this in route handlers.
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, name: true, role: true, isActive: true, mustChangePassword: true },
  });

  if (!user || !user.isActive) return null;
  return user;
});
