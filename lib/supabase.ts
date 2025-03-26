import { createClient } from "@supabase/supabase-js"

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Return a mock client for SSR
    return createMockSupabaseClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or anon key is missing. Using mock client.")
    return createMockSupabaseClient()
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
  } catch (error) {
    console.error("Error initializing Supabase client:", error)
    return createMockSupabaseClient()
  }
}

// Create a mock Supabase client that doesn't throw errors
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
      signInWithPassword: async () => ({ data: null, error: new Error("Supabase not configured") }),
      signUp: async () => ({ data: null, error: new Error("Supabase not configured") }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: new Error("Supabase not configured") }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
        }),
        order: () => ({ data: [], error: null }),
        gte: () => ({
          lte: () => ({
            order: () => ({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: async () => ({ data: null, error: new Error("Supabase not configured") }),
      }),
      update: () => ({
        eq: () => ({
          select: async () => ({ data: null, error: new Error("Supabase not configured") }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ error: new Error("Supabase not configured") }),
      }),
    }),
  } as unknown as ReturnType<typeof createClient>
}

// Export the supabase client for convenience
export const supabase =
  typeof window !== "undefined" ? getSupabase() : (null as unknown as ReturnType<typeof createClient>)

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]

// Define database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          max_heart_rate: number | null
          resting_heart_rate: number | null
          weight_kg: number | null
          height_cm: number | null
          gender: "male" | "female" | "other" | null
          birth_date: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          max_heart_rate?: number | null
          resting_heart_rate?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          gender?: "male" | "female" | "other" | null
          birth_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          max_heart_rate?: number | null
          resting_heart_rate?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          gender?: "male" | "female" | "other" | null
          birth_date?: string | null
        }
      }
      workouts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          type: string
          date: string
          distance: number
          duration: number
          pace: number
          elevation_gain: number
          avg_heart_rate: number | null
          max_heart_rate: number | null
          notes: string | null
          gpx_file_url: string | null
          has_gps_data: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          type: string
          date: string
          distance: number
          duration: number
          pace: number
          elevation_gain: number
          avg_heart_rate?: number | null
          max_heart_rate?: number | null
          notes?: string | null
          gpx_file_url?: string | null
          has_gps_data?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          type?: string
          date?: string
          distance?: number
          duration?: number
          pace?: number
          elevation_gain?: number
          avg_heart_rate?: number | null
          max_heart_rate?: number | null
          notes?: string | null
          gpx_file_url?: string | null
          has_gps_data?: boolean
        }
      }
      workout_gps_points: {
        Row: {
          id: string
          workout_id: string
          latitude: number
          longitude: number
          elevation: number | null
          timestamp: string | null
          heart_rate: number | null
          speed: number | null
          cadence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          latitude: number
          longitude: number
          elevation?: number | null
          timestamp?: string | null
          heart_rate?: number | null
          speed?: number | null
          cadence?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          latitude?: number
          longitude?: number
          elevation?: number | null
          timestamp?: string | null
          heart_rate?: number | null
          speed?: number | null
          cadence?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

