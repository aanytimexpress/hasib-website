import { supabase } from "./supabase";
import { calculateReadingTime } from "./readingTime";

export interface AiSuggestionInput {
  title: string;
  content: string;
}

export interface AiSuggestionOutput {
  summary: string;
  tags: string[];
  seoKeywords: string[];
  readingMinutes: number;
  relatedHint: string;
}

function fallbackAssistant(input: AiSuggestionInput): AiSuggestionOutput {
  const sentences = input.content.replace(/<[^>]+>/g, " ").split(/[.!?।]/).map((s) => s.trim());
  const summary = sentences.filter(Boolean).slice(0, 2).join("। ");
  const words = input.content
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .match(/[a-zA-Z\u0980-\u09FF]{3,}/g);
  const topWords = Array.from(new Set(words ?? [])).slice(0, 5);

  return {
    summary: summary || `${input.title} পোস্টের সংক্ষিপ্ত সারাংশ তৈরি করা হয়েছে।`,
    tags: topWords.slice(0, 4),
    seoKeywords: topWords.slice(0, 6),
    readingMinutes: calculateReadingTime(input.content),
    relatedHint: "এই পোস্টের সাথে অনুরূপ লেখার জন্য একই ট্যাগের পুরোনো পোস্টগুলো দেখুন।"
  };
}

export async function generateAiSuggestions(input: AiSuggestionInput): Promise<AiSuggestionOutput> {
  if (!input.content.trim()) {
    return fallbackAssistant(input);
  }

  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: {
      mode: "post-helper",
      ...input
    }
  });

  if (error || !data) {
    return fallbackAssistant(input);
  }

  return {
    summary: data.summary ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    seoKeywords: Array.isArray(data.seoKeywords) ? data.seoKeywords : [],
    readingMinutes: Number(data.readingMinutes ?? calculateReadingTime(input.content)),
    relatedHint: data.relatedHint ?? ""
  };
}
