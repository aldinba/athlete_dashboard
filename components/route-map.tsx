"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Map, BarChart3, Heart, ArrowUpRight, Mountain, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

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

// Define props for the RouteMap component
interface RouteMapProps {
  gpsData: GpsPoint[]
  height?: string
  className?: string
  workoutTitle?: string
  workoutType?: string
  workoutDate?: string
}

// Format pace from m/s to min/km
const formatPace = (speedMs: number | null): string => {
  if (!speedMs || speedMs <= 0) return "N/A"

  const paceMinPerKm = 16.6667 / speedMs // Convert m/s to min/km
  const minutes = Math.floor(paceMinPerKm)
  const seconds = Math.floor((paceMinPerKm - minutes) * 60)

  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`
}

export function RouteMap({
  gpsData,
  height = "500px",
  className = "",
  workoutTitle,
  workoutType,
  workoutDate,
}: RouteMapProps) {
  const [colorBy, setColorBy] = useState<"heartRate" | "speed" | "elevation" | "none">("none")
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain">("standard")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Dynamically load Leaflet
  useEffect(() => {
    // Only load Leaflet on client side
    const loadLeaflet = async () => {
      try {
        // Import Leaflet and related CSS
        await Promise.all([
          import("leaflet"),
          import("leaflet/dist/leaflet.css"),
          import("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"),
          import("leaflet-defaulticon-compatibility"),
        ])

        setIsLeafletLoaded(true)
      } catch (error) {
        console.error("Error loading Leaflet:", error)
      }
    }

    loadLeaflet()
  }, [])

  // Check if we have valid GPS data
  if (!gpsData || gpsData.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <Map className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No GPS data available for this workout</p>
          <p className="text-xs text-muted-foreground mt-1">
            GPS data may not have been recorded or was not included in the imported file.
          </p>
        </div>
      </div>
    )
  }

  // Calculate statistics for the route
  // Calculate total distance
  let totalDistance = 0
  for (let i = 1; i < gpsData.length; i++) {
    const point1 = gpsData[i - 1]
    const point2 = gpsData[i]
    totalDistance += calculateDistance(point1.latitude, point1.longitude, point2.latitude, point2.longitude)
  }

  // Calculate elevation stats
  const elevationPoints = gpsData.filter((point) => point.elevation !== null).map((point) => point.elevation || 0)
  const minElevation = elevationPoints.length > 0 ? Math.min(...elevationPoints) : 0
  const maxElevation = elevationPoints.length > 0 ? Math.max(...elevationPoints) : 0
  const elevationGain = calculateElevationGain(gpsData)

  // Helper function to calculate elevation gain
  function calculateElevationGain(points: GpsPoint[]): number {
    let gain = 0
    let prevElevation: number | null = null

    for (const point of points) {
      if (prevElevation !== null && point.elevation !== null && point.elevation > prevElevation) {
        gain += point.elevation - prevElevation
      }
      prevElevation = point.elevation
    }

    return Math.round(gain)
  }

  // Helper function to calculate distance between two points
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  // Helper function to convert degrees to radians
  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  return (
    <div className={`${className} ${isFullscreen ? "fixed inset-0 z-50 p-4 bg-background" : ""}`} ref={mapContainerRef}>
      <Card className="h-full">
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Map className="h-4 w-4 mr-2" />
              {workoutTitle ? workoutTitle : "Route Map"}
            </CardTitle>
            {workoutType && workoutDate && (
              <p className="text-xs text-muted-foreground">
                {workoutType} • {workoutDate}
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Tabs value={colorBy} onValueChange={(value) => setColorBy(value as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="none" className="text-xs px-2 h-6">
                  Solid
                </TabsTrigger>
                <TabsTrigger value="heartRate" className="text-xs px-2 h-6">
                  Heart Rate
                </TabsTrigger>
                <TabsTrigger value="speed" className="text-xs px-2 h-6">
                  Pace
                </TabsTrigger>
                <TabsTrigger value="elevation" className="text-xs px-2 h-6">
                  Elevation
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="h-full" style={{ height: isFullscreen ? "calc(100vh - 150px)" : height }}>
            {!isLeafletLoaded ? (
              <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            ) : (
              <MapComponent
                gpsData={gpsData}
                colorBy={colorBy}
                mapType={mapType}
                setMapType={setMapType}
                onMapLoaded={() => setIsMapLoaded(true)}
              />
            )}
          </div>

          {/* Route Statistics */}
          <div className="p-4 pt-2">
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Distance</span>
                <span className="text-sm font-medium">{totalDistance.toFixed(2)} km</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg">
                <Mountain className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Elevation</span>
                <span className="text-sm font-medium">{elevationGain}m</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg">
                <Heart className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Max Elev</span>
                <span className="text-sm font-medium">{maxElevation}m</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg">
                <BarChart3 className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Min Elev</span>
                <span className="text-sm font-medium">{minElevation}m</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          {colorBy !== "none" && (
            <div className="px-4 pb-4 text-xs">
              <p className="font-medium mb-1">Legend:</p>
              <div className="flex flex-wrap gap-2">
                {colorBy === "heartRate" ? (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#3388ff] mr-1"></div>
                      <span>&lt;120 bpm</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#33cc33] mr-1"></div>
                      <span>120-140 bpm</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ffcc00] mr-1"></div>
                      <span>140-160 bpm</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ff9900] mr-1"></div>
                      <span>160-180 bpm</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ff3300] mr-1"></div>
                      <span>&gt;180 bpm</span>
                    </div>
                  </>
                ) : colorBy === "speed" ? (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#3388ff] mr-1"></div>
                      <span>&gt;7:00 /km</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#33cc33] mr-1"></div>
                      <span>6:00-7:00 /km</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ffcc00] mr-1"></div>
                      <span>5:00-6:00 /km</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ff9900] mr-1"></div>
                      <span>4:00-5:00 /km</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ff3300] mr-1"></div>
                      <span>&lt;4:00 /km</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#3388ff] mr-1"></div>
                      <span>Low</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#33cc33] mr-1"></div>
                      <span>Medium-Low</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ffcc00] mr-1"></div>
                      <span>Medium-High</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#ff3300] mr-1"></div>
                      <span>High</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Separate component for the map to handle dynamic imports
function MapComponent({
  gpsData,
  colorBy,
  mapType,
  setMapType,
  onMapLoaded,
}: {
  gpsData: GpsPoint[]
  colorBy: string
  mapType: string
  setMapType: (type: "standard" | "satellite" | "terrain") => void
  onMapLoaded: () => void
}) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    // Dynamically import the map components
    const loadMap = async () => {
      try {
        // Import React-Leaflet components
        await import("react-leaflet")
        setMapReady(true)
        onMapLoaded()
      } catch (error) {
        console.error("Error loading map components:", error)
      }
    }

    loadMap()
  }, [onMapLoaded])

  if (!mapReady) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
          <p className="text-muted-foreground">Initializing map...</p>
        </div>
      </div>
    )
  }

  // Now we can safely import and use the React-Leaflet components
  const { MapContainer, TileLayer, Polyline, Marker, Popup, ZoomControl, useMap } = require("react-leaflet")
  const L = require("leaflet")

  // Convert GPS data to route points
  const routePoints = gpsData.map((point) => [point.latitude, point.longitude] as [number, number])

  // Create colored segments based on heart rate, speed, or elevation
  const coloredSegments = []
  for (let i = 0; i < gpsData.length - 1; i++) {
    const point1 = gpsData[i]
    const point2 = gpsData[i + 1]

    let color = "#3388ff" // Default blue

    if (colorBy === "heartRate") {
      // Use average heart rate for the segment
      const avgHeartRate =
        point1.heart_rate && point2.heart_rate
          ? (point1.heart_rate + point2.heart_rate) / 2
          : point1.heart_rate || point2.heart_rate

      if (!avgHeartRate)
        color = "#3388ff" // Default blue
      else if (avgHeartRate < 120)
        color = "#3388ff" // Blue - easy
      else if (avgHeartRate < 140)
        color = "#33cc33" // Green - aerobic
      else if (avgHeartRate < 160)
        color = "#ffcc00" // Yellow - tempo
      else if (avgHeartRate < 180)
        color = "#ff9900" // Orange - threshold
      else color = "#ff3300" // Red - anaerobic
    } else if (colorBy === "speed") {
      // Use average speed for the segment
      const avgSpeed = point1.speed && point2.speed ? (point1.speed + point2.speed) / 2 : point1.speed || point2.speed

      if (!avgSpeed)
        color = "#3388ff" // Default blue
      else {
        const paceMinPerKm = 16.6667 / avgSpeed // Convert m/s to min/km

        if (paceMinPerKm > 7)
          color = "#3388ff" // Blue - very slow
        else if (paceMinPerKm > 6)
          color = "#33cc33" // Green - easy
        else if (paceMinPerKm > 5)
          color = "#ffcc00" // Yellow - moderate
        else if (paceMinPerKm > 4)
          color = "#ff9900" // Orange - fast
        else color = "#ff3300" // Red - very fast
      }
    } else if (colorBy === "elevation") {
      // Color based on elevation
      const elevation = point1.elevation || 0

      // Determine min and max elevation to create a gradient
      const minElevation = Math.min(...gpsData.filter((p) => p.elevation !== null).map((p) => p.elevation || 0))
      const maxElevation = Math.max(...gpsData.filter((p) => p.elevation !== null).map((p) => p.elevation || 0))
      const range = maxElevation - minElevation

      if (range > 0) {
        const normalizedElevation = (elevation - minElevation) / range

        // Create a color gradient from blue (low) to red (high)
        if (normalizedElevation < 0.25)
          color = "#3388ff" // Blue - low elevation
        else if (normalizedElevation < 0.5)
          color = "#33cc33" // Green - medium-low elevation
        else if (normalizedElevation < 0.75)
          color = "#ffcc00" // Yellow - medium-high elevation
        else color = "#ff3300" // Red - high elevation
      }
    }

    coloredSegments.push({
      positions: [
        [point1.latitude, point1.longitude] as [number, number],
        [point2.latitude, point2.longitude] as [number, number],
      ],
      color,
    })
  }

  // Calculate bounds for the map
  const bounds = L.latLngBounds(routePoints.map((point) => L.latLng(point[0], point[1])))

  // Helper component to fit bounds
  function FitBounds({ bounds }: { bounds: any }) {
    const map = useMap()

    useEffect(() => {
      if (bounds) {
        map.fitBounds(bounds)
      }
    }, [map, bounds])

    return null
  }

  // Helper component for map controls
  function MapControls() {
    const map = useMap()

    const handleFitBounds = () => {
      if (bounds) {
        map.fitBounds(bounds)
      }
    }

    return (
      <div className="leaflet-top leaflet-right" style={{ marginTop: "60px" }}>
        <div className="leaflet-control leaflet-bar">
          <a
            href="#"
            title="Fit to route"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              handleFitBounds()
            }}
            className="flex items-center justify-center"
          >
            <Maximize className="h-4 w-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
      center={[routePoints[0][0], routePoints[0][1]]}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      {/* Map Layers */}
      {mapType === "standard" && (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      {mapType === "satellite" && (
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      )}
      {mapType === "terrain" && (
        <TileLayer
          attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a> contributors'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
      )}

      {/* Map Controls */}
      <ZoomControl position="topright" />
      <MapControls />

      {/* Layer Control */}
      <div className="leaflet-bottom leaflet-right">
        <div className="leaflet-control leaflet-bar bg-background shadow-md rounded-md p-1">
          <div className="flex flex-col space-y-1">
            <Button
              variant={mapType === "standard" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMapType("standard")}
            >
              Standard
            </Button>
            <Button
              variant={mapType === "satellite" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMapType("satellite")}
            >
              Satellite
            </Button>
            <Button
              variant={mapType === "terrain" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMapType("terrain")}
            >
              Terrain
            </Button>
          </div>
        </div>
      </div>

      {/* Render colored segments */}
      {colorBy !== "none" &&
        coloredSegments.map((segment, index) => (
          <Polyline key={`segment-${index}`} positions={segment.positions} color={segment.color} weight={5} />
        ))}

      {/* Render single polyline if not using colored segments */}
      {colorBy === "none" && <Polyline positions={routePoints} color="#3388ff" weight={5} />}

      {/* Start marker */}
      <Marker position={[routePoints[0][0], routePoints[0][1]]}>
        <Popup>
          <div className="text-xs">
            <p className="font-bold">Start</p>
            <p>Time: {gpsData[0].timestamp ? new Date(gpsData[0].timestamp).toLocaleTimeString() : "N/A"}</p>
            {gpsData[0].elevation !== null && <p>Elevation: {gpsData[0].elevation}m</p>}
          </div>
        </Popup>
      </Marker>

      {/* End marker */}
      <Marker position={[routePoints[routePoints.length - 1][0], routePoints[routePoints.length - 1][1]]}>
        <Popup>
          <div className="text-xs">
            <p className="font-bold">Finish</p>
            <p>
              Time:{" "}
              {gpsData[gpsData.length - 1].timestamp
                ? new Date(gpsData[gpsData.length - 1].timestamp).toLocaleTimeString()
                : "N/A"}
            </p>
            {gpsData[gpsData.length - 1].elevation !== null && (
              <p>Elevation: {gpsData[gpsData.length - 1].elevation}m</p>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Fit bounds to show the entire route */}
      <FitBounds bounds={bounds} />
    </MapContainer>
  )
}

export default RouteMap

