# Hasibur Rahman CMS

Production-ready Bengali personal publishing CMS with a dynamic public site and a WordPress-style admin dashboard.

## Author Prefill

- Name: Hasibur Rahman
- Location: Bogura, Bangladesh
- Languages: Bangla, English
- Education:
  - Bogura Cantonment Public School and College
  - Government Azizul Haque College
- Homepage intro:
  - আমি হাসিবুর রহমান। এটি আমার ব্যক্তিগত লেখার জার্নাল যেখানে আমি আমার জীবনের গল্প স্মৃতি চিন্তা অনুভূতি এবং প্রিয় বিষয়গুলো শেয়ার করি।

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + TypeScript
- Backend & DB: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- State: Zustand
- Routing: React Router

## Included Features

### Public Website

- Dynamic homepage sections (hero, featured slider, recent posts, popular posts, favorites preview, gallery preview, quote block)
- About page with editable profile + education data
- Blog list with category, tag, search, pagination
- Single post features:
  - Reading progress bar
  - Font resizing
  - Reading time
  - Share button
  - Bookmark toggle
  - Dark mode toggle
- Favorites page grouped by type
- Gallery with album filter and lightbox preview
- Timeline page
- Contact page with message form
- Dedicated search route using PostgreSQL full-text index

### Admin Dashboard

- WordPress-style sidebar layout
- Dashboard analytics overview
- Posts manager:
  - Create/Edit/Delete
  - Draft autosave
  - Schedule publish
  - Auto slug
  - Cover upload
  - Inline image insert
  - AI writing assistant
- Pages manager:
  - Homepage sections editor
  - About/Favorites/Timeline/Contact editors
- Gallery manager:
  - Album create
  - Upload image
  - Delete image
  - Caption edit
  - Preview/lightbox
- Favorites manager (players, teams, foods, books, flowers, places, games, colors)
- Timeline manager with reorder
- Comments manager:
  - Approve/Delete
  - Disable comments per post
- Media library:
  - Upload/Delete/Search
  - Folder support
  - Reuse by URL
- Menu manager:
  - Header/Footer builders
  - Drag-and-drop reorder
- SEO manager:
  - Meta title/description
  - Canonical URL
  - OG URL helper
  - Slug helper
- Users manager:
  - Super-admin-only account creation
  - Role assignment

### Role System

- Super Admin: full access
- Editor: posts-focused access (posts, tags, categories, post media)
- Moderator: comments module access

### Security

- Admin routes protected by Supabase auth + role checks
- RLS policies across all content tables with strict role boundaries:
  - super_admin = full CMS
  - editor = posts + related media
  - moderator = comments moderation
- Public signup enabled for normal users; admin roles are restricted by allowlist
- HTML sanitization for rendered content
- Storage policies locked to editor/admin roles for write actions

### Performance

- Lazy-loaded routes and images
- Indexed SQL queries
- Generated `tsvector` full-text search column
- Optimized image compression + thumbnail generation on upload

---

## Project Structure

```text
.
|-- .env.example
|-- .gitignore
|-- eslint.config.js
|-- index.html
|-- netlify.toml
|-- package.json
|-- postcss.config.js
|-- server.js
|-- tailwind.config.js
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
|-- vercel.json
|-- vite.config.ts
|-- supabase/
|   |-- schema.sql
|   |-- seed.sql
|   `-- functions/
|       |-- ai-assistant/index.ts
|       `-- admin-create-user/index.ts
`-- src/
    |-- App.tsx
    |-- main.tsx
    |-- index.css
    |-- constants/adminNav.ts
    |-- hooks/
    |   |-- useAuth.ts
    |   |-- useCrud.ts
    |   `-- usePosts.ts
    |-- lib/
    |   |-- aiAssistant.ts
    |   |-- date.ts
    |   |-- media.ts
    |   |-- readingTime.ts
    |   |-- sanitize.ts
    |   |-- slug.ts
    |   `-- supabase.ts
    |-- routes/
    |   |-- AppRoutes.tsx
    |   `-- ProtectedRoute.tsx
    |-- store/
    |   |-- adminStore.ts
    |   `-- authStore.ts
    |-- types/
    |   |-- db.ts
    |   `-- models.ts
    |-- components/
    |   |-- admin/
    |   |-- layout/
    |   `-- public/
    `-- pages/
        |-- admin/
        `-- public/
