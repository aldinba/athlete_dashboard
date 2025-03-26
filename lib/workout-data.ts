// Sample workout data for the past 60 days

export interface Workout {
  id: string
  date: Date
  title: string
  type: "Easy Run" | "Long Run" | "Tempo Run" | "Interval Training" | "Recovery Run" | "Race"
  distance: number // in kilometers
  duration: number // in minutes
  pace: number // in seconds per kilometer
  elevationGain: number // in meters
  avgHeartRate?: number // in bpm
  maxHeartRate?: number // in bpm
  notes?: string
}

// Generate a random workout
function generateWorkout(date: Date, index: number): Workout {
  const types = ["Easy Run", "Long Run", "Tempo Run", "Interval Training", "Recovery Run", "Race"] as const
  const dayOfWeek = date.getDay()

  // Determine workout type based on day of week
  let type: Workout["type"]
  let distance: number
  let pace: number
  let elevationGain: number

  // Weekend long run
  if (dayOfWeek === 6) {
    // Saturday
    type = "Long Run"
    distance = 12 + Math.random() * 8 // 12-20km
    pace = 320 + Math.random() * 30 // 5:20-5:50 min/km
    elevationGain = 100 + Math.random() * 200 // 100-300m
  }
  // Tuesday tempo
  else if (dayOfWeek === 2) {
    type = "Tempo Run"
    distance = 8 + Math.random() * 4 // 8-12km
    pace = 280 + Math.random() * 20 // 4:40-5:00 min/km
    elevationGain = 50 + Math.random() * 100 // 50-150m
  }
  // Thursday intervals
  else if (dayOfWeek === 4) {
    type = "Interval Training"
    distance = 5 + Math.random() * 3 // 5-8km
    pace = 300 + Math.random() * 20 // 5:00-5:20 min/km
    elevationGain = 30 + Math.random() * 70 // 30-100m
  }
  // Monday recovery
  else if (dayOfWeek === 1) {
    type = "Recovery Run"
    distance = 5 + Math.random() * 2 // 5-7km
    pace = 340 + Math.random() * 30 // 5:40-6:10 min/km
    elevationGain = 20 + Math.random() * 50 // 20-70m
  }
  // Other days easy
  else {
    type = "Easy Run"
    distance = 6 + Math.random() * 4 // 6-10km
    pace = 320 + Math.random() * 30 // 5:20-5:50 min/km
    elevationGain = 40 + Math.random() * 80 // 40-120m
  }

  // Add some randomness - not every day has a workout
  const hasWorkout = Math.random() > 0.3 // 70% chance of having a workout

  if (!hasWorkout) {
    return null
  }

  // Round distance to 1 decimal place
  distance = Math.round(distance * 10) / 10

  // Calculate duration from distance and pace
  const duration = Math.round((distance * pace) / 60)

  // Generate heart rate data
  const avgHeartRate = Math.round(140 + Math.random() * 30) // 140-170 bpm
  const maxHeartRate = avgHeartRate + Math.round(10 + Math.random() * 20) // 10-30 bpm higher than avg

  // Generate title
  let title = type
  if (type === "Long Run" && distance > 18) {
    title = "Weekend Long Run"
  } else if (type === "Tempo Run") {
    title = "Threshold Session"
  } else if (type === "Interval Training") {
    title = "800m Repeats"
  }

  return {
    id: `workout-${index}`,
    date,
    title,
    type,
    distance,
    duration,
    pace,
    elevationGain: Math.round(elevationGain),
    avgHeartRate,
    maxHeartRate,
  }
}

// Generate workouts for the past 60 days
export function generateWorkouts(days = 60): Workout[] {
  const workouts: Workout[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)

    const workout = generateWorkout(date, i)
    if (workout) {
      workouts.push(workout)
    }
  }

  return workouts
}

// Get workouts for a specific date range
export function getWorkoutsInRange(workouts: Workout[], startDate: Date, endDate: Date): Workout[] {
  return workouts.filter((workout) => workout.date >= startDate && workout.date <= endDate)
}

// Calculate total distance for a set of workouts
export function calculateTotalDistance(workouts: Workout[]): number {
  return Math.round(workouts.reduce((sum, workout) => sum + workout.distance, 0) * 10) / 10
}

// Calculate average pace for a set of workouts
export function calculateAveragePace(workouts: Workout[]): number {
  if (workouts.length === 0) return 0

  const totalDistance = workouts.reduce((sum, workout) => sum + workout.distance, 0)
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0)

  return Math.round((totalDuration * 60) / totalDistance)
}

// Format pace from seconds per km to MM:SS format
export function formatPace(paceInSeconds: number): string {
  const minutes = Math.floor(paceInSeconds / 60)
  const seconds = Math.floor(paceInSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`
}

// Format duration from minutes to HH:MM format
export function formatDuration(durationInMinutes: number): string {
  const hours = Math.floor(durationInMinutes / 60)
  const minutes = Math.floor(durationInMinutes % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

// Calculate daily TRIMP values from workouts
export function calculateDailyTrimpValues(workouts: Workout[], days = 60): number[] {
  const today = new Date()
  const dailyTrimp: number[] = Array(days).fill(0)

  workouts.forEach((workout) => {
    const dayIndex = Math.floor((today.getTime() - workout.date.getTime()) / (1000 * 60 * 60 * 24))
    if (dayIndex >= 0 && dayIndex < days) {
      // Calculate TRIMP for this workout
      const trimp = workout.avgHeartRate ? calculateTrimpFromHeartRate(workout) : calculateTrimpFromWorkout(workout)

      dailyTrimp[dayIndex] += trimp
    }
  })

  // Reverse the array so it's in chronological order
  return dailyTrimp.reverse()
}

// Calculate TRIMP from heart rate data
function calculateTrimpFromHeartRate(workout: Workout): number {
  // Default values if not provided
  const restingHeartRate = 60
  const maxHeartRate = 190

  return calculateTrimp(workout.duration, workout.avgHeartRate, restingHeartRate, workout.maxHeartRate || maxHeartRate)
}

// Calculate TRIMP from workout data when heart rate is not available
function calculateTrimpFromWorkout(workout: Workout): number {
  return calculateTrimpFromPace(workout.duration, workout.distance, workout.elevationGain)
}

// Import training metrics functions
import { calculateTrimp, calculateTrimpFromPace } from "./training-metrics"

