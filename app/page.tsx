"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityCard } from "@/components/activity-card"
import { MainNav } from "@/components/main-nav"
import { Overview } from "@/components/overview"
import { UserNav } from "@/components/user-nav"
import { TrainingLoadChart } from "@/components/training-load-chart"
import { TrainingMetricsCards } from "@/components/training-metrics-cards"
import { TrainingStatusCard } from "@/components/training-status-card"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

import {
  getUserWorkouts,
  calculateDailyTrimpValues,
  formatPace,
  formatDurationDisplay,
  type Workout,
} from "@/lib/workout-service"

import { calculateCTL } from "@/lib/training-metrics"

export default function DashboardPage() {
  const { user, isLoading: authLoading, isConfigured } = useAuth()
  const router = useRouter()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [dailyTrimpValues, setDailyTrimpValues] = useState<number[]>([])
  const [ctlValues, setCtlValues] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/auth/login")
      return
    }

    const fetchData = async () => {
      if (!user || !isConfigured) {
        setLoading(false)
        return
      }

      try {
        // Get all workouts for the user
        const allWorkouts = await getUserWorkouts()
        setWorkouts(allWorkouts)

        // Calculate daily TRIMP values
        const trimp = calculateDailyTrimpValues(allWorkouts, 60)
        setDailyTrimpValues(trimp)

        // Calculate CTL values for each day
        const ctl: number[] = []
        for (let i = 7; i <= trimp.length; i++) {
          ctl.push(calculateCTL(trimp.slice(0, i)))
        }
        setCtlValues(ctl)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user || !isConfigured) {
      fetchData()
    }
  }, [user, authLoading, isConfigured, router])

  // Get current date
  const today = new Date()

  // Get workouts for the current month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthWorkouts = workouts.filter((workout) => {
    const workoutDate = new Date(workout.date)
    return workoutDate >= currentMonthStart && workoutDate <= today
  })

  // Get workouts for the previous month
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const previousMonthWorkouts = workouts.filter((workout) => {
    const workoutDate = new Date(workout.date)
    return workoutDate >= previousMonthStart && workoutDate <= previousMonthEnd
  })

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading training data...</h2>
          <p className="text-muted-foreground">Please wait while we calculate your metrics</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/workouts/import">
                <Upload className="mr-2 h-4 w-4" />
                Import Workout
              </Link>
            </Button>
            <Button asChild>
              <Link href="/workouts/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workout
              </Link>
            </Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <TrainingMetricsCards
              workouts={currentMonthWorkouts}
              dailyTrimpValues={dailyTrimpValues}
              ctlValues={ctlValues}
              previousMonthWorkouts={previousMonthWorkouts}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <TrainingLoadChart dailyTrimpValues={dailyTrimpValues} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Weekly Distance</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview workouts={workouts} />
                </CardContent>
              </Card>

              <TrainingStatusCard dailyTrimpValues={dailyTrimpValues} ctlValues={ctlValues} />
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Your running performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <TrainingLoadChart dailyTrimpValues={dailyTrimpValues} />
                  </div>
                </CardContent>
              </Card>

              <TrainingStatusCard dailyTrimpValues={dailyTrimpValues} ctlValues={ctlValues} />
            </div>
          </TabsContent>
          <TabsContent value="activities" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workouts.slice(0, 6).map((workout) => (
                <ActivityCard
                  key={workout.id}
                  id={workout.id}
                  date={new Date(workout.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  title={workout.title}
                  distance={`${workout.distance} km`}
                  duration={formatDurationDisplay(workout.duration)}
                  pace={formatPace(workout.pace)}
                  elevation={`${workout.elevation_gain}m`}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

