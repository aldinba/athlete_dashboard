"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { TrainingLoadChart } from "@/components/training-load-chart"
import { TrainingStatusCard } from "@/components/training-status-card"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getUserWorkouts, calculateDailyTrimpValues, type Workout } from "@/lib/workout-service"

import { calculateCTL } from "@/lib/training-metrics"

export default function AnalyticsPage() {
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
      if (!user && !isConfigured) {
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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading analytics...</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>

        <Tabs defaultValue="training-load" className="space-y-4">
          <TabsList>
            <TabsTrigger value="training-load">Training Load</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="training-load" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <TrainingLoadChart dailyTrimpValues={dailyTrimpValues} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Training Load Analysis</CardTitle>
                  <CardDescription>Understanding your training metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Acute Training Load (ATL)</h3>
                      <p className="text-sm text-muted-foreground">
                        Represents your fatigue level based on recent training (7-day weighted average). Higher values
                        indicate more fatigue.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Chronic Training Load (CTL)</h3>
                      <p className="text-sm text-muted-foreground">
                        Represents your fitness level based on longer-term training (42-day weighted average). Higher
                        values indicate better fitness.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Training Stress Balance (TSB)</h3>
                      <p className="text-sm text-muted-foreground">
                        The difference between CTL and ATL, indicating your form or freshness. Positive values suggest
                        good form, while negative values indicate fatigue.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TrainingStatusCard dailyTrimpValues={dailyTrimpValues} ctlValues={ctlValues} />
            </div>
          </TabsContent>
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Track your running performance over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">Performance metrics coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

