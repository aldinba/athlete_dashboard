import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a variable to store the client instance
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // If we already have a client instance, return it to prevent unnecessary re-creation
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      // Return a dummy client that won't throw errors but won't work either
      // This allows the UI to render without crashing
      supabaseClient = createSupabaseClient("https://placeholder-url.supabase.co", "placeholder-key")
      return supabaseClient
    }

    // Create a new client instance
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    // Return a dummy client in case of any errors
    return createSupabaseClient("https://placeholder-url.supabase.co", "placeholder-key")
  }
}

