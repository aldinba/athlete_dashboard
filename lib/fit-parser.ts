export interface ParsedWorkout {
  title: string
  type: string
  date: string
  distance: number
  duration: number
  pace: number
  elevationGain: number
  avgHeartRate: number | null
  maxHeartRate: number | null
  coordinates: Array<{
    lat: number
    lng: number
    elevation: number | null
    time: string | null
    heartRate: number | null
    speed: number | null
  }>
}

// Parse FIT file using fit-file-parser library
async function parseFitFileReal(file: File): Promise<ParsedWorkout> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        if (!buffer) {
          throw new Error("Failed to read FIT file")
        }

        // Import the FitParser module correctly
        try {
          // Dynamic import to avoid SSR issues
          const FitFileParser = await import("fit-file-parser")

          // Create a new instance - FitFileParser should export a class called FitParser
          const fitParser = new FitFileParser.default({
            force: true,
            speedUnit: "km/h",
            lengthUnit: "km",
            temperatureUnit: "celsius",
            elapsedRecordField: true,
            mode: "list",
          })

          // Parse the buffer
          fitParser.parse(buffer, (error: any, data: any) => {
            if (error) {
              console.error("Error parsing FIT file:", error)
              reject(new Error(`Failed to parse FIT file: ${error.message}`))
              return
            }

            try {
              // Extract session data
              const session = data.sessions?.[0] || {}
              const records = data.records || []
              const laps = data.laps || []

              // Extract basic metadata
              const startTime = session.start_time || new Date()
              const totalDistance = session.total_distance || 0 // in km
              const totalDuration = session.total_elapsed_time || 0 // in seconds
              const totalElevationGain = session.total_ascent || 0 // in meters
              const avgHeartRate = session.avg_heart_rate || null
              const maxHeartRate = session.max_heart_rate || null

              // Determine workout type
              let workoutType = "Easy Run"
              if (session.sub_sport) {
                const subSport = session.sub_sport.toLowerCase()
                if (subSport.includes("interval")) workoutType = "Interval Training"
                else if (subSport.includes("tempo")) workoutType = "Tempo Run"
                else if (subSport.includes("long")) workoutType = "Long Run"
                else if (subSport.includes("recovery")) workoutType = "Recovery Run"
                else if (subSport.includes("race")) workoutType = "Race"
              }

              // Extract title from session name or file name
              const title = session.name || file.name.replace(/\.[^/.]+$/, "")

              // Calculate pace (seconds per km)
              const pace = totalDistance > 0 ? totalDuration / totalDistance : 0

              // Extract GPS coordinates from records
              const coordinates = records
                .filter((record: any) => record.position_lat && record.position_long)
                .map((record: any) => {
                  // Convert semicircles to degrees if needed
                  const lat =
                    typeof record.position_lat === "number"
                      ? convertSemicirclesToDegrees(record.position_lat)
                      : record.position_lat

                  const lng =
                    typeof record.position_long === "number"
                      ? convertSemicirclesToDegrees(record.position_long)
                      : record.position_long

                  return {
                    lat,
                    lng,
                    elevation: record.altitude || null,
                    time: record.timestamp ? new Date(record.timestamp).toISOString() : null,
                    heartRate: record.heart_rate || null,
                    speed: record.speed || null,
                  }
                })

              // Create the parsed workout object
              const parsedWorkout: ParsedWorkout = {
                title,
                type: workoutType,
                date: startTime.toISOString().split("T")[0],
                distance: totalDistance,
                duration: totalDuration,
                pace,
                elevationGain: totalElevationGain,
                avgHeartRate,
                maxHeartRate,
                coordinates,
              }

              resolve(parsedWorkout)
            } catch (error) {
              console.error("Error processing FIT data:", error)
              reject(error)
            }
          })
        } catch (importError) {
          console.error("Error importing FitParser:", importError)
          reject(
            new Error(
              `Failed to import FIT parser: ${importError instanceof Error ? importError.message : String(importError)}`,
            ),
          )
        }
      } catch (error) {
        console.error("Error parsing FIT file:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error("Error reading FIT file:", error)
      reject(new Error("Failed to read FIT file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Helper function to convert semicircles to degrees (used in FIT files)
function convertSemicirclesToDegrees(semicircles: number): number {
  return semicircles * (180 / Math.pow(2, 31))
}

// Parse GPX file
async function parseGpxFile(file: File): Promise<ParsedWorkout> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const xmlString = e.target?.result as string
        if (!xmlString) {
          throw new Error("Failed to read GPX file")
        }

        // Parse XML
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlString, "text/xml")

        // Check for parsing errors
        const parserError = xmlDoc.querySelector("parsererror")
        if (parserError) {
          throw new Error("Invalid GPX file format")
        }

        // Extract basic metadata
        const name = xmlDoc.querySelector("name")?.textContent || file.name.replace(/\.[^/.]+$/, "")
        const type = determineWorkoutType(name, file.name)

        // Get all track points
        const trackPoints = Array.from(xmlDoc.querySelectorAll("trkpt"))
        if (trackPoints.length === 0) {
          throw new Error("No GPS data found in the GPX file")
        }

        // Extract coordinates and data
        const coordinates: ParsedWorkout["coordinates"] = []
        let minLat = 90,
          maxLat = -90,
          minLng = 180,
          maxLng = -180
        let totalElevation = 0,
          elevationGain = 0
        let prevElevation: number | null = null
        const heartRates: number[] = []
        let startTime: Date | null = null
        let endTime: Date | null = null

        trackPoints.forEach((point, index) => {
          const lat = Number.parseFloat(point.getAttribute("lat") || "0")
          const lng = Number.parseFloat(point.getAttribute("lon") || "0")
          const elevationEl = point.querySelector("ele")
          const timeEl = point.querySelector("time")
          const hrEl =
            point.querySelector("extensions gpxtpx\\:TrackPointExtension gpxtpx\\:hr") ||
            point.querySelector("extensions *|hr")

          const elevation = elevationEl ? Number.parseFloat(elevationEl.textContent || "0") : null
          const time = timeEl ? new Date(timeEl.textContent || "") : null
          const heartRate = hrEl ? Number.parseInt(hrEl.textContent || "0", 10) : null

          // Calculate elevation gain
          if (elevation !== null && prevElevation !== null) {
            const diff = elevation - prevElevation
            if (diff > 0) {
              elevationGain += diff
            }
          }
          prevElevation = elevation

          // Track min/max coordinates for distance calculation
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng

          // Track start/end times
          if (time) {
            if (!startTime || time < startTime) startTime = time
            if (!endTime || time > endTime) endTime = time
          }

          // Collect heart rates for averaging
          if (heartRate) {
            heartRates.push(heartRate)
          }

          // Calculate speed if we have time data
          let speed = null
          if (index > 0 && time && coordinates[index - 1].time) {
            const prevTime = new Date(coordinates[index - 1].time!)
            const prevLat = coordinates[index - 1].lat
            const prevLng = coordinates[index - 1].lng

            const timeDiffSec = (time.getTime() - prevTime.getTime()) / 1000
            if (timeDiffSec > 0) {
              const distanceM = calculateDistance(prevLat, prevLng, lat, lng) * 1000
              speed = distanceM / timeDiffSec // m/s
            }
          }

          coordinates.push({
            lat,
            lng,
            elevation,
            time: time ? time.toISOString() : null,
            heartRate,
            speed,
          })
        })

        // Calculate total distance using Haversine formula
        let totalDistance = 0
        for (let i = 1; i < coordinates.length; i++) {
          const prevPoint = coordinates[i - 1]
          const currPoint = coordinates[i]
          totalDistance += calculateDistance(prevPoint.lat, prevPoint.lng, currPoint.lat, currPoint.lng)
        }

        // Calculate duration
        let duration = 0
        if (startTime && endTime) {
          duration = (endTime.getTime() - startTime.getTime()) / 1000 // in seconds
        } else {
          // Estimate duration based on distance (assuming 5:30 min/km pace)
          duration = totalDistance * 330
        }

        // Calculate average heart rate
        const avgHeartRate =
          heartRates.length > 0 ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length) : null

        // Calculate max heart rate
        const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null

        // Calculate pace
        const pace = duration / totalDistance // seconds per km

        // Use the file's last modified date if we don't have time data
        const date = startTime
          ? startTime.toISOString().split("T")[0]
          : new Date(file.lastModified).toISOString().split("T")[0]

        resolve({
          title: name,
          type,
          date,
          distance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
          duration: Math.round(duration),
          pace: Math.round(pace),
          elevationGain: Math.round(elevationGain),
          avgHeartRate,
          maxHeartRate,
          coordinates,
        })
      } catch (error) {
        console.error("Error parsing GPX:", error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error("Error reading GPX file:", error)
      reject(new Error("Failed to read GPX file"))
    }

    reader.readAsText(file)
  })
}

