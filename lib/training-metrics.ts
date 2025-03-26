// Training metrics calculation utilities

// TRIMP (Training Impulse) calculation
// Based on duration and heart rate data
export function calculateTrimp(
  durationMinutes: number,
  avgHeartRate: number,
  restingHeartRate: number,
  maxHeartRate: number,
): number {
  // Check for invalid inputs
  if (
    isNaN(durationMinutes) ||
    isNaN(avgHeartRate) ||
    isNaN(restingHeartRate) ||
    isNaN(maxHeartRate) ||
    durationMinutes <= 0 ||
    avgHeartRate <= 0 ||
    restingHeartRate <= 0 ||
    maxHeartRate <= 0
  ) {
    return 0
  }

  // Calculate heart rate reserve (HRR)
  const hrr = (avgHeartRate - restingHeartRate) / (maxHeartRate - restingHeartRate)

  // Gender factor (using male factor as default)
  const genderFactor = 1.92

  // Calculate TRIMP using Banister's formula
  const trimp = durationMinutes * hrr * 0.64 * Math.exp(genderFactor * hrr)

  return isNaN(trimp) ? 0 : Math.round(trimp)
}

// Calculate TRIMP from pace and distance when HR data is not available
export function calculateTrimpFromPace(durationMinutes: number, distanceKm: number, elevationGain = 0): number {
  // Check for invalid inputs
  if (isNaN(durationMinutes) || isNaN(distanceKm) || isNaN(elevationGain) || durationMinutes <= 0 || distanceKm <= 0) {
    return 0
  }

  // Calculate pace in min/km
  const paceMinPerKm = durationMinutes / distanceKm

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
  const elevationFactor = elevationGain > 0 ? Math.min(elevationGain / 1000, 0.2) : 0

  // Calculate simplified TRIMP
  const trimp = durationMinutes * (intensityFactor + elevationFactor)

  return isNaN(trimp) ? 0 : Math.round(trimp)
}

// ATL (Acute Training Load) - 7-day exponentially weighted average
export function calculateATL(dailyTrimpValues: number[]): number {
  // We need at least some data
  if (!dailyTrimpValues || dailyTrimpValues.length === 0) {
    return 0
  }

  // We need at least 7 days of data
  if (dailyTrimpValues.length < 7) {
    // If we have less than 7 days, use what we have
    const avgTrimp =
      dailyTrimpValues.reduce((sum, trimp) => sum + (isNaN(trimp) ? 0 : trimp), 0) / dailyTrimpValues.length
    return isNaN(avgTrimp) ? 0 : Math.round(avgTrimp)
  }

  // Get the last 7 days
  const last7Days = dailyTrimpValues.slice(-7)

  // ATL time constant (7 days)
  const atlTimeConstant = 7

  // Calculate exponentially weighted average
  let weightedSum = 0
  let weightSum = 0

  for (let i = 0; i < last7Days.length; i++) {
    const weight = Math.exp(-i / atlTimeConstant)
    weightedSum += (isNaN(last7Days[last7Days.length - 1 - i]) ? 0 : last7Days[last7Days.length - 1 - i]) * weight
    weightSum += weight
  }

  const result = weightedSum / weightSum
  return isNaN(result) ? 0 : Math.round(result)
}

// CTL (Chronic Training Load) - 42-day exponentially weighted average
export function calculateCTL(dailyTrimpValues: number[]): number {
  // We need at least some data
  if (!dailyTrimpValues || dailyTrimpValues.length === 0) {
    return 0
  }

  // If we have less than 42 days, use what we have
  const daysToUse = Math.min(dailyTrimpValues.length, 42)
  const relevantDays = dailyTrimpValues.slice(-daysToUse)

  // CTL time constant (42 days)
  const ctlTimeConstant = 42

  // Calculate exponentially weighted average
  let weightedSum = 0
  let weightSum = 0

  for (let i = 0; i < relevantDays.length; i++) {
    const weight = Math.exp(-i / ctlTimeConstant)
    weightedSum +=
      (isNaN(relevantDays[relevantDays.length - 1 - i]) ? 0 : relevantDays[relevantDays.length - 1 - i]) * weight
    weightSum += weight
  }

  const result = weightedSum / weightSum
  return isNaN(result) ? 0 : Math.round(result)
}

// TSB (Training Stress Balance) - Difference between CTL and ATL
export function calculateTSB(ctl: number, atl: number): number {
  if (isNaN(ctl) || isNaN(atl)) {
    return 0
  }
  return ctl - atl
}

// Ramp Rate - Rate of CTL increase over the last week
export function calculateRampRate(ctlValues: number[]): number {
  if (!ctlValues || ctlValues.length < 7) {
    return 0
  }

  const currentCTL = isNaN(ctlValues[ctlValues.length - 1]) ? 0 : ctlValues[ctlValues.length - 1]
  const weekAgoCTL = isNaN(ctlValues[ctlValues.length - 7]) ? 0 : ctlValues[ctlValues.length - 7]

  const result = currentCTL - weekAgoCTL
  return isNaN(result) ? 0 : Math.round(result * 10) / 10
}

// Training load zones
export enum TrainingLoadZone {
  Detraining = "Detraining",
  Recovery = "Recovery",
  Maintenance = "Maintenance",
  Productive = "Productive",
  Optimal = "Optimal",
  Overreaching = "Overreaching",
  Overtraining = "Overtraining",
}

// Determine training load zone based on TSB and CTL
export function getTrainingLoadZone(tsb: number, ctl: number): TrainingLoadZone {
  // Handle NaN values
  const safeTsb = isNaN(tsb) ? 0 : tsb
  const safeCtl = isNaN(ctl) ? 0 : ctl

  if (safeCtl < 30) {
    return TrainingLoadZone.Detraining
  }

  if (safeTsb > 25) {
    return TrainingLoadZone.Recovery
  }

  if (safeTsb > 5) {
    return TrainingLoadZone.Maintenance
  }

  if (safeTsb > -10) {
    return TrainingLoadZone.Productive
  }

  if (safeTsb > -25) {
    return TrainingLoadZone.Optimal
  }

  if (safeTsb > -40) {
    return TrainingLoadZone.Overreaching
  }

  return TrainingLoadZone.Overtraining
}

// Get color for training load zone
export function getTrainingLoadZoneColor(zone: TrainingLoadZone): string {
  switch (zone) {
    case TrainingLoadZone.Detraining:
      return "text-gray-500"
    case TrainingLoadZone.Recovery:
      return "text-blue-500"
    case TrainingLoadZone.Maintenance:
      return "text-green-500"
    case TrainingLoadZone.Productive:
      return "text-emerald-500"
    case TrainingLoadZone.Optimal:
      return "text-yellow-500"
    case TrainingLoadZone.Overreaching:
      return "text-orange-500"
    case TrainingLoadZone.Overtraining:
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

