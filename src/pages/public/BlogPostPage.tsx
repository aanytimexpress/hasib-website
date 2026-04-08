import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Facebook, MessageCircleMore, Share2 } from "lucide-react";
import { BookmarkButton } from "../../components/public/BookmarkButton";
import { DarkModeToggle } from "../../components/public/DarkModeToggle";
import { FontSizeControl } from "../../components/public/FontSizeControl";
import { ReadingProgress } from "../../components/public/ReadingProgress";
import { Comment, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { sanitizeHtml } from "../../lib/sanitize";
import { formatDate } from "../../lib/date";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", content: "" });
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      const { data: postData } = await supabase
        .from("posts")
        .select("*, category:categories(*)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (!postData) return;
      setPost(postData as Post);

      await supabase
        .from("posts")
        .update({ view_count: (postData.view_count ?? 0) + 1 })
        .eq("id", postData.id);

      const [{ data: commentData }, { data: sameCategoryData }, { data: currentTagMap }] = await Promise.all([
        supabase
          .from("comments")
          .select("*")
          .eq("post_id", postData.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .neq("id", postData.id)
          .eq("category_id", postData.category_id)
          .limit(8),
        supabase.from("post_tags").select("tag_id").eq("post_id", postData.id)
      ]);
      setComments((commentData as Comment[]) ?? []);

      const currentTagIds = (currentTagMap ?? []).map((item) => item.tag_id);
      let recommended: Post[] = [];

      if (currentTagIds.length) {
        const { data: relatedTagMap } = await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("tag_id", currentTagIds)
          .neq("post_id", postData.id);

        const scoreMap = new Map<string, number>();
        (relatedTagMap ?? []).forEach((item) => {
          scoreMap.set(item.post_id, (scoreMap.get(item.post_id) || 0) + 1);
        });

        const rankedIds = Array.from(scoreMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map((entry) => entry[0]);

        if (rankedIds.length) {
          const { data: rankedPosts } = await supabase
            .from("posts")
            .select("*")
            .eq("status", "published")
            .in("id", rankedIds);
          recommended = ((rankedPosts as Post[]) ?? []).sort(
            (a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id)
          );
        }
      }

      if (!recommended.length) {
        recommended = (sameCategoryData as Post[]) ?? [];
      }

      setRelatedPosts(recommended.slice(0, 4));
    };

    void load();
  }, [slug]);

  const shareUrl = useMemo(() => `${window.location.origin}/blog/${slug}`, [slug]);

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!post) return;

    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      author_name: commentForm.name,
      author_email: commentForm.email,
      content: commentForm.content,
      status: "pending"
    });

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("আপনার মন্তব্য জমা হয়েছে। অনুমোদনের পর এটি সবার জন্য দেখা যাবে।");
    setCommentForm({ name: "", email: "", content: "" });
  };

  if (!post) {
    return <p className="section-card text-center text-slate-600">এই লেখাটি খুঁজে পাওয়া যায়নি।</p>;
  }

  return (
    <div className="page-shell">
      <ReadingProgress />

      <section className="page-hero">
        <div className="space-y-4">
          <Link to="/blog" className="ghost-button w-fit gap-2">
            <ArrowLeft size={16} />
            সব লেখায় ফিরুন
          </Link>
          <p className="section-kicker">{formatDate(post.published_at || post.created_at)}</p>
          <h1 className="section-title max-w-4xl">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-white/85 px-4 py-2">পড়তে সময় {post.reading_minutes} মিনিট</span>
            {post.category ? <span className="rounded-full bg-brand-50 px-4 py-2 text-brand-800">{post.category.name}</span> : null}
            <span className="rounded-full bg-white/85 px-4 py-2">{post.view_count} বার দেখা হয়েছে</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="section-card overflow-hidden p-0">
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="max-h-[540px] w-full object-cover"
              loading="lazy"
            />
          ) : null}

          <div className="space-y-6 p-5 md:p-8">
            <div className="flex flex-wrap gap-2">
              <FontSizeControl size={fontSize} onChange={setFontSize} />
              <DarkModeToggle />
              <BookmarkButton slug={post.slug} />
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="ghost-button gap-2"
              >
                <Facebook size={15} />
                শেয়ার
              </a>
            </div>

            <div
              style={{ fontSize: `${fontSize}px` }}
              className="prose-bn transition-all"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          </div>
        </article>

        <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
          <div className="section-card space-y-4">
            <div>
              <p className="section-kicker">পাঠ অভিজ্ঞতা</p>
              <h2 className="mt-3 font-display text-3xl text-brand-900">এই লেখার পাশে</h2>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              ফন্ট ছোট-বড় করুন, লেখাটি সংরক্ষণ করুন, অথবা বন্ধুদের সাথে শেয়ার করে দিন।
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="rounded-[22px] bg-white/85 px-4 py-3">প্রকাশ: {formatDate(post.published_at || post.created_at)}</div>
              <div className="rounded-[22px] bg-white/85 px-4 py-3">লেখার সময়: {post.reading_minutes} মিনিট</div>
            </div>
          </div>

          <div className="section-card space-y-3">
            <div>
              <p className="section-kicker">শেয়ার</p>
              <h2 className="mt-3 font-display text-2xl text-brand-900">এই লেখা ছড়িয়ে দিন</h2>
            </div>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="soft-button w-full gap-2"
            >
              <Share2 size={16} />
              ফেসবুকে শেয়ার করুন
            </a>
          </div>
        </aside>
      </section>

      {post.allow_comments ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="section-card">
            <div className="mb-4 space-y-2">
              <p className="section-kicker">পাঠকের কথা</p>
              <h2 className="font-display text-3xl text-brand-900">মন্তব্য লিখুন</h2>
            </div>
            <form className="space-y-3" onSubmit={(event) => void submitComment(event)}>
              <input
                required
                value={commentForm.name}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="আপনার নাম"
                className="soft-input"
              />
              <input
                required
                type="email"
                value={commentForm.email}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="ইমেইল ঠিকানা"
                className="soft-input"
              />
              <textarea
                required
                value={commentForm.content}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="এই লেখাটি পড়ে আপনার অনুভূতি লিখুন..."
                rows={6}
                className="soft-input min-h-[180px] resize-y"
              />
              <button type="submit" className="soft-button">
                মন্তব্য পাঠান
              </button>
              {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
            </form>
          </div>

          <div className="section-card">
            <div className="mb-4 space-y-2">
              <p className="section-kicker">প্রতিক্রিয়া</p>
              <h2 className="font-display text-3xl text-brand-900">পাঠকদের মন্তব্য</h2>
            </div>
            <div className="space-y-3">
              {comments.length ? (
                comments.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-brand-100 bg-white/85 p-4">
                    <div className="mb-2 inline-flex items-center gap-2 text-brand-800">
                      <MessageCircleMore size={16} />
                      <p className="font-semibold">{item.author_name}</p>
                    </div>
                    <p className="text-sm leading-7 text-slate-700">{item.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">এখনো কোনো মন্তব্য আসেনি। আপনিই প্রথম মন্তব্যটি লিখে ফেলুন।</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {relatedPosts.length ? (
        <section className="section-card space-y-4">
          <div>
            <p className="section-kicker">আরও পড়ুন</p>
            <h2 className="mt-3 font-display text-4xl text-brand-900">এই লেখার কাছাকাছি আরও কিছু লেখা</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedPosts.map((item) => (
              <Link
                key={item.id}
                to={`/blog/${item.slug}`}
                className="rounded-[24px] border border-brand-100 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-sm"
              >
                <p className="font-display text-2xl leading-tight text-brand-900">{item.title}</p>
                <p className="mt-2 text-xs text-slate-500">{item.reading_minutes} মিনিটের পাঠ</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
