import { login } from "@/lib/actions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const db = getDb();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-brand-600">알바톡</h1>
          <p className="mt-2 text-sm text-slate-500">
            업무 보고 · 근무 일정 · 직원 소통을 한곳에서
          </p>
        </div>
        <form action={login} className="card space-y-4">
          <div>
            <label className="label" htmlFor="userId">
              직원 선택
            </label>
            <select id="userId" name="userId" className="input" required>
              {db.users.filter((u) => u.active).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "owner" ? "사장님" : u.position})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pin">
              PIN 번호 (4자리)
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input"
              placeholder="••••"
              required
            />
          </div>
          {searchParams.error && (
            <p className="text-sm font-medium text-red-600">
              PIN 번호가 올바르지 않습니다.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            로그인
          </button>
          <p className="text-center text-xs text-slate-400">
            데모 계정 PIN — 김사장 1234 · 이하늘 1111 · 박준영 2222 · 최유나 3333
          </p>
        </form>
      </div>
    </main>
  );
}
