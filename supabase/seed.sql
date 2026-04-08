begin;

with admin_allowlist(email) as (
  values
    ('aanytime.xpress@gmail.com'),
    ('alshakib730@gmail.com')
),
super_admin_role as (
  select id from public.roles where name = 'super_admin' limit 1
)
insert into public.users (auth_user_id, email, full_name, location, language, bio, role_id)
select
  au.id,
  au.email,
  'Hasibur Rahman',
  'Bogura, Bangladesh',
  array['Bangla', 'English'],
  'Personal writer and storyteller.',
  sar.id
from auth.users au
join admin_allowlist aa on lower(au.email) = aa.email
cross join super_admin_role sar
on conflict (auth_user_id)
do update set
  full_name = excluded.full_name,
  location = excluded.location,
  language = excluded.language,
  role_id = excluded.role_id;

insert into public.categories (name, slug, description)
values
  ('জীবন', 'jibon', 'ব্যক্তিগত জীবন অভিজ্ঞতা'),
  ('স্মৃতি', 'smriti', 'পুরোনো দিন ও স্মৃতিচারণ'),
  ('চিন্তা', 'chinta', 'ভাবনা, বিশ্লেষণ ও মতামত'),
  ('ভ্রমণ', 'vromon', 'ঘোরাঘুরি ও স্থান অভিজ্ঞতা')
on conflict (slug) do nothing;

insert into public.tags (name, slug)
values
  ('বাংলা', 'bangla'),
  ('লেখালেখি', 'lekhalekhi'),
  ('জার্নাল', 'journal'),
  ('অনুভূতি', 'onubhuti')
on conflict (slug) do nothing;

insert into public.pages (slug, title, content, json_content)
values
  (
    'about',
    'আমার সম্পর্কে',
    '<p>আমি হাসিবুর রহমান। আমি লেখালেখি ভালোবাসি। ব্যক্তিগত জীবনের গল্প, অনুভূতি, স্মৃতি এবং পছন্দের বিষয় নিয়ে লিখি।</p>',
    jsonb_build_object(
      'education',
      jsonb_build_array(
        'Bogura Cantonment Public School and College',
        'Government Azizul Haque College'
      )
    )
  ),
  (
    'favorites',
    'আমার পছন্দ',
    '<p>এই পেইজে আমার পছন্দের বিষয়গুলো শ্রেণিভিত্তিকভাবে সাজানো আছে।</p>',
    '{}'::jsonb
  ),
  (
    'timeline',
    'জীবনের টাইমলাইন',
    '<p>জীবনের উল্লেখযোগ্য ঘটনা এবং সময়ভিত্তিক স্মৃতির ধারাবাহিকতা।</p>',
    '{}'::jsonb
  ),
  (
    'contact',
    'যোগাযোগ',
    '<p>আমার সাথে যোগাযোগ করতে চাইলে নিচের ফর্ম ব্যবহার করুন।</p>',
    '{}'::jsonb
  )
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  json_content = excluded.json_content;

insert into public.homepage_sections (section_key, title, content, enabled, sort_order, json_content)
values
  (
    'hero_intro',
    'ব্যক্তিগত লেখার জার্নাল',
    'আমি হাসিবুর রহমান। এটি আমার ব্যক্তিগত লেখার জার্নাল যেখানে আমি আমার জীবনের গল্প স্মৃতি চিন্তা অনুভূতি এবং প্রিয় বিষয়গুলো শেয়ার করি।',
    true,
    1,
    '{}'::jsonb
  ),
  (
    'featured_posts',
    'ফিচার্ড পোস্ট',
    'নির্বাচিত পোস্টসমূহ',
    true,
    2,
    '{}'::jsonb
  ),
  (
    'favorites_preview',
    'পছন্দের তালিকা',
    'আমার পছন্দের কিছু বাছাইকৃত বিষয়',
    true,
    3,
    '{}'::jsonb
  ),
  (
    'gallery_preview',
    'গ্যালারি প্রিভিউ',
    'স্মৃতির ছবি',
    true,
    4,
    '{}'::jsonb
  ),
  (
    'quote_block',
    'Quote',
    'জীবনের প্রতিটি স্মৃতি এক একটি অমূল্য গল্প।',
    true,
    5,
    '{}'::jsonb
  )
on conflict (section_key) do update set
  title = excluded.title,
  content = excluded.content,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

insert into public.site_settings (key, value, description)
values
  ('site_title', 'Hasibur Rahman', 'Website title'),
  ('site_tagline', 'Personal Bengali Publishing Journal', 'Homepage tagline'),
  ('author_name', 'Hasibur Rahman', 'Author name'),
  ('author_location', 'Bogura, Bangladesh', 'Location'),
  ('contact_email', 'hello@hasiburrahman.com', 'Public contact email'),
  ('contact_phone', '+8801XXXXXXXXX', 'Public contact phone'),
  ('default_meta_description', 'Hasibur Rahman এর ব্যক্তিগত বাংলা লেখার জার্নাল।', 'Default SEO description')
on conflict (key) do update set value = excluded.value;

