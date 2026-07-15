import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { addComment } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function PostPage({ params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const post = db.posts.find((p) => p.id === params.id);
  if (!post) notFound();

  const userName = (id: string) =>
    db.users.find((u) => u.id === id)?.name ?? "알 수 없음";

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <Link href="/board" className="text-sm text-slate-500 hover:underline">
          ← 게시판으로
        </Link>

        <article className="card">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`badge ${
                post.category === "notice"
                  ? "bg-red-100 text-red-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {post.category === "notice" ? "공지" : "자유"}
            </span>
            <h1 className="text-lg font-bold">{post.title}</h1>
          </div>
          <p className="mb-4 text-xs text-slate-400">
            {userName(post.authorId)} · {formatDateTime(post.createdAt)}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </p>
        </article>

        <section className="card">
          <h2 className="mb-3 font-semibold">댓글 {post.comments.length}</h2>
          {post.comments.length === 0 ? (
            <p className="mb-3 text-sm text-slate-400">첫 댓글을 남겨보세요.</p>
          ) : (
            <ul className="mb-4 space-y-3">
              {post.comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{userName(c.authorId)}</span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
          <form action={addComment} className="flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <input
              name="content"
              className="input flex-1"
              placeholder="댓글을 입력하세요"
              required
            />
            <button type="submit" className="btn-primary shrink-0">
              등록
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
