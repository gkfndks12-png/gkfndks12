import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  addMonths,
  currentMonth,
  monthGrid,
  todayStr,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function MonthSchedulePage({
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
  const today = todayStr();
  const weeks = monthGrid(month);

  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "?";
  const shiftsByDate = new Map<string, typeof db.shifts>();
  for (const s of db.shifts) {
    if (!s.date.startsWith(month)) continue;
    const list = shiftsByDate.get(s.date) ?? [];
    list.push(s);
    shiftsByDate.set(s.date, list);
  }
  for (const list of Array.from(shiftsByDate.values())) {
    list.sort((a, b) => a.start.localeCompare(b.start));
  }

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">근무표</h1>
            <div className="flex rounded-lg bg-slate-200 p-0.5 text-xs font-semibold">
              <Link href="/schedule" className="rounded-md px-3 py-1 text-slate-500">
                주간
              </Link>
              <span className="rounded-md bg-white px-3 py-1 shadow-sm">월간</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/schedule/month?month=${addMonths(month, -1)}`} className="btn-ghost">
              ←
            </Link>
            <span className="font-semibold">
              {y}년 {Number(m)}월
            </span>
            <Link href={`/schedule/month?month=${addMonths(month, 1)}`} className="btn-ghost">
              →
            </Link>
          </div>
        </div>

        <div className="card overflow-x-auto !p-0">
          <table className="w-full table-fixed text-xs" style={{ minWidth: "640px" }}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {WEEKDAYS.map((d, i) => (
                  <th
                    key={d}
                    className={`px-1 py-2 font-medium ${
                      i >= 5 ? "text-red-500" : "text-slate-500"
                    }`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi} className="border-b border-slate-100 last:border-0">
                  {week.map((date, di) => {
                    if (!date) {
                      return <td key={di} className="bg-slate-50/50 align-top" />;
                    }
                    const dayNum = Number(date.slice(8));
                    const isToday = date === today;
                    const shifts = shiftsByDate.get(date) ?? [];
                    return (
                      <td key={di} className="h-24 align-top">
                        <Link
                          href={`/schedule?week=${date}`}
                          className={`block h-full p-1.5 transition-colors hover:bg-brand-50 ${
                            isToday ? "bg-brand-50 ring-1 ring-inset ring-brand-500" : ""
                          }`}
                        >
                          <span
                            className={`text-[11px] font-semibold ${
                              isToday
                                ? "text-brand-700"
                                : di >= 5
                                  ? "text-red-400"
                                  : "text-slate-500"
                            }`}
                          >
                            {dayNum}
                          </span>
                          <div className="mt-0.5 space-y-0.5">
                            {shifts.slice(0, 3).map((s) => (
                              <div
                                key={s.id}
                                className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                                  s.userId === user.id
                                    ? "bg-brand-100 font-semibold text-brand-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {userName(s.userId)} {s.start}
                              </div>
                            ))}
                            {shifts.length > 3 && (
                              <div className="px-1 text-[10px] text-slate-400">
                                +{shifts.length - 3}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400">
          날짜를 클릭하면 해당 주의 주간 근무표로 이동합니다. 내 근무는 파란색으로 표시됩니다.
        </p>
      </main>
    </>
  );
}
