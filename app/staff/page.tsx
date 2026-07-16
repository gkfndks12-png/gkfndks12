import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { addStaff, toggleStaffActive, updateStaff } from "@/lib/actions";
import { formatWon } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function StaffPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/");

  const db = getDb();
  const staff = db.users.filter((u) => u.role === "staff");

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <h1 className="text-xl font-bold">직원 관리</h1>

        {searchParams.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            입력값을 확인해주세요. 이름은 필수이며 PIN은 숫자 4자리여야 합니다.
          </p>
        )}

        <div className="space-y-3">
          {staff.map((u) => (
            <section
              key={u.id}
              className={`card ${!u.active ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {u.name}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {u.position} · 시급 {formatWon(u.wage)}
                  </span>
                  {!u.active && (
                    <span className="badge ml-2 bg-slate-100 text-slate-400">
                      비활성 (퇴사)
                    </span>
                  )}
                </h2>
                <form action={toggleStaffActive}>
                  <input type="hidden" name="targetId" value={u.id} />
                  <button
                    className={`text-xs hover:underline ${
                      u.active ? "text-red-400 hover:text-red-600" : "text-brand-600"
                    }`}
                  >
                    {u.active ? "비활성화" : "다시 활성화"}
                  </button>
                </form>
              </div>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer font-medium text-brand-600">
                  정보 수정
                </summary>
                <form
                  action={updateStaff}
                  className="mt-3 grid gap-3 sm:grid-cols-4"
                >
                  <input type="hidden" name="targetId" value={u.id} />
                  <div>
                    <label className="label">담당</label>
                    <input name="position" className="input" defaultValue={u.position} />
                  </div>
                  <div>
                    <label className="label">시급 (원)</label>
                    <input
                      name="wage"
                      type="number"
                      min={0}
                      step={10}
                      className="input"
                      defaultValue={u.wage}
                    />
                  </div>
                  <div>
                    <label className="label">새 PIN (변경 시)</label>
                    <input
                      name="newPin"
                      inputMode="numeric"
                      maxLength={4}
                      className="input"
                      placeholder="4자리"
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="btn-primary w-full">
                      저장
                    </button>
                  </div>
                </form>
              </details>
            </section>
          ))}
        </div>

        <section className="card border-dashed">
          <h2 className="mb-3 font-semibold">+ 새 직원 등록</h2>
          <form action={addStaff} className="grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <label className="label">이름 *</label>
              <input name="name" className="input" required />
            </div>
            <div>
              <label className="label">담당</label>
              <input name="position" className="input" placeholder="홀 / 주방 등" />
            </div>
            <div>
              <label className="label">시급 (원)</label>
              <input
                name="wage"
                type="number"
                min={0}
                step={10}
                className="input"
                defaultValue={10320}
              />
            </div>
            <div>
              <label className="label">PIN (4자리) *</label>
              <input
                name="pin"
                inputMode="numeric"
                maxLength={4}
                className="input"
                required
              />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="btn-primary">
                직원 등록
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
