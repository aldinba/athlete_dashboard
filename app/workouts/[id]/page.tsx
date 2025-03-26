"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Mountain,
  Activity,
  BarChart3,
  Heart,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Map,
} from "lucide-react"
import dynamic from "next/dynamic"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  getWorkoutById,
  getWorkoutGpsData,
  formatPace,
  formatDuration,
  deleteWorkout,
  type Workout,
} from "@/lib/workout-service"

// Dynamically import the WorkoutCharts component
const WorkoutCharts = dynamic(() => import("@/components/workout-charts").then((mod) => mod.WorkoutCharts), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted/30 rounded-lg flex items-center justify-center">
      <Skeleton className="h-[250px] w-full" />
    </div>
  ),
})

// Dynamically import the RouteMap component with a loading fallback
const RouteMap = dynamic(() => import("@/components/route-map"), {
  ssr: false,
  loading: () => (
    <Card className="w-full">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg flex items-center">
          <Map className="h-4 w-4 mr-2" />
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </CardContent>
    </Card>
  ),
})

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading: authLoading, isConfigured } = useAuth()
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [gpsData, setGpsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGps, setLoadingGps] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  // Fetch workout data
  useEffect(() => {
    // Skip if we're still loading auth or if we need to redirect
    if (authLoading) return

    if (!user && isConfigured) {
      router.push("/auth/login")
      return
    }

    // Check if the ID is "import" - if so, redirect to the import page
    if (id === "import") {
      router.push("/workouts/import")
      return
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      setError(`Invalid workout ID format: ${id}`)
      setLoading(false)
      return
    }

    // Fetch workout data
    const fetchWorkout = async () => {
      try {
        const workoutData = await getWorkoutById(id)
        if (!workoutData) {
          setError("Workout not found")
          return
        }
        setWorkout(workoutData)
      } catch (error) {
        console.error("Error fetching workout:", error)
        setError("Failed to load workout data")
      } finally {
        setLoading(false)
      }
    }

    // Fetch GPS data separately to avoid blocking the UI
    const fetchGpsData = async () => {
      try {
        const gpsPoints = await getWorkoutGpsData(id)
        if (gpsPoints && gpsPoints.length > 0) {
          setGpsData(gpsPoints)
        }
      } catch (error) {
        console.error("Error fetching GPS data:", error)
      } finally {
        setLoadingGps(false)
      }
    }

    if (user || !isConfigured) {
      fetchWorkout()
      fetchGpsData()
    }
  }, [user, authLoading, isConfigured, router, id])

  const handleDeleteWorkout = async () => {
    if (!workout) return

    try {
      setIsDeleting(true)
      setDeleteStatus("loading")

      await deleteWorkout(workout.id)

      setDeleteStatus("success")

      // Show success toast
      toast({
        title: "Workout deleted",
        description: "The workout has been successfully deleted.",
        variant: "default",
        duration: 3000,
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/activities")
      }, 1500)
    } catch (error) {
      console.error("Error deleting workout:", error)
      setError("Failed to delete workout")
      setIsDeleting(false)
      setDeleteStatus("error")

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })
    }
  }

  // Render loading skeleton
  if (authLoading) {
    return <LoadingSkeleton />
  }

  // Render error state
  if (error || (!loading && !workout)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <Button variant="ghost" onClick={() => router.push("/activities")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Button>

          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Workout not found</h2>
              <p className="text-muted-foreground mt-2">
                {error || "The workout you're looking for doesn't exist or you don't have access to it."}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/activities">View All Activities</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show skeleton while loading workout data
  if (loading) {
    return <LoadingSkeleton />
  }

  // At this point, we know workout is not null
  const workoutData = workout as Workout

  const workoutDate = new Date(workoutData.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Calculate additional metrics
  const paceMinPerKm = workoutData.pace / 60
  const caloriesBurned = Math.round(workoutData.distance * 60 * (paceMinPerKm < 5 ? 1.2 : 1.0))
  const isImported = workoutData.notes?.includes("Imported from")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => router.push("/activities")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Workout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the workout and all associated data
                  including GPS points.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWorkout}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteStatus === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : deleteStatus === "success" ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Deleted!
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{workoutData.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  {workoutDate}
                </CardDescription>
              </div>
              <Badge variant={isImported ? "secondary" : "outline"}>{isImported ? "Imported" : workoutData.type}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="text-xl font-bold">{workoutData.distance.toFixed(2)} km</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-xl font-bold">{formatDuration(workoutData.duration)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Activity className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Pace</span>
                  <span className="text-xl font-bold">{formatPace(workoutData.pace)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                  <Mountain className="h-5 w-5 text-primary mb-2" />
                  <span className="text-sm text-muted-foreground">Elevation</span>
                  <span className="text-xl font-bold">{workoutData.elevation_gain}m</span>
                </div>
              </div>

              {/* Map section */}
              <div className="mt-6">
                {loadingGps ? (
                  <Card className="w-full">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="text-lg flex items-center">
                        <Map className="h-4 w-4 mr-2" />
                        Route Map
                      </CardTitle>
                      <CardDescription>Loading GPS data...</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="h-[400px] w-full bg-muted/30 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                      </div>
                    </CardContent>
                  </Card>
                ) : gpsData.length > 0 ? (
                  <RouteMap
                    gpsData={gpsData}
                    height="500px"
                    workoutTitle={workoutData.title}
                    workoutType={workoutData.type}
                    workoutDate={workoutDate}
                  />
                ) : (
                  <div className="flex items-center justify-center bg-muted/30 rounded-lg h-[300px]">
                    <div className="text-center">
                      <Map className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No GPS data available for this workout</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Charts section */}
              {gpsData.length > 0 && (
                <div className="mt-6">
                  <WorkoutCharts gpsData={gpsData} />
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Heart Rate</h3>
                  <Separator className="mb-4" />

                  {workoutData.avg_heart_rate ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                        <Heart className="h-5 w-5 text-red-500 mb-2" />
                        <span className="text-sm text-muted-foreground">Average</span>
                        <span className="text-xl font-bold">{workoutData.avg_heart_rate} bpm</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                        <Heart className="h-5 w-5 text-red-600 mb-2" />
                        <span className="text-sm text-muted-foreground">Maximum</span>
                        <span className="text-xl font-bold">{workoutData.max_heart_rate || "-"} bpm</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No heart rate data available for this workout.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Training Load</h3>
                  <Separator className="mb-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-primary mb-2" />
                      <span className="text-sm text-muted-foreground">Calories</span>
                      <span className="text-xl font-bold">{caloriesBurned}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                      <Activity className="h-5 w-5 text-primary mb-2" />
                      <span className="text-sm text-muted-foreground">Training Effect</span>
                      <span className="text-xl font-bold">{calculateTrainingEffect(workoutData)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {workoutData.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Notes</h3>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground whitespace-pre-line">{workoutData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="mx-6">
            <Skeleton className="h-8 w-[300px]" />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-4 w-[150px] mt-2" />
              </div>
              <Skeleton className="h-6 w-[100px]" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>

              <Skeleton className="h-[400px] w-full rounded-lg" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-6 w-[150px] mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-6 w-[150px] mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate training effect based on workout metrics
function calculateTrainingEffect(workout: Workout): string {
  // Simple calculation based on duration and intensity
  const durationHours = workout.duration / 3600
  const avgHeartRate = workout.avg_heart_rate || 150

  // Higher heart rate and longer duration = higher training effect
  const baseEffect = (avgHeartRate / 150) * Math.sqrt(durationHours)

  // Scale to 1.0-5.0 range
  const scaledEffect = Math.min(5.0, Math.max(1.0, baseEffect * 2.5))

  return scaledEffect.toFixed(1)
}

