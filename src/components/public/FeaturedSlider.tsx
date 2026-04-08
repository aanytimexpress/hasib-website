import { Link } from "react-router-dom";
import { Post } from "../../types/models";

interface FeaturedSliderProps {
  posts: Post[];
}

export function FeaturedSlider({ posts }: FeaturedSliderProps) {
  if (!posts.length) return null;

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {posts.map((post) => (
          <Link
            to={`/blog/${post.slug}`}
            key={post.id}
            className="group relative h-64 w-[290px] overflow-hidden rounded-2xl bg-slate-900"
          >
            {post.cover_image_url ? (
              <img
                src={post.cover_image_url}
                alt={post.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-800 to-cyan-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="absolute bottom-0 p-4">
              <p className="mb-2 inline-flex rounded-full bg-white/20 px-2 py-1 text-xs text-white backdrop-blur">
                Featured
              </p>
              <h3 className="line-clamp-2 text-lg font-semibold text-white">{post.title}</h3>
              {post.excerpt ? <p className="line-clamp-2 text-sm text-white/80">{post.excerpt}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
