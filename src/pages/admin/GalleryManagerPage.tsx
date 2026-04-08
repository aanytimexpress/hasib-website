import { ChangeEvent, useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { compressImage, createThumbnail } from "../../lib/media";
import { MEDIA_BUCKET, supabase } from "../../lib/supabase";
import { GalleryCategory, GalleryItem } from "../../types/models";
import { slugify } from "../../lib/slug";

export default function GalleryManagerPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [newAlbum, setNewAlbum] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  const load = async () => {
    const [{ data: categoryData }, { data: itemData }] = await Promise.all([
      supabase.from("gallery_categories").select("*").order("name"),
      supabase.from("gallery").select("*, category:gallery_categories(*)").order("sort_order")
    ]);
    setCategories((categoryData as GalleryCategory[]) ?? []);
    setItems((itemData as GalleryItem[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const createAlbum = async () => {
    if (!newAlbum.trim()) return;
    const slug = slugify(newAlbum);
    const { error } = await supabase.from("gallery_categories").insert({ name: newAlbum, slug });
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewAlbum("");
    await load();
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file, 1800, 0.82);
    const thumb = await createThumbnail(file, 500);

    const imagePath = `gallery/${Date.now()}-${compressed.name}`;
    const thumbPath = `gallery/thumb-${Date.now()}-${thumb.name}`;

    const [{ error: uploadError }, { error: thumbError }] = await Promise.all([
      supabase.storage.from(MEDIA_BUCKET).upload(imagePath, compressed, { upsert: true }),
      supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumb, { upsert: true })
    ]);

    if (uploadError || thumbError) {
      setMessage(uploadError?.message || thumbError?.message || "Upload failed.");
      return;
    }

    const { data: imageUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(imagePath);
    const { data: thumbUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(thumbPath);

    await Promise.all([
      supabase.from("gallery").insert({
        title: uploadTitle || file.name,
        image_url: imageUrlData.publicUrl,
        thumbnail_url: thumbUrlData.publicUrl,
        category_id: uploadCategory || null
      }),
      supabase.from("media_library").insert({
        title: uploadTitle || file.name,
        file_path: imagePath,
        bucket: MEDIA_BUCKET,
        mime_type: compressed.type,
        size_bytes: compressed.size,
        folder: "gallery",
        url: imageUrlData.publicUrl,
        thumbnail_url: thumbUrlData.publicUrl
      })
    ]);

    setUploadTitle("");
    setMessage("Image uploaded successfully.");
    await load();
  };

  const deleteImage = async (item: GalleryItem) => {
    if (!window.confirm("এই ছবি ডিলিট করতে চান?")) return;
    await supabase.from("gallery").delete().eq("id", item.id);
    await load();
  };

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from("gallery").update({ caption }).eq("id", id);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Gallery Manager" description="Albums, uploads, captions, and preview." />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Create Album</h3>
          <input
            value={newAlbum}
            onChange={(event) => setNewAlbum(event.target.value)}
            placeholder="Album name"
            className="w-full rounded-lg border border-slate-300 p-2"
          />
          <button
            type="button"
            onClick={() => void createAlbum()}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Album
          </button>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                {item.name}
              </span>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Upload Image</h3>
          <input
            value={uploadTitle}
            onChange={(event) => setUploadTitle(event.target.value)}
            placeholder="Image title"
            className="w-full rounded-lg border border-slate-300 p-2"
          />
          <select
            value={uploadCategory}
            onChange={(event) => setUploadCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2"
          >
            <option value="">No album</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input type="file" accept="image/*" onChange={(event) => void uploadImage(event)} />
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </AdminCard>
      </div>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Gallery Items</h3>
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-2">
                <button type="button" onClick={() => setPreview(item)} className="w-full">
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.title}
                    className="mb-2 h-36 w-full rounded object-cover"
                    loading="lazy"
                  />
                </button>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <textarea
                  defaultValue={item.caption || ""}
                  rows={2}
                  onBlur={(event) => void updateCaption(item.id, event.target.value)}
                  className="mt-2 w-full rounded border border-slate-300 p-1 text-xs"
                  placeholder="Caption"
                />
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPreview(item)}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteImage(item)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No gallery images yet." />
        )}
      </AdminCard>

      {preview ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{preview.title}</h3>
              <button type="button" onClick={() => setPreview(null)} className="rounded bg-slate-100 px-3 py-1 text-sm">
                Close
              </button>
            </div>
            <img src={preview.image_url} alt={preview.title} className="max-h-[70vh] w-full rounded-xl object-contain" />
            {preview.caption ? <p className="mt-3 text-sm text-slate-700">{preview.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
