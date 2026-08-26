import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "bnc_admin_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

// In-memory rate limiting store for admin authentication attempts
interface RateLimitRecord {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes sliding window

/**
 * Clean up old rate limit records periodically
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (
      (!record.lockedUntil || record.lockedUntil < now) &&
      now - record.lastAttempt > ATTEMPT_WINDOW_MS
    ) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a client IP
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutSecondsRemaining?: number;
  message?: string;
} {
  cleanupRateLimitStore();
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if IP is currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const secondsRemaining = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutSecondsRemaining: secondsRemaining,
      message: `Terlalu banyak percobaan gagal. Akses diblokir sementara selama ${Math.ceil(
        secondsRemaining / 60
      )} menit.`,
    };
  }

  // Check if window has expired
  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    rateLimitStore.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  if (remaining === 0) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutSecondsRemaining: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      message: "Batas percobaan terlampaui. Akses diblokir sementara selama 15 menit.",
    };
  }

  return { allowed: true, remainingAttempts: remaining };
}

/**
 * Record a failed attempt for a client IP
 */
export function recordFailedAttempt(ip: string): {
  remainingAttempts: number;
  locked: boolean;
  message?: string;
} {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  if (!record || now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    record = { attempts: 1, lockedUntil: null, lastAttempt: now };
  } else {
    record.attempts += 1;
    record.lastAttempt = now;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    rateLimitStore.set(ip, record);
    return {
      remainingAttempts: 0,
      locked: true,
      message: "Batas percobaan terlampaui. Akses diblokir sementara selama 15 menit.",
    };
  }

  rateLimitStore.set(ip, record);
  const remaining = MAX_ATTEMPTS - record.attempts;
  return {
    remainingAttempts: remaining,
    locked: false,
    message:
      remaining <= 2
        ? `Kode akses salah. Peringatan: Tersisa ${remaining} percobaan sebelum diblokir sementara.`
        : "Kode akses tidak valid. Silakan coba lagi.",
  };
}

/**
 * Reset rate limit on successful authentication
 */
export function resetRateLimit(ip: string) {
  rateLimitStore.delete(ip);
}

/**
 * Get the secret session signing key
 */
function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "bnc-admin-super-secure-secret-key-2026-smasa"
  );
}

/**
 * Constant-time safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Verify secret email and NIK combination from /myticket
 */
export function verifyAdminSecretCredentials(email: string, nik: string): boolean {
  const secretEmail = (
    process.env.ADMIN_SECRET_EMAIL || "admin@bnc.smasa.sch.id"
  ).trim().toLowerCase();
  const secretNik = (
    process.env.ADMIN_SECRET_NIK || "3519999999999999"
  ).trim();

  const inputEmail = (email || "").trim().toLowerCase();
  const inputNik = (nik || "").trim();

  if (!inputEmail || !inputNik) return false;

  const emailMatch = timingSafeEqual(inputEmail, secretEmail);
  const nikMatch = timingSafeEqual(inputNik, secretNik);

  return emailMatch && nikMatch;
}

/**
 * Verify secret access code from /consol_admin
 */
export function verifyAdminAccessCode(code: string): boolean {
  const secretCode = (
    process.env.ADMIN_ACCESS_CODE || "BNC2026-ADMIN-PASS"
  ).trim();
  const secretCodeHash = process.env.ADMIN_ACCESS_CODE_HASH?.trim();

  const inputCode = (code || "").trim();
  if (!inputCode) return false;

  // If hash is configured in environment
  if (secretCodeHash) {
    const inputHash = crypto.createHash("sha256").update(inputCode).digest("hex");
    if (timingSafeEqual(inputHash, secretCodeHash)) {
      return true;
    }
  }

  // Direct code match (timing safe)
  return timingSafeEqual(inputCode, secretCode);
}

/**
 * Generate a signed session token
 */
export function createAdminSessionToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now();
  const expiresAt = timestamp + SESSION_MAX_AGE_SECONDS * 1000;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ role: "admin", iat: timestamp, exp: expiresAt, nonce });
  const payloadBase64 = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  const secret = getSessionSecret();

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  if (!timingSafeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);

    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return false; // Token expired
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check admin session from server component or API route headers/cookies
 */
export async function isServerAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

/**
 * Extract client IP address from NextRequest
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
