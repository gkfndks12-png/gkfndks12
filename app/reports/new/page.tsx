import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { createReport } from "@/lib/actions";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function NewReportPage({
  searchParams,
}: {
  searchParams: { date?: string; start?: string; end?: string };
}) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const defaultDate = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "")
    ? searchParams.date!
    : todayStr();
  const defaultStart = /^\d{2}:\d{2}$/.test(searchParams.start ?? "")
    ? searchParams.start
    : undefined;
  const defaultEnd = /^\d{2}:\d{2}$/.test(searchParams.end ?? "")
    ? searchParams.end
    : undefined;

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">업무 보고서 작성</h1>
        <form action={createReport} className="card space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="date">근무일</label>
              <input
                id="date"
                name="date"
                type="date"
                className="input"
                defaultValue={defaultDate}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="start">출근</label>
              <input
                id="start"
                name="start"
                type="time"
                className="input"
                defaultValue={defaultStart}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="end">퇴근</label>
              <input
                id="end"
                name="end"
                type="time"
                className="input"
                defaultValue={defaultEnd}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="tasks">오늘 한 일 *</label>
            <textarea
              id="tasks"
              name="tasks"
              rows={4}
              className="input"
              placeholder="예) 오픈 준비, 홀 서빙, 재고 정리"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="issues">특이사항 / 이슈</label>
            <textarea
              id="issues"
              name="issues"
              rows={3}
              className="input"
              placeholder="예) 포스기 오류, 고객 컴플레인 등"
            />
          </div>
          <div>
            <label className="label" htmlFor="handover">다음 근무자 인수인계</label>
            <textarea
              id="handover"
              name="handover"
              rows={3}
              className="input"
              placeholder="예) 우유 재고 부족, 발주 필요"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            보고서 제출
          </button>
        </form>
      </main>
    </>
  );
}
