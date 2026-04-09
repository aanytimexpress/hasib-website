import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Post } from "../../types/models";
import { toBanglaNumber } from "../../lib/locale";

interface FeaturedSliderProps {
  posts: Post[];
}

export function FeaturedSlider({ posts }: FeaturedSliderProps) {
  if (!posts.length) return null;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {posts.map((post, index) => (
          <Link
            to={`/blog/${post.slug}`}
            key={post.id}
            className="group relative h-[22rem] w-[320px] overflow-hidden rounded-[30px] border border-white/30 bg-slate-900 shadow-[0_24px_52px_rgba(18,34,57,0.22)]"
          >
            {post.cover_image_url ? (
              <img
                src={post.cover_image_url}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-800 via-brand-700 to-accent-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
            <div className="absolute bottom-0 space-y-3 p-5">
              <p className="inline-flex rounded-full bg-white/18 px-3 py-1 text-xs text-white backdrop-blur">
                আলোচিত লেখা {toBanglaNumber(String(index + 1).padStart(2, "0"))}
              </p>
              <h3 className="font-display line-clamp-2 text-2xl leading-tight text-white">{post.title}</h3>
              {post.excerpt ? <p className="line-clamp-2 text-sm leading-7 text-white/82">{post.excerpt}</p> : null}
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                পড়া শুরু করুন
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
