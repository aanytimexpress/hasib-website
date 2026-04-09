import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Flame, ImageIcon, LayoutTemplate, NotebookPen, Sparkles } from "lucide-react";
import { PostCard } from "../../components/public/PostCard";
import { GalleryItem, HomepageSection, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/date";
import { toBanglaNumber } from "../../lib/locale";

type CategoryStat = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

const FALLBACK_TITLE = "ব্যক্তিগত লেখালেখির ডায়েরি";
const FALLBACK_SUBTITLE =
  "আমি হাসিবুর রহমান। এখানে আমি আমার জীবনের গল্প, স্মৃতি, অনুভূতি এবং নীরব ভাবনাগুলো যত্ন করে শেয়ার করি।";
const FALLBACK_QUOTE = "জীবনের প্রতিটি স্মৃতি এক একটি অনন্য গল্প";
const FALLBACK_TOPICS = ["জীবনের গল্প", "স্মৃতি", "অনুভূতি", "ডায়েরি", "ভ্রমণ", "চিন্তা"];

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
  const topicRow = categories.length > 0 ? categories.slice(0, 6).map((item) => item.name) : FALLBACK_TOPICS;

  const stats = [
    { label: "নির্বাচিত লেখা", value: toBanglaNumber(String(featuredPosts.length || 1).padStart(2, "0")) },
    { label: "বিভাগসমূহ", value: toBanglaNumber(String(categories.length || 4).padStart(2, "0")) },
    { label: "সংরক্ষিত ফ্রেম", value: toBanglaNumber(String(galleryItems.length || 8).padStart(2, "0")) }
  ];

  if (loading) {
    return (
      <div className="editorial-panel p-10 text-center">
        <p className="text-base text-slate-600">হোমপেজ প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="editorial-panel overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div className="space-y-7">
            <div className="space-y-4">
              <p className="inline-flex rounded-full bg-[#fff4ee] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c55b2f]">
                হাসিবুর রহমান জার্নাল
              </p>
              <h1 className="max-w-3xl text-balance font-display text-4xl leading-[1.08] text-brand-900 md:text-[4.6rem]">
                {heroSection?.title || FALLBACK_TITLE}
              </h1>
              <p className="max-w-2xl text-base leading-9 text-slate-600 md:text-[1.1rem]">
                {heroSection?.content || FALLBACK_SUBTITLE}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/blog" className="soft-button gap-2">
                আমার লেখা পড়ুন <ArrowRight size={17} />
              </Link>
              <Link to="/about" className="ghost-button">
                আমার পরিচয়
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {topicRow.map((topic) => (
                <span key={topic} className="rounded-full border border-[#eadfd2] bg-white px-4 py-2 text-sm text-slate-600">
                  {topic}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[26px] border border-[#eadfd2] bg-white px-5 py-5 shadow-sm">
                  <p className="text-3xl font-semibold text-brand-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] border border-[#eadfd2] bg-white p-5 shadow-[0_18px_50px_rgba(95,61,39,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f6d6c2,#fff2e9)] text-2xl font-semibold text-[#9d4d28]">
                  হা
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#c55b2f]">লেখকের খাতা</p>
                  <h2 className="font-display text-2xl text-brand-900">হাসিবুর রহমান</h2>
                  <p className="text-sm text-slate-500">বগুড়া, বাংলাদেশ</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-8 text-slate-600">
                এই জার্নালে ব্যক্তিগত স্মৃতি, নীরব অনুভূতি, প্রিয় বিষয় এবং সময়ের টুকরোগুলো একত্রে রাখা আছে।
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[32px] border border-[#eadfd2] bg-[linear-gradient(180deg,#fffdf9,#fff7f0)] p-5 shadow-sm">
                <p className="inline-flex rounded-full bg-[#fff4ee] px-3 py-1 text-xs font-semibold text-[#c55b2f]">
                  নির্বাচিত লেখা
                </p>
                <h3 className="mt-4 font-display text-3xl leading-tight text-brand-900">
                  {featured?.title || "আমার গল্প, আমার সময়"}
                </h3>
                <p className="mt-3 text-sm leading-8 text-slate-600">
                  {featured?.excerpt ||
                    "ব্যক্তিগত লেখা, স্মৃতি আর সময়ের টুকরোগুলোকে একটি নরম, পাঠযোগ্য এবং আবেগপূর্ণ আকারে এখানে তুলে ধরা হয়।"}
                </p>
                <div className="mt-5">
                  <Link to={featured ? `/blog/${featured.slug}` : "/blog"} className="ghost-button gap-2">
                    বিস্তারিত পড়ুন <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] bg-[#ec7f56] p-5 text-white shadow-[0_18px_44px_rgba(214,116,70,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">জার্নালের বিন্যাস</p>
                  <p className="mt-3 text-lg font-semibold leading-8">
                    লেখা, ভাবনা, ছবি আর ব্যক্তিগত প্রিয় বিষয়গুলো একসাথে থাকবে
                  </p>
                </div>
                <div className="rounded-[28px] bg-[#243a61] p-5 text-white shadow-[0_18px_44px_rgba(36,58,97,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">পাঠের আবহ</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-white/84">
                    <li>শান্ত বাংলা টাইপোগ্রাফি</li>
                    <li>পরিচ্ছন্ন শ্বাস নেওয়া মতো স্পেসিং</li>
                    <li>কম clutter, বেশি focus</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.28fr_0.72fr]">
        {featured ? (
          <article className="editorial-panel overflow-hidden p-4 md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
              <div className="overflow-hidden rounded-[30px]">
                {featured.cover_image_url ? (
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    loading="lazy"
                    className="h-full min-h-[360px] w-full object-cover"
                  />
                ) : (
                  <div className="h-full min-h-[360px] w-full bg-[linear-gradient(135deg,#f7e6d7,#fff9f3_42%,#e9eef7)]" />
                )}
              </div>

              <div className="flex flex-col justify-between gap-5 rounded-[30px] bg-white p-6">
                <div className="space-y-4">
                  <p className="inline-flex rounded-full bg-[#fff4ee] px-3 py-1 text-xs font-semibold text-[#c55b2f]">
                    প্রধান ফিচার
                  </p>
                  <h2 className="font-display text-3xl leading-tight text-brand-900">{featured.title}</h2>
                  <p className="text-sm text-slate-500">{formatDate(featured.published_at || featured.created_at)}</p>
                  {featured.excerpt ? <p className="line-clamp-4 text-sm leading-7 text-slate-600">{featured.excerpt}</p> : null}
                </div>

                <Link to={`/blog/${featured.slug}`} className="soft-button w-fit gap-2">
                  পুরো লেখা পড়ুন <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="editorial-panel p-8 text-center text-slate-600">
            ড্যাশবোর্ড থেকে একটি ফিচার পোস্ট যুক্ত করলে এখানে তা বড় আকারে দেখানো হবে।
          </div>
        )}

        <aside className="editorial-panel p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4ee]">
              <Flame size={18} className="text-[#d67446]" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c55b2f]">সবচেয়ে বেশি পড়া</p>
              <h3 className="font-display text-3xl text-brand-900">জনপ্রিয় লেখা</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {popularPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group block rounded-[24px] border border-[#eadfd2] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d67446]">
                  ক্রম {toBanglaNumber(String(index + 1).padStart(2, "0"))}
                </p>
                <p className="mt-2 line-clamp-2 font-semibold leading-7 text-brand-900 group-hover:text-[#a44b21]">
                  {post.title}
                </p>
                <p className="mt-2 text-xs text-slate-500">{toBanglaNumber(post.view_count || 0)} বার পড়া হয়েছে</p>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <NotebookPen size={20} className="text-[#d67446]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c55b2f]">সাম্প্রতিক</p>
            <h2 className="font-display text-4xl text-brand-900">নতুন লেখা</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recentList.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="editorial-panel p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
              <LayoutTemplate size={18} className="text-[#d67446]" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c55b2f]">বিষয়ভাগ</p>
              <h3 className="font-display text-3xl text-brand-900">বিভাগসমূহ</h3>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/blog?category=${category.slug}`}
                className="rounded-full border border-[#eadfd2] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#efc6b1] hover:bg-[#fff4ee] hover:text-[#a44b21]"
              >
                {category.name} <span className="text-slate-400">({toBanglaNumber(category.count)})</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="editorial-panel p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ImageIcon size={18} className="text-[#d67446]" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c55b2f]">দৃশ্যের ঝলক</p>
                <h3 className="font-display text-3xl text-brand-900">গ্যালারি প্রিভিউ</h3>
              </div>
            </div>
            <Link to="/gallery" className="ghost-button">
              সব ছবি
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {galleryItems.slice(0, 8).map((item, index) => (
              <Link
                key={item.id}
                to="/gallery"
                className={`group relative overflow-hidden rounded-[26px] ${index === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
              >
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.title}
                  loading="lazy"
                  className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                    index === 0 ? "h-[260px] md:h-full" : "h-32 md:h-40"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <p className="absolute bottom-3 left-3 right-3 translate-y-2 text-xs text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-panel overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-[#243a61] px-6 py-8 text-white md:px-8 md:py-10">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              ডায়েরির আবহ
            </p>
            <h3 className="mt-4 font-display text-4xl leading-tight">স্মৃতি, লেখা আর নীরব অনুভূতির জন্য একটি উষ্ণ, পরিষ্কার ঠিকানা</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/74">
              এই homepage-এ এখন focus রাখা হয়েছে readability, warm editorial mood আর clean composition-এর ওপর।
            </p>
          </div>
          <div className="bg-[linear-gradient(135deg,#f9e6d8,#fff9f4)] px-6 py-8 md:px-8 md:py-10">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-1 text-[#d67446]" />
              <p className="font-display text-3xl leading-[1.6] text-brand-900">{quoteSection?.content || FALLBACK_QUOTE}</p>
            </div>
            <div className="mt-5">
              <Link to="/about" className="soft-button gap-2">
                আমার গল্প পড়ুন <BookOpenText size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
