import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  addMonths,
  attendanceHours,
  currentMonth,
  formatHours,
  formatWon,
  hoursBetween,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function PayPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "")
    ? searchParams.month!
    : currentMonth();
  const [y, m] = month.split("-");

  // 사장님은 전체, 알바생은 본인만
  const targets = db.users.filter(
    (u) =>
      u.role === "staff" &&
      (user.role === "owner" || u.id === user.id) &&
      (u.active ||
        db.shifts.some((s) => s.userId === u.id && s.date.startsWith(month)) ||
        db.attendances.some(
          (a) => a.userId === u.id && a.date.startsWith(month)
        ))
  );

  const rows = targets.map((u) => {
    const scheduled = db.shifts
      .filter((s) => s.userId === u.id && s.date.startsWith(month))
      .reduce((sum, s) => sum + hoursBetween(s.start, s.end), 0);
    const actual = db.attendances
      .filter(
        (a) =>
          a.userId === u.id && a.date.startsWith(month) && a.clockOut !== null
      )
      .reduce((sum, a) => sum + attendanceHours(a.clockIn, a.clockOut!), 0);
    return {
      user: u,
      scheduled,
      actual,
      estimated: actual * u.wage,
      scheduledPay: scheduled * u.wage,
    };
  });

  const totalEstimated = rows.reduce((s, r) => s + r.estimated, 0);

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">급여 · 근무시간</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/pay?month=${addMonths(month, -1)}`} className="btn-ghost">
              ←
            </Link>
            <span className="font-semibold">
              {y}년 {Number(m)}월
            </span>
            <Link href={`/pay?month=${addMonths(month, 1)}`} className="btn-ghost">
              →
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          실제 근무시간은 출퇴근 기록 기준, 예정 근무시간은 근무표 기준입니다.
          예상 급여는 <b>실제 근무시간 × 시급</b>으로 계산됩니다 (주휴수당·세금 미반영).
        </p>

        {rows.length === 0 ? (
          <p className="card text-sm text-slate-400">
            이번 달 데이터가 있는 직원이 없습니다.
          </p>
        ) : (
          <div className="card overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">직원</th>
                  <th className="px-4 py-3 font-medium">시급</th>
                  <th className="px-4 py-3 font-medium">예정 근무</th>
                  <th className="px-4 py-3 font-medium">실제 근무</th>
                  <th className="px-4 py-3 text-right font-medium">예상 급여</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {r.user.name}
                      <span className="ml-1 text-xs text-slate-400">
                        {r.user.position}
                      </span>
                      {!r.user.active && (
                        <span className="badge ml-1.5 bg-slate-100 text-slate-400">
                          퇴사
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatWon(r.user.wage)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.scheduled > 0 ? formatHours(r.scheduled) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.actual > 0 ? formatHours(r.actual) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-700">
                      {r.actual > 0 ? formatWon(r.estimated) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {user.role === "owner" && rows.length > 1 && (
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3" colSpan={4}>
                      합계
                    </td>
                    <td className="px-4 py-3 text-right text-brand-700">
                      {formatWon(totalEstimated)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>
    </>
  );
}
