"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format, subDays } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function TrainingLoadChart() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTrainingLoadData()
  }, [])

  async function fetchTrainingLoadData() {
    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      const endDate = new Date()
      const startDate = subDays(endDate, 42) // 6 weeks of data

      const { data, error } = await supabase
        .from("training_load")
        .select("date, atl, ctl, tsb")
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true })

      if (error) throw error

      // Format the data for the chart
      const formattedData = data.map((item) => ({
        date: format(new Date(item.date), "MMM dd"),
        ATL: Number.parseFloat(item.atl.toFixed(1)),
        CTL: Number.parseFloat(item.ctl.toFixed(1)),
        TSB: Number.parseFloat(item.tsb.toFixed(1)),
      }))

      setData(formattedData)
    } catch (err) {
      console.error("Error fetching training load data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch training load data")
      toast({
        title: "Error fetching training load data",
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
        <CardTitle>Training Load</CardTitle>
        <CardDescription>ATL (Fatigue), CTL (Fitness), and TSB (Form)</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !error && (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">No training load data available</p>
          </div>
        )}

        {!isLoading && !error && data.length > 0 && (
          <ChartContainer
            config={{
              ATL: {
                label: "Fatigue (ATL)",
                color: "hsl(var(--chart-1))",
              },
              CTL: {
                label: "Fitness (CTL)",
                color: "hsl(var(--chart-2))",
              },
              TSB: {
                label: "Form (TSB)",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis yAxisId="right" orientation="right" domain={[-30, 30]} tick={{ fontSize: 12 }} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ATL"
                  stroke="var(--color-ATL)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="CTL"
                  stroke="var(--color-CTL)"
                  strokeWidth={2}
                  dot={false}
                />
                <Bar yAxisId="right" dataKey="TSB" fill="var(--color-TSB)" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

