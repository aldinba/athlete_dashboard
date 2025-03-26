"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function EnvironmentVariablesCheck() {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Only run this check once
    if (!checked) {
      try {
        const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

        // Safely check if environment variables exist
        const missing = requiredVars.filter((varName) => {
          const value = process.env[varName as keyof typeof process.env]
          return !value
        })

        setMissingVars(missing)
      } catch (error) {
        console.error("Error checking environment variables:", error)
        // If there's an error, assume all variables are missing
        setMissingVars(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
      }

      setChecked(true)
    }
  }, [checked])

  if (missingVars.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Environment Variables</AlertTitle>
      <AlertDescription>
        <p>The following environment variables are missing:</p>
        <ul className="list-disc pl-5 mt-2">
          {missingVars.map((varName) => (
            <li key={varName}>{varName}</li>
          ))}
        </ul>
        <p className="mt-2">Please make sure these variables are properly set in your environment.</p>
      </AlertDescription>
    </Alert>
  )
}

