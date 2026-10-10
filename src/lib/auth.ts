import { runtimeEnv } from "@/lib/runtime-env";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "nagheshiran_session";
const encoder = new TextEncoder();

function getSecret() {
  const configuredSecret = runtimeEnv("SESSION_SECRET")?.trim();
  if (
    process.env.NODE_ENV === "production" &&
    (!configuredSecret || configuredSecret.length < 32)
  ) {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 characters in production.",
    );
  }
  return encoder.encode(configuredSecret || "naghshiran-dev-secret-change-me");
}

export function assertSessionConfigured() {
  getSecret();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function setSessionCookie(userId: number) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = payload.userId;
    return typeof id === "number" && Number.isSafeInteger(id) && id > 0
      ? id
      : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(strict = false) {
  const userId = await getSessionUserId();
  if (!userId) return null;
  let rows;
  try {
    const db = await getDb();
    rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  } catch (error) {
    if (strict) throw error;
    return null;
  }
  const user = rows[0];
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    isAdmin: user.isAdmin,
  };
}
