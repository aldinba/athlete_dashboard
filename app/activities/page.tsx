"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ActivityCard } from "@/components/activity-card"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

import { getUserWorkouts, formatPace, formatDurationDisplay, type Workout } from "@/lib/workout-service"

export default function ActivitiesPage() {
  const { user, isLoading: authLoading, isConfigured } = useAuth()
  const router = useRouter()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWorkouts = async () => {
    if (!user && !isConfigured) {
      setLoading(false)
      return
    }

    try {
      // Get all workouts for the user
      const allWorkouts = await getUserWorkouts()
      setWorkouts(allWorkouts)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/auth/login")
      return
    }

    fetchWorkouts()
  }, [user, authLoading, isConfigured, router])

  const handleWorkoutDeleted = () => {
    // Refresh the workouts list
    fetchWorkouts()
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading activities...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your workouts</p>
        </div>
      </div>
    )
  }

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
        {!isConfigured && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Supabase is not configured. The app is running in demo mode with mock data. Please set
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/workouts/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workout
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <ActivityCard
              key={workout.id}
              id={workout.id}
              date={new Date(workout.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              title={workout.title}
              distance={`${workout.distance.toFixed(2)} km`}
              duration={formatDurationDisplay(workout.duration)}
              pace={formatPace(workout.pace)}
              elevation={`${workout.elevation_gain}m`}
              isImported={workout.notes?.includes("Imported from") || false}
              onDelete={handleWorkoutDeleted}
            />
          ))}

          {workouts.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <h3 className="text-lg font-medium">No workouts yet</h3>
              <p className="text-muted-foreground mt-1">Add your first workout to start tracking your progress</p>
              <Button className="mt-4" asChild>
                <Link href="/workouts/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Workout
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

