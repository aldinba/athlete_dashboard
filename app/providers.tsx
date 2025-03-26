"use client"

import { type ReactNode, useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import AuthProvider with no SSR
// Make sure to use a named import that matches the export
const AuthProviderComponent = dynamic(() => import("@/context/auth-context"), {
  ssr: false,
  loading: () => <div>Loading authentication...</div>,
})

export function Providers({ children }: { children: ReactNode }) {
  // This ensures hydration issues don't occur by only rendering children after mounting
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <AuthProviderComponent>{children}</AuthProviderComponent>
}

