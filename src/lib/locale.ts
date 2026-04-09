const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const STATIC_TEXT_MAP: Record<string, string> = {
  "Hasibur Rahman": "হাসিবুর রহমান",
  "Bogura Bangladesh": "বগুড়া, বাংলাদেশ",
  "Bogura, Bangladesh": "বগুড়া, বাংলাদেশ",
  Bangla: "বাংলা",
  Bengali: "বাংলা",
  English: "ইংরেজি"
};

export function toBanglaNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

export function localizeStaticText(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  return STATIC_TEXT_MAP[trimmed] ?? trimmed;
}

export function localizeLanguage(value: string): string {
  return localizeStaticText(value) || value;
}

export function localizeRoleName(role: string | null | undefined): string {
  switch (role) {
    case "super_admin":
      return "সুপার অ্যাডমিন";
    case "editor":
      return "সম্পাদক";
    case "moderator":
      return "মডারেটর";
    case "user":
      return "পাঠক";
    default:
      return "পাঠক";
  }
}
