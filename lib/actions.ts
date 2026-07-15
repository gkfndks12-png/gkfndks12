"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDb, saveDb, newId } from "./db";
import { getCurrentUser } from "./auth";
import { encodeSession, hashPin, newSalt } from "./security";
import { todayStr } from "./utils";

// ---------- 인증 ----------

export async function login(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user || !user.active || hashPin(pin, user.salt) !== user.pinHash) {
    redirect("/login?error=1");
  }
  cookies().set("uid", encodeSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  cookies().delete("uid");
  redirect("/login");
}

// ---------- 출퇴근 ----------

export async function clockIn() {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const open = db.attendances.find(
    (a) => a.userId === user.id && a.clockOut === null
  );
  if (!open) {
    db.attendances.push({
      id: newId(),
      userId: user.id,
      date: todayStr(),
      clockIn: new Date().toISOString(),
      clockOut: null,
    });
    saveDb(db);
  }
  revalidatePath("/");
  redirect("/");
}

export async function clockOut() {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  const open = db.attendances.find(
    (a) => a.userId === user.id && a.clockOut === null
  );
  if (open) {
    open.clockOut = new Date().toISOString();
    saveDb(db);
  }
  revalidatePath("/");
  revalidatePath("/pay");
  redirect("/");
}

// ---------- 업무 보고서 ----------

export async function createReport(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const db = getDb();
  db.reports.unshift({
    id: newId(),
    authorId: user.id,
    date: String(formData.get("date") ?? ""),
    start: String(formData.get("start") ?? ""),
    end: String(formData.get("end") ?? ""),
    tasks: String(formData.get("tasks") ?? "").trim(),
    issues: String(formData.get("issues") ?? "").trim(),
    handover: String(formData.get("handover") ?? "").trim(),
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
  revalidatePath("/reports");
  revalidatePath("/");
  redirect("/reports");
}

// ---------- 근무 일정 ----------

export async function createShift(formData: FormData) {
  const user = getCurrentUser();
  if (!user || user.role !== "owner") redirect("/login");
  const db = getDb();
  const date = String(formData.get("date") ?? "");
  db.shifts.push({
    id: newId(),
    userId: String(formData.get("userId") ?? ""),
    date,
    start: String(formData.get("start") ?? ""),
    end: String(formData.get("end") ?? ""),
    memo: String(formData.get("memo") ?? "").trim(),
  });
  saveDb(db);
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect(`/schedule?week=${date}`);
}

export async function deleteShift(formData: FormData) {
  const user = getCurrentUser();
  if (!user || user.role !== "owner") redirect("/login");
  const shiftId = String(formData.get("shiftId") ?? "");
  const db = getDb();
  const shift = db.shifts.find((s) => s.id === shiftId);
  db.shifts = db.shifts.filter((s) => s.id !== shiftId);
  // 해당 근무의 대기중 대타 요청도 함께 취소
  db.swapRequests = db.swapRequests.map((r) =>
    r.shiftId === shiftId && r.status === "pending"
      ? { ...r, status: "cancelled" as const }
      : r
  );
  saveDb(db);
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect(`/schedule?week=${shift?.date ?? ""}`);
}

// ---------- 대타 요청 ----------

export async function requestSwap(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const shiftId = String(formData.get("shiftId") ?? "");
  const db = getDb();
  const shift = db.shifts.find((s) => s.id === shiftId);
  if (!shift || shift.userId !== user.id) redirect("/schedule");
  const alreadyPending = db.swapRequests.some(
    (r) => r.shiftId === shiftId && r.status === "pending"
  );
  if (!alreadyPending) {
    db.swapRequests.unshift({
      id: newId(),
      shiftId,
      requesterId: user.id,
      reason: String(formData.get("reason") ?? "").trim(),
      status: "pending",
      acceptedBy: null,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
  }
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect(`/schedule?week=${shift?.date ?? ""}`);
}

export async function acceptSwap(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const requestId = String(formData.get("requestId") ?? "");
  const db = getDb();
  const req = db.swapRequests.find((r) => r.id === requestId);
  if (req && req.status === "pending" && req.requesterId !== user.id) {
    req.status = "accepted";
    req.acceptedBy = user.id;
    const shift = db.shifts.find((s) => s.id === req.shiftId);
    if (shift) shift.userId = user.id;
    saveDb(db);
  }
  revalidatePath("/schedule");
  revalidatePath("/");
  redirect("/schedule");
}

export async function cancelSwap(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const requestId = String(formData.get("requestId") ?? "");
  const db = getDb();
  const req = db.swapRequests.find((r) => r.id === requestId);
  if (
    req &&
    req.status === "pending" &&
    (req.requesterId === user.id || user.role === "owner")
  ) {
    req.status = "cancelled";
    saveDb(db);
  }
  revalidatePath("/schedule");
  redirect("/schedule");
}

// ---------- 게시판 ----------

export async function createPost(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  let category = String(formData.get("category") ?? "free");
  if (category === "notice" && user.role !== "owner") category = "free";
  const db = getDb();
  const id = newId();
  db.posts.unshift({
    id,
    authorId: user.id,
    category: category as "notice" | "free",
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    createdAt: new Date().toISOString(),
    comments: [],
  });
  saveDb(db);
  revalidatePath("/board");
  revalidatePath("/");
  redirect(`/board/${id}`);
}

export async function addComment(formData: FormData) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (content) {
    const db = getDb();
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      post.comments.push({
        id: newId(),
        authorId: user.id,
        content,
        createdAt: new Date().toISOString(),
      });
      saveDb(db);
    }
  }
  revalidatePath(`/board/${postId}`);
  redirect(`/board/${postId}`);
}

// ---------- 직원 관리 (사장님 전용) ----------

export async function addStaff(formData: FormData) {
  const user = getCurrentUser();
  if (!user || user.role !== "owner") redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  if (!name || !/^\d{4}$/.test(pin)) redirect("/staff?error=1");
  const db = getDb();
  const salt = newSalt();
  db.users.push({
    id: newId(),
    name,
    role: "staff",
    salt,
    pinHash: hashPin(pin, salt),
    position: String(formData.get("position") ?? "").trim() || "직원",
    wage: Math.max(0, Number(formData.get("wage") ?? 0) || 0),
    active: true,
  });
  saveDb(db);
  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaff(formData: FormData) {
  const user = getCurrentUser();
  if (!user || user.role !== "owner") redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const db = getDb();
  const target = db.users.find((u) => u.id === targetId);
  if (target) {
    const position = String(formData.get("position") ?? "").trim();
    const wage = Number(formData.get("wage") ?? NaN);
    const newPin = String(formData.get("newPin") ?? "").trim();
    if (position) target.position = position;
    if (!Number.isNaN(wage) && wage >= 0) target.wage = wage;
    if (/^\d{4}$/.test(newPin)) {
      target.salt = newSalt();
      target.pinHash = hashPin(newPin, target.salt);
    }
    saveDb(db);
  }
  revalidatePath("/staff");
  redirect("/staff");
}

export async function toggleStaffActive(formData: FormData) {
  const user = getCurrentUser();
  if (!user || user.role !== "owner") redirect("/login");
  const targetId = String(formData.get("targetId") ?? "");
  const db = getDb();
  const target = db.users.find((u) => u.id === targetId);
  if (target && target.role !== "owner") {
    target.active = !target.active;
    saveDb(db);
  }
  revalidatePath("/staff");
  redirect("/staff");
}
