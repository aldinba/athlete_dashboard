/**
 * Training Metrics Service
 * 
 * This service provides functions for calculating various training metrics
 * including TRIMP, ATL, CTL, TSB, and more.
 */
import { supabase } from '../lib/supabaseClient';

/**
 * Calculate Training Impulse (TRIMP) using Banister's formula
 * TRIMP = duration (minutes) × intensity factor
 * where intensity factor = HRreserve × 0.64 × e^(1.92 × HRreserve)
 * and HRreserve = (avg HR - resting HR) / (max HR - resting HR)
 * 
 * @param {number} duration - Duration in minutes
 * @param {number} avgHR - Average heart rate
 * @param {number} maxHR - Maximum heart rate
 * @param {number} restingHR - Resting heart rate
 * @returns {number} - TRIMP value
 */
export function calculateTRIMP(duration, avgHR, maxHR, restingHR) {
  // Default values if not provided
  maxHR = maxHR || 185;
  restingHR = restingHR || 60;
  
  // Calculate heart rate reserve
  const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
  
  // Calculate intensity factor using Banister's formula
  const intensityFactor = hrReserve * 0.64 * Math.exp(1.92 * hrReserve);
  
  // Calculate TRIMP
  const trimp = duration * intensityFactor;
  
  return Math.round(trimp * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Acute Training Load (ATL)
 * ATL = ATL_yesterday + (TRIMP_today - ATL_yesterday) / 7
 * 
 * @param {number} previousATL - Previous day's ATL
 * @param {number} todayTRIMP - Today's TRIMP value
 * @returns {number} - New ATL value
 */
export function calculateATL(previousATL, todayTRIMP) {
  const timeConstant = 7; // 7-day time constant
  const newATL = previousATL + (todayTRIMP - previousATL) / timeConstant;
  return Math.round(newATL * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Chronic Training Load (CTL)
 * CTL = CTL_yesterday + (TRIMP_today - CTL_yesterday) / 42
 * 
 * @param {number} previousCTL - Previous day's CTL
 * @param {number} todayTRIMP - Today's TRIMP value
 * @returns {number} - New CTL value
 */
export function calculateCTL(previousCTL, todayTRIMP) {
  const timeConstant = 42; // 42-day time constant
  const newCTL = previousCTL + (todayTRIMP - previousCTL) / timeConstant;
  return Math.round(newCTL * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Training Stress Balance (TSB)
 * TSB = CTL - ATL
 * 
 * @param {number} ctl - Chronic Training Load
 * @param {number} atl - Acute Training Load
 * @returns {number} - TSB value
 */
export function calculateTSB(ctl, atl) {
  const tsb = ctl - atl;
  return Math.round(tsb * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Heart Rate Drift
 * HR Drift = (avg HR second half - avg HR first half) / avg HR first half * 100
 * 
 * @param {number[]} heartRates - Array of heart rate values
 * @returns {number} - HR Drift as a percentage
 */
export function calculateHRDrift(heartRates) {
  if (!heartRates || heartRates.length < 2) {
    return 0;
  }
  
  const midpoint = Math.floor(heartRates.length / 2);
  const firstHalf = heartRates.slice(0, midpoint);
  const secondHalf = heartRates.slice(midpoint);
  
  const avgFirstHalf = firstHalf.reduce((sum, hr) => sum + hr, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.reduce((sum, hr) => sum + hr, 0) / secondHalf.length;
  
  const hrDrift = (avgSecondHalf - avgFirstHalf) / avgFirstHalf * 100;
  
  return Math.round(hrDrift * 100) / 100; // Round to 2 decimal places
}

/**
 * Estimate VO2max using heart rate and pace data
 * This is a simplified implementation of the Daniels-Gilbert formula
 * 
 * @param {number} avgHR - Average heart rate
 * @param {number} avgPace - Average pace in seconds per kilometer
 * @param {number} maxHR - Maximum heart rate
 * @param {number} restingHR - Resting heart rate
 * @returns {number} - Estimated VO2max in ml/kg/min
 */
export function estimateVO2max(avgHR, avgPace, maxHR, restingHR) {
  // Default values if not provided
  maxHR = maxHR || 185;
  restingHR = restingHR || 60;
  
  // Convert pace to meters per second
  const speedMPS = 1000 / avgPace;
  
  // Calculate heart rate reserve percentage
  const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
  
  // Simplified VO2max estimation
  // This is a basic approximation - more accurate models exist
  const vo2max = (speedMPS * 3.5) / hrReserve;
  
  return Math.round(vo2max * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate time spent in each heart rate zone
 * 
 * @param {number[]} heartRates - Array of heart rate values
 * @param {number} maxHR - Maximum heart rate
 * @returns {Object} - Object with time spent in each zone (in seconds)
 *
export function calculateHRZones(heartRates, maxHR) {
  // Default max HR if not provided
  maxHR = maxHR || 185;
  
  // Define HR zones as percentages of max HR
  const zoneThresholds = [
    0.6,  // Zone 1: 60-70% of max HR
    0.7,  // Zone 2: 70-80% of max HR
    0.8,  // Zone 3: 80-90% of max HR
    0.9,  // Zone 4: 90-100% of max HR
    1.0   // Zone 5: 100%+ of max HR (for completeness)
  ];
  
  // Initialize zone counters
  const zones = {
    zone1: 0,
    zone2: 0,
    zone3: 0,
    zone4: 0,
    zone5: 0
  };
  
  // Count time spent in each zone
  heartRates.forEach(hr => {
    const hrPercentage = hr / maxHR;
    
    if (hrPercentage < zoneThresholds[0]) {
      // Below Zone 1
      return;
    } else if (hrPercentage < zoneThresholds[1]) {
      zones.zone1++;
    } else if (hrPercentage < zoneThresholds[2]) {
      zones.zone2++;
    } else if (hrPercentage < zoneThresholds[3]) {
      zones.zone3++;
    } else if (hrPercentage < zoneThresholds[4]) {
      zones.zone4++;
    } else {
      zones.zone5++;
    }
  });
  
  return zones;
}
*/

/**
 * Update training load metrics (ATL, CTL, TSB) for a user
 * @param {string} userId - User ID
 */
async function updateTrainingLoad(userId) {
  try {
    // Get user's workouts
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, workout_date, duration, avg_hr, max_hr')
      .eq('user_id', userId)
      .order('workout_date', { ascending: true });

    if (workoutsError) {
      throw workoutsError;
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('max_hr, resting_hr')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    const maxHR = profile?.max_hr || 185;
    const restingHR = profile?.resting_hr || 60;

    let atl = 0;
    let ctl = 0;

    // Iterate over workouts and calculate TRIMP, ATL, CTL, TSB
    for (const workout of workouts) {
      // Calculate TRIMP
      const trimp = calculateTRIMP(workout.duration / 60, workout.avg_hr, maxHR, restingHR);

      // Calculate ATL
      atl = calculateATL(atl, trimp);

      // Calculate CTL
      ctl = calculateCTL(ctl, trimp);

      // Calculate TSB
      const tsb = calculateTSB(ctl, atl);

      // Get workout date
      const workoutDate = workout.workout_date;

      // Store training load metrics in the database
      const { error: trainingLoadError } = await supabase
        .from('training_load')
        .upsert({
          user_id: userId,
          date: workoutDate,
          atl: atl,
          ctl: ctl,
          tsb: tsb,
        }, { onConflict: ['user_id', 'date'] });

      if (trainingLoadError) {
        throw trainingLoadError;
      }
    }
  } catch (error) {
    console.error('Error updating training load:', error);
    throw error;
  }
}

export default {
  calculateTRIMP,
  calculateATL,
  calculateCTL,
  calculateTSB,
  calculateHRDrift,
  estimateVO2max,
  updateTrainingLoad
};
