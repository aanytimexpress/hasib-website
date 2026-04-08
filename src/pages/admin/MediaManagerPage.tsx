import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { EmptyState } from "../../components/admin/EmptyState";
import { compressImage, createThumbnail, formatBytes } from "../../lib/media";
import { MEDIA_BUCKET, supabase } from "../../lib/supabase";
import { MediaItem } from "../../types/models";

export default function MediaManagerPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const { data } = await supabase.from("media_library").select("*").order("created_at", { ascending: false });
    setItems((data as MediaItem[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const folderOptions = useMemo(() => {
    const values = Array.from(new Set(items.map((item) => item.folder).filter(Boolean) as string[]));
    return values;
  }, [items]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.alt_text || "").toLowerCase().includes(search.toLowerCase());
      const matchesFolder = !folder || item.folder === folder;
      return matchesSearch && matchesFolder;
    });
  }, [items, search, folder]);

  const uploadMedia = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const optimized = await compressImage(file);
    const thumbnail = optimized.type.startsWith("image/") ? await createThumbnail(file) : null;
    const targetFolder = newFolder.trim() || folder || "general";
    const path = `${targetFolder}/${Date.now()}-${optimized.name}`;
    const thumbPath = thumbnail ? `${targetFolder}/thumb-${Date.now()}-${thumbnail.name}` : null;

    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
      upsert: true,
      cacheControl: "3600"
    });
    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    if (thumbPath && thumbnail) {
      await supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumbnail, { upsert: true });
    }

    const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    const thumbnailUrl = thumbPath ? supabase.storage.from(MEDIA_BUCKET).getPublicUrl(thumbPath).data.publicUrl : null;

    await supabase.from("media_library").insert({
      title: file.name,
      file_path: path,
      bucket: MEDIA_BUCKET,
      mime_type: optimized.type,
      size_bytes: optimized.size,
      folder: targetFolder,
      url: publicUrlData.publicUrl,
      thumbnail_url: thumbnailUrl
    });

    setMessage("Media uploaded successfully.");
    setNewFolder("");
    await load();
  };

  const removeMedia = async (item: MediaItem) => {
    if (!window.confirm("এই মিডিয়া ফাইল ডিলিট করতে চান?")) return;
    await supabase.storage.from(item.bucket || MEDIA_BUCKET).remove([item.file_path]);
    if (item.thumbnail_url?.includes("/")) {
      const thumbPath = item.thumbnail_url.split(`/${item.bucket || MEDIA_BUCKET}/`)[1];
      if (thumbPath) {
        await supabase.storage.from(item.bucket || MEDIA_BUCKET).remove([thumbPath]);
      }
    }
    await supabase.from("media_library").delete().eq("id", item.id);
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Media Library" description="Upload, search, reuse, folder support and delete media files." />

      <AdminCard className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Search media..."
          />
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            className="rounded-lg border border-slate-300 p-2"
          >
            <option value="">All folders</option>
            {folderOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={newFolder}
            onChange={(event) => setNewFolder(event.target.value)}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="New folder"
          />
          <input type="file" onChange={(event) => void uploadMedia(event)} />
        </div>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </AdminCard>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Files</h3>
        {visibleItems.length ? (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                {item.thumbnail_url || item.url ? (
                  <img
                    src={item.thumbnail_url || item.url || ""}
                    alt={item.title}
                    className="mb-2 h-28 w-full rounded object-cover"
                    loading="lazy"
                  />
                ) : null}
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.folder || "general"}</p>
                <p className="text-xs text-slate-500">{formatBytes(item.size_bytes)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url || "");
                      setMessage("Media URL copied.");
                    }}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeMedia(item)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No media found." subtitle="Upload files to populate the media library." />
        )}
      </AdminCard>
    </div>
  );
}
