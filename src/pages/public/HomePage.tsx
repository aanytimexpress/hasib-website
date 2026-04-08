import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookHeart, Camera, Sparkles } from "lucide-react";
import { FeaturedSlider } from "../../components/public/FeaturedSlider";
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

const fallbackTitle = "হৃদয়ের ভাঁজে রাখা বাংলা দিনলিপি";
const fallbackSubtitle =
  "এখানে ধরা থাকে জীবন থেকে তুলে আনা ছোট ছোট গল্প, কিছু দীর্ঘশ্বাস, কিছু আলো, কিছু স্নেহমাখা স্মৃতি।";
const fallbackQuote = "প্রতিটি স্মৃতি আসলে আমাদের জীবনের গোপন ভাষায় লেখা একটি চিঠি।";
const profileImage =
  "https://ui-avatars.com/api/?name=Hasibur+Rahman&background=e2ecff&color=274c8a&size=280";

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
          .limit(9),
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

      const counts = ((postCategoryData ?? []) as Array<{ category_id: string | null }>).reduce<Record<string, number>>(
        (acc, item) => {
          if (!item.category_id) return acc;
          acc[item.category_id] = (acc[item.category_id] ?? 0) + 1;
          return acc;
        },
        {}
      );

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

  const heroSection = useMemo(() => sections.find((item) => item.section_key === "hero_intro"), [sections]);
  const quoteSection = useMemo(() => sections.find((item) => item.section_key === "quote_block"), [sections]);

  const featured = featuredPosts[0] || recentPosts[0] || null;
  const recentList = featured ? recentPosts.filter((item) => item.id !== featured.id) : recentPosts;

  if (loading) {
    return (
      <div className="section-card text-center">
        <p className="text-base text-slate-600">পৃষ্ঠা সাজানো হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-hero overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(240,244,249,0.82),rgba(249,239,231,0.95))]">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="section-kicker">বাংলা ব্যক্তিগত জার্নাল</p>
            <h1 className="section-title max-w-3xl text-balance">{heroSection?.title || fallbackTitle}</h1>
            <p className="max-w-2xl text-lg leading-9 text-slate-700">{heroSection?.content || fallbackSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/blog" className="soft-button gap-2">
                লেখার ঘরে ঢুকুন
                <ArrowRight size={16} />
              </Link>
              <Link to="/gallery" className="ghost-button gap-2">
                ছবি দেখুন
                <Camera size={16} />
              </Link>
            </div>
          </div>

          <div className="relative rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-paper">
            <div className="flex items-center gap-4">
              <img
                src={profileImage}
                alt="Hasibur Rahman"
                loading="lazy"
                className="h-24 w-24 rounded-[28px] object-cover shadow-md"
              />
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">লেখকের ডেস্ক</p>
                <h2 className="font-display text-3xl text-brand-900">হাসিব</h2>
                <p className="text-sm leading-7 text-slate-600">
                  গল্প, পর্যবেক্ষণ, স্মৃতি আর নরম আলোয় সাজানো কিছু ব্যক্তিগত পাতা।
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] bg-brand-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-700">লেখা</p>
                <p className="mt-2 font-display text-3xl text-brand-900">{recentPosts.length}</p>
              </div>
              <div className="rounded-[24px] bg-white px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-700">ক্যাটাগরি</p>
                <p className="mt-2 font-display text-3xl text-brand-900">{categories.length}</p>
              </div>
              <div className="rounded-[24px] bg-accent-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-700">গ্যালারি</p>
                <p className="mt-2 font-display text-3xl text-brand-900">{galleryItems.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredPosts.length ? (
        <section className="section-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">আলোচনায়</p>
              <h2 className="section-title mt-3 text-3xl md:text-[2.4rem]">নির্বাচিত কিছু লেখা</h2>
            </div>
            <Link to="/blog" className="ghost-button gap-2">
              সব লেখা
              <ArrowRight size={16} />
            </Link>
          </div>
          <FeaturedSlider posts={featuredPosts.slice(0, 4)} />
        </section>
      ) : null}

      {featured ? (
        <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <article className="section-card overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.95fr]">
              <div className="overflow-hidden">
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    loading="lazy"
                    className="h-full min-h-[320px] w-full object-cover transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="h-full min-h-[320px] w-full bg-hero-grid" />
                )}
              </div>
              <div className="flex flex-col justify-between gap-5 p-6 md:p-8">
                <div className="space-y-4">
                  <p className="section-kicker">আজকের প্রধান লেখা</p>
                  <h2 className="font-display text-3xl leading-tight text-brand-900 md:text-4xl">{featured.title}</h2>
                  <p className="text-sm text-slate-500">{formatDate(featured.published_at || featured.created_at)}</p>
                  {featured.excerpt ? <p className="text-base leading-8 text-slate-700">{featured.excerpt}</p> : null}
                </div>
                <Link to={`/blog/${featured.slug}`} className="soft-button w-fit gap-2">
                  পুরো লেখা পড়ুন
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>

          <aside className="section-card space-y-4">
            <div>
              <p className="section-kicker">সবচেয়ে পঠিত</p>
              <h2 className="mt-3 font-display text-3xl text-brand-900">জনপ্রিয় পোস্ট</h2>
            </div>
            <div className="space-y-3">
              {popularPosts.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group block rounded-[24px] border border-brand-100 bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-sm"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-600">
                    #{String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="line-clamp-2 text-lg font-semibold leading-8 text-slate-800 group-hover:text-brand-700">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{post.view_count} বার পড়া হয়েছে</p>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[2.1fr_1fr]">
        <div className="space-y-4">
          <div>
            <p className="section-kicker">সাম্প্রতিক</p>
            <h2 className="mt-3 font-display text-4xl text-brand-900">নতুন লেখা</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recentList.slice(0, 9).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="section-card space-y-5">
          <div>
            <p className="section-kicker">সূচিপত্র</p>
            <h2 className="mt-3 font-display text-3xl text-brand-900">বিভাগগুলো</h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/blog?category=${category.slug}`}
                className="group inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-accent-300 hover:bg-brand-700 hover:text-white"
              >
                <span>{category.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 group-hover:bg-white/20 group-hover:text-white">
                  {category.count}
                </span>
              </Link>
            ))}
          </div>
          <div className="rounded-[26px] bg-brand-900 px-5 py-6 text-white">
            <BookHeart className="mb-3" size={20} />
            <h3 className="font-display text-2xl">প্রিয় জিনিসের তালিকা</h3>
            <p className="mt-2 text-sm leading-7 text-white/80">
              লেখার বাইরে যেসব বই, খাবার, জায়গা বা ছোট ভালো লাগা আমাকে ছুঁয়ে যায়, সেগুলোও আলাদা করে রাখা আছে।
            </p>
            <Link to="/favorites" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
              তালিকাটি দেখুন
              <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="section-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">দৃশ্যের ভাঁজে</p>
            <h2 className="mt-3 font-display text-4xl text-brand-900">গ্যালারি প্রিভিউ</h2>
          </div>
          <Link to="/gallery" className="ghost-button gap-2">
            পুরো গ্যালারি
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galleryItems.slice(0, 8).map((item) => (
            <Link key={item.id} to="/gallery" className="group relative overflow-hidden rounded-[24px]">
              <img
                src={item.thumbnail_url || item.image_url}
                alt={item.title}
                loading="lazy"
                className="h-40 w-full object-cover transition duration-500 group-hover:scale-110 md:h-48"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <p className="absolute bottom-3 left-3 right-3 translate-y-2 text-xs text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,rgba(25,59,112,0.96),rgba(48,87,146,0.94),rgba(171,87,40,0.86))] px-6 py-8 text-white shadow-[0_20px_50px_rgba(26,71,140,0.22)] md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl text-center">
          <Sparkles className="mx-auto mb-4" size={22} />
          <p className="font-display text-3xl leading-[1.8] md:text-[2.5rem]">
            {quoteSection?.content || fallbackQuote}
          </p>
        </div>
      </section>
    </div>
  );
}
