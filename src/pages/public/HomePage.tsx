import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { PostCard } from "../../components/public/PostCard";
import { GalleryItem, HomepageSection, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/date";

type CategoryStat = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

const FALLBACK_TITLE = "ব্যক্তিগত লেখালেখির ডায়েরি";
const FALLBACK_SUBTITLE =
  "আমি হাসিবুর রহমান। এখানে আমি আমার জীবনের গল্প, স্মৃতি, অনুভূতি এবং চিন্তাগুলো শেয়ার করি।";
const FALLBACK_QUOTE = "জীবনের প্রতিটি স্মৃতি এক একটি অনন্য গল্প";
const PROFILE_IMAGE =
  "https://ui-avatars.com/api/?name=Hasibur+Rahman&background=e2ecff&color=274c8a&size=300";

export default function HomePage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [
        { data: sectionData },
        { data: featuredData },
        { data: recentData },
        { data: popularData },
        { data: galleryData },
        { data: categoriesData },
        { data: postCategoryData }
      ] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("enabled", true).order("sort_order"),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .eq("featured", true)
          .order("published_at", { ascending: false })
          .limit(4),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(10),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .order("view_count", { ascending: false })
          .limit(6),
        supabase.from("gallery").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("categories").select("id, name, slug").order("name"),
        supabase.from("posts").select("category_id").eq("status", "published")
      ]);

      const counts = ((postCategoryData ?? []) as Array<{ category_id: string | null }>).reduce<
        Record<string, number>
      >((acc, item) => {
        if (!item.category_id) return acc;
        acc[item.category_id] = (acc[item.category_id] ?? 0) + 1;
        return acc;
      }, {});

      const categoryStats = ((categoriesData ?? []) as Array<{ id: string; name: string; slug: string }>).map(
        (item) => ({
          ...item,
          count: counts[item.id] ?? 0
        })
      );

      setSections((sectionData as HomepageSection[]) ?? []);
      setFeaturedPosts((featuredData as Post[]) ?? []);
      setRecentPosts((recentData as Post[]) ?? []);
      setPopularPosts((popularData as Post[]) ?? []);
      setGalleryItems((galleryData as GalleryItem[]) ?? []);
      setCategories(categoryStats);
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

  const featured = featuredPosts[0] || recentPosts[0] || null;
  const recentList = featured ? recentPosts.filter((item) => item.id !== featured.id) : recentPosts;

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-10 text-center shadow-panel backdrop-blur-xl">
        <p className="text-base text-slate-600">জার্নাল লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="rounded-[36px] border border-white/70 bg-gradient-to-br from-white/85 via-sky-50/80 to-blue-100/70 p-7 shadow-[0_24px_70px_rgba(53,88,144,0.18)] backdrop-blur-xl md:p-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <img
            src={PROFILE_IMAGE}
            alt="Hasibur Rahman"
            loading="lazy"
            className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg md:h-32 md:w-32"
          />
          <p className="rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            Hasibur Rahman Journal
          </p>
          <h1 className="text-balance text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
            {heroSection?.title || FALLBACK_TITLE}
          </h1>
          <p className="max-w-3xl text-lg leading-9 text-slate-700 md:text-xl">
            {heroSection?.content || FALLBACK_SUBTITLE}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-base font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-lg"
          >
            আমার লেখা পড়ুন <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {featured ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900 md:text-3xl">
              <Sparkles size={24} className="text-brand-700" />
              Featured Post
            </h2>
            <Link to="/blog" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              সব লেখা
            </Link>
          </div>

          <article className="group overflow-hidden rounded-[30px] border border-white/70 bg-white/75 shadow-[0_20px_55px_rgba(29,64,121,0.16)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(29,64,121,0.2)]">
            <div className="grid lg:grid-cols-[1.25fr_1fr]">
              <div className="overflow-hidden">
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    loading="lazy"
                    className="h-full min-h-[300px] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full min-h-[300px] w-full bg-gradient-to-br from-brand-200 via-sky-100 to-cyan-100" />
                )}
              </div>

              <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
                <div className="space-y-3">
                  <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                    স্মৃতির খাতা
                  </p>
                  <h3 className="text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                    {featured.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatDate(featured.published_at || featured.created_at)}
                  </p>
                  {featured.excerpt ? (
                    <p className="line-clamp-4 text-base leading-8 text-slate-700">{featured.excerpt}</p>
                  ) : null}
                </div>

                <Link
                  to={`/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-base font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  বিস্তারিত পড়ুন <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">সাম্প্রতিক লেখা</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recentList.slice(0, 9).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="rounded-[26px] border border-white/70 bg-white/72 p-5 shadow-[0_16px_40px_rgba(33,74,141,0.13)] backdrop-blur-xl">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Flame size={20} className="text-orange-500" />
            জনপ্রিয় লেখা
          </h3>

          <div className="space-y-3">
            {popularPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-slate-200/80 bg-white/80 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <p className="mb-1 text-xs font-semibold text-slate-400">#{String(index + 1).padStart(2, "0")}</p>
                <p className="line-clamp-2 font-medium leading-7 text-slate-800 group-hover:text-brand-700">
                  {post.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{post.view_count} বার পড়া হয়েছে</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/72 p-6 shadow-[0_14px_34px_rgba(29,64,121,0.12)] backdrop-blur-xl md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">বিভাগসমূহ</h2>
          <Link to="/blog" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            ক্যাটাগরি অনুযায়ী দেখুন
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/blog?category=${category.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white"
            >
              <span>{category.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 group-hover:bg-white/20">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_16px_38px_rgba(29,64,121,0.14)] backdrop-blur-xl md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">গ্যালারি প্রিভিউ</h2>
          <Link to="/gallery" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            সব ছবি দেখুন
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galleryItems.slice(0, 8).map((item) => (
            <Link key={item.id} to="/gallery" className="group relative overflow-hidden rounded-2xl">
              <img
                src={item.thumbnail_url || item.image_url}
                alt={item.title}
                loading="lazy"
                className="h-36 w-full object-cover transition duration-500 group-hover:scale-110 md:h-44"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <p className="absolute bottom-2 left-3 right-3 translate-y-2 text-xs text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-gradient-to-r from-brand-700/95 via-brand-600/90 to-cyan-600/90 p-7 text-center text-white shadow-[0_20px_50px_rgba(26,71,140,0.22)] md:p-9">
        <p className="mx-auto max-w-3xl text-2xl font-medium italic leading-[1.9] md:text-3xl">
          {quoteSection?.content || FALLBACK_QUOTE}
        </p>
      </section>
    </div>
  );
}
