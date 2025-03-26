"use client"

import { useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  calculateATL,
  calculateCTL,
  calculateTSB,
  getTrainingLoadZone,
  getTrainingLoadZoneColor,
} from "@/lib/training-metrics"

interface TrainingLoadChartProps {
  dailyTrimpValues: number[]
}

export function TrainingLoadChart({ dailyTrimpValues }: TrainingLoadChartProps) {
  const [timeRange, setTimeRange] = useState<"4w" | "8w" | "12w">("8w")

  // Calculate how many days to show based on the selected time range
  const daysToShow = timeRange === "4w" ? 28 : timeRange === "8w" ? 56 : 84

  // Get the relevant data for the selected time range
  const relevantData = dailyTrimpValues.slice(-daysToShow)

  // Calculate ATL and CTL for each day
  const atlValues: number[] = []
  const ctlValues: number[] = []
  const tsbValues: number[] = []

  for (let i = 7; i <= relevantData.length; i++) {
    const dataUpToDay = dailyTrimpValues.slice(0, dailyTrimpValues.length - relevantData.length + i)
    const atl = calculateATL(dataUpToDay)
    const ctl = calculateCTL(dataUpToDay)

    atlValues.push(atl)
    ctlValues.push(ctl)
    tsbValues.push(calculateTSB(ctl, atl))
  }

  // Create chart data
  const chartData = []

  // Start from day 7 since we need at least 7 days for ATL
  for (let i = 7; i < relevantData.length; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (relevantData.length - i - 1))

    // Ensure we don't have NaN values in the chart data
    const trimp = isNaN(relevantData[i]) ? 0 : relevantData[i]
    const atl = isNaN(atlValues[i - 7]) ? 0 : atlValues[i - 7]
    const ctl = isNaN(ctlValues[i - 7]) ? 0 : ctlValues[i - 7]
    const tsb = isNaN(tsbValues[i - 7]) ? 0 : tsbValues[i - 7]

    chartData.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      trimp,
      atl,
      ctl,
      tsb,
    })
  }

  // Get current values
  const currentATL = atlValues.length > 0 ? atlValues[atlValues.length - 1] : 0
  const currentCTL = ctlValues.length > 0 ? ctlValues[ctlValues.length - 1] : 0
  const currentTSB = tsbValues.length > 0 ? tsbValues[tsbValues.length - 1] : 0

  // Ensure we don't have NaN values
  const safeCurrentATL = isNaN(currentATL) ? 0 : currentATL
  const safeCurrentCTL = isNaN(currentCTL) ? 0 : currentCTL
  const safeCurrentTSB = isNaN(currentTSB) ? 0 : currentTSB

  const currentZone = getTrainingLoadZone(safeCurrentTSB, safeCurrentCTL)
  const zoneColor = getTrainingLoadZoneColor(currentZone)

  return (
    <Card className="col-span-7">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Training Load</CardTitle>
          <CardDescription>
            ATL (Fatigue): {safeCurrentATL} | CTL (Fitness): {safeCurrentCTL} | TSB (Form): {safeCurrentTSB}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`text-sm font-medium ${zoneColor}`}>{currentZone}</div>
          <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList className="grid w-[180px] grid-cols-3">
              <TabsTrigger value="4w">4w</TabsTrigger>
              <TabsTrigger value="8w">8w</TabsTrigger>
              <TabsTrigger value="12w">12w</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value, index) => (index % 7 === 0 ? value : "")}
              />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="atl"
                name="Fatigue (ATL)"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="ctl"
                name="Fitness (CTL)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="tsb"
                name="Form (TSB)"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

