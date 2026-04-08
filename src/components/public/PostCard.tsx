import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { Post } from "../../types/models";
import { formatDate } from "../../lib/date";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-panel">
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="lazy"
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-100 via-sky-100 to-teal-100" />
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {post.reading_minutes || 1} min
          </span>
        </div>
        <h3 className="line-clamp-2 text-lg font-semibold leading-8 text-slate-800">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt}</p> : null}
        <Link to={`/blog/${post.slug}`} className="inline-block text-sm font-semibold text-brand-700 transition hover:text-brand-800">
          বিস্তারিত পড়ুন →
        </Link>
      </div>
    </article>
  );
}
