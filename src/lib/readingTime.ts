const WORDS_PER_MINUTE = 200;

export function calculateReadingTime(content: string): number {
  const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText.length ? plainText.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
