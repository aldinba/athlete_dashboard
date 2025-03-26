import { getSupabase, type Tables } from "./supabase"
import type { ParsedWorkout } from "./fit-parser"

export type Workout = Tables<"workouts">

// Get all workouts for the current user
export async function getUserWorkouts() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("workouts").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching workouts:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserWorkouts:", error)
    return []
  }
}

// Get workouts for a specific date range
export async function getWorkoutsInRange(startDate: string, endDate: string) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching workouts in range:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getWorkoutsInRange:", error)
    return []
  }
}

// Create a new workout
export async function createWorkout(workout: Omit<Workout, "id" | "created_at" | "updated_at">) {
  try {
    const supabase = getSupabase()

    // Create a new workout object without the has_gps_data field to avoid the error
    const { has_gps_data, ...workoutData } = workout as any

    const { data, error } = await supabase
      .from("workouts")
      .insert([
        {
          ...workoutData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error creating workout:", error)
      throw error
    }

    return data?.[0]
  } catch (error) {
    console.error("Error in createWorkout:", error)
    throw error
  }
}

// Update an existing workout
export async function updateWorkout(id: string, workout: Partial<Omit<Workout, "id" | "created_at" | "updated_at">>) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("workouts")
      .update({
        ...workout,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating workout:", error)
      throw error
    }

    return data?.[0]
  } catch (error) {
    console.error("Error in updateWorkout:", error)
    throw error
  }
}

// Delete a workout
export async function deleteWorkout(id: string) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("workouts").delete().eq("id", id)

    if (error) {
      console.error("Error deleting workout:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteWorkout:", error)
    throw error
  }
}

// Add this function to get a single workout by ID
export async function getWorkoutById(id: string): Promise<Workout | null> {
  try {
    // Check if the ID is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.error("Invalid UUID format:", id)
      return null
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.from("workouts").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching workout:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getWorkoutById:", error)
    return null
  }
}

// Calculate daily TRIMP values from workouts
export function calculateDailyTrimpValues(workouts: Workout[], days = 60): number[] {
  const today = new Date()
  const dailyTrimp: number[] = Array(days).fill(0)

  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.date)
    const dayIndex = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayIndex >= 0 && dayIndex < days) {
      // Calculate TRIMP for this workout
      const trimp = calculateTrimpFromWorkout(workout)
      dailyTrimp[dayIndex] += trimp
    }
  })

  // Reverse the array so it's in chronological order
  return dailyTrimp.reverse()
}

// Calculate TRIMP from workout data
function calculateTrimpFromWorkout(workout: Workout): number {
  // If we have heart rate data, use it
  if (workout.avg_heart_rate) {
    return calculateTrimpFromHeartRate(workout)
  }

  // Otherwise, use pace and distance
  return calculateTrimpFromPace(workout)
}

// Calculate TRIMP from heart rate data
function calculateTrimpFromHeartRate(workout: Workout): number {
  // Get user's max and resting heart rates
  const maxHeartRate = workout.max_heart_rate || 190
  const restingHeartRate = 60 // Default value

  // Calculate heart rate reserve (HRR)
  const hrr = (workout.avg_heart_rate - restingHeartRate) / (maxHeartRate - restingHeartRate)

  // Gender factor (using male factor as default)
  const genderFactor = 1.92

  // Calculate TRIMP using Banister's formula
  const durationMinutes = workout.duration / 60
  const trimp = durationMinutes * hrr * 0.64 * Math.exp(genderFactor * hrr)

  // Check for NaN
  return isNaN(trimp) ? 0 : Math.round(trimp)
}

// Calculate TRIMP from pace and distance
function calculateTrimpFromPace(workout: Workout): number {
  // Calculate pace in min/km
  const paceMinPerKm = workout.pace / 60

  // Estimate intensity factor based on pace
  // Faster pace = higher intensity
  let intensityFactor = 0

  if (paceMinPerKm < 4)
    intensityFactor = 0.9 // Very fast
  else if (paceMinPerKm < 4.5)
    intensityFactor = 0.8 // Fast
  else if (paceMinPerKm < 5)
    intensityFactor = 0.7 // Moderate-fast
  else if (paceMinPerKm < 5.5)
    intensityFactor = 0.6 // Moderate
  else if (paceMinPerKm < 6)
    intensityFactor = 0.5 // Moderate-easy
  else if (paceMinPerKm < 7)
    intensityFactor = 0.4 // Easy
  else intensityFactor = 0.3 // Very easy

  // Add elevation factor (more elevation = higher intensity)
  const elevationFactor = workout.elevation_gain > 0 ? Math.min(workout.elevation_gain / 1000, 0.2) : 0

  // Calculate simplified TRIMP
  const durationMinutes = workout.duration / 60
  const trimp = durationMinutes * (intensityFactor + elevationFactor)

  // Check for NaN
  return isNaN(trimp) ? 0 : Math.round(trimp)
}

