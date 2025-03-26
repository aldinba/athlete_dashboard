"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "@/components/ui/chart"
import type { Workout } from "@/lib/workout-data"

interface OverviewProps {
  workouts?: Workout[]
}

export function Overview({ workouts = [] }: OverviewProps) {
  // Get current date
  const today = new Date()

  // Calculate the start of the current week (Sunday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  // Initialize data for each day of the week
  const weekData = [
    { name: "Mon", total: 0 },
    { name: "Tue", total: 0 },
    { name: "Wed", total: 0 },
    { name: "Thu", total: 0 },
    { name: "Fri", total: 0 },
    { name: "Sat", total: 0 },
    { name: "Sun", total: 0 },
  ]

  // If we have workouts, calculate the distance for each day
  if (workouts.length > 0) {
    // Get workouts from the current week
    const weekWorkouts = workouts.filter((workout) => {
      const workoutDate = new Date(workout.date)
      return workoutDate >= startOfWeek && workoutDate <= today
    })

    // Sum distances by day of week
    weekWorkouts.forEach((workout) => {
      const workoutDate = new Date(workout.date)
      const dayOfWeek = workoutDate.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert to 0 = Monday, 6 = Sunday

      // Ensure we don't add NaN values
      const distance = isNaN(workout.distance) ? 0 : workout.distance
      weekData[dayIndex].total += distance
    })

    // Round distances to 1 decimal place
    weekData.forEach((day) => {
      day.total = Math.round(day.total * 10) / 10
    })
  } else {
    // Use sample data if no workouts provided
    weekData[0].total = 5.2
    weekData[1].total = 8.3
    weekData[2].total = 0
    weekData[3].total = 6.5
    weekData[4].total = 4.8
    weekData[5].total = 12.5
    weekData[6].total = 7.2
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={weekData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}km`}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}

