import { cookies } from "next/headers";
import { getDb } from "./db";
import { decodeSession } from "./security";
import type { User } from "./types";

export function getCurrentUser(): User | null {
  const uid = decodeSession(cookies().get("uid")?.value);
  if (!uid) return null;
  const db = getDb();
  const user = db.users.find((u) => u.id === uid) ?? null;
  return user && user.active ? user : null;
}
