begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

do $$
begin
  create type post_status as enum ('draft', 'scheduled', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type comment_status as enum ('pending', 'approved', 'spam', 'deleted');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('super_admin', 'editor', 'moderator')),
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (name, label)
values
  ('super_admin', 'Super Admin'),
  ('editor', 'Editor'),
  ('moderator', 'Moderator')
on conflict (name) do update set label = excluded.label;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  location text,
  language text[] default array['Bangla', 'English'],
  bio text,
  avatar_url text,
  role_id uuid not null references public.roles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  status post_status not null default 'draft',
  allow_comments boolean not null default true,
  featured boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  reading_minutes integer not null default 1,
  view_count integer not null default 0,
  author_id uuid references public.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      unaccent(
        coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')
      )
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  content text not null,
  status comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content text not null default '',
  json_content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('players', 'teams', 'foods', 'books', 'flowers', 'places', 'games', 'colors')),
  title text not null,
  description text,
  image_url text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  thumbnail_url text,
  category_id uuid references public.gallery_categories(id) on delete set null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  title text not null,
  description text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  bucket text not null default 'media',
  mime_type text,
  size_bytes bigint,
  folder text,
  alt_text text,
  url text,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  location text unique not null check (location in ('header', 'footer')),
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  label text not null,
  path text not null,
  target text not null default '_self' check (target in ('_self', '_blank')),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  route_path text unique not null,
  meta_title text not null,
  meta_description text,
  canonical_url text,
  og_image text,
  keywords text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text,
  content text,
  json_content jsonb,
  enabled boolean not null default true,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists idx_posts_status_published on public.posts(status, published_at desc);
