import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime, formatShort } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function ReportsPage({
  searchParams,
}: {
  searchParams: { mine?: string };
}) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "알 수 없음";

  const mineOnly = searchParams.mine === "1";
  const reports = db.reports.filter(
    (r) => !mineOnly || r.authorId === user.id
  );

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">업무 보고서</h1>
          <Link href="/reports/new" className="btn-primary text-sm">
            + 보고서 작성
          </Link>
        </div>

        <div className="flex gap-2 text-sm">
          <Link
            href="/reports"
            className={mineOnly ? "btn-ghost" : "btn-primary"}
          >
            전체
          </Link>
          <Link
            href="/reports?mine=1"
            className={mineOnly ? "btn-primary" : "btn-ghost"}
          >
            내 보고서
          </Link>
        </div>

        {reports.length === 0 ? (
          <p className="card text-sm text-slate-400">작성된 보고서가 없습니다.</p>
        ) : (
          reports.map((r) => (
            <article key={r.id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold">
                  {formatShort(r.date)} {r.start} ~ {r.end}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {userName(r.authorId)}
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  {formatDateTime(r.createdAt)} 작성
                </span>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">✅ 오늘 한 일</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{r.tasks}</dd>
                </div>
                {r.issues && (
                  <div>
                    <dt className="font-medium text-slate-500">⚠️ 특이사항</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">{r.issues}</dd>
                  </div>
                )}
                {r.handover && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <dt className="font-medium text-amber-700">📌 인수인계</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-amber-900">
                      {r.handover}
                    </dd>
                  </div>
                )}
              </dl>
            </article>
          ))
        )}
      </main>
    </>
  );
}
