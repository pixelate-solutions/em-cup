import "server-only";

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "emcup_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "emcup-2026";
}

function makeToken(password = getAdminPassword()) {
  return createHash("sha256").update(`em-cup-admin:${password}`).digest("hex");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  const expected = makeToken();
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  const valueBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}