create index if not exists idx_posts_scheduled_at on public.posts(status, scheduled_at);
create index if not exists idx_posts_search_vector on public.posts using gin(search_vector);
create index if not exists idx_comments_post_status on public.comments(post_id, status, created_at desc);
create index if not exists idx_menu_items_menu_sort on public.menu_items(menu_id, sort_order);
create index if not exists idx_gallery_category_sort on public.gallery(category_id, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at before update on public.pages for each row execute function public.set_updated_at();

drop trigger if exists trg_favorites_updated_at on public.favorites;
create trigger trg_favorites_updated_at before update on public.favorites for each row execute function public.set_updated_at();

drop trigger if exists trg_gallery_updated_at on public.gallery;
create trigger trg_gallery_updated_at before update on public.gallery for each row execute function public.set_updated_at();

drop trigger if exists trg_timeline_updated_at on public.timeline;
create trigger trg_timeline_updated_at before update on public.timeline for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

drop trigger if exists trg_seo_settings_updated_at on public.seo_settings;
create trigger trg_seo_settings_updated_at before update on public.seo_settings for each row execute function public.set_updated_at();

drop trigger if exists trg_homepage_sections_updated_at on public.homepage_sections;
create trigger trg_homepage_sections_updated_at before update on public.homepage_sections for each row execute function public.set_updated_at();

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_role(allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_name() = any(allowed), false);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.roles where name = 'editor' limit 1;
  insert into public.users (auth_user_id, email, full_name, role_id, location)
  values (
    new.id,
    coalesce(new.email, concat(new.id, '@example.com')),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    default_role_id,
    'Bogura, Bangladesh'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.publish_scheduled_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  update public.posts
  set status = 'published',
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where status = 'scheduled'
    and scheduled_at is not null
    and scheduled_at <= now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace view public.post_search_view as
select
  p.id,
  p.title,
  p.slug,
  p.excerpt,
  p.content,
  p.cover_image_url,
  p.published_at,
  p.reading_minutes,
  p.view_count,
  p.search_vector
from public.posts p
where p.status = 'published'
  and (p.published_at is null or p.published_at <= now());

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.pages enable row level security;
alter table public.favorites enable row level security;
alter table public.gallery_categories enable row level security;
alter table public.gallery enable row level security;
alter table public.timeline enable row level security;
alter table public.media_library enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.seo_settings enable row level security;
alter table public.social_links enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.contact_messages enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "roles_manage_super_admin" on public.roles;
create policy "roles_manage_super_admin"
on public.roles
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "users_self_select" on public.users;
create policy "users_self_select"
on public.users
for select
to authenticated
using (auth.uid() = auth_user_id or public.has_role(array['super_admin']));

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update"
on public.users
for update
to authenticated
using (auth.uid() = auth_user_id or public.has_role(array['super_admin']))
with check (auth.uid() = auth_user_id or public.has_role(array['super_admin']));

drop policy if exists "users_admin_insert" on public.users;
create policy "users_admin_insert"
on public.users
for insert
to authenticated
with check (public.has_role(array['super_admin']));

drop policy if exists "public_posts_read" on public.posts;
create policy "public_posts_read"
on public.posts
for select
to anon, authenticated
using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists "editor_manage_posts" on public.posts;
create policy "editor_manage_posts"
on public.posts
for all
to authenticated
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "public_categories_read" on public.categories;
create policy "public_categories_read"
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_categories" on public.categories;
create policy "editor_manage_categories"
on public.categories
for all
to authenticated
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "public_tags_read" on public.tags;
create policy "public_tags_read"
on public.tags
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_tags" on public.tags;
create policy "editor_manage_tags"
on public.tags
for all
to authenticated
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "editor_manage_post_tags" on public.post_tags;
create policy "editor_manage_post_tags"
on public.post_tags
for all
to authenticated
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "public_pages_read" on public.pages;
create policy "public_pages_read"
on public.pages
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_pages" on public.pages;
create policy "editor_manage_pages"
on public.pages
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_favorites_read" on public.favorites;
create policy "public_favorites_read"
on public.favorites
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_favorites" on public.favorites;
create policy "editor_manage_favorites"
on public.favorites
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_gallery_categories_read" on public.gallery_categories;
create policy "public_gallery_categories_read"
on public.gallery_categories
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_gallery_categories" on public.gallery_categories;
create policy "editor_manage_gallery_categories"
on public.gallery_categories
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_gallery_read" on public.gallery;
create policy "public_gallery_read"
on public.gallery
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_gallery" on public.gallery;
create policy "editor_manage_gallery"
on public.gallery
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_timeline_read" on public.timeline;
create policy "public_timeline_read"
on public.timeline
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_timeline" on public.timeline;
create policy "editor_manage_timeline"
on public.timeline
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_media_read" on public.media_library;
create policy "public_media_read"
on public.media_library
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_media" on public.media_library;
create policy "editor_manage_media"
on public.media_library
for all
to authenticated
using (public.has_role(array['super_admin', 'editor']))
with check (public.has_role(array['super_admin', 'editor']));

drop policy if exists "public_menus_read" on public.menus;
create policy "public_menus_read"
on public.menus
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_menus" on public.menus;
create policy "editor_manage_menus"
on public.menus
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_menu_items_read" on public.menu_items;
create policy "public_menu_items_read"
on public.menu_items
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_menu_items" on public.menu_items;
create policy "editor_manage_menu_items"
on public.menu_items
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_site_settings_read" on public.site_settings;
create policy "public_site_settings_read"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_site_settings" on public.site_settings;
create policy "editor_manage_site_settings"
on public.site_settings
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_seo_settings_read" on public.seo_settings;
create policy "public_seo_settings_read"
on public.seo_settings
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_seo_settings" on public.seo_settings;
create policy "editor_manage_seo_settings"
on public.seo_settings
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_social_links_read" on public.social_links;
create policy "public_social_links_read"
on public.social_links
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_social_links" on public.social_links;
create policy "editor_manage_social_links"
on public.social_links
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_homepage_sections_read" on public.homepage_sections;
create policy "public_homepage_sections_read"
on public.homepage_sections
for select
to anon, authenticated
using (true);

drop policy if exists "editor_manage_homepage_sections" on public.homepage_sections;
create policy "editor_manage_homepage_sections"
on public.homepage_sections
for all
to authenticated
using (public.has_role(array['super_admin']))
with check (public.has_role(array['super_admin']));

drop policy if exists "public_comments_read_approved" on public.comments;
create policy "public_comments_read_approved"
on public.comments
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "public_comments_insert_pending" on public.comments;
create policy "public_comments_insert_pending"
on public.comments
for insert
to anon, authenticated
with check (
  status = 'pending'
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and p.status = 'published'
      and p.allow_comments = true
  )
);

drop policy if exists "moderator_manage_comments" on public.comments;
create policy "moderator_manage_comments"
on public.comments
for all
to authenticated
using (public.has_role(array['super_admin', 'moderator']))
with check (public.has_role(array['super_admin', 'moderator']));

drop policy if exists "public_contact_insert" on public.contact_messages;
create policy "public_contact_insert"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "admin_manage_contact_messages" on public.contact_messages;
create policy "admin_manage_contact_messages"
on public.contact_messages
for all
to authenticated
using (public.has_role(array['super_admin', 'moderator']))
with check (public.has_role(array['super_admin', 'moderator']));

drop policy if exists "user_manage_own_bookmarks" on public.bookmarks;
create policy "user_manage_own_bookmarks"
on public.bookmarks
for all
to authenticated
using (
  user_id in (
    select id from public.users where auth_user_id = auth.uid()
  )
)
with check (
  user_id in (
    select id from public.users where auth_user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public media bucket read" on storage.objects;
create policy "Public media bucket read"
on storage.objects
for select
to public
using (bucket_id = 'media');

drop policy if exists "Editor media bucket insert" on storage.objects;
create policy "Editor media bucket insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media' and public.has_role(array['super_admin', 'editor'])
);

drop policy if exists "Editor media bucket update" on storage.objects;
create policy "Editor media bucket update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media' and public.has_role(array['super_admin', 'editor'])
)
with check (
  bucket_id = 'media' and public.has_role(array['super_admin', 'editor'])
);

drop policy if exists "Editor media bucket delete" on storage.objects;
create policy "Editor media bucket delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media' and public.has_role(array['super_admin', 'editor'])
);

commit;
