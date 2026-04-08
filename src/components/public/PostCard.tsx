import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { Post } from "../../types/models";
import { formatDate } from "../../lib/date";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="lazy"
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-100 via-sky-100 to-teal-100" />
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {post.reading_minutes || 1} min
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-800">
          <Link to={`/blog/${post.slug}`} className="hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="line-clamp-3 text-sm text-slate-600">{post.excerpt}</p> : null}
        <Link to={`/blog/${post.slug}`} className="inline-block text-sm font-semibold text-brand-700">
          বিস্তারিত পড়ুন →
        </Link>
      </div>
    </article>
  );
}
