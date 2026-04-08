import { format } from "date-fns";

export function formatDate(date?: string | null): string {
  if (!date) return "";
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch {
    return date;
  }
}
