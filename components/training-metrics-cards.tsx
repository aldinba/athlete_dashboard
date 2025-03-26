import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, BarChart3, Calendar, TrendingUp } from "lucide-react"
import {
  calculateATL,
  calculateCTL,
  calculateTSB,
  calculateRampRate,
  getTrainingLoadZone,
  getTrainingLoadZoneColor,
} from "@/lib/training-metrics"
import {
  calculateTotalDistance,
  calculateAveragePace,
  formatPace,
  formatDuration,
  type Workout,
} from "@/lib/workout-data"

interface TrainingMetricsCardsProps {
  workouts: Workout[]
  dailyTrimpValues: number[]
  ctlValues: number[]
  previousMonthWorkouts: Workout[]
}

export function TrainingMetricsCards({
  workouts,
  dailyTrimpValues,
  ctlValues,
  previousMonthWorkouts,
}: TrainingMetricsCardsProps) {
  // Calculate current metrics
  const currentATL = calculateATL(dailyTrimpValues)
  const currentCTL = calculateCTL(dailyTrimpValues)
  const currentTSB = calculateTSB(currentCTL, currentATL)
  const rampRate = calculateRampRate(ctlValues)

  // Calculate total distance
  const totalDistance = calculateTotalDistance(workouts)
  const previousTotalDistance = calculateTotalDistance(previousMonthWorkouts)
  const distanceChange =
    totalDistance > 0 && previousTotalDistance > 0
      ? ((totalDistance - previousTotalDistance) / previousTotalDistance) * 100
      : 0

  // Calculate average pace
  const averagePace = calculateAveragePace(workouts)
  const previousAveragePace = calculateAveragePace(previousMonthWorkouts)
  const paceChangeSeconds = previousAveragePace > 0 ? previousAveragePace - averagePace : 0

  // Calculate total duration
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0)
  const previousTotalDuration = previousMonthWorkouts.reduce((sum, workout) => sum + workout.duration, 0)
  const durationChange =
    totalDuration > 0 && previousTotalDuration > 0
      ? ((totalDuration - previousTotalDuration) / previousTotalDuration) * 100
      : 0

  // Calculate total workouts
  const totalWorkouts = workouts.length
  const previousTotalWorkouts = previousMonthWorkouts.length
  const workoutsChange = totalWorkouts - previousTotalWorkouts

  // Get training zone
  const trainingZone = getTrainingLoadZone(currentTSB, currentCTL)
  const zoneColor = getTrainingLoadZoneColor(trainingZone)

  // Format values to prevent NaN
  const formattedDistanceChange = isNaN(distanceChange) ? "0" : `${(Math.round(distanceChange * 10) / 10).toString()}%`
  const formattedDurationChange = isNaN(durationChange) ? "0" : `${(Math.round(durationChange * 10) / 10).toString()}%`
  const formattedPaceChange = isNaN(paceChangeSeconds) ? "0:00" : formatPace(Math.abs(paceChangeSeconds))
  const formattedRampRate = isNaN(rampRate) ? "0" : `${rampRate > 0 ? "+" : ""}${rampRate}`

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDistance} km</div>
          <p className="text-xs text-muted-foreground">
            {distanceChange > 0 ? "+" : ""}
            {formattedDistanceChange} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Pace</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averagePace ? formatPace(averagePace) : "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            {paceChangeSeconds > 0 ? "-" : "+"}
            {formattedPaceChange} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Time</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
          <p className="text-xs text-muted-foreground">
            {durationChange > 0 ? "+" : ""}
            {formattedDurationChange} from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workouts</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWorkouts}</div>
          <p className="text-xs text-muted-foreground">
            {workoutsChange > 0 ? "+" : ""}
            {workoutsChange} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

