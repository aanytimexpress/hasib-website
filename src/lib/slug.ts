const BANGLA_MAP: Record<string, string> = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "ii", "উ": "u", "ঊ": "uu",
  "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",

  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng",
  "চ": "c", "ছ": "ch", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n",
  "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "ph", "ব": "b", "ভ": "bh", "ম": "m",

  "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh", "স": "s", "হ": "h",

  "া": "a", "ি": "i", "ী": "ii", "ু": "u", "ূ": "uu",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou"
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
