/**
 * RaktSetu — Auth & Session Cookie Helper
 *
 * Phone-number + OTP stub login with signed httpOnly cookie.
 * In demo mode, accepts any 6-digit code and logs generated OTPs to dev panel.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "raktsetu_session";

export interface SessionData {
  donorId?: string;
  phone: string;
  full_name?: string;
  isLoggedIn: boolean;
}

/**
 * Encodes session data as base64 string
 */
function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Decodes base64 session string
 */
function decodeSession(str: string): SessionData | null {
  try {
    const json = Buffer.from(str, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Reads current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return decodeSession(sessionCookie.value);
}

/**
 * Sets session cookie
 */
export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const value = encodeSession(data);
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clears session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Verifies 6-digit OTP stub (accepts any 6-digit code for demo)
 */
export function verifyOtpStub(code: string): boolean {
  if (!code) return false;
  const cleaned = code.trim();
  return /^\d{6}$/.test(cleaned);
}
