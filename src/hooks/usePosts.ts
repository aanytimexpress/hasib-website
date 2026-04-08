import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { Post } from "../types/models";

interface UsePostsParams {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
  onlyPublished?: boolean;
}

export function usePosts(params: UsePostsParams = {}) {
  const {
    page = 1,
    pageSize = 9,
    categorySlug,
    tagSlug,
    query,
    onlyPublished = true
  } = params;
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      let tagPostIds: string[] | null = null;
      if (tagSlug) {
        const { data: tagData } = await supabase.from("tags").select("id").eq("slug", tagSlug).single();
        if (!tagData?.id) {
          setPosts([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        const { data: taggedPosts } = await supabase
          .from("post_tags")
          .select("post_id")
          .eq("tag_id", tagData.id);
        tagPostIds = (taggedPosts ?? []).map((item) => item.post_id);
        if (!tagPostIds.length) {
          setPosts([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }

      let baseQuery = supabase
        .from("posts")
        .select("*, category:categories(*)", { count: "exact" })
        .order("published_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (onlyPublished) {
        baseQuery = baseQuery.eq("status", "published");
      }

      if (query?.trim()) {
        baseQuery = baseQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      if (categorySlug) {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        if (categoryData) {
          baseQuery = baseQuery.eq("category_id", categoryData.id);
        }
      }

      if (tagPostIds) {
        baseQuery = baseQuery.in("id", tagPostIds);
      }

      const { data, error: postError, count } = await baseQuery;

      if (postError) {
        setError(postError.message);
        setLoading(false);
        return;
      }

      const finalPosts = (data ?? []) as Post[];
      setPosts(finalPosts);
      setTotal(count ?? finalPosts.length);
      setLoading(false);
    };

    void run();
  }, [page, pageSize, categorySlug, tagSlug, query, onlyPublished]);

  return useMemo(
    () => ({
      posts,
      total,
      loading,
      error
    }),
    [posts, total, loading, error]
  );
}
