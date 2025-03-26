"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Define the GpsPoint type
interface GpsPoint {
  id: string
  workout_id: string
  latitude: number
  longitude: number
  elevation: number | null
  timestamp: string | null
  heart_rate: number | null
  speed: number | null
  cadence: number | null
  created_at: string
}

interface WorkoutChartsProps {
  gpsData: GpsPoint[]
  className?: string
}

export function WorkoutCharts({ gpsData, className = "" }: WorkoutChartsProps) {
  const [chartType, setChartType] = useState<"elevation" | "heartRate" | "pace">("elevation")

  // Skip points to avoid too many data points (take every 5th point)
  const filteredData = gpsData.filter((_, i) => i % 5 === 0)

  // Format data for charts
  const chartData = filteredData.map((point, index) => {
    // Calculate distance from start (in km)
    let distanceFromStart = 0
    if (index > 0) {
      // Simple distance calculation between consecutive points
      const prevPoint = filteredData[index - 1]
      const lat1 = prevPoint.latitude
      const lon1 = prevPoint.longitude
      const lat2 = point.latitude
      const lon2 = point.longitude

      // Haversine formula for distance between two points
      const R = 6371 // Radius of the earth in km
      const dLat = deg2rad(lat2 - lat1)
      const dLon = deg2rad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c // Distance in km

      // Add to previous distance
      distanceFromStart = (filteredData[index - 1] as any).distanceFromStart + distance
    }

    // Format timestamp
    let formattedTime = "N/A"
    if (point.timestamp) {
      try {
        const date = new Date(point.timestamp)
        formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } catch (e) {
        formattedTime = "Invalid time"
      }
    }

    // Format pace from m/s to min/km
    let formattedPace = "N/A"
    let paceMinPerKm = 0
    if (point.speed && point.speed > 0) {
      paceMinPerKm = 16.6667 / point.speed // Convert m/s to min/km
      const minutes = Math.floor(paceMinPerKm)
      const seconds = Math.floor((paceMinPerKm - minutes) * 60)
      formattedPace = `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    return {
      ...point,
      distanceFromStart: Number.parseFloat(distanceFromStart.toFixed(2)),
      formattedTime,
      formattedPace,
      paceMinPerKm: point.speed ? paceMinPerKm : null,
    }
  })

  // Helper function to convert degrees to radians
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
  }

  if (gpsData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/30 rounded-lg ${className}`}
        style={{ height: "300px" }}
      >
        <p className="text-muted-foreground">No GPS data available for this workout</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <Tabs defaultValue="elevation" onValueChange={(value) => setChartType(value as any)}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Workout Data</h3>
          <TabsList>
            <TabsTrigger value="elevation">Elevation</TabsTrigger>
            <TabsTrigger value="heartRate">Heart Rate</TabsTrigger>
            <TabsTrigger value="pace">Pace</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="elevation" className="mt-0">
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="distanceFromStart"
                  label={{ value: "Distance (km)", position: "insideBottomRight", offset: -5 }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  label={{ value: "Elevation (m)", angle: -90, position: "insideLeft" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} m`, "Elevation"]}
                  labelFormatter={(label) => `Distance: ${label} km`}
                />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#elevationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="heartRate" className="mt-0">
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="distanceFromStart"
                  label={{ value: "Distance (km)", position: "insideBottomRight", offset: -5 }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  label={{ value: "Heart Rate (bpm)", angle: -90, position: "insideLeft" }}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} bpm`, "Heart Rate"]}
                  labelFormatter={(label) => `Distance: ${label} km`}
                />
                <Line type="monotone" dataKey="heart_rate" stroke="#ff4d4f" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="pace" className="mt-0">
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="distanceFromStart"
                  label={{ value: "Distance (km)", position: "insideBottomRight", offset: -5 }}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis
                  label={{ value: "Pace (min/km)", angle: -90, position: "insideLeft" }}
                  domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === "paceMinPerKm") {
                      const minutes = Math.floor(value)
                      const seconds = Math.floor((value - minutes) * 60)
                      return [`${minutes}:${seconds.toString().padStart(2, "0")} /km`, "Pace"]
                    }
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Distance: ${label} km`}
                />
                <Line type="monotone" dataKey="paceMinPerKm" stroke="#52c41a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

