import { Link } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";
import { Post } from "../../types/models";
import { formatDate } from "../../lib/date";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/70 bg-paper-grain shadow-paper backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(31,47,75,0.16)]">
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="lazy"
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="h-56 bg-hero-grid" />
      )}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-white/80 px-3 py-1">{formatDate(post.published_at || post.created_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {post.reading_minutes || 1} মিনিট
          </span>
        </div>
        <h3 className="font-display line-clamp-2 text-2xl leading-tight text-brand-900">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt}</p> : null}
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-accent-300 hover:text-accent-700"
        >
          বিস্তারিত পড়ুন
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