```

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_MEDIA_BUCKET=media
VITE_SITE_URL=
```

### 3. Setup Supabase schema and seed

Before running seed: create your first Auth user manually in Supabase (this user is promoted to Super Admin by `seed.sql`).

Run in Supabase SQL Editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

### 4. Deploy Edge Functions

```bash
supabase functions deploy ai-assistant
supabase functions deploy admin-create-user
```

Set function secrets:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set OPENAI_API_KEY=...
supabase secrets set OPENAI_MODEL=gpt-5.4-mini
```

### 5. Configure public signup

In Supabase Dashboard:

1. Authentication -> Providers
2. Keep public email signup ON (normal users can register)
3. Keep email confirmation ON
4. Admin roles stay restricted by DB allowlist trigger

### 6. Run app

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

## Database Notes

- Full schema: `supabase/schema.sql`
- Includes all requested tables:
  - `users`, `roles`, `posts`, `categories`, `tags`, `comments`, `pages`, `favorites`, `gallery`, `gallery_categories`, `timeline`, `media_library`, `menus`, `menu_items`, `site_settings`, `seo_settings`, `social_links`, `homepage_sections`
- Plus operational tables:
  - `post_tags`, `contact_messages`, `bookmarks`
- Full-text search:
  - `posts.search_vector` (GIN indexed)
  - `public.post_search_view`
- Scheduled publishing helper:
  - `public.publish_scheduled_posts()`
  - Run this via `pg_cron` or Supabase scheduled function for automatic publish execution

---

## AI Assistant Details

Inside post editor:

- Auto summary generation
- Tag suggestions
- SEO keyword suggestions
- Reading time suggestions
- Related-post hint

If OpenAI is unavailable, the app uses local fallback logic.

---

## Deployment

### Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add all `VITE_*` env vars

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Add `VITE_*` env vars in site settings

### Hostinger Node Hosting

- Build once with `npm run build`
- Run the included server with `npm run start`
- Ensure `dist` exists and environment variables are set
- Keep SPA fallback enabled (already handled by `server.js`)

---

## Admin Auth Troubleshooting

- Login/Signup/Reset needs valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- In Vercel (or other host), set all `VITE_*` variables for Production and Preview.
- Admin email allowlist is enforced in DB trigger:
  - `aanytime.xpress@gmail.com`
  - `alshakib730@gmail.com`
- These two emails can hold admin roles (`super_admin`/`editor`/`moderator`); all other registrations are forced to `user`.
- In Supabase Auth URL Configuration:
  - `Site URL`: your production frontend URL
  - Add redirect URLs:
    - `https://your-domain.com/admin/login`
    - `https://your-domain.com/admin/reset-password`
    - `https://*.vercel.app/admin/login`
    - `https://*.vercel.app/admin/reset-password`
- If signup is disabled in Supabase, `/admin/signup` will fail by design; enable signup for normal-user registration.
- First super admin setup:
  - Create first Auth user manually in Supabase
  - Run `supabase/schema.sql`
  - Run `supabase/seed.sql` (promotes allowlisted admin emails to super admin)
- For existing projects, run once: `supabase/admin_email_allowlist_patch.sql`

---

## Production Checklist

- [ ] Create initial super admin in Supabase Auth
- [ ] Run schema and seed SQL
- [ ] Set edge function secrets
- [ ] Keep public signup enabled with email confirmation
- [ ] Configure custom domain and canonical URLs in `seo_settings`
- [ ] Test role permissions for all 3 roles
- [ ] Connect backup and monitoring for Supabase project
