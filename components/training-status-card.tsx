import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  calculateATL,
  calculateCTL,
  calculateTSB,
  calculateRampRate,
  getTrainingLoadZone,
  getTrainingLoadZoneColor,
  TrainingLoadZone,
} from "@/lib/training-metrics"

interface TrainingStatusCardProps {
  dailyTrimpValues: number[]
  ctlValues: number[]
}

export function TrainingStatusCard({ dailyTrimpValues, ctlValues }: TrainingStatusCardProps) {
  // Calculate current metrics
  const currentATL = calculateATL(dailyTrimpValues)
  const currentCTL = calculateCTL(dailyTrimpValues)
  const currentTSB = calculateTSB(currentCTL, currentATL)
  const rampRate = calculateRampRate(ctlValues)

  // Get training zone
  const trainingZone = getTrainingLoadZone(currentTSB, currentCTL)
  const zoneColor = getTrainingLoadZoneColor(trainingZone)

  // Calculate fitness percentage (based on CTL)
  // Assuming 100 is a high CTL value for a recreational runner
  const fitnessPercentage = Math.min(Math.round((currentCTL / 100) * 100), 100)

  // Calculate freshness percentage (based on TSB)
  // Convert TSB to a percentage between 0-100
  // TSB range is typically -40 to +25, so we normalize to 0-100
  const freshness = Math.max(Math.min(((currentTSB + 40) / 65) * 100, 100), 0)

  // Calculate form percentage (based on TSB and CTL combination)
  const form = Math.max(Math.min(((currentTSB + 20) / 40) * 100, 100), 0)

  // Calculate training load percentage (based on ATL)
  // Assuming 80 is a high ATL value for a recreational runner
  const trainingLoad = Math.min(Math.round((currentATL / 80) * 100), 100)

  // Format values to prevent NaN
  const safeRampRate = isNaN(rampRate) ? 0 : rampRate
  const safeFitnessPercentage = isNaN(fitnessPercentage) ? 0 : fitnessPercentage
  const safeTrainingLoad = isNaN(trainingLoad) ? 0 : trainingLoad
  const safeFreshness = isNaN(freshness) ? 0 : freshness
  const safeCurrentATL = isNaN(currentATL) ? 0 : currentATL
  const safeCurrentCTL = isNaN(currentCTL) ? 0 : currentCTL
  const safeCurrentTSB = isNaN(currentTSB) ? 0 : currentTSB

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Training Status</CardTitle>
        <CardDescription>Current training load metrics and status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Current Status</div>
              <div className={`text-sm font-medium ${zoneColor}`}>{trainingZone}</div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">{getStatusDescription(trainingZone)}</div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Fitness (CTL)</div>
                <div className="text-sm text-muted-foreground">{safeCurrentCTL}</div>
              </div>
              <Progress value={safeFitnessPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Ramp rate: {safeRampRate > 0 ? "+" : ""}
                {safeRampRate} points/week
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Fatigue (ATL)</div>
                <div className="text-sm text-muted-foreground">{safeCurrentATL}</div>
              </div>
              <Progress value={safeTrainingLoad} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Form (TSB)</div>
                <div className="text-sm text-muted-foreground">{safeCurrentTSB}</div>
              </div>
              <Progress value={safeFreshness} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get status description
function getStatusDescription(zone: TrainingLoadZone): string {
  switch (zone) {
    case TrainingLoadZone.Detraining:
      return "Your fitness is declining due to insufficient training stimulus."
    case TrainingLoadZone.Recovery:
      return "You're well-recovered and ready for a new training block."
    case TrainingLoadZone.Maintenance:
      return "You're maintaining fitness with balanced training and recovery."
    case TrainingLoadZone.Productive:
      return "Good balance of training and recovery for long-term improvement."
    case TrainingLoadZone.Optimal:
      return "Optimal training stress for performance gains. Monitor recovery."
    case TrainingLoadZone.Overreaching:
      return "High training load with functional overreaching. Plan recovery soon."
    case TrainingLoadZone.Overtraining:
      return "Warning: Training load is too high. Reduce intensity and prioritize recovery."
    default:
      return "Analyzing your training status..."
  }
}

