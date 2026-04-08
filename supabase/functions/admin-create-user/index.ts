import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization");

  if (!supabaseUrl || !serviceRole || !anonKey || !authHeader) {
    return new Response(JSON.stringify({ error: "Missing environment configuration." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });
  const adminClient = createClient(supabaseUrl, serviceRole);

  const { data: callerAuth } = await callerClient.auth.getUser();
  if (!callerAuth.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: callerProfile } = await adminClient
    .from("users")
    .select("role:roles(name)")
    .eq("auth_user_id", callerAuth.user.id)
    .single();
  if (callerProfile?.role?.name !== "super_admin") {
    return new Response(JSON.stringify({ error: "Only super admin can create users." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = (body?.password as string | undefined)?.trim();
  const fullName = (body?.full_name as string | undefined)?.trim() || "New User";
  const roleName = (body?.role as string | undefined) || "editor";

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: roleData } = await adminClient.from("roles").select("id").eq("name", roleName).single();
  if (!roleData?.id) {
    return new Response(JSON.stringify({ error: "Invalid role." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { data: authCreated, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError || !authCreated.user) {
    return new Response(JSON.stringify({ error: authError?.message || "User creation failed." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const { error: profileError } = await adminClient.from("users").upsert({
    auth_user_id: authCreated.user.id,
    email,
    full_name: fullName,
    role_id: roleData.id
  });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ message: "User created successfully." }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
