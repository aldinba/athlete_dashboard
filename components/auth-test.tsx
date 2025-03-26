"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function AuthTest() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)

  const testSignUp = async () => {
    if (!email || !password) {
      setTestResult({
        success: false,
        message: "Please enter both email and password",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // Safely handle potentially undefined user data
      const userDetails = data.user
        ? {
            id: data.user.id || "Unknown",
            email: data.user.email || "Unknown",
            confirmed: !data.user.email_confirmed_at ? "No (check email)" : "Yes",
          }
        : null

      setTestResult({
        success: true,
        message: "Sign up successful!",
        details: userDetails
          ? `User ID: ${userDetails.id}\nEmail: ${userDetails.email}\nConfirmed: ${userDetails.confirmed}`
          : "User created. Please check your email for confirmation.",
      })
    } catch (error: any) {
      console.error("Auth test error:", error)

      setTestResult({
        success: false,
        message: "Sign up failed",
        details: `Error: ${error.message || "Unknown error"}\n${error.code ? `Code: ${error.code}` : ""}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testSignIn = async () => {
    if (!email || !password) {
      setTestResult({
        success: false,
        message: "Please enter both email and password",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Safely handle potentially undefined user data
      const userDetails = data.user
        ? {
            id: data.user.id || "Unknown",
            email: data.user.email || "Unknown",
          }
        : null

      setTestResult({
        success: true,
        message: "Sign in successful!",
        details: userDetails
          ? `User ID: ${userDetails.id}\nEmail: ${userDetails.email}`
          : "User authenticated successfully.",
      })
    } catch (error: any) {
      console.error("Auth test error:", error)

      setTestResult({
        success: false,
        message: "Sign in failed",
        details: `Error: ${error.message || "Unknown error"}\n${error.code ? `Code: ${error.code}` : ""}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
        <CardDescription>Test Supabase authentication functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Email</Label>
          <Input
            id="test-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-password">Password</Label>
          <Input id="test-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
      <CardFooter className="flex gap-2">
        <Button onClick={testSignUp} disabled={isLoading} variant="outline" className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Sign Up"
          )}
        </Button>
        <Button onClick={testSignIn} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Sign In"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

