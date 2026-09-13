import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "cinevero_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  return process.env.ADMIN_DASHBOARD_PASSWORD || "";
}

export function createAdminSession(username: string) {
  const issuedAt = Date.now();
  const payload = `${username}.${issuedAt}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(value: string | undefined) {
  if (!value || !secret()) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [username, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  const expectedUser = process.env.ADMIN_DASHBOARD_USER || "";
  if (!username || username !== expectedUser || !Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_TTL_MS || issuedAt > Date.now() + 60_000) return false;
  const expected = createHmac("sha256", secret()).update(`${username}.${issuedAt}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export { COOKIE_NAME, SESSION_TTL_MS };
