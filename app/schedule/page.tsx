import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  acceptSwap,
  cancelSwap,
  createShift,
  deleteShift,
  requestSwap,
} from "@/lib/actions";
import { addDays, formatShort, mondayOf, todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function SchedulePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "알 수 없음";

  const today = todayStr();
  const base = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week ?? "")
    ? searchParams.week!
    : today;
  const monday = mondayOf(base);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const pendingSwaps = db.swapRequests.filter((r) => r.status === "pending");
  const pendingByShift = new Map(pendingSwaps.map((r) => [r.shiftId, r]));

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">주간 근무표</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/schedule?week=${addDays(monday, -7)}`} className="btn-ghost">
              ← 지난주
            </Link>
            <Link href={`/schedule?week=${today}`} className="btn-ghost">
              이번주
            </Link>
            <Link href={`/schedule?week=${addDays(monday, 7)}`} className="btn-ghost">
              다음주 →
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          {formatShort(monday)} ~ {formatShort(addDays(monday, 6))}
        </p>

        {/* 대타 요청 목록 */}
        {pendingSwaps.length > 0 && (
          <section className="card border-amber-200 bg-amber-50">
            <h2 className="mb-3 font-semibold text-amber-800">
              🙋 대기 중인 대타 요청
            </h2>
            <ul className="space-y-3">
              {pendingSwaps.map((req) => {
                const shift = db.shifts.find((s) => s.id === req.shiftId);
                if (!shift) return null;
                return (
                  <li
                    key={req.id}
                    className="rounded-lg bg-white p-3 text-sm shadow-sm"
                  >
                    <p className="font-medium">
                      {userName(req.requesterId)} · {formatShort(shift.date)}{" "}
                      {shift.start}~{shift.end}
                    </p>
                    {req.reason && (
                      <p className="mt-1 text-slate-500">“{req.reason}”</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {req.requesterId !== user.id && (
                        <form action={acceptSwap}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <button className="btn-primary !px-3 !py-1.5 text-xs">
                            내가 대신 근무할게요
                          </button>
                        </form>
                      )}
                      {(req.requesterId === user.id || user.role === "owner") && (
                        <form action={cancelSwap}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <button className="btn-ghost !px-3 !py-1.5 text-xs">
                            요청 취소
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 주간 그리드 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {days.map((date) => {
            const dayShifts = db.shifts
              .filter((s) => s.date === date)
              .sort((a, b) => a.start.localeCompare(b.start));
            const isToday = date === today;
            return (
              <section
                key={date}
                className={`card ${isToday ? "ring-2 ring-brand-500" : ""}`}
              >
                <h3 className="mb-2 flex items-center justify-between font-semibold">
                  {formatShort(date)}
                  {isToday && (
                    <span className="badge bg-brand-100 text-brand-700">오늘</span>
                  )}
                </h3>
                {dayShifts.length === 0 ? (
                  <p className="text-sm text-slate-300">근무 없음</p>
                ) : (
                  <ul className="space-y-2">
                    {dayShifts.map((s) => {
                      const pending = pendingByShift.get(s.id);
                      const mine = s.userId === user.id;
                      return (
                        <li
                          key={s.id}
                          className={`rounded-lg px-3 py-2 text-sm ${
                            mine ? "bg-brand-50" : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {userName(s.userId)}
                              {mine && (
                                <span className="badge ml-1.5 bg-brand-100 text-brand-700">
                                  나
                                </span>
                              )}
                            </span>
                            <span className="text-slate-500">
                              {s.start}~{s.end}
                            </span>
                          </div>
                          {s.memo && (
                            <p className="mt-0.5 text-xs text-slate-400">{s.memo}</p>
                          )}
                          {pending && (
                            <p className="mt-1 text-xs font-medium text-amber-600">
                              🙋 대타 요청 중
                            </p>
                          )}
                          <div className="mt-1.5 flex gap-2">
                            {mine && !pending && date >= today && (
                              <details className="text-xs">
                                <summary className="cursor-pointer font-medium text-brand-600">
                                  대타 요청하기
                                </summary>
                                <form action={requestSwap} className="mt-2 space-y-2">
                                  <input type="hidden" name="shiftId" value={s.id} />
                                  <input
                                    name="reason"
                                    className="input !py-1.5 text-xs"
                                    placeholder="사유 (선택)"
                                  />
                                  <button className="btn-primary !px-3 !py-1.5 text-xs">
                                    요청 등록
                                  </button>
                                </form>
                              </details>
                            )}
                            {user.role === "owner" && (
                              <form action={deleteShift}>
                                <input type="hidden" name="shiftId" value={s.id} />
                                <button className="text-xs text-red-400 hover:text-red-600 hover:underline">
                                  삭제
                                </button>
                              </form>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}

          {/* 사장님: 근무 추가 */}
          {user.role === "owner" && (
            <section className="card border-dashed">
              <h3 className="mb-3 font-semibold">+ 근무 추가</h3>
              <form action={createShift} className="space-y-3 text-sm">
                <div>
                  <label className="label" htmlFor="shift-user">직원</label>
                  <select id="shift-user" name="userId" className="input" required>
                    {db.users
                      .filter((u) => u.role === "staff" && u.active)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.position})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="shift-date">날짜</label>
                  <input
                    id="shift-date"
                    name="date"
                    type="date"
                    className="input"
                    defaultValue={monday}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="shift-start">시작</label>
                    <input id="shift-start" name="start" type="time" className="input" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="shift-end">종료</label>
                    <input id="shift-end" name="end" type="time" className="input" required />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="shift-memo">메모</label>
                  <input id="shift-memo" name="memo" className="input" placeholder="선택" />
                </div>
                <button type="submit" className="btn-primary w-full">
                  근무 등록
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
