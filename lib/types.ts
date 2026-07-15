export type Role = "owner" | "staff";

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
  position: string;
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

export interface Database {
  users: User[];
  reports: Report[];
  shifts: Shift[];
  swapRequests: SwapRequest[];
  posts: Post[];
}
