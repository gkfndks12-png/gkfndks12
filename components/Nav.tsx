import Link from "next/link";
import { logout } from "@/lib/actions";
import type { User } from "@/lib/types";

const MENU = [
  { href: "/", label: "홈" },
  { href: "/reports", label: "업무 보고" },
  { href: "/schedule", label: "근무표" },
  { href: "/board", label: "게시판" },
];

export default function Nav({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand-600">
          알바톡
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {user.name}
            <span className="ml-1 text-xs text-slate-400">
              {user.role === "owner" ? "사장님" : user.position}
            </span>
          </span>
          <form action={logout}>
            <button className="btn-ghost !px-3 !py-1.5 text-xs">
              로그아웃
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
