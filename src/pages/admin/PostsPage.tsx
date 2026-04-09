import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { AiAssistantPanel } from "../../components/admin/AiAssistantPanel";
import { EmptyState } from "../../components/admin/EmptyState";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { RichTextEditor } from "../../components/admin/RichTextEditor";
import { compressImage, createThumbnail } from "../../lib/media";
import { calculateReadingTime } from "../../lib/readingTime";
import { slugify } from "../../lib/slug";
import { MEDIA_BUCKET, supabase } from "../../lib/supabase";
import { useAdminStore } from "../../store/adminStore";
import { useAuthStore } from "../../store/authStore";
import { Category, MediaItem, Post } from "../../types/models";

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

const REQUEST_TIMEOUT_MS = 20000;

function normalizeToDatetimeInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

async function withTimeout<T>(promise: Promise<T>, message: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
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
    try {
      const [postsRes, categoryRes, mediaRes] = await Promise.all([
        withTimeout(
          supabase.from("posts").select("*").order("updated_at", { ascending: false }),
          "পোস্ট লিস্ট লোড করতে সময় বেশি লাগছে।"
        ),
        withTimeout(
          supabase.from("categories").select("*").order("name"),
          "ক্যাটাগরি লোড করতে সময় বেশি লাগছে।"
        ),
        withTimeout(
          supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(200),
          "মিডিয়া লিস্ট লোড করতে সময় বেশি লাগছে।"
        )
      ]);

      const firstError = postsRes.error?.message || categoryRes.error?.message || mediaRes.error?.message;
      if (firstError) {
        setMessage(firstError);
      } else {
        setMessage("");
      }

      setPosts((postsRes.data as Post[]) ?? []);
      setCategories((categoryRes.data as Category[]) ?? []);
      setMediaItems((mediaRes.data as MediaItem[]) ?? []);
    } catch (error) {
      setMessage(getErrorMessage(error, "এই মুহূর্তে পোস্ট মডিউল লোড করা যাচ্ছে না।"));
    } finally {
      setLoading(false);
    }
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
      setDraft(draftKey, form as unknown as Partial<Post>);
    }, 900);

    return () => {
      if (autosaveRef.current) {
        window.clearTimeout(autosaveRef.current);
      }
    };
  }, [form, draftKey, setDraft]);

  const selectedDraft = autosaveDrafts[draftKey] as unknown as PostForm | undefined;

  useEffect(() => {
    if (selectedDraft && !editingId) {
      setForm((prev) => ({ ...prev, ...selectedDraft }));
    }
  }, [selectedDraft, editingId]);

  const pickPost = async (post: Post) => {
    setEditingId(post.id);

    try {
      const { data: postTagsData, error } = await withTimeout(
        supabase.from("post_tags").select("tags(name)").eq("post_id", post.id),
        "পোস্টের ট্যাগ লোড করতে সময় বেশি লাগছে।"
      );

      if (error) {
        throw new Error(error.message);
      }

      const tags = ((postTagsData ?? []) as Array<{ tags?: { name?: string } | Array<{ name?: string }> }>)
        .flatMap((item) => (Array.isArray(item.tags) ? item.tags.map((tag) => tag?.name) : [item.tags?.name]))
        .filter((name): name is string => Boolean(name))
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
    } catch (error) {
      setMessage(getErrorMessage(error, "Post তথ্য load করা যায়নি।"));
    }
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

    try {
      const compressed = await compressImage(file);
      const path = `posts/${Date.now()}-${compressed.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await withTimeout(
        supabase.storage.from(MEDIA_BUCKET).upload(path, compressed, {
          cacheControl: "3600",
          upsert: true
        }),
        "Cover upload করতে সময় বেশি লাগছে।"
      );

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      updateField("cover_image_url", urlData.publicUrl);

      const { error: mediaError } = await withTimeout(
        supabase.from("media_library").insert({
          title: file.name,
          file_path: path,
          bucket: MEDIA_BUCKET,
          mime_type: compressed.type,
          size_bytes: compressed.size,
          folder: "posts",
          url: urlData.publicUrl
        }),
        "Media library update করতে সময় বেশি লাগছে।"
      );

      if (mediaError) {
        throw new Error(mediaError.message);
      }

      setMessage("Cover image সফলভাবে আপলোড হয়েছে।");
    } catch (error) {
      setMessage(getErrorMessage(error, "Cover image upload করা যায়নি।"));
    }
  };

  const save = async () => {
    if (saving) return;
    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Title and content are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nextSlug = form.slug || slugify(form.title);
      const currentPost = editingId ? posts.find((item) => item.id === editingId) : null;

      let scheduledISO: string | null = null;
      if (form.status === "scheduled" && form.scheduled_at) {
        const scheduledDate = new Date(form.scheduled_at);
        if (Number.isNaN(scheduledDate.getTime())) {
          throw new Error("Schedule date/time সঠিক নয়।");
        }
        scheduledISO = scheduledDate.toISOString();
      }

      let status = form.status;
      if (status === "scheduled" && !scheduledISO) {
        status = "draft";
      }

      const now = new Date().toISOString();
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
        published_at: status === "published" ? currentPost?.published_at || now : null,
        reading_minutes: form.reading_minutes || calculateReadingTime(form.content),
        author_id: profile?.id || null
      };

      let postId = editingId;
      if (editingId) {
        const { error } = await withTimeout(
          supabase.from("posts").update(payload).eq("id", editingId),
          "Post update করতে সময় বেশি লাগছে।"
        );
        if (error) {
          throw new Error(error.message);
        }
      } else {
        const { data, error } = await withTimeout(
          supabase.from("posts").insert(payload).select("id").single(),
          "Post save করতে সময় বেশি লাগছে।"
        );
        if (error || !data) {
          throw new Error(error?.message || "Insert failed");
        }
        postId = data.id;
        setEditingId(data.id);
      }

      const tagNames = Array.from(
        new Set(
          form.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );

      const tagIds: string[] = [];
      for (const name of tagNames) {
        const tagSlug = slugify(name);
        const { data: existing, error: existingError } = await withTimeout(
          supabase.from("tags").select("id").eq("slug", tagSlug).maybeSingle(),
          "Tag check করতে সময় বেশি লাগছে।"
        );

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (existing?.id) {
          tagIds.push(existing.id);
          continue;
        }

        const { data: created, error: createError } = await withTimeout(
          supabase.from("tags").insert({ name, slug: tagSlug }).select("id").single(),
          "Tag create করতে সময় বেশি লাগছে।"
        );

        if (createError) {
          throw new Error(createError.message);
        }

        if (created?.id) {
          tagIds.push(created.id);
        }
      }

      if (postId) {
        const { error: clearTagError } = await withTimeout(
          supabase.from("post_tags").delete().eq("post_id", postId),
          "পুরনো tag মুছতে সময় বেশি লাগছে।"
        );
        if (clearTagError) {
          throw new Error(clearTagError.message);
        }

        if (tagIds.length) {
          const { error: attachTagError } = await withTimeout(
            supabase.from("post_tags").insert(
              tagIds.map((tagId) => ({
                post_id: postId,
                tag_id: tagId
              }))
            ),
            "Tag attach করতে সময় বেশি লাগছে।"
          );
          if (attachTagError) {
            throw new Error(attachTagError.message);
          }
        }
      }

      removeDraft(draftKey);
      await load();
      setMessage("Post saved successfully.");
    } catch (error) {
      setMessage(getErrorMessage(error, "Post save করা যায়নি। আবার চেষ্টা করুন।"));
    } finally {
      setSaving(false);
    }
  };

  const removePost = async (id: string) => {
    if (!window.confirm("এই পোস্ট ডিলিট করতে চান?")) return;

    try {
      const { error } = await withTimeout(
        supabase.from("posts").delete().eq("id", id),
        "Post delete করতে সময় বেশি লাগছে।"
      );
      if (error) {
        throw new Error(error.message);
      }

      if (editingId === id) {
        resetForm();
      }
      await load();
      setMessage("Post delete হয়েছে।");
    } catch (error) {
      setMessage(getErrorMessage(error, "Post delete করা যায়নি।"));
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const payload = { name: newCategory, slug: slugify(newCategory) };
      const { error } = await withTimeout(
        supabase.from("categories").insert(payload),
        "Category add করতে সময় বেশি লাগছে।"
      );

      if (error) {
        throw new Error(error.message);
      }

      setNewCategory("");
      await load();
      setMessage("Category যোগ হয়েছে।");
    } catch (error) {
      setMessage(getErrorMessage(error, "Category যোগ করা যায়নি।"));
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

    try {
      const response = await withTimeout(fetch(item.url), "Image fetch করতে সময় বেশি লাগছে।");
      const blob = await response.blob();
      const file = new File([blob], item.title || "image", { type: blob.type || "image/jpeg" });
      const thumbFile = await createThumbnail(file);
      const thumbPath = `thumbnails/${Date.now()}-${thumbFile.name}`;

      const { error } = await withTimeout(
        supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumbFile, { upsert: true }),
        "Thumbnail upload করতে সময় বেশি লাগছে।"
      );
      if (error) {
        throw new Error(error.message);
      }

      const { data: thumbUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(thumbPath);
      const { error: updateError } = await withTimeout(
        supabase.from("media_library").update({ thumbnail_url: thumbUrlData.publicUrl }).eq("id", item.id),
        "Thumbnail save করতে সময় বেশি লাগছে।"
      );
      if (updateError) {
        throw new Error(updateError.message);
      }

      await load();
      setMessage("Thumbnail তৈরি হয়েছে।");
    } catch (error) {
      setMessage(getErrorMessage(error, "Thumbnail তৈরি করা যায়নি।"));
    }
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
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                  <button type="button" onClick={() => void pickPost(post)} className="w-full text-left">
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
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-700 hover:bg-brand-100"
                    >
                      View
                    </a>
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
                  onChange={(event) => {
                    const nextStatus = event.target.value as Post["status"];
                    updateField("status", nextStatus);
                    if (nextStatus !== "scheduled") {
                      updateField("scheduled_at", "");
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Published করলে post সঙ্গে সঙ্গে live site-এ show করবে।</p>
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
            <div className="mb-3 flex items-center justify-between gap-3">
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
              if (tags.length) {
                updateField("tags", Array.from(new Set([...form.tags.split(","), ...tags])).join(", "));
              }
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