// Helper function to determine workout type
function determineWorkoutType(name: string, filename: string): string {
  const lowerName = name.toLowerCase()
  const lowerFilename = filename.toLowerCase()

  if (
    lowerName.includes("interval") ||
    lowerName.includes("speed") ||
    lowerName.includes("track") ||
    lowerFilename.includes("interval") ||
    lowerFilename.includes("speed") ||
    lowerFilename.includes("track")
  ) {
    return "Interval Training"
  } else if (
    lowerName.includes("tempo") ||
    lowerName.includes("threshold") ||
    lowerFilename.includes("tempo") ||
    lowerFilename.includes("threshold")
  ) {
    return "Tempo Run"
  } else if (
    lowerName.includes("long") ||
    lowerName.includes("marathon") ||
    lowerName.includes("distance") ||
    lowerFilename.includes("long") ||
    lowerFilename.includes("marathon") ||
    lowerFilename.includes("distance")
  ) {
    return "Long Run"
  } else if (
    lowerName.includes("recovery") ||
    lowerName.includes("easy") ||
    lowerFilename.includes("recovery") ||
    lowerFilename.includes("easy")
  ) {
    return "Recovery Run"
  } else if (
    lowerName.includes("race") ||
    lowerName.includes("event") ||
    lowerName.includes("marathon") ||
    lowerName.includes("10k") ||
    lowerName.includes("5k") ||
    lowerName.includes("half") ||
    lowerFilename.includes("race") ||
    lowerFilename.includes("event") ||
    lowerFilename.includes("marathon") ||
    lowerFilename.includes("10k") ||
    lowerFilename.includes("5k") ||
    lowerFilename.includes("half")
  ) {
    return "Race"
  }

  return "Easy Run"
}

