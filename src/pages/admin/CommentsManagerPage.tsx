import { useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { Comment, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";

export default function CommentsManagerPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const load = async () => {
    const [{ data: commentData }, { data: postData }] = await Promise.all([
      supabase
        .from("comments")
        .select("*, post:posts(id, title, slug, allow_comments)")
        .order("created_at", { ascending: false }),
      supabase.from("posts").select("id, title, slug, allow_comments, status, content, created_at, updated_at, excerpt, cover_image_url, scheduled_at, published_at, reading_minutes, view_count, author_id, category_id, featured")
    ]);
    setComments((commentData as Comment[]) ?? []);
    setPosts((postData as Post[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (id: string, status: Comment["status"]) => {
    await supabase.from("comments").update({ status }).eq("id", id);
    await load();
  };

  const deleteComment = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    await load();
  };

  const togglePostComments = async (postId: string, allow: boolean) => {
    await supabase.from("posts").update({ allow_comments: allow }).eq("id", postId);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Comments Manager" description="Approve/delete comments and enable/disable per post." />

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Per Post Comment Permission</h3>
        <div className="space-y-2">
          {posts.slice(0, 40).map((post) => (
            <div key={post.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-800">{post.title}</p>
                <p className="text-xs text-slate-500">{post.slug}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={post.allow_comments}
                  onChange={(event) => void togglePostComments(post.id, event.target.checked)}
                />
                Allow comments
              </label>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Comments Queue</h3>
        {comments.length ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{comment.author_name}</p>
                    <p className="text-xs text-slate-500">{comment.author_email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      comment.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : comment.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{comment.content}</p>
                {comment.post?.title ? <p className="mt-1 text-xs text-slate-500">Post: {comment.post.title}</p> : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void setStatus(comment.id, "approved")}
                    className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void setStatus(comment.id, "pending")}
                    className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700"
                  >
                    Mark Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteComment(comment.id)}
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No comments found." />
        )}
      </AdminCard>
    </div>
  );
}
