import { runtimeEnv } from "@/lib/runtime-env";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getDb, getRawDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "nagheshiran_session";
const SESSION_SECRET_KEY = "session_secret";
const MIN_SECRET_LENGTH = 32;
const DEV_FALLBACK_SECRET = "naghshiran-dev-secret-change-me";
const encoder = new TextEncoder();

// Cached per Worker isolate so signing/verifying stays cheap after the first
// successful resolution (the D1 lookup happens at most once per isolate).
let cachedRuntimeSecret: Uint8Array | null = null;
let warnedShortSecret = false;

/**
 * An explicitly configured SESSION_SECRET always wins. Values shorter than 32
 * characters are ignored (with a one-time warning) instead of breaking login,
 * because a half-configured secret used to take the whole shop offline.
 */
function configuredSecret(): string | null {
  const value = runtimeEnv("SESSION_SECRET")?.trim();
  if (!value) return null;
  if (value.length < MIN_SECRET_LENGTH) {
    if (!warnedShortSecret) {
      warnedShortSecret = true;
      console.warn(
        `[auth] SESSION_SECRET is shorter than ${MIN_SECRET_LENGTH} characters and is ignored; using the managed secret instead.`,
      );
    }
    return null;
  }
  return value;
}

function randomSecretHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Zero-configuration session secret for production: generate once and store it
 * in D1 (`app_settings`), so every Worker isolate signs with the same key and
 * the shop never depends on a manually-set environment variable.
 *
 * `INSERT ... ON CONFLICT DO NOTHING` + read-back keeps concurrent isolates on
 * the single value that won the insert, even if two of them provision at once.
 */
async function loadOrProvisionRuntimeSecret(): Promise<string> {
  const database = await getRawDb(); // also ensures the schema (app_settings)
  const [insertResult, selectResult] = await database.batch([
    database
      .prepare(
        "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING",
      )
      .bind(SESSION_SECRET_KEY, randomSecretHex()),
    database
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .bind(SESSION_SECRET_KEY),
  ]);
  void insertResult;
  const row = selectResult?.results?.[0] as { value?: unknown } | undefined;
  const stored = typeof row?.value === "string" ? row.value.trim() : "";
  if (stored.length < MIN_SECRET_LENGTH) {
    throw new Error("Session secret could not be provisioned in app_settings.");
  }
  return stored;
}

/**
 * Resolve the HMAC secret used for session cookies.
 *
 * Priority: configured SESSION_SECRET → secret auto-provisioned in D1 → the
 * fixed development fallback (non-production builds only).
 */
export async function resolveSessionSecret(): Promise<Uint8Array> {
  const configured = configuredSecret();
  if (configured) return encoder.encode(configured);
  if (cachedRuntimeSecret) return cachedRuntimeSecret;
  if (process.env.NODE_ENV !== "production") {
    // Local dev and unit tests stay zero-config and database-free.
    cachedRuntimeSecret = encoder.encode(DEV_FALLBACK_SECRET);
    return cachedRuntimeSecret;
  }
  cachedRuntimeSecret = encoder.encode(await loadOrProvisionRuntimeSecret());
  return cachedRuntimeSecret;
}

/**
 * Fail-early check used by login/register: resolves (and if needed creates) the
 * session secret before creating accounts or verifying credentials.
 */
export async function ensureSessionSecret() {
  await resolveSessionSecret();
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
    .sign(await resolveSessionSecret());
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
    const { payload } = await jwtVerify(token, await resolveSessionSecret());
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
