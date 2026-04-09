import { Link } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";
import { Post } from "../../types/models";
import { formatDate } from "../../lib/date";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-[#eadfd2] bg-[rgba(255,252,248,0.92)] shadow-[0_20px_50px_rgba(95,61,39,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_58px_rgba(95,61,39,0.14)]">
      {post.cover_image_url ? (
        <div className="overflow-hidden">
          <img
            src={post.cover_image_url}
            alt={post.title}
            loading="lazy"
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-52 bg-[linear-gradient(135deg,#f7e6d7,#fff9f3_42%,#e9eef7)]" />
      )}

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            {formatDate(post.published_at || post.created_at)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4ee] px-3 py-1 text-[#a44b21]">
            <Clock3 size={13} />
            {post.reading_minutes || 1} min
          </span>
        </div>

        <h3 className="font-display line-clamp-2 text-2xl leading-tight text-brand-900">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-accent-700">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? <p className="line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt}</p> : null}

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#a44b21] transition group-hover:gap-3"
        >
          বিস্তারিত পড়ুন <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
