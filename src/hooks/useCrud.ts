import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

interface CrudOptions<T> {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  filter?: { column: string; value: string | number | boolean | null };
  transform?: (rows: T[]) => T[];
}

export function useCrud<T extends { id: string }>(table: string, options?: CrudOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const select = options?.select ?? "*";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase.from(table).select(select);
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }
    if (options?.filter) {
      query = query.eq(options.filter.column, options.filter.value as never);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as T[];
    setItems(options?.transform ? options.transform(rows) : rows);
    setLoading(false);
  }, [table, select, options?.orderBy, options?.ascending, options?.filter, options?.transform]);

  const createItem = useCallback(
    async (payload: Partial<T>) => {
      const { error: insertError } = await supabase.from(table).insert(payload as never);
      if (insertError) throw insertError;
      await load();
    },
    [table, load]
  );

  const updateItem = useCallback(
    async (id: string, payload: Partial<T>) => {
      const { error: updateError } = await supabase.from(table).update(payload as never).eq("id", id);
      if (updateError) throw updateError;
      await load();
    },
    [table, load]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
      if (deleteError) throw deleteError;
      await load();
    },
    [table, load]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(
    () => ({
      items,
      loading,
      error,
      load,
      createItem,
      updateItem,
      deleteItem
    }),
    [items, loading, error, load, createItem, updateItem, deleteItem]
  );
}
