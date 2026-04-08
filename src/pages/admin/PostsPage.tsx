import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { EmptyState } from "../../components/admin/EmptyState";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { RichTextEditor } from "../../components/admin/RichTextEditor";
import { AiAssistantPanel } from "../../components/admin/AiAssistantPanel";
import { calculateReadingTime } from "../../lib/readingTime";
import { slugify } from "../../lib/slug";
import { compressImage, createThumbnail } from "../../lib/media";
import { MEDIA_BUCKET, supabase } from "../../lib/supabase";
import { useAdminStore } from "../../store/adminStore";
import { useAuthStore } from "../../store/authStore";
import { Category, MediaItem, Post, Tag } from "../../types/models";

type PostForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: Post["status"];
  scheduled_at: string;
  category_id: string;
  featured: boolean;
  allow_comments: boolean;
  cover_image_url: string;
  tags: string;
  reading_minutes: number;
};

const initialForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
  scheduled_at: "",
  category_id: "",
  featured: false,
  allow_comments: true,
  cover_image_url: "",
  tags: "",
  reading_minutes: 1
};

function normalizeToDatetimeInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<PostForm>(initialForm);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const { autosaveDrafts, setDraft, removeDraft } = useAdminStore();
  const profile = useAuthStore((state) => state.profile);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autosaveRef = useRef<number | null>(null);

  const draftKey = editingId || "new-post";

  const load = async () => {
    setLoading(true);
    const [{ data: postsData }, { data: categoryData }, { data: mediaData }] = await Promise.all([
      supabase.from("posts").select("*").order("updated_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(200)
    ]);
    setPosts((postsData as Post[]) ?? []);
    setCategories((categoryData as Category[]) ?? []);
    setMediaItems((mediaData as MediaItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!form.title.trim()) return;
    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current);
    }
    autosaveRef.current = window.setTimeout(() => {
      setDraft(draftKey, form as Partial<Post>);
    }, 900);
    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current);
      }
    };
  }, [form, draftKey, setDraft]);

  const selectedDraft = autosaveDrafts[draftKey] as PostForm | undefined;

  useEffect(() => {
    if (selectedDraft && !editingId) {
      setForm((prev) => ({ ...prev, ...selectedDraft }));
    }
  }, [selectedDraft, editingId]);

  const pickPost = async (post: Post) => {
    setEditingId(post.id);
    const { data: postTagsData } = await supabase
      .from("post_tags")
      .select("tags(name)")
      .eq("post_id", post.id);
    const tags = (postTagsData ?? [])
      .map((item: { tags?: { name?: string } }) => item.tags?.name)
      .filter(Boolean)
      .join(", ");
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      status: post.status,
      scheduled_at: normalizeToDatetimeInput(post.scheduled_at),
      category_id: post.category_id || "",
      featured: post.featured,
      allow_comments: post.allow_comments,
      cover_image_url: post.cover_image_url || "",
      tags,
      reading_minutes: post.reading_minutes || 1
    });
    setMessage("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
  };

  const updateField = <K extends keyof PostForm>(key: K, value: PostForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    const path = `posts/${Date.now()}-${compressed.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, compressed, {
      cacheControl: "3600",
      upsert: true
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    updateField("cover_image_url", urlData.publicUrl);

    await supabase.from("media_library").insert({
      title: file.name,
      file_path: path,
      bucket: MEDIA_BUCKET,
      mime_type: compressed.type,
      size_bytes: compressed.size,
      folder: "posts",
      url: urlData.publicUrl
    });
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Title and content are required.");
      return;
    }
    setSaving(true);

    const nextSlug = form.slug || slugify(form.title);
    const scheduledISO = form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null;
    const now = new Date().toISOString();

    let status = form.status;
    if (status === "scheduled" && !scheduledISO) {
      status = "draft";
    }
    if (scheduledISO && new Date(scheduledISO).getTime() > Date.now() && status === "published") {
      status = "scheduled";
    }

    const payload = {
      title: form.title,
      slug: nextSlug,
      excerpt: form.excerpt || null,
      content: form.content,
      status,
      category_id: form.category_id || null,
      featured: form.featured,
      allow_comments: form.allow_comments,
      cover_image_url: form.cover_image_url || null,
      scheduled_at: status === "scheduled" ? scheduledISO : null,
      published_at: status === "published" ? now : null,
      reading_minutes: form.reading_minutes || calculateReadingTime(form.content),
      author_id: profile?.id || null
    };

    let postId = editingId;
    if (editingId) {
      const { error } = await supabase.from("posts").update(payload).eq("id", editingId);
      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
      if (error || !data) {
        setMessage(error?.message || "Insert failed");
        setSaving(false);
        return;
      }
      postId = data.id;
      setEditingId(data.id);
    }

    const tagNames = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const tagIds: string[] = [];
    for (const name of tagNames) {
      const slug = slugify(name);
      const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
      if (existing?.id) {
        tagIds.push(existing.id);
      } else {
        const { data: created } = await supabase.from("tags").insert({ name, slug }).select("id").single();
        if (created?.id) {
          tagIds.push(created.id);
        }
      }
    }

    if (postId) {
      await supabase.from("post_tags").delete().eq("post_id", postId);
      if (tagIds.length) {
        await supabase.from("post_tags").insert(
          tagIds.map((tagId) => ({
            post_id: postId,
            tag_id: tagId
          }))
        );
      }
    }

    setMessage("Post saved successfully.");
    removeDraft(draftKey);
    await load();
    setSaving(false);
  };

  const removePost = async (id: string) => {
    if (!window.confirm("এই পোস্ট ডিলিট করতে চান?")) return;
    await supabase.from("posts").delete().eq("id", id);
    if (editingId === id) {
      resetForm();
    }
    await load();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const payload = { name: newCategory, slug: slugify(newCategory) };
    const { error } = await supabase.from("categories").insert(payload);
    if (!error) {
      setNewCategory("");
      await load();
    } else {
      setMessage(error.message);
    }
  };

  const insertMediaInContent = (url: string) => {
    if (!editorRef.current) {
      updateField("content", `${form.content}\n<img src="${url}" alt="" />`);
      return;
    }
    const area = editorRef.current;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const snippet = `<img src="${url}" alt="" />`;
    const next = `${form.content.slice(0, start)}${snippet}${form.content.slice(end)}`;
    updateField("content", next);
    setMediaPickerOpen(false);
  };

  const onGenerateThumbnail = async (item: MediaItem) => {
    if (!item.url) return;
    const response = await fetch(item.url);
    const blob = await response.blob();
    const file = new File([blob], item.title || "image", { type: blob.type || "image/jpeg" });
    const thumbFile = await createThumbnail(file);
    const thumbPath = `thumbnails/${Date.now()}-${thumbFile.name}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumbFile, {
      upsert: true
    });
    if (error) return;
    const { data: thumbUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(thumbPath);
    await supabase
      .from("media_library")
      .update({ thumbnail_url: thumbUrlData.publicUrl })
      .eq("id", item.id);
    await load();
  };

  const postList = useMemo(() => posts.slice(0, 50), [posts]);

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Posts Manager"
        description="Create, edit, autosave, schedule publish, and AI assist all posts."
        actions={
          <>
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              New Post
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Post"}
            </button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.8fr]">
        <AdminCard className="h-fit">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">All Posts</h3>
          {loading ? (
            <p className="text-sm text-slate-600">Loading posts...</p>
          ) : postList.length ? (
            <div className="space-y-2">
              {postList.map((post) => (
                <div key={post.id} className="rounded-lg border border-slate-200 p-3">
                  <button
                    type="button"
                    onClick={() => void pickPost(post)}
                    className="w-full text-left"
                  >
                    <p className="line-clamp-2 font-semibold text-slate-800">{post.title}</p>
                    <p className="text-xs text-slate-500">
                      {post.status} • {post.slug}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void pickPost(post)}
                      className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePost(post.id)}
                      className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No posts yet" subtitle="Create your first article from the right panel." />
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
                <input
                  value={form.title}
                  onChange={(event) => {
                    updateField("title", event.target.value);
                    if (!editingId) {
                      updateField("slug", slugify(event.target.value));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Slug</label>
                <div className="flex gap-2">
                  <input
                    value={form.slug}
                    onChange={(event) => updateField("slug", slugify(event.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-slate-100 px-3 text-xs"
                    onClick={() => updateField("slug", slugify(form.title))}
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
                <div className="space-y-2">
                  <select
                    value={form.category_id}
                    onChange={(event) => updateField("category_id", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                      placeholder="New category"
                    />
                    <button
                      type="button"
                      onClick={() => void addCategory()}
                      className="rounded-lg bg-slate-100 px-3 text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as Post["status"])}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Schedule Publish</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(event) => updateField("scheduled_at", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2"
                  placeholder="বাংলা, জীবন, স্মৃতি"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Reading Time (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={form.reading_minutes}
                  onChange={(event) => updateField("reading_minutes", Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => updateField("featured", event.target.checked)}
                  />
                  Featured
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.allow_comments}
                    onChange={(event) => updateField("allow_comments", event.target.checked)}
                  />
                  Allow comments
                </label>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Cover Image</h3>
              <input type="file" accept="image/*" onChange={(event) => void uploadCover(event)} />
            </div>
            {form.cover_image_url ? (
              <img src={form.cover_image_url} alt="cover" className="max-h-72 w-full rounded-xl object-cover" />
            ) : (
              <p className="text-sm text-slate-600">No cover image selected.</p>
            )}
          </AdminCard>

          <AiAssistantPanel
            title={form.title}
            content={form.content}
            onApplySummary={(summary) => {
              if (summary) updateField("excerpt", summary);
            }}
            onApplyTags={(tags) => {
              if (tags.length) updateField("tags", Array.from(new Set([...form.tags.split(","), ...tags])).join(", "));
            }}
            onApplyKeywords={(keywords) => {
              if (keywords.length) {
                const merged = Array.from(new Set([...form.tags.split(","), ...keywords]));
                updateField("tags", merged.filter(Boolean).join(", "));
              }
            }}
            onApplyReadingTime={(minutes) => updateField("reading_minutes", minutes)}
          />

          <AdminCard>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Content Editor</h3>
            <RichTextEditor
              value={form.content}
              onChange={(value) => {
                updateField("content", value);
                updateField("reading_minutes", calculateReadingTime(value));
              }}
              textareaRef={editorRef}
              onInsertImage={() => setMediaPickerOpen(true)}
            />
          </AdminCard>

          {message ? <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{message}</p> : null}
        </div>
      </div>

      {mediaPickerOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Media Library</h3>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="rounded bg-slate-100 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-auto md:grid-cols-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-2">
                  {item.thumbnail_url || item.url ? (
                    <img
                      src={item.thumbnail_url || item.url || ""}
                      alt={item.title}
                      className="mb-2 h-28 w-full rounded object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <p className="mb-2 line-clamp-2 text-xs text-slate-700">{item.title}</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => insertMediaInContent(item.url || "")}
                      className="rounded bg-brand-700 px-2 py-1 text-[11px] text-white"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => void onGenerateThumbnail(item)}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px]"
                    >
                      Thumb
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
