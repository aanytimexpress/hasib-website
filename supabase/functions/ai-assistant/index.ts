import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type SuggestionResponse = {
  summary: string;
  tags: string[];
  seoKeywords: string[];
  readingMinutes: number;
  relatedHint: string;
};

function localFallback(title: string, content: string): SuggestionResponse {
  const stripped = content.replace(/<[^>]+>/g, " ");
  const sentences = stripped.split(/[.!?।]/).map((item) => item.trim()).filter(Boolean);
  const words = stripped
    .toLowerCase()
    .match(/[a-zA-Z\u0980-\u09FF]{3,}/g);
  const uniqueWords = Array.from(new Set(words ?? [])).slice(0, 8);
  const readingMinutes = Math.max(1, Math.ceil(stripped.split(/\s+/).filter(Boolean).length / 200));

  return {
    summary: sentences.slice(0, 2).join("। ") || `${title} পোস্টের সংক্ষিপ্ত সারাংশ।`,
    tags: uniqueWords.slice(0, 4),
    seoKeywords: uniqueWords.slice(0, 6),
    readingMinutes,
    relatedHint: "একই ক্যাটাগরি ও ট্যাগের পুরোনো পোস্টগুলো রিলেটেড পোস্ট হিসেবে দেখান।"
  };
}

async function verifyEditorOrAdmin(req: Request): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !serviceRole || !anonKey || !authHeader) return false;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });

  const { data: authData } = await callerClient.auth.getUser();
  if (!authData.user) return false;

  const adminClient = createClient(supabaseUrl, serviceRole);
  const { data } = await adminClient
    .from("users")
    .select("role:roles(name)")
    .eq("auth_user_id", authData.user.id)
    .single();

  const roleName = data?.role?.name as string | undefined;
  return roleName === "super_admin" || roleName === "editor";
}

async function generateWithOpenAI(title: string, content: string): Promise<SuggestionResponse | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini";
  const prompt = `
Return only valid JSON with keys:
summary (string, Bengali),
tags (array of max 6 short tags),
seoKeywords (array of max 8 keywords),
readingMinutes (number),
relatedHint (string in Bengali).

Title: ${title}
Content: ${content.slice(0, 9000)}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 500
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const rawText = data.output_text as string | undefined;
  if (!rawText) return null;
  try {
    const parsed = JSON.parse(rawText);
    return {
      summary: parsed.summary ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [],
      readingMinutes: Number(parsed.readingMinutes ?? 1),
      relatedHint: parsed.relatedHint ?? ""
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const allowed = await verifyEditorOrAdmin(req);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const body = await req.json().catch(() => null);
  const title = (body?.title as string | undefined) ?? "";
  const content = (body?.content as string | undefined) ?? "";
  if (!content.trim()) {
    return new Response(JSON.stringify(localFallback(title, content)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const openAiResult = await generateWithOpenAI(title, content);
  const result = openAiResult ?? localFallback(title, content);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
