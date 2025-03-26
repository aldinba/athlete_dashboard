"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Activity } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorDetails(null)

    try {
      console.log("Attempting to sign in with:", { email })

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        throw error
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      console.error("Full error object:", error)

      // Create a more detailed error message
      const errorMessage = error.message || "Unknown error occurred"
      let details = ""

      if (error.status) {
        details += `Status: ${error.status}\n`
      }

      if (error.code) {
        details += `Code: ${error.code}\n`
      }

      if (error.name) {
        details += `Name: ${error.name}\n`
      }

      setErrorDetails(details || null)

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorDetails(null)

    try {
      console.log("Attempting to sign up with:", { email })

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        throw error
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your sign up",
      })
    } catch (error: any) {
      console.error("Full error object:", error)

      // Create a more detailed error message
      const errorMessage = error.message || "Unknown error occurred"
      let details = ""

      if (error.status) {
        details += `Status: ${error.status}\n`
      }

      if (error.code) {
        details += `Code: ${error.code}\n`
      }

      if (error.name) {
        details += `Name: ${error.name}\n`
      }

      setErrorDetails(details || null)

      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Athlete Dashboard</h1>
          <p className="text-muted-foreground mt-2">Training analytics and AI coaching for endurance athletes</p>
        </div>

        {errorDetails && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Detailed Error Information</AlertTitle>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-xs mt-2">{errorDetails}</pre>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Enter your email and password to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Create an account to start tracking your training</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

