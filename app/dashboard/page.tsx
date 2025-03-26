import type { Metadata } from "next"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { TrainingLoadChart } from "@/components/dashboard/charts/training-load-chart"
import { WeeklyMileageChart } from "@/components/dashboard/charts/weekly-mileage-chart"
import { HRZonesChart } from "@/components/dashboard/charts/hr-zones-chart"
import { TRIMPSessionChart } from "@/components/dashboard/charts/trimp-session-chart"
import { WorkoutDetails } from "@/components/dashboard/workout-details"
import { EnvironmentVariablesCheck } from "@/components/env-check"

export const metadata: Metadata = {
  title: "Athlete Dashboard",
  description: "Training analytics and AI coaching for endurance athletes",
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <EnvironmentVariablesCheck />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TrainingLoadChart />
        <WeeklyMileageChart />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HRZonesChart />
        <TRIMPSessionChart />
      </div>
      <div className="mt-4">
        <WorkoutDetails />
      </div>
    </DashboardLayout>
  )
}

