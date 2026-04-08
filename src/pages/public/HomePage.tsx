import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FeaturedSlider } from "../../components/public/FeaturedSlider";
import { PostCard } from "../../components/public/PostCard";
import { Favorite, GalleryItem, HomepageSection, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";

const fallbackIntro =
  "আমি হাসিবুর রহমান। এটি আমার ব্যক্তিগত লেখার জার্নাল যেখানে আমি আমার জীবনের গল্প স্মৃতি চিন্তা অনুভূতি এবং প্রিয় বিষয়গুলো শেয়ার করি।";

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [
        { data: sectionData },
        { data: featuredData },
        { data: recentData },
        { data: popularData },
        { data: favoriteData },
        { data: galleryData }
      ] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("enabled", true).order("sort_order"),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .eq("featured", true)
          .order("published_at", { ascending: false })
          .limit(6),
        supabase.from("posts").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(6),
        supabase.from("posts").select("*").eq("status", "published").order("view_count", { ascending: false }).limit(5),
        supabase.from("favorites").select("*").order("sort_order", { ascending: true }).limit(8),
        supabase.from("gallery").select("*").order("created_at", { ascending: false }).limit(6)
      ]);

      setSections((sectionData as HomepageSection[]) ?? []);
      setFeaturedPosts((featuredData as Post[]) ?? []);
      setRecentPosts((recentData as Post[]) ?? []);
      setPopularPosts((popularData as Post[]) ?? []);
      setFavorites((favoriteData as Favorite[]) ?? []);
      setGalleryItems((galleryData as GalleryItem[]) ?? []);
      setLoading(false);
    };

    void load();
  }, []);

  const heroSection = useMemo(
    () => sections.find((item) => item.section_key === "hero_intro"),
    [sections]
  );
  const quoteSection = useMemo(
    () => sections.find((item) => item.section_key === "quote_block"),
    [sections]
  );

  if (loading) {
    return <p className="rounded-xl bg-white p-8 text-center text-slate-600">Loading homepage...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-brand-200 bg-white p-6 shadow-panel md:p-10">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-700">Hasibur Rahman Journal</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            {heroSection?.title || "ব্যক্তিগত লেখালেখির ডায়রি"}
          </h1>
          <p className="max-w-4xl text-lg leading-8 text-slate-700">{heroSection?.content || fallbackIntro}</p>
        </div>
      </section>

      {featuredPosts.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">ফিচার্ড পোস্ট</h2>
            <Link to="/blog" className="text-sm font-semibold text-brand-700">
              সব পোস্ট দেখুন
            </Link>
          </div>
          <FeaturedSlider posts={featuredPosts} />
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">সাম্প্রতিক লেখা</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">জনপ্রিয় পোস্ট</h3>
          <div className="space-y-3">
            {popularPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="block rounded-lg border border-slate-200 p-3 hover:border-brand-300">
                <p className="line-clamp-2 font-medium text-slate-800">{post.title}</p>
                <p className="mt-1 text-xs text-slate-500">{post.view_count} views</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">পছন্দের তালিকা</h2>
            <Link to="/favorites" className="text-sm font-semibold text-brand-700">
              আরো দেখুন
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {favorites.slice(0, 8).map((item) => (
              <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {item.title}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">গ্যালারি প্রিভিউ</h2>
            <Link to="/gallery" className="text-sm font-semibold text-brand-700">
              সব ছবি দেখুন
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {galleryItems.slice(0, 6).map((item) => (
              <img
                key={item.id}
                src={item.thumbnail_url || item.image_url}
                alt={item.title}
                loading="lazy"
                className="h-24 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-sky-50 to-teal-50 p-6">
        <p className="text-xl italic leading-9 text-slate-800">
          {quoteSection?.content || "জীবনের প্রতিটি স্মৃতি এক একটি অমূল্য গল্প।"}
        </p>
      </section>
    </div>
  );
}
