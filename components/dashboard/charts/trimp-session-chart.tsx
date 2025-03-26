"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
  Cell,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, subDays } from "date-fns"

export function TRIMPSessionChart() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTRIMPData()
  }, [])

  async function fetchTRIMPData() {
    setIsLoading(true)

    try {
      const endDate = new Date()
      const startDate = subDays(endDate, 90) // 3 months of data

      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id,
          date,
          type,
          duration,
          workout_metrics (trimp, intensity)
        `)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true })

      if (error) throw error

      // Format the data for the chart
      const formattedData = data.map((workout) => {
        const duration = workout.duration / 60 // Convert to minutes
        return {
          date: format(new Date(workout.date), "MMM dd"),
          duration: Number.parseFloat(duration.toFixed(0)),
          trimp: Number.parseFloat(workout.workout_metrics.trimp.toFixed(1)),
          intensity: Number.parseFloat(workout.workout_metrics.intensity.toFixed(2)),
          type: workout.type,
        }
      })

      setData(formattedData)
    } catch (error) {
      console.error("Error fetching TRIMP data:", error)
      toast({
        title: "Error fetching TRIMP data",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Run":
        return "#3b82f6"
      case "Ride":
        return "#f97316"
      default:
        return "#a855f7"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Impulse (TRIMP)</CardTitle>
        <CardDescription>Duration vs. TRIMP by workout intensity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="duration"
                  name="Duration"
                  unit=" min"
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis type="number" dataKey="trimp" name="TRIMP" tick={{ fontSize: 12 }} tickMargin={10} />
                <ZAxis type="number" dataKey="intensity" range={[50, 400]} name="Intensity" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="font-medium">Date:</div>
                            <div>{data.date}</div>
                            <div className="font-medium">Type:</div>
                            <div>{data.type}</div>
                            <div className="font-medium">Duration:</div>
                            <div>{data.duration} min</div>
                            <div className="font-medium">TRIMP:</div>
                            <div>{data.trimp}</div>
                            <div className="font-medium">Intensity:</div>
                            <div>{data.intensity}</div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Scatter name="Workouts" data={data} fill="#8884d8" shape="circle" legendType="none">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTypeColor(entry.type)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

