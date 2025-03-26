"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface GpsPoint {
  latitude: number
  longitude: number
  elevation: number
  timestamp: string
}

interface WorkoutMapProps {
  gpsData: GpsPoint[]
}

export function WorkoutMap({ gpsData }: WorkoutMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !gpsData.length) return

    // Load the Mapbox script dynamically
    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"
    script.async = true

    script.onload = initializeMap

    document.body.appendChild(script)

    // Add Mapbox CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
      document.body.removeChild(script)
      document.head.removeChild(link)
    }
  }, [gpsData])

  function initializeMap() {
    if (!window.mapboxgl) return

    // Replace with your Mapbox access token
    window.mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN'CESS_TOKEN"

    const coordinates = gpsData.map((point) => [point.longitude, point.latitude])

    // Create bounds that encompass all points
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord)
    }, new window.mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

    // Initialize the map
    mapInstanceRef.current = new window.mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      bounds: bounds,
      padding: 50,
    })

    // Add navigation controls
    mapInstanceRef.current.addControl(new window.mapboxgl.NavigationControl())

    // Wait for map to load
    mapInstanceRef.current.on("load", () => {
      // Add the route line
      mapInstanceRef.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      })

      mapInstanceRef.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 4,
        },
      })

      // Add start and end markers
      new window.mapboxgl.Marker({ color: "#22c55e" }).setLngLat(coordinates[0]).addTo(mapInstanceRef.current)

      new window.mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat(coordinates[coordinates.length - 1])
        .addTo(mapInstanceRef.current)
    })
  }

  return (
    <Card>
      <div ref={mapRef} className="h-[400px] w-full rounded-md" />
    </Card>
  )
}