// Format pace from seconds per km to MM:SS format
export function formatPace(paceInSeconds: number): string {
  if (isNaN(paceInSeconds) || paceInSeconds <= 0) {
    return "0:00 /km"
  }

  const minutes = Math.floor(paceInSeconds / 60)
  const seconds = Math.floor(paceInSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`
}

// Format duration from seconds to HH:MM:SS format
export function formatDuration(durationInSeconds: number): string {
  if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
    return "0:00"
  }

  const hours = Math.floor(durationInSeconds / 3600)
  const minutes = Math.floor((durationInSeconds % 3600) / 60)
  const seconds = Math.floor(durationInSeconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

// Format duration for display (e.g., "1h 23m")
export function formatDurationDisplay(durationInSeconds: number): string {
  if (isNaN(durationInSeconds) || durationInSeconds <= 0) {
    return "0m"
  }

  const hours = Math.floor(durationInSeconds / 3600)
  const minutes = Math.floor((durationInSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

// Add this function to map a parsed workout to our database schema
export function mapParsedWorkoutToDbWorkout(parsedWorkout: ParsedWorkout, userId: string) {
  return {
    user_id: userId,
    title: parsedWorkout.title,
    type: parsedWorkout.type,
    date: parsedWorkout.date,
    distance: parsedWorkout.distance,
    duration: parsedWorkout.duration,
    pace: parsedWorkout.pace,
    elevation_gain: parsedWorkout.elevationGain,
    avg_heart_rate: parsedWorkout.avgHeartRate,
    max_heart_rate: parsedWorkout.maxHeartRate,
    notes: `Imported workout`,
    gpx_file_url: null,
  }
}

// Add these functions to workout-service.ts

// Get GPS data for a workout
export async function getWorkoutGpsData(workoutId: string) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("workout_gps_points")
      .select("*")
      .eq("workout_id", workoutId)
      .order("timestamp", { ascending: true })

    if (error) {
      // Check if the error is because the table doesn't exist
      if (error.message.includes("does not exist")) {
        console.warn("workout_gps_points table does not exist:", error.message)
        return [] // Return empty array instead of failing
      }

      console.error("Error fetching GPS data:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getWorkoutGpsData:", error)
    return []
  }
}

// Save GPS data for a workout
export async function saveWorkoutGpsPoints(
  workoutId: string,
  points: Array<{
    latitude: number
    longitude: number
    elevation?: number | null
    timestamp?: string | null
    heart_rate?: number | null
    speed?: number | null
    cadence?: number | null
  }>,
) {
  if (!points || points.length === 0) return

  try {
    const supabase = getSupabase()

    // Validate workoutId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(workoutId)) {
      throw new Error(`Invalid workout ID format: ${workoutId}`)
    }

    // Prepare data for insertion
    const dataToInsert = points.map((point) => ({
      workout_id: workoutId,
      latitude: point.latitude,
      longitude: point.longitude,
      elevation: point.elevation || null,
      timestamp: point.timestamp || null,
      heart_rate: point.heart_rate || null,
      speed: point.speed || null,
      cadence: point.cadence || null,
    }))

    console.log(`Saving ${dataToInsert.length} GPS points for workout ${workoutId}`)

    // Insert in batches to avoid hitting request size limits
    const batchSize = 50 // Reduced batch size for better reliability
    let successCount = 0

    for (let i = 0; i < dataToInsert.length; i += batchSize) {
      const batch = dataToInsert.slice(i, i + batchSize)

      try {
        const { error } = await supabase.from("workout_gps_points").insert(batch)

        if (error) {
          // Check if the error is because the table doesn't exist
          if (error.message.includes("does not exist")) {
            console.warn("workout_gps_points table does not exist:", error.message)
            break // Stop trying to insert data
          }

          console.error(`Error saving GPS points batch ${i / batchSize + 1}:`, error)
          // Continue with next batch instead of failing completely
        } else {
          successCount += batch.length
        }
      } catch (batchError) {
        console.error(`Exception in batch ${i / batchSize + 1}:`, batchError)
        // Continue with next batch
      }
    }

    console.log(`Successfully saved ${successCount} of ${dataToInsert.length} GPS points`)

    // Try to update the has_gps_data flag, but handle the case where the column doesn't exist
    if (successCount > 0) {
      try {
        await supabase.from("workouts").update({ has_gps_data: true }).eq("id", workoutId)
      } catch (updateError) {
        // If the column doesn't exist, log the error but don't fail the operation
        console.warn("Could not update has_gps_data flag:", updateError)
      }
      return true
    } else {
      // Don't throw an error if the table doesn't exist, just return false
      return false
    }
  } catch (error) {
    console.error("Error in saveWorkoutGpsPoints:", error)
    // Don't throw the error, just return false
    return false
  }
}

