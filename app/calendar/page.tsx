"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"

import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { getUserWorkouts, type Workout } from "@/lib/workout-service"

export default function CalendarPage() {
  const { user, isLoading: authLoading, isConfigured } = useAuth()
  const router = useRouter()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Group workouts by date
  const workoutsByDate = workouts.reduce(
    (acc, workout) => {
      const date = workout.date.split("T")[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(workout)
      return acc
    },
    {} as Record<string, Workout[]>,
  )

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading calendar...</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/workouts/new">Add Workout</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 font-medium">
                  {day}
                </div>
              ))}

              {/* Empty cells for days of the week before the first day of the month */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
              ))}

              {/* Calendar days */}
              {days.map((day) => {
                const dateString = format(day, "yyyy-MM-dd")
                const dayWorkouts = workoutsByDate[dateString] || []

                return (
                  <div
                    key={day.toString()}
                    className={`h-24 border rounded-md p-1 overflow-hidden ${
                      isSameDay(day, new Date()) ? "bg-primary/10 border-primary" : ""
                    }`}
                  >
                    <div className="font-medium text-sm">{format(day, "d")}</div>
                    <div className="mt-1 space-y-1">
                      {dayWorkouts.map((workout) => (
                        <Link key={workout.id} href={`/workouts/${workout.id}`} className="block">
                          <Badge
                            variant="outline"
                            className="w-full justify-start text-xs truncate hover:bg-primary/10"
                          >
                            {workout.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Empty cells for days of the week after the last day of the month */}
              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-24 border rounded-md bg-muted/20"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

