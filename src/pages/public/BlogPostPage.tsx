import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookmarkButton } from "../../components/public/BookmarkButton";
import { DarkModeToggle } from "../../components/public/DarkModeToggle";
import { FontSizeControl } from "../../components/public/FontSizeControl";
import { ReadingProgress } from "../../components/public/ReadingProgress";
import { Post, Comment } from "../../types/models";
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

    setStatusMessage("আপনার মন্তব্য জমা হয়েছে। অনুমোদনের পর দেখানো হবে।");
    setCommentForm({ name: "", email: "", content: "" });
  };

  if (!post) {
    return <p className="rounded-xl bg-white p-8 text-center text-slate-600">Post not found.</p>;
  }

  return (
    <div className="space-y-6">
      <ReadingProgress />
      <article className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
        <header className="mb-6 space-y-3 border-b border-slate-200 pb-6">
          <p className="text-sm text-slate-500">{formatDate(post.published_at || post.created_at)}</p>
          <h1 className="text-3xl font-bold leading-snug text-slate-900">{post.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800">
              {post.reading_minutes} min read
            </span>
            {post.category ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{post.category.name}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FontSizeControl size={fontSize} onChange={setFontSize} />
            <DarkModeToggle />
            <BookmarkButton slug={post.slug} />
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Share
            </a>
          </div>
        </header>

        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="mb-6 max-h-[500px] w-full rounded-2xl object-cover"
            loading="lazy"
          />
        ) : null}

        <div
          style={{ fontSize: `${fontSize}px` }}
          className="prose-bn transition-all"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      </article>

      {post.allow_comments ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">মন্তব্য করুন</h2>
            <form className="space-y-3" onSubmit={(event) => void submitComment(event)}>
              <input
                required
                value={commentForm.name}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="নাম"
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <input
                required
                type="email"
                value={commentForm.email}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="ইমেইল"
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <textarea
                required
                value={commentForm.content}
                onChange={(event) => setCommentForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="মন্তব্য লিখুন..."
                rows={5}
                className="w-full rounded-lg border border-slate-300 p-2"
              />
              <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                Submit
              </button>
              {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-slate-900">মন্তব্যসমূহ</h2>
            <div className="space-y-3">
              {comments.length ? (
                comments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold text-slate-800">{item.author_name}</p>
                    <p className="mt-1 text-sm leading-7 text-slate-700">{item.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">এখনও কোনো মন্তব্য নেই।</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Related Posts</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {relatedPosts.map((item) => (
            <Link key={item.id} to={`/blog/${item.slug}`} className="rounded-lg border border-slate-200 p-3 hover:border-brand-300">
              <p className="font-medium text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.reading_minutes} min read</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
