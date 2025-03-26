"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, TrendingUp, Heart, Activity, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { WorkoutMap } from "./workout-map"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WorkoutDetailsProps {
  workoutId?: string
}

export function WorkoutDetails({ workoutId }: WorkoutDetailsProps) {
  const [workout, setWorkout] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutDetails()
    } else {
      setWorkout(null)
      setError(null)
    }
  }, [workoutId])

  async function fetchWorkoutDetails() {
    if (!workoutId) return

    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      // Fetch workout details
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          workout_metrics(*),
          gps_data(*)
        `)
        .eq("id", workoutId)
        .single()

      if (error) throw error

      setWorkout(data)
    } catch (err) {
      console.error("Error fetching workout details:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch workout details")
      toast({
        title: "Error fetching workout details",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>There was an error loading the workout details</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>Loading workout details...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!workout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Details</CardTitle>
          <CardDescription>Select a workout to view details</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  function formatDistance(distance: number): string {
    return (distance / 1000).toFixed(2) + " km"
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  function formatPace(pace: number): string {
    const minutes = Math.floor(pace)
    const seconds = Math.floor((pace - minutes) * 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{workout.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(workout.date), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </div>
          <Badge>{workout.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1 flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              Distance
            </span>
            <span className="text-2xl font-bold">{formatDistance(workout.distance)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Duration
            </span>
            <span className="text-2xl font-bold">{formatDuration(workout.duration)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Avg Pace
            </span>
            <span className="text-2xl font-bold">{formatPace(workout.workout_metrics.avg_pace)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1 flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              Avg HR
            </span>
            <span className="text-2xl font-bold">{Math.round(workout.workout_metrics.avg_hr)} bpm</span>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Heart Rate</span>
                    <span>{workout.workout_metrics.max_hr} bpm</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elevation Gain</span>
                    <span>{workout.workout_metrics.elevation_gain} m</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Cadence</span>
                    <span>{workout.workout_metrics.avg_cadence} spm</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calories</span>
                    <span>{workout.workout_metrics.calories} kcal</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Training Load</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TRIMP</span>
                    <span>{workout.workout_metrics.trimp.toFixed(1)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HR Drift</span>
                    <span>{(workout.workout_metrics.hr_drift * 100).toFixed(1)}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intensity</span>
                    <span>{workout.workout_metrics.intensity.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VO2max Estimate</span>
                    <span>{workout.workout_metrics.vo2max_estimate?.toFixed(1) || "N/A"} ml/kg/min</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map">
            {workout.gps_data && workout.gps_data.length > 0 ? (
              <WorkoutMap gpsData={workout.gps_data} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>No GPS data available for this workout</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Pace Analysis</h3>
                <p className="text-muted-foreground">
                  Your average pace was {formatPace(workout.workout_metrics.avg_pace)}.
                  {workout.workout_metrics.pace_variability > 0.1
                    ? " Your pace was quite variable during this workout, which might indicate hills or interval training."
                    : " You maintained a consistent pace throughout this workout, showing good pacing control."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Heart Rate Analysis</h3>
                <p className="text-muted-foreground">
                  Your average heart rate was {Math.round(workout.workout_metrics.avg_hr)} bpm (
                  {Math.round(workout.workout_metrics.avg_hr_percentage * 100)}% of max).
                  {workout.workout_metrics.hr_drift > 0.05
                    ? " Your heart rate drift of " +
                      (workout.workout_metrics.hr_drift * 100).toFixed(1) +
                      "% indicates some cardiovascular fatigue during this session."
                    : " Your heart rate drift was minimal, indicating good cardiovascular efficiency."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Training Effect</h3>
                <p className="text-muted-foreground">
                  This workout contributed {workout.workout_metrics.trimp.toFixed(1)} TRIMP points to your training
                  load.
                  {workout.workout_metrics.intensity > 1.05
                    ? " This was a high-intensity session that will primarily boost your anaerobic capacity and VO2max."
                    : " This was a moderate-intensity session that will primarily enhance your aerobic endurance."}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

