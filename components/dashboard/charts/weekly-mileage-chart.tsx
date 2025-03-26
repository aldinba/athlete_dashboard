"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, subWeeks, startOfWeek } from "date-fns"

export function WeeklyMileageChart() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchWeeklyMileageData()
  }, [])

  async function fetchWeeklyMileageData() {
    setIsLoading(true)

    try {
      const endDate = new Date()
      const startDate = subWeeks(endDate, 12) // 12 weeks of data

      const { data, error } = await supabase
        .from("workouts")
        .select("date, distance, type")
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true })

      if (error) throw error

      // Group by week and workout type
      const weeklyData: Record<string, Record<string, number>> = {}

      data.forEach((workout) => {
        const date = new Date(workout.date)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Week starts on Monday
        const weekKey = format(weekStart, "MMM dd")

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { Run: 0, Ride: 0, Other: 0 }
        }

        const type = ["Run", "Ride"].includes(workout.type) ? workout.type : "Other"
        weeklyData[weekKey][type] += workout.distance / 1000 // Convert to km
      })

      // Format the data for the chart
      const formattedData = Object.entries(weeklyData).map(([week, types]) => ({
        week,
        Run: Number.parseFloat(types.Run.toFixed(1)),
        Ride: Number.parseFloat(types.Ride.toFixed(1)),
        Other: Number.parseFloat(types.Other.toFixed(1)),
      }))

      setData(formattedData)
    } catch (error) {
      console.error("Error fetching weekly mileage data:", error)
      toast({
        title: "Error fetching weekly mileage data",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Distance</CardTitle>
        <CardDescription>Distance by activity type (kilometers)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              Run: {
                label: "Running",
                color: "hsl(var(--chart-1))",
              },
              Ride: {
                label: "Cycling",
                color: "hsl(var(--chart-2))",
              },
              Other: {
                label: "Other",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="Run" stackId="a" fill="var(--color-Run)" />
                <Bar dataKey="Ride" stackId="a" fill="var(--color-Ride)" />
                <Bar dataKey="Other" stackId="a" fill="var(--color-Other)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

