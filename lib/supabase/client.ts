import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    // Return a dummy client that won't throw errors but won't work either
    // This allows the UI to render without crashing
    return createSupabaseClient("https://placeholder-url.supabase.co", "placeholder-key")
  }

  // Add debug logging to see what values are being used
  console.log("Initializing Supabase client with:", {
    url: supabaseUrl.substring(0, 10) + "...", // Only log part of the URL for security
    hasKey: !!supabaseAnonKey,
  })

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

