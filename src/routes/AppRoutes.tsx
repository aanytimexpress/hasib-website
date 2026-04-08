import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";

const HomePage = lazy(() => import("../pages/public/HomePage"));
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const BlogPage = lazy(() => import("../pages/public/BlogPage"));
const BlogPostPage = lazy(() => import("../pages/public/BlogPostPage"));
const FavoritesPage = lazy(() => import("../pages/public/FavoritesPage"));
const GalleryPage = lazy(() => import("../pages/public/GalleryPage"));
const TimelinePage = lazy(() => import("../pages/public/TimelinePage"));
const ContactPage = lazy(() => import("../pages/public/ContactPage"));
const SearchPage = lazy(() => import("../pages/public/SearchPage"));

const AdminLoginPage = lazy(() => import("../pages/admin/AdminLoginPage"));
const AdminSignupPage = lazy(() => import("../pages/admin/AdminSignupPage"));
const ResetPasswordPage = lazy(() => import("../pages/admin/ResetPasswordPage"));
const DashboardPage = lazy(() => import("../pages/admin/DashboardPage"));
const PostsPage = lazy(() => import("../pages/admin/PostsPage"));
const PagesPage = lazy(() => import("../pages/admin/PagesPage"));
const GalleryManagerPage = lazy(() => import("../pages/admin/GalleryManagerPage"));
const TimelineManagerPage = lazy(() => import("../pages/admin/TimelineManagerPage"));
const FavoritesManagerPage = lazy(() => import("../pages/admin/FavoritesManagerPage"));
const CommentsManagerPage = lazy(() => import("../pages/admin/CommentsManagerPage"));
const MediaManagerPage = lazy(() => import("../pages/admin/MediaManagerPage"));
const MenuManagerPage = lazy(() => import("../pages/admin/MenuManagerPage"));
const SettingsPage = lazy(() => import("../pages/admin/SettingsPage"));
const SeoPage = lazy(() => import("../pages/admin/SeoPage"));
const UsersPage = lazy(() => import("../pages/admin/UsersPage"));

function Loader() {
  return <div className="p-6 text-center text-sm text-slate-600">Loading...</div>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/signup" element={<AdminSignupPage />} />
        <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute roles={["super_admin", "editor", "moderator"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["super_admin", "editor"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/posts" element={<PostsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["super_admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/pages" element={<PagesPage />} />
            <Route path="/admin/gallery" element={<GalleryManagerPage />} />
            <Route path="/admin/timeline" element={<TimelineManagerPage />} />
            <Route path="/admin/favorites" element={<FavoritesManagerPage />} />
            <Route path="/admin/media" element={<MediaManagerPage />} />
            <Route path="/admin/menu" element={<MenuManagerPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/seo" element={<SeoPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["super_admin", "moderator"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/comments" element={<CommentsManagerPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={["super_admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
