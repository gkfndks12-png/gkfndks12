import { cookies } from "next/headers";
import { getDb } from "./db";
import type { User } from "./types";

export function getCurrentUser(): User | null {
  const uid = cookies().get("uid")?.value;
  if (!uid) return null;
  const db = getDb();
  return db.users.find((u) => u.id === uid) ?? null;
}
