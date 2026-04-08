export type RoleName = "super_admin" | "editor" | "moderator";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export interface Role {
  id: string;
  name: RoleName;
  label: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  location: string | null;
  language: string[] | null;
  bio: string | null;
  avatar_url: string | null;
  role_id: string;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: PostStatus;
  allow_comments: boolean;
  featured: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  reading_minutes: number;
  view_count: number;
  author_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  tags?: Tag[];
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  content: string;
  status: "pending" | "approved" | "spam" | "deleted";
  created_at: string;
  post?: Pick<Post, "id" | "title" | "slug" | "allow_comments">;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  content: string;
  json_content: Record<string, unknown> | null;
  updated_at: string;
}

export interface Favorite {
  id: string;
  type: "players" | "teams" | "foods" | "books" | "flowers" | "places" | "games" | "colors";
  title: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: GalleryCategory | null;
}

export interface TimelineEvent {
  id: string;
  event_date: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  file_path: string;
  bucket: string;
  mime_type: string | null;
  size_bytes: number | null;
  folder: string | null;
  alt_text: string | null;
  url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface Menu {
  id: string;
  location: "header" | "footer";
  label: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  label: string;
  path: string;
  sort_order: number;
  target: "_self" | "_blank";
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SeoSetting {
  id: string;
  route_path: string;
  meta_title: string;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  keywords: string[] | null;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  json_content: Record<string, unknown> | null;
  enabled: boolean;
  sort_order: number;
  updated_at: string;
}
