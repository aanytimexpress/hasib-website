import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Flame,
  ImageIcon,
  LayoutTemplate,
  NotebookPen,
  Sparkles
} from "lucide-react";
import { PostCard } from "../../components/public/PostCard";
import { GalleryItem, HomepageSection, Post } from "../../types/models";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../lib/date";
import { localizeStaticText, toBanglaNumber } from "../../lib/locale";

type CategoryStat = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

const FALLBACK_TITLE = "ব্যক্তিগত লেখালেখির ডায়েরি";
const FALLBACK_SUBTITLE =
  "আমি হাসিবুর রহমান। এখানে আমি আমার জীবনের গল্প, স্মৃতি, অনুভূতি এবং নীরব ভাবনাগুলো একত্রে রাখি।";
const FALLBACK_QUOTE = "জীবনের প্রতিটি স্মৃতি এক একটি অনন্য গল্প";
const PROFILE_IMAGE =
  "https://ui-avatars.com/api/?name=Hasibur+Rahman&background=f9dfd1&color=7a3c1f&size=320";
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
  const topicRow =
    categories.length > 0 ? categories.slice(0, 6).map((item) => item.name) : FALLBACK_TOPICS;

  const stats = [
    { label: "নির্বাচিত লেখা", value: toBanglaNumber(String(featuredPosts.length || 1).padStart(2, "0")) },
    { label: "বিষয়ভিত্তিক বিভাগ", value: toBanglaNumber(String(categories.length || 4).padStart(2, "0")) },
    { label: "সংরক্ষিত ফ্রেম", value: toBanglaNumber(String(galleryItems.length || 8).padStart(2, "0")) }
  ];

  const processCards = [
    {
      index: "০১",
      title: "জীবনের গল্প",
      text: "ব্যক্তিগত স্মৃতি, পথচলা আর নীরব অনুভূতির লেখাগুলো পরিচ্ছন্নভাবে এক জায়গায় সাজানো থাকবে।"
    },
    {
      index: "০২",
      title: "মুহূর্তের ফ্রেম",
      text: "ছবি, অ্যালবাম, ছোট নোট আর স্মৃতির ঝলক একসাথে একটি উষ্ণ অভিজ্ঞতা তৈরি করবে।"
    },
    {
      index: "০৩",
      title: "নিয়মিত আপডেট",
      text: "নতুন লেখা, পাঠকের প্রিয় পোস্ট আর নির্বাচিত অংশগুলো homepage-এ আলাদা করে ফুটে উঠবে।"
    }
  ];

  if (loading) {
    return (
      <div className="editorial-panel p-10 text-center">
        <p className="text-base text-slate-600">জার্নালের আবহ প্রস্তুত করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="editorial-panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-44 lg:block">
          <div className="float-soft absolute left-2 top-20 w-40 rounded-[28px] border border-white/70 bg-[rgba(255,248,242,0.82)] p-4 shadow-[0_20px_48px_rgba(95,61,39,0.08)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d67446]">
              খসড়া নোট
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              ছোট ছোট স্মৃতি, অনুক্ত অনুভূতি আর মনে থেকে যাওয়া দিনের রেশ।
            </p>
          </div>
          <div className="float-soft-delay absolute left-10 top-72 w-36 rounded-[26px] border border-white/60 bg-white/70 p-4 shadow-[0_18px_44px_rgba(95,61,39,0.08)]">
            <p className="text-xs text-slate-500">পাঠকের পছন্দ</p>
            <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-brand-900">
              {popularPosts[0]?.title || "সবচেয়ে বেশি পড়া লেখাগুলো এখান থেকে সহজে দেখা যাবে"}
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-44 lg:block">
          <div className="float-soft-delay absolute right-3 top-12 w-40 rounded-[28px] bg-[#ec7f56] p-4 text-white shadow-[0_22px_50px_rgba(214,116,70,0.28)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
              জার্নালের স্তর
            </p>
            <p className="mt-3 text-sm leading-6">লেখা, গ্যালারি, উদ্ধৃতি, প্রিয় জিনিস আর ব্যক্তিগত স্মৃতি</p>
          </div>
          <div className="float-soft absolute right-12 top-72 w-36 rounded-[26px] bg-[#1f2f4b] p-4 text-white shadow-[0_18px_48px_rgba(31,47,75,0.22)]">
            <p className="text-xs text-white/65">আজকের ফ্রেম</p>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6">
              {galleryItems[0]?.title || "নির্বাচিত ছবির জন্য আলাদা একটি উজ্জ্বল জায়গা"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="inline-flex rounded-full bg-[#fff4ee] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c55b2f]">
                {localizeStaticText("Hasibur Rahman")} জার্নাল
              </p>
              <h1 className="max-w-xl text-balance font-display text-4xl leading-[1.05] text-brand-900 md:text-[4.2rem]">
                {heroSection?.title || FALLBACK_TITLE}
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600 md:text-lg">
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
                <span
                  key={topic}
                  className="rounded-full border border-[#eadfd2] bg-white px-3 py-1.5 text-sm text-slate-600"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-[#eadfd2] bg-white px-4 py-4 shadow-sm"
                >
                  <p className="text-2xl font-semibold text-brand-900 md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="absolute -left-4 top-20 hidden rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_18px_44px_rgba(95,61,39,0.1)] md:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d67446]">
                লেখার বোর্ড
              </p>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-28 rounded-full bg-[#e9edf4]" />
                <div className="h-2 w-20 rounded-full bg-[#f2d3c0]" />
                <div className="h-2 w-24 rounded-full bg-[#e9edf4]" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-[#eadfd2] bg-[#fffdfa] p-4 shadow-[0_30px_90px_rgba(95,61,39,0.14)] md:p-5">
              <div className="rounded-[28px] border border-[#efe3d8] bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#fff4ee] px-3 py-1 font-semibold text-[#c55b2f]">
                    নির্বাচিত খসড়া
                  </span>
                  <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-slate-500">স্মৃতির আর্কাইভ</span>
                  <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-slate-500">গ্যালারির নোট</span>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-[#efe3d8] bg-[#fffbf7] p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={featured?.cover_image_url || PROFILE_IMAGE}
                        alt={featured?.title || "হাসিবুর রহমান"}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d67446]">
                          প্রধান লেখা
                        </p>
                        <h2 className="mt-1 font-display text-2xl leading-tight text-brand-900">
                          {featured?.title || "আমার গল্প, আমার সময়"}
                        </h2>
                      </div>
                    </div>
                    <p className="line-clamp-4 text-sm leading-7 text-slate-600">
                      {featured?.excerpt ||
                        "ব্যক্তিগত লেখা, স্মৃতি আর সময়ের টুকরোগুলোকে একটি নরম, পাঠযোগ্য, আর আবেগপূর্ণ আকারে এখানে তুলে ধরা হবে।"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[24px] bg-[#ec7f56] p-4 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                        সাজানো বিন্যাস
                      </p>
                      <p className="mt-3 text-lg font-semibold leading-7">
                        লেখা, ভাবনা, ছবি আর ব্যক্তিগত প্রিয় বিষয়গুলো একসাথে থাকবে
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-[#1f2f4b] p-4 text-white">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/65">
                        পাঠের আবহ
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-white/85">
                        <li>শান্ত বাংলা টাইপোগ্রাফি</li>
                        <li>মোলায়েম প্রিমিয়াম স্পেসিং</li>
                        <li>দৃশ্যমান ফিচার ব্লক</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {processCards.map((item) => (
                    <div key={item.index} className="rounded-[22px] border border-[#efe3d8] bg-[#fffbf7] p-4">
                      <p className="text-sm font-semibold text-[#d67446]">{item.index}</p>
                      <h3 className="mt-2 font-semibold text-brand-900">{item.title}</h3>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#efe3d8] pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500 md:text-base">
            {topicRow.map((item) => (
              <span key={item} className="font-medium">
                {item}
              </span>
            ))}
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
                    নির্বাচিত লেখা
                  </p>
                  <h2 className="font-display text-3xl leading-tight text-brand-900">{featured.title}</h2>
                  <p className="text-sm text-slate-500">
                    {formatDate(featured.published_at || featured.created_at)}
                  </p>
                  {featured.excerpt ? (
                    <p className="line-clamp-4 text-sm leading-7 text-slate-600">{featured.excerpt}</p>
                  ) : null}
                </div>

                <Link to={`/blog/${featured.slug}`} className="soft-button w-fit gap-2">
                  পুরো লেখা পড়ুন <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="editorial-panel p-8 text-center text-slate-600">
            ড্যাশবোর্ড থেকে একটি নির্বাচিত লেখা যুক্ত করলে এখানে বড় আকারে তা দেখানো হবে।
          </div>
        )}

        <aside className="editorial-panel p-5 md:p-6">
          <p className="inline-flex rounded-full bg-[#fff4ee] px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c55b2f]">
            জার্নালের ছন্দ
          </p>
          <h3 className="mt-4 font-display text-4xl leading-tight text-brand-900">
            এই ওয়েবসাইট
            <span className="text-[#d67446]"> কীভাবে সাজানো</span>
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            এখানে প্রতিটি অংশ এমনভাবে বিন্যস্ত, যাতে লেখাগুলো শুধু তালিকা আকারে না থেকে একটি আবেগপূর্ণ,
            উষ্ণ এবং পড়তে ভালো লাগা অভিজ্ঞতা তৈরি করে।
          </p>

          <div className="mt-6 space-y-3">
            {processCards.map((item) => (
              <div key={item.index} className="rounded-[24px] border border-[#eadfd2] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ec7f56] text-sm font-semibold text-white">
                    {item.index}
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-900">{item.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_0.8fr]">
        <div className="space-y-4">
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
        </div>

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
                <p className="mt-2 text-xs text-slate-500">
                  {toBanglaNumber(post.view_count || 0)} বার পড়া হয়েছে
                </p>
              </Link>
            ))}
          </div>
        </aside>
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
                className={`group relative overflow-hidden rounded-[26px] ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
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
          <div className="bg-[#1f2f4b] px-6 py-8 text-white md:px-8 md:py-10">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              ডায়েরির আবহ
            </p>
            <h3 className="mt-4 font-display text-4xl leading-tight">
              স্মৃতি, লেখা আর নীরব অনুভূতির জন্য একটি উষ্ণ, মোলায়েম ঠিকানা
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/74">
              এই homepage শুধু কনটেন্টের তালিকা নয়, বরং এমন একটি অভিজ্ঞতা যেখানে পাঠক এসে কিছুক্ষণ থামতে
              চাইবে, পড়বে, আর নিজের মতো করে অনুভব করবে।
            </p>
          </div>
          <div className="bg-[linear-gradient(135deg,#f9e6d8,#fff9f4)] px-6 py-8 md:px-8 md:py-10">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="mt-1 text-[#d67446]" />
              <p className="font-display text-3xl leading-[1.6] text-brand-900">
                {quoteSection?.content || FALLBACK_QUOTE}
              </p>
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
