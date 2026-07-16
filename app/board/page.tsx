import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createPost } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function BoardPage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "알 수 없음";

  const notices = db.posts.filter((p) => p.category === "notice");
  const frees = db.posts.filter((p) => p.category === "free");

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <h1 className="text-xl font-bold">게시판</h1>

        <section className="card">
          <h2 className="mb-3 font-semibold text-red-600">📢 공지사항</h2>
          {notices.length === 0 ? (
            <p className="text-sm text-slate-400">등록된 공지가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notices.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/board/${p.id}`}
                    className="flex items-center gap-2 py-2.5 text-sm hover:text-brand-600"
                  >
                    <span className="flex-1 truncate font-medium">{p.title}</span>
                    <span className="text-xs text-slate-400">
                      {userName(p.authorId)} · {formatDateTime(p.createdAt)} · 💬{" "}
                      {p.comments.length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-semibold">💬 자유 게시판</h2>
          {frees.length === 0 ? (
            <p className="text-sm text-slate-400">아직 글이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {frees.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/board/${p.id}`}
                    className="flex items-center gap-2 py-2.5 text-sm hover:text-brand-600"
                  >
                    <span className="flex-1 truncate font-medium">{p.title}</span>
                    <span className="text-xs text-slate-400">
                      {userName(p.authorId)} · {formatDateTime(p.createdAt)} · 💬{" "}
                      {p.comments.length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 font-semibold">✏️ 새 글 작성</h2>
          <form action={createPost} className="space-y-3 text-sm">
            <div className="flex gap-3">
              {user.role === "owner" && (
                <label className="flex items-center gap-1.5">
                  <input type="radio" name="category" value="notice" />
                  공지사항
                </label>
              )}
              <label className="flex items-center gap-1.5">
                <input type="radio" name="category" value="free" defaultChecked />
                자유글
              </label>
            </div>
            <input
              name="title"
              className="input"
              placeholder="제목"
              required
            />
            <textarea
              name="content"
              rows={4}
              className="input"
              placeholder="내용을 입력하세요"
              required
            />
            <button type="submit" className="btn-primary">
              등록
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
