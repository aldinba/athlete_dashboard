"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Upload, Calendar, Activity, AlertTriangle } from "lucide-react"
import { WorkoutUploader } from "./workout-uploader"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Workout {
  id: string
  title: string
  date: string
  distance: number
  duration: number
  type: string
}

interface WorkoutSidebarProps {
  selectedWorkoutId: string | null
  onSelectWorkout: (id: string) => void
}

export function WorkoutSidebar({ selectedWorkoutId, onSelectWorkout }: WorkoutSidebarProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isUploaderOpen, setIsUploaderOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Use useCallback to prevent the function from being recreated on every render
  const fetchWorkouts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      const { data, error } = await supabase.from("workouts").select("*").order("date", { ascending: false })

      if (error) throw error

      if (data) {
        setWorkouts(data)
        // Select the most recent workout by default if none is selected
        if (!selectedWorkoutId && data.length > 0) {
          onSelectWorkout(data[0].id)
        }
      }
    } catch (err) {
      console.error("Error fetching workouts:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch workouts")
      toast({
        title: "Error fetching workouts",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedWorkoutId, onSelectWorkout, toast, supabase])

  // Use useEffect with proper dependencies
  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  function formatDistance(distance: number): string {
    return (distance / 1000).toFixed(2) + " km"
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="w-80 border-r bg-muted/40 h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-2">Workouts</h2>
        <Button className="w-full" onClick={() => setIsUploaderOpen(true)} disabled={!!error}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Workout
        </Button>
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

          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading workouts...</p>
            </div>
          )}

          {!isLoading && !error && workouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workouts found</p>
              <p className="text-sm mt-1">Upload your first workout to get started</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            workouts.map((workout) => (
              <div key={workout.id}>
                <button
                  className={`w-full text-left p-3 rounded-md hover:bg-accent transition-colors ${
                    selectedWorkoutId === workout.id ? "bg-accent" : ""
                  }`}
                  onClick={() => onSelectWorkout(workout.id)}
                >
                  <div className="font-medium">{workout.title}</div>
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(workout.date), { addSuffix: true })}
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="flex items-center">
                      <Activity className="h-3 w-3 mr-1" />
                      {formatDistance(workout.distance)}
                    </span>
                    <span>{formatDuration(workout.duration)}</span>
                  </div>
                </button>
                <Separator className="my-2" />
              </div>
            ))}
        </div>
      </ScrollArea>

      <WorkoutUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUploadSuccess={() => {
          setIsUploaderOpen(false)
          toast({
            title: "Workout uploaded",
            description: "Your workout has been processed successfully",
          })
          // Refresh the workout list after a successful upload
          fetchWorkouts()
        }}
      />
    </div>
  )
}

