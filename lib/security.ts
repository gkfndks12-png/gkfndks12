import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "alba-talk-dev-secret-change-in-production";

export function hashPin(pin: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
}

export function newSalt(): string {
  return crypto.randomBytes(4).toString("hex");
}

function sign(value: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("hex")
    .slice(0, 32);
}

/** 세션 쿠키 값: "<uid>.<서명>" */
export function encodeSession(uid: string): string {
  return `${uid}.${sign(uid)}`;
}

/** 서명 검증 후 uid 반환, 위조 시 null */
export function decodeSession(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot <= 0) return null;
  const uid = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  const expected = sign(uid);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  return uid;
}
