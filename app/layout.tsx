import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "알바톡 — 아르바이트 업무·일정 관리",
  description: "업무 보고서, 근무 일정, 직원 소통을 한곳에서",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
