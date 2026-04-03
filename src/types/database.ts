export type UserRole = "user" | "admin" | "moderator";
export type ProjectCategory = "apps" | "design" | "media";
export type ProjectStatus = "pending" | "approved" | "removed";
export type ReportReason = "spam" | "inappropriate" | "misleading" | "other";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  karma: number;
  is_banned: boolean;
  is_trusted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  category: ProjectCategory;
  ai_tools_used: string[];
  thumbnail_url: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  score: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  project_images?: ProjectImage[];
  user_vote?: number;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  project_id: string;
  value: number; // 1 or -1
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  project_id: string;
  parent_id: string | null;
  body: string;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  replies?: Comment[];
}

export interface Report {
  id: string;
  reporter_id: string;
  project_id: string | null;
  comment_id: string | null;
  reason: ReportReason;
  details: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  announcement: string | null;
  submissions_open: boolean;
  updated_at: string;
}