insert into public.seo_settings (route_path, meta_title, meta_description, canonical_url, keywords)
values
  ('/', 'Hasibur Rahman | ব্যক্তিগত বাংলা জার্নাল', 'ব্যক্তিগত লেখার জার্নাল, গল্প, স্মৃতি ও চিন্তা।', 'https://example.com/', array['Hasibur Rahman', 'বাংলা জার্নাল']),
  ('/about', 'আমার সম্পর্কে | Hasibur Rahman', 'লেখক পরিচিতি, শিক্ষা ও জীবনী।', 'https://example.com/about', array['Hasibur Rahman biography', 'about']),
  ('/blog', 'ব্লগ | Hasibur Rahman', 'সকল ব্লগ পোস্ট, ক্যাটাগরি ও ট্যাগ সহ।', 'https://example.com/blog', array['Bangla blog', 'personal journal']),
  ('/favorites', 'পছন্দ | Hasibur Rahman', 'লেখকের প্রিয় বিষয়সমূহ।', 'https://example.com/favorites', array['favorites', 'Bangla']),
  ('/gallery', 'গ্যালারি | Hasibur Rahman', 'স্মৃতির গ্যালারি।', 'https://example.com/gallery', array['gallery', 'photos']),
  ('/timeline', 'টাইমলাইন | Hasibur Rahman', 'জীবনের গুরুত্বপূর্ণ সময়রেখা।', 'https://example.com/timeline', array['timeline', 'life events']),
  ('/contact', 'যোগাযোগ | Hasibur Rahman', 'যোগাযোগের তথ্য ও মেসেজ ফর্ম।', 'https://example.com/contact', array['contact', 'writer'])
on conflict (route_path) do update set
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  canonical_url = excluded.canonical_url,
  keywords = excluded.keywords;

insert into public.social_links (platform, url, sort_order)
values
  ('Facebook', 'https://facebook.com/', 1),
  ('YouTube', 'https://youtube.com/', 2),
  ('LinkedIn', 'https://linkedin.com/', 3)
on conflict do nothing;

insert into public.menus (location, label)
values
  ('header', 'Header Menu'),
  ('footer', 'Footer Menu')
on conflict (location) do update set label = excluded.label;

with header_menu as (
  select id from public.menus where location = 'header' limit 1
),
footer_menu as (
  select id from public.menus where location = 'footer' limit 1
)
insert into public.menu_items (menu_id, label, path, sort_order, target)
values
  ((select id from header_menu), 'হোম', '/', 1, '_self'),
  ((select id from header_menu), 'পরিচিতি', '/about', 2, '_self'),
  ((select id from header_menu), 'ব্লগ', '/blog', 3, '_self'),
  ((select id from header_menu), 'পছন্দ', '/favorites', 4, '_self'),
  ((select id from header_menu), 'গ্যালারি', '/gallery', 5, '_self'),
  ((select id from header_menu), 'টাইমলাইন', '/timeline', 6, '_self'),
  ((select id from header_menu), 'যোগাযোগ', '/contact', 7, '_self'),
  ((select id from footer_menu), 'ব্লগ', '/blog', 1, '_self'),
  ((select id from footer_menu), 'যোগাযোগ', '/contact', 2, '_self')
on conflict do nothing;

insert into public.gallery_categories (name, slug)
values
  ('Family', 'family'),
  ('Travel', 'travel'),
  ('Nature', 'nature')
on conflict (slug) do nothing;

insert into public.timeline (event_date, title, description, sort_order)
values
  ('2014-01-01', 'স্কুল জীবন', 'Bogura Cantonment Public School and College-এ পড়াশোনা।', 1),
  ('2018-01-01', 'কলেজ জীবন', 'Government Azizul Haque College-এ উচ্চশিক্ষা।', 2),
  ('2022-01-01', 'ব্যক্তিগত লেখালেখি শুরু', 'অনলাইন প্ল্যাটফর্মে ব্যক্তিগত জার্নাল প্রকাশ শুরু।', 3)
on conflict do nothing;

insert into public.favorites (type, title, description, sort_order)
values
  ('players', 'Lionel Messi', 'প্রিয় ফুটবল খেলোয়াড়', 1),
  ('teams', 'Argentina', 'প্রিয় জাতীয় দল', 1),
  ('foods', 'খিচুড়ি', 'আরামদায়ক প্রিয় খাবার', 1),
  ('books', 'পথের পাঁচালী', 'প্রিয় বাংলা সাহিত্য', 1),
  ('flowers', 'গোলাপ', 'প্রিয় ফুল', 1),
  ('places', 'Bogura', 'নিজ শহর', 1),
  ('games', 'Football', 'প্রিয় খেলা', 1),
  ('colors', 'নীল', 'প্রিয় রং', 1)
on conflict do nothing;

insert into public.posts (
  title,
  slug,
  excerpt,
  content,
  status,
  featured,
  published_at,
  reading_minutes,
  author_id,
  category_id
)
select
  'আমার লেখার শুরু',
  'amar-lekhar-shuru',
  'কেন আমি ব্যক্তিগত জার্নাল লেখা শুরু করলাম সেই গল্প।',
  '<p>লেখালেখি আমার কাছে শুধুমাত্র শখ নয়, এটি নিজেকে বোঝার একটি প্রক্রিয়া। এই জার্নালে আমি জীবনের স্মৃতি, অনুভূতি এবং প্রিয় বিষয়গুলো তুলে ধরব।</p>',
  'published',
  true,
  now(),
  2,
  (select id from public.users order by created_at asc limit 1),
  (select id from public.categories where slug = 'jibon' limit 1)
where not exists (
  select 1 from public.posts where slug = 'amar-lekhar-shuru'
);

commit;
