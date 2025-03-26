"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { subDays } from "date-fns"

interface HRZoneData {
  name: string
  value: number
  color: string
}

export function HRZonesChart() {
  const [data, setData] = useState<HRZoneData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchHRZonesData()
  }, [])

  async function fetchHRZonesData() {
    setIsLoading(true)

    try {
      const endDate = new Date()
      const startDate = subDays(endDate, 28) // 4 weeks of data

      const { data: workouts, error } = await supabase
        .from("workouts")
        .select("id, duration")
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())

      if (error) throw error

      // Get HR zone data for each workout
      const workoutIds = workouts.map((w) => w.id)

      const { data: hrData, error: hrError } = await supabase
        .from("hr_zones")
        .select("zone_1, zone_2, zone_3, zone_4, zone_5")
        .in("workout_id", workoutIds)

      if (hrError) throw hrError

      // Calculate total time in each zone
      const zoneTotals = {
        zone_1: 0,
        zone_2: 0,
        zone_3: 0,
        zone_4: 0,
        zone_5: 0,
      }

      hrData.forEach((workout) => {
        zoneTotals.zone_1 += workout.zone_1
        zoneTotals.zone_2 += workout.zone_2
        zoneTotals.zone_3 += workout.zone_3
        zoneTotals.zone_4 += workout.zone_4
        zoneTotals.zone_5 += workout.zone_5
      })

      // Format the data for the chart
      const formattedData: HRZoneData[] = [
        { name: "Zone 1 (Easy)", value: zoneTotals.zone_1, color: "#22c55e" },
        { name: "Zone 2 (Aerobic)", value: zoneTotals.zone_2, color: "#3b82f6" },
        { name: "Zone 3 (Tempo)", value: zoneTotals.zone_3, color: "#a855f7" },
        { name: "Zone 4 (Threshold)", value: zoneTotals.zone_4, color: "#f97316" },
        { name: "Zone 5 (Anaerobic)", value: zoneTotals.zone_5, color: "#ef4444" },
      ]

      setData(formattedData)
    } catch (error) {
      console.error("Error fetching HR zones data:", error)
      toast({
        title: "Error fetching HR zones data",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Heart Rate Zones</CardTitle>
        <CardDescription>Time spent in each heart rate zone (last 4 weeks)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatTime(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