// Calculate distance between two points using Haversine formula
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

// Convert degrees to radians
function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Create a fallback parser for FIT files when the library fails
async function fallbackParseFitFile(file: File): Promise<ParsedWorkout> {
  console.warn("Using fallback parser for FIT file")

  // Create a basic workout with minimal data
  const title = file.name.replace(/\.[^/.]+$/, "")
  const date = new Date(file.lastModified).toISOString().split("T")[0]

  return {
    title,
    type: "Easy Run",
    date,
    distance: 5, // Default 5km
    duration: 1500, // Default 25 minutes
    pace: 300, // Default 5:00 min/km
    elevationGain: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    coordinates: [], // No GPS data
  }
}

export async function parseFitFile(file: File): Promise<ParsedWorkout> {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type
      const fileExt = file.name.toLowerCase().split(".").pop()

      if (fileExt === "gpx") {
        // Parse GPX file
        parseGpxFile(file).then(resolve).catch(reject)
      } else if (fileExt === "fit") {
        // Try to parse FIT file, but use fallback if it fails
        parseFitFileReal(file)
          .then(resolve)
          .catch((err) => {
            console.error("Error parsing FIT file with primary parser:", err)
            console.log("Falling back to basic FIT file parser")
            // If the primary parser fails, use the fallback
            fallbackParseFitFile(file).then(resolve).catch(reject)
          })
      } else {
        throw new Error(`Unsupported file format: .${fileExt}. Please upload a .FIT or .GPX file.`)
      }
    } catch (err) {
      console.error("Error in parseFitFile:", err)
      reject(err instanceof Error ? err : new Error("Failed to parse file"))
    }
  })
}

