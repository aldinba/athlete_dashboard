"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, RefreshCw, ChevronRight, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SmartCoachPanelProps {
  workoutId: string | null
}

export function SmartCoachPanel({ workoutId }: SmartCoachPanelProps) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (workoutId) {
      fetchCoachingAdvice()
    } else {
      setAdvice(null)
      setError(null)
    }
  }, [workoutId])

  async function fetchCoachingAdvice() {
    if (!workoutId) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      // Check if we already have advice for this workout
      const { data: existingAdvice, error: fetchError } = await supabase
        .from("coaching_advice")
        .select("advice")
        .eq("workout_id", workoutId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (existingAdvice) {
        setAdvice(existingAdvice.advice)
      } else {
        // Generate new advice
        const { data, error } = await supabase.functions.invoke("generate-coaching-advice", {
          body: { workoutId },
        })

        if (error) throw error

        setAdvice(data.advice)
      }
    } catch (err) {
      console.error("Error fetching coaching advice:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch coaching advice")
      toast({
        title: "Error fetching coaching advice",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function regenerateAdvice() {
    if (!workoutId) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      const { data, error } = await supabase.functions.invoke("generate-coaching-advice", {
        body: { workoutId, forceRegenerate: true },
      })

      if (error) throw error

      setAdvice(data.advice)
    } catch (err) {
      console.error("Error regenerating coaching advice:", err)
      setError(err instanceof Error ? err.message : "Failed to regenerate coaching advice")
      toast({
        title: "Error regenerating advice",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-80 border-l bg-muted/40 h-screen flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          <h2 className="text-xl font-semibold">Smart Coach</h2>
        </div>
        {workoutId && !error && (
          <Button variant="ghost" size="icon" onClick={regenerateAdvice} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Regenerate advice</span>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!workoutId && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Select a workout to get coaching advice</p>
            </div>
          )}

          {workoutId && isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Analyzing your workout...</p>
            </div>
          )}

          {workoutId && !isLoading && advice && !error && (
            <div className="prose prose-sm dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: advice }} />
            </div>
          )}
        </div>
      </ScrollArea>

      {workoutId && !isLoading && advice && !error && (
        <div className="p-4 border-t">
          <Button className="w-full">
            Get Training Plan
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

