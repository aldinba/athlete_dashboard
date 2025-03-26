"use client"

import type React from "react"

import { useState } from "react"
import { WorkoutSidebar } from "./workout-sidebar"
import { SmartCoachPanel } from "./smart-coach-panel"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - Workout List */}
      <WorkoutSidebar selectedWorkoutId={selectedWorkoutId} onSelectWorkout={setSelectedWorkoutId} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Training Dashboard</h1>
          {children}
        </div>
      </main>

      {/* Right Sidebar - AI Smart Coach */}
      <SmartCoachPanel workoutId={selectedWorkoutId} />
    </div>
  )
}

