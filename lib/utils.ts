export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/** 로컬 기준 YYYY-MM-DD 문자열 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** 해당 날짜가 속한 주의 월요일 */
export function mondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay(); // 0=일
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return toDateStr(d);
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** "7/15 (수)" 형태 */
export function formatShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[d.getDay()]})`;
}

/** "HH:mm" 두 개 사이의 시간(시간 단위, 자정 넘김 지원) */
export function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

/** 출퇴근 ISO 타임스탬프 사이의 시간(시간 단위) */
export function attendanceHours(clockIn: string, clockOut: string): number {
  return (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000;
}

/** 12345 → "12,345원" */
export function formatWon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

/** 7.25 → "7시간 15분" */
export function formatHours(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm === 0 ? `${hh}시간` : `${hh}시간 ${mm}분`;
}

/** 현재 달 "YYYY-MM" */
export function currentMonth(): string {
  return todayStr().slice(0, 7);
}

/** "YYYY-MM"에 n개월 더하기 */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 월간 캘린더 그리드 (월요일 시작, 앞뒤 패딩은 null) */
export function monthGrid(month: string): (string | null)[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // 월요일=0
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** ISO 문자열 → "14:30" */
export function formatTimeHM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/** ISO 문자열 → "2026.07.15 14:30" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}
