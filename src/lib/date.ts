export function formatDate(date?: string | null): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date));
  } catch {
    return date;
  }
}
