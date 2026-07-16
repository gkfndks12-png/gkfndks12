export type Role = "owner" | "staff";

export interface User {
  id: string;
  name: string;
  role: Role;
  salt: string;
  pinHash: string; // sha256(`${salt}:${pin}`)
  position: string;
  wage: number; // 시급 (원)
  active: boolean;
}

export interface Report {
  id: string;
  authorId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  tasks: string;
  issues: string;
  handover: string;
  createdAt: string; // ISO
}

export interface Shift {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  memo: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (출근한 날)
  clockIn: string; // ISO
  clockOut: string | null; // ISO, 근무 중이면 null
}

export type SwapStatus = "pending" | "accepted" | "cancelled";

export interface SwapRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  reason: string;
  status: SwapStatus;
  acceptedBy: string | null;
  createdAt: string; // ISO
}

export type PostCategory = "notice" | "free";

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string; // ISO
}

export interface Post {
  id: string;
  authorId: string;
  category: PostCategory;
  title: string;
  content: string;
  createdAt: string; // ISO
  comments: Comment[];
}

export type NotificationType =
  | "swap_request"
  | "swap_accepted"
  | "notice"
  | "comment"
  | "shift_assigned"
  | "shift_removed";

export interface Notification {
  id: string;
  userId: string; // 받는 사람
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  createdAt: string; // ISO
}

export interface Database {
  users: User[];
  reports: Report[];
  shifts: Shift[];
  attendances: Attendance[];
  swapRequests: SwapRequest[];
  posts: Post[];
  notifications: Notification[];
}
