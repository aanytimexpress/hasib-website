import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { Post, Comment } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/date";

interface DashboardCounts {
  posts: number;
  pages: number;
  commentsPending: number;
  gallery: number;
  timeline: number;
  favorites: number;
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    posts: 0,
    pages: 0,
    commentsPending: 0,
    gallery: 0,
    timeline: 0,
    favorites: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);

  useEffect(() => {
    const load = async () => {
      const [
        { count: postsCount },
        { count: pagesCount },
        { count: commentsPendingCount },
        { count: galleryCount },
        { count: timelineCount },
        { count: favoritesCount },
        { data: postsData },
        { data: commentsData }
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("pages").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("gallery").select("*", { count: "exact", head: true }),
        supabase.from("timeline").select("*", { count: "exact", head: true }),
        supabase.from("favorites").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(5),
        supabase
          .from("comments")
          .select("*, post:posts(id, title, slug, allow_comments)")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      setCounts({
        posts: postsCount ?? 0,
        pages: pagesCount ?? 0,
        commentsPending: commentsPendingCount ?? 0,
        gallery: galleryCount ?? 0,
        timeline: timelineCount ?? 0,
        favorites: favoritesCount ?? 0
      });
      setRecentPosts((postsData as Post[]) ?? []);
      setRecentComments((commentsData as Comment[]) ?? []);
    };
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Dashboard Overview"
        description="সাইটের সকল সেকশনের রিয়েল-টাইম কন্টেন্ট স্টেটাস।"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Posts", value: counts.posts },
          { label: "Static Pages", value: counts.pages },
          { label: "Pending Comments", value: counts.commentsPending },
          { label: "Gallery Photos", value: counts.gallery },
          { label: "Timeline Events", value: counts.timeline },
          { label: "Favorites Items", value: counts.favorites }
        ].map((item) => (
          <AdminCard key={item.label}>
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
          </AdminCard>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Recent Posts</h3>
          <div className="space-y-2">
            {recentPosts.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">
                  {item.status} • {formatDate(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Latest Comments</h3>
          <div className="space-y-2">
            {recentComments.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-800">{item.author_name}</p>
                <p className="line-clamp-2 text-sm text-slate-600">{item.content}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.status} • {formatDate(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>
    </div>
  );
}
