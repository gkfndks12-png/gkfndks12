import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { markAllNotificationsRead } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const mine = db.notifications
    .filter((n) => n.userId === user.id)
    .slice(0, 50);
  const unreadCount = mine.filter((n) => !n.read).length;

  return (
    <>
      <Nav user={user} />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            알림
            {unreadCount > 0 && (
              <span className="badge ml-2 bg-red-100 text-red-600">
                안 읽음 {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <button className="btn-ghost text-sm">모두 읽음 처리</button>
            </form>
          )}
        </div>

        {mine.length === 0 ? (
          <p className="card text-sm text-slate-400">알림이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link}
                  className={`card block !p-3 text-sm transition-colors hover:border-brand-500 ${
                    n.read ? "opacity-60" : "border-brand-200 bg-brand-50/50"
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(n.createdAt)}
                    {!n.read && (
                      <span className="ml-2 font-semibold text-red-500">●</span>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
