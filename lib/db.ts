import fs from "fs";
import path from "path";
import SqliteDatabase from "better-sqlite3";
import type {
  Attendance,
  Database,
  Notification,
  Post,
  Report,
  Shift,
  SwapRequest,
  User,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "alba.db");
const SEED_PATH = path.join(DATA_DIR, "db.json");

type Sqlite = InstanceType<typeof SqliteDatabase>;

// Next.js 개발 모드의 핫 리로드에서도 커넥션을 재사용
declare global {
  // eslint-disable-next-line no-var
  var __albaSqlite: Sqlite | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
  salt TEXT NOT NULL, pinHash TEXT NOT NULL, position TEXT NOT NULL,
  wage INTEGER NOT NULL, active INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, authorId TEXT NOT NULL, date TEXT NOT NULL,
  start TEXT NOT NULL, end TEXT NOT NULL, tasks TEXT NOT NULL,
  issues TEXT NOT NULL, handover TEXT NOT NULL, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, date TEXT NOT NULL,
  start TEXT NOT NULL, end TEXT NOT NULL, memo TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, date TEXT NOT NULL,
  clockIn TEXT NOT NULL, clockOut TEXT
);
CREATE TABLE IF NOT EXISTS swap_requests (
  id TEXT PRIMARY KEY, shiftId TEXT NOT NULL, requesterId TEXT NOT NULL,
  reason TEXT NOT NULL, status TEXT NOT NULL, acceptedBy TEXT,
  createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY, authorId TEXT NOT NULL, category TEXT NOT NULL,
  title TEXT NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL,
  comments TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, type TEXT NOT NULL,
  message TEXT NOT NULL, link TEXT NOT NULL, read INTEGER NOT NULL,
  createdAt TEXT NOT NULL
);
`;

function writeAll(sql: Sqlite, data: Database): void {
  const tx = sql.transaction(() => {
    sql.exec(
      "DELETE FROM users; DELETE FROM reports; DELETE FROM shifts; DELETE FROM attendances; DELETE FROM swap_requests; DELETE FROM posts; DELETE FROM notifications;"
    );
    const iu = sql.prepare(
      "INSERT INTO users VALUES (@id,@name,@role,@salt,@pinHash,@position,@wage,@active)"
    );
    for (const u of data.users) iu.run({ ...u, active: u.active ? 1 : 0 });
    const ir = sql.prepare(
      "INSERT INTO reports VALUES (@id,@authorId,@date,@start,@end,@tasks,@issues,@handover,@createdAt)"
    );
    for (const r of data.reports) ir.run(r);
    const is = sql.prepare(
      "INSERT INTO shifts VALUES (@id,@userId,@date,@start,@end,@memo)"
    );
    for (const s of data.shifts) is.run(s);
    const ia = sql.prepare(
      "INSERT INTO attendances VALUES (@id,@userId,@date,@clockIn,@clockOut)"
    );
    for (const a of data.attendances) ia.run(a);
    const iw = sql.prepare(
      "INSERT INTO swap_requests VALUES (@id,@shiftId,@requesterId,@reason,@status,@acceptedBy,@createdAt)"
    );
    for (const w of data.swapRequests) iw.run(w);
    const ip = sql.prepare(
      "INSERT INTO posts VALUES (@id,@authorId,@category,@title,@content,@createdAt,@comments)"
    );
    for (const p of data.posts)
      ip.run({ ...p, comments: JSON.stringify(p.comments) });
    const inf = sql.prepare(
      "INSERT INTO notifications VALUES (@id,@userId,@type,@message,@link,@read,@createdAt)"
    );
    for (const n of data.notifications)
      inf.run({ ...n, read: n.read ? 1 : 0 });
  });
  tx();
}

function connect(): Sqlite {
  if (globalThis.__albaSqlite) return globalThis.__albaSqlite;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sql = new SqliteDatabase(DB_PATH);
  sql.pragma("journal_mode = WAL");
  sql.exec(SCHEMA);
  // 최초 실행 시 db.json 시드 데이터를 SQLite로 마이그레이션
  const { c } = sql.prepare("SELECT COUNT(*) AS c FROM users").get() as {
    c: number;
  };
  if (c === 0 && fs.existsSync(SEED_PATH)) {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
    writeAll(sql, { notifications: [], ...seed });
  }
  globalThis.__albaSqlite = sql;
  return sql;
}

export function getDb(): Database {
  const sql = connect();
  return {
    users: (sql.prepare("SELECT * FROM users").all() as any[]).map((u) => ({
      ...u,
      active: !!u.active,
    })) as User[],
    reports: sql
      .prepare("SELECT * FROM reports ORDER BY createdAt DESC")
      .all() as Report[],
    shifts: sql.prepare("SELECT * FROM shifts").all() as Shift[],
    attendances: sql
      .prepare("SELECT * FROM attendances")
      .all() as Attendance[],
    swapRequests: sql
      .prepare("SELECT * FROM swap_requests ORDER BY createdAt DESC")
      .all() as SwapRequest[],
    posts: (
      sql.prepare("SELECT * FROM posts ORDER BY createdAt DESC").all() as any[]
    ).map((p) => ({ ...p, comments: JSON.parse(p.comments) })) as Post[],
    notifications: (
      sql
        .prepare("SELECT * FROM notifications ORDER BY createdAt DESC")
        .all() as any[]
    ).map((n) => ({ ...n, read: !!n.read })) as Notification[],
  };
}

export function saveDb(data: Database): void {
  writeAll(connect(), data);
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
