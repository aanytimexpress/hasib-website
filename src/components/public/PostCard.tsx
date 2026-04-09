import { Link } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";
import { Post } from "../../types/models";
import { formatDate } from "../../lib/date";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-[22px] border border-white/70 bg-white/72 shadow-[0_14px_35px_rgba(29,64,121,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(29,64,121,0.18)]">
      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          loading="lazy"
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="h-48 bg-gradient-to-br from-brand-100 via-sky-100 to-cyan-100" />
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(post.published_at || post.created_at)}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm">
            <Clock3 size={13} />
            {post.reading_minutes || 1} min
          </span>
        </div>

        <h3 className="line-clamp-2 text-xl font-semibold leading-8 text-slate-800">
          <Link to={`/blog/${post.slug}`} className="transition hover:text-brand-700">
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? <p className="line-clamp-3 text-sm leading-7 text-slate-600">{post.excerpt}</p> : null}

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition group-hover:gap-2 group-hover:text-brand-800"
        >
          বিস্তারিত পড়ুন <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
