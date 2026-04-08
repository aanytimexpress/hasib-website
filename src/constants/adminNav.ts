import { LayoutDashboard, FileText, PanelsTopLeft, Image, Clock3, Heart, MessageSquare, Folder, Menu, Settings, Search, Users } from "lucide-react";
import { RoleName } from "../types/models";

export const adminNavItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, roles: ["super_admin", "editor", "moderator"] as RoleName[] },
  { label: "Posts", path: "/admin/posts", icon: FileText, roles: ["super_admin", "editor"] as RoleName[] },
  { label: "Pages", path: "/admin/pages", icon: PanelsTopLeft, roles: ["super_admin"] as RoleName[] },
  { label: "Gallery", path: "/admin/gallery", icon: Image, roles: ["super_admin"] as RoleName[] },
  { label: "Timeline", path: "/admin/timeline", icon: Clock3, roles: ["super_admin"] as RoleName[] },
  { label: "Favorites", path: "/admin/favorites", icon: Heart, roles: ["super_admin"] as RoleName[] },
  { label: "Comments", path: "/admin/comments", icon: MessageSquare, roles: ["super_admin", "moderator"] as RoleName[] },
  { label: "Media", path: "/admin/media", icon: Folder, roles: ["super_admin"] as RoleName[] },
  { label: "Menu", path: "/admin/menu", icon: Menu, roles: ["super_admin"] as RoleName[] },
  { label: "Settings", path: "/admin/settings", icon: Settings, roles: ["super_admin"] as RoleName[] },
  { label: "SEO", path: "/admin/seo", icon: Search, roles: ["super_admin"] as RoleName[] },
  { label: "Users", path: "/admin/users", icon: Users, roles: ["super_admin"] as RoleName[] }
];
