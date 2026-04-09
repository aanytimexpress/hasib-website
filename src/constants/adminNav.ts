import {
  Clock3,
  FileText,
  Folder,
  Heart,
  Image,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelsTopLeft,
  Search,
  Settings,
  Users
} from "lucide-react";
import { RoleName } from "../types/models";

export const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, roles: ["super_admin", "editor", "moderator"] as RoleName[] },
  { label: "পোস্ট", path: "/admin/posts", icon: FileText, roles: ["super_admin", "editor"] as RoleName[] },
  { label: "পেজ", path: "/admin/pages", icon: PanelsTopLeft, roles: ["super_admin"] as RoleName[] },
  { label: "গ্যালারি", path: "/admin/gallery", icon: Image, roles: ["super_admin"] as RoleName[] },
  { label: "টাইমলাইন", path: "/admin/timeline", icon: Clock3, roles: ["super_admin"] as RoleName[] },
  { label: "প্রিয়তালিকা", path: "/admin/favorites", icon: Heart, roles: ["super_admin"] as RoleName[] },
  { label: "মন্তব্য", path: "/admin/comments", icon: MessageSquare, roles: ["super_admin", "moderator"] as RoleName[] },
  { label: "মিডিয়া", path: "/admin/media", icon: Folder, roles: ["super_admin"] as RoleName[] },
  { label: "মেনু", path: "/admin/menu", icon: Menu, roles: ["super_admin"] as RoleName[] },
  { label: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["super_admin"] as RoleName[] },
  { label: "এসইও", path: "/admin/seo", icon: Search, roles: ["super_admin"] as RoleName[] },
  { label: "ব্যবহারকারী", path: "/admin/users", icon: Users, roles: ["super_admin"] as RoleName[] }
];
