import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, formatShort, todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const today = todayStr();
  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "알 수 없음";

  const todayShifts = db.shifts
    .filter((s) => s.date === today)
    .sort((a, b) => a.start.localeCompare(b.start));

  const myNextShift = db.shifts
    .filter((s) => s.userId === user.id && s.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];

  const pendingSwaps = db.swapRequests.filter((r) => r.status === "pending");
  const recentReports = db.reports.slice(0, 3);
  const recentPosts = db.posts.slice(0, 3);

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            안녕하세요, {user.name}님 👋
          </h1>
          <span className="text-sm text-slate-500">{formatShort(today)}</span>
        </div>

        {pendingSwaps.length > 0 && (
          <Link
            href="/schedule"
            className="block rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100"
          >
            🙋 대타 요청 <b>{pendingSwaps.length}건</b>이 수락을 기다리고
            있어요. 근무표에서 확인해주세요.
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="card">
            <h2 className="mb-3 font-semibold">오늘 근무자</h2>
            {todayShifts.length === 0 ? (
              <p className="text-sm text-slate-400">오늘 등록된 근무가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {todayShifts.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {userName(s.userId)}
                      {s.userId === user.id && (
                        <span className="badge ml-1.5 bg-brand-100 text-brand-700">나</span>
                      )}
                    </span>
                    <span className="text-slate-500">
                      {s.start} ~ {s.end}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="mb-3 font-semibold">내 다음 근무</h2>
            {myNextShift ? (
              <div className="rounded-lg bg-brand-50 p-4">
                <p className="text-lg font-bold text-brand-700">
                  {formatShort(myNextShift.date)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {myNextShift.start} ~ {myNextShift.end}
                  {myNextShift.memo && (
                    <span className="ml-2 text-slate-400">· {myNextShift.memo}</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">예정된 근무가 없습니다.</p>
            )}
            <Link
              href="/schedule"
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              전체 근무표 보기 →
            </Link>
          </section>
        </div>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">최근 업무 보고</h2>
            <Link
              href="/reports/new"
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              + 보고서 작성
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <p className="text-sm text-slate-400">아직 작성된 보고서가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentReports.map((r) => (
                <li key={r.id} className="py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {userName(r.authorId)} · {formatShort(r.date)} {r.start}~{r.end}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-slate-500">{r.tasks}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/reports"
            className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            보고서 전체 보기 →
          </Link>
        </section>

        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">게시판 최신 글</h2>
            <Link href="/board" className="text-sm font-medium text-brand-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentPosts.map((p) => (
              <li key={p.id} className="py-2.5 text-sm">
                <Link href={`/board/${p.id}`} className="flex items-center gap-2 hover:text-brand-600">
                  <span
                    className={`badge ${
                      p.category === "notice"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.category === "notice" ? "공지" : "자유"}
                  </span>
                  <span className="flex-1 truncate font-medium">{p.title}</span>
                  <span className="text-xs text-slate-400">
                    {userName(p.authorId)} · 💬 {p.comments.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
