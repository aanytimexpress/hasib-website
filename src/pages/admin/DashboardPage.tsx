import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { formatDate } from "../../lib/date";
import { supabase } from "../../lib/supabase";
import { Comment, Post } from "../../types/models";

interface DashboardCounts {
  posts: number;
  pages: number;
  commentsPending: number;
  gallery: number;
  timeline: number;
  favorites: number;
}

const postStatusLabel: Record<string, string> = {
  draft: "খসড়া",
  scheduled: "নির্ধারিত",
  published: "প্রকাশিত",
  archived: "আর্কাইভ"
};

const commentStatusLabel: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  approved: "অনুমোদিত",
  spam: "স্প্যাম",
  deleted: "মুছে ফেলা"
};

function formatCount(value: number) {
  return new Intl.NumberFormat("bn-BD").format(value);
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
        title="ড্যাশবোর্ড সংক্ষিপ্তচিত্র"
        description="পোস্ট, পেজ, মন্তব্য এবং সাইটের গুরুত্বপূর্ণ অংশগুলোর বর্তমান অবস্থা এখানে এক নজরে দেখা যাচ্ছে।"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "মোট পোস্ট", value: counts.posts },
          { label: "স্ট্যাটিক পেজ", value: counts.pages },
          { label: "অপেক্ষমাণ মন্তব্য", value: counts.commentsPending },
          { label: "গ্যালারি ছবি", value: counts.gallery },
          { label: "টাইমলাইন ইভেন্ট", value: counts.timeline },
          { label: "প্রিয়তালিকা আইটেম", value: counts.favorites }
        ].map((item) => (
          <AdminCard key={item.label} className="relative overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(248,205,184,0.38),transparent_68%)]" />
            <p className="relative text-sm text-slate-500">{item.label}</p>
            <p className="relative mt-3 text-4xl font-bold text-brand-900">{formatCount(item.value)}</p>
          </AdminCard>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h3 className="mb-4 text-xl font-semibold text-slate-900">সাম্প্রতিক পোস্ট</h3>
          <div className="space-y-3">
            {recentPosts.length ? (
              recentPosts.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-brand-100/70 bg-[#fffaf6] p-4">
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {postStatusLabel[item.status] ?? item.status} • {formatDate(item.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-brand-100 bg-[#fffaf6] p-4 text-sm text-slate-500">
                এখনো কোনো পোস্ট যোগ করা হয়নি।
              </p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="mb-4 text-xl font-semibold text-slate-900">সাম্প্রতিক মন্তব্য</h3>
          <div className="space-y-3">
            {recentComments.length ? (
              recentComments.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-brand-100/70 bg-[#fffaf6] p-4">
                  <p className="font-semibold text-slate-800">{item.author_name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.content}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {commentStatusLabel[item.status] ?? item.status} • {formatDate(item.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[22px] border border-dashed border-brand-100 bg-[#fffaf6] p-4 text-sm text-slate-500">
                এখনো কোনো মন্তব্য পাওয়া যায়নি।
              </p>
            )}
          </div>
        </AdminCard>
      </section>
    </div>
  );
}
