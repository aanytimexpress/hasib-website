export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: Error | null;
}

export interface SupabaseSingleResponse<T> {
  data: T | null;
  error: Error | null;
}
