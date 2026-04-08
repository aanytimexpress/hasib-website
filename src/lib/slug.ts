export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

export function slugify(text: string): string {
  const transliterated = text
    .split("")
    .map((char) => BANGLA_MAP[char] ?? char)
    .join("");

  const slug = transliterated
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (slug.length > 0) {
    return slug;
  }

  return `post-${Math.random().toString(36).slice(2, 8)}`;
}
