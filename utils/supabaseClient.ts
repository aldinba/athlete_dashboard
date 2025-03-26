import { createClient } from "@supabase/supabase-js"

let supabase: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (supabase) {
    return supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or anon key is missing.")
    return null
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)
  return supabase
}

