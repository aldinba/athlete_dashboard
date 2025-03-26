"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"
import type { Tables } from "@/lib/supabase"

type Profile = Tables<"profiles">

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
  }>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Export the component as both default and named export
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      setIsConfigured(false)
      setIsLoading(false)
      return
    }

    const setData = async () => {
      try {
        const supabase = getSupabase()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error(error)
          setIsLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setProfile(profile)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Auth initialization error:", error)
        setIsLoading(false)
      }
    }

    setData()

    let authListener: { subscription: { unsubscribe: () => void } } | null = null

    try {
      const supabase = getSupabase()
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setProfile(profile)
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      })

      authListener = listener
    } catch (error) {
      console.error("Auth listener error:", error)
    }

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error("Supabase is not configured. Please set environment variables.") }
    }

    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        router.push("/")
      }

      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error: new Error("Failed to sign in. Please try again.") }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: new Error("Supabase is not configured. Please set environment variables.") }
    }

    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (!error) {
        router.push("/auth/verify")
      }

      return { error }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: new Error("Failed to sign up. Please try again.") }
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      router.push("/auth/login")
      return
    }

    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: new Error("Supabase is not configured. Please set environment variables.") }
    }

    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      return { error }
    } catch (error) {
      console.error("Reset password error:", error)
      return { error: new Error("Failed to reset password. Please try again.") }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Also export as default for dynamic import
export default AuthProvider

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

