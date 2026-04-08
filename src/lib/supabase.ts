import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const IS_SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);
const DEMO_ERROR_MESSAGE =
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env";

type GenericSupabaseClient = SupabaseClient<any, "public", any>;

function createDemoQueryBuilder() {
  let expectSingle = false;
  const response = () => ({
    data: expectSingle ? null : [],
    error: { message: DEMO_ERROR_MESSAGE },
    count: 0
  });

  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    or: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    textSearch: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    single: () => {
      expectSingle = true;
      return builder;
    },
    maybeSingle: () => {
      expectSingle = true;
      return builder;
    },
    then: (onFulfilled?: (value: ReturnType<typeof response>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(response()).then(onFulfilled, onRejected)
  };

  return builder;
}

function createDemoClient() {
  return {
    from: () => createDemoQueryBuilder(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: DEMO_ERROR_MESSAGE } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => undefined
          }
        }
      })
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: DEMO_ERROR_MESSAGE } }),
        remove: async () => ({ data: null, error: { message: DEMO_ERROR_MESSAGE } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
    },
    functions: {
      invoke: async () => ({ data: null, error: { message: DEMO_ERROR_MESSAGE } })
    }
  } as unknown as GenericSupabaseClient;
}

if (!IS_SUPABASE_CONFIGURED) {
  console.warn(`${DEMO_ERROR_MESSAGE}. Running in UI demo mode.`);
}

const realClient = createClient(supabaseUrl || "https://example.com", supabaseAnonKey || "demo-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const supabase = (IS_SUPABASE_CONFIGURED ? realClient : createDemoClient()) as GenericSupabaseClient;

export const MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET || "media";
