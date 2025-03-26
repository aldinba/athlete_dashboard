"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const [envVars, setEnvVars] = useState({
    url: "Not set",
    key: "Not set",
  })

  useEffect(() => {
    // Get the environment variables (masked for security)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Safely handle potentially undefined values
    if (url) {
      const maskedUrl = `${url.substring(0, 8)}...${url.substring(Math.max(0, url.length - 5))}`
      setEnvVars((prev) => ({ ...prev, url: maskedUrl }))
    }

    if (key) {
      const maskedKey = `${key.substring(0, 3)}...${key.substring(Math.max(0, key.length - 3))}`
      setEnvVars((prev) => ({ ...prev, key: maskedKey }))
    }
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const supabase = createClient()

      // Test 1: Simple query to check connection
      const { data, error } = await supabase.from("profiles").select("count", { count: "exact" }).limit(0)

      if (error) {
        throw error
      }

      setTestResult({
        success: true,
        message: "Successfully connected to Supabase!",
        details: "The connection to your Supabase project is working correctly.",
      })
    } catch (error: any) {
      console.error("Supabase test error:", error)

      setTestResult({
        success: false,
        message: "Failed to connect to Supabase",
        details: `Error: ${error.message || "Unknown error"}\n${error.code ? `Code: ${error.code}` : ""}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Verify your Supabase connection is working properly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Supabase URL:</div>
          <div className="font-mono text-sm">{envVars.url}</div>

          <div className="font-medium">Anon Key:</div>
          <div className="font-mono text-sm">{envVars.key}</div>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>{testResult.message}</AlertTitle>
            </div>
            {testResult.details && (
              <AlertDescription className="mt-2">
                <pre className="whitespace-pre-wrap text-xs mt-2">{testResult.details}</pre>
              </AlertDescription>
            )}
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

