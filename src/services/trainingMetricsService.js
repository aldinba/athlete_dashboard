# Training Metrics Calculation

This document outlines the implementation of training metrics calculations for the Athlete Dashboard application.

## Overview

Training metrics are essential for athletes to understand their training load, recovery status, and fitness progression. The Athlete Dashboard will implement several key metrics:

1. **TRIMP (Training Impulse)** - A measure of training load for a single workout
2. **ATL (Acute Training Load)** - Short-term training load (fatigue)
3. **CTL (Chronic Training Load)** - Long-term training load (fitness)
4. **TSB (Training Stress Balance)** - Balance between fitness and fatigue (form)
5. **VO2max estimate** - Estimated maximal oxygen uptake
6. **HR Drift** - Heart rate increase over time at constant intensity

## Implementation Details

### TRIMP (Training Impulse)

TRIMP quantifies the training load of a single workout based on duration and intensity.

**Banister's TRIMP Formula:**
```
TRIMP = duration (minutes) × intensity factor
```

Where intensity factor is calculated as:
```
intensity factor = HRR × 0.64 × e^(1.92 × HRR)
```

And HRR (Heart Rate Reserve) is:
```
HRR = (avg_hr - resting_hr) / (max_hr - resting_hr)
```

### ATL (Acute Training Load)

ATL represents short-term fatigue and is calculated as an exponentially weighted average of daily TRIMP values with a time constant of 7 days.

**Formula:**
```
ATL_today = ATL_yesterday + (TRIMP_today - ATL_yesterday) / 7
```

### CTL (Chronic Training Load)

CTL represents long-term fitness and is calculated as an exponentially weighted average of daily TRIMP values with a time constant of 42 days.

**Formula:**
```
CTL_today = CTL_yesterday + (TRIMP_today - CTL_yesterday) / 42
```

### TSB (Training Stress Balance)

TSB represents the balance between fitness and fatigue, often referred to as "form".

**Formula:**
```
TSB = CTL - ATL
```

- Positive TSB: Fresh, well-recovered state
- Negative TSB: Fatigued state
- Very negative TSB: Risk of overtraining

### VO2max Estimate

VO2max is estimated using heart rate and pace data from workouts.

**Simplified Firstbeat Method:**
```
VO2max ≈ 15 * (max speed in km/h) / (avg HR / max HR)
```

### HR Drift

HR drift measures cardiovascular efficiency by comparing heart rate between the first and second half of a workout at similar intensities.

**Formula:**
```
HR Drift = ((avg_hr_second_half - avg_hr_first_half) / avg_hr_first_half) * 100
```

## Implementation Plan

### 1. Training Metrics Service

Create a service that:
- Calculates TRIMP for individual workouts
- Updates ATL, CTL, and TSB daily
- Stores calculated metrics in the database

```javascript
// trainingMetricsService.js
import { supabase } from '../lib/supabaseClient';

/**
 * Calculate TRIMP for a workout
 * @param {Object} workout - Workout data
 * @param {Object} userProfile - User profile with max_hr and resting_hr
 * @returns {number} - TRIMP value
 */
export const calculateTRIMP = (workout, userProfile) => {
  const { duration, avg_hr } = workout;
  const { max_hr, resting_hr } = userProfile;
  
  // Default values if not available
  const maxHR = max_hr || 220 - 30; // Default formula: 220 - age (assuming 30)
  const restingHR = resting_hr || 60;
  
  // Calculate TRIMP
  if (avg_hr > 0 && duration > 0) {
    const durationMinutes = duration / 60;
    const hrReserve = (avg_hr - restingHR) / (maxHR - restingHR);
    
    if (hrReserve > 0) {
      // Banister's formula
      const intensityFactor = hrReserve * 0.64 * Math.exp(1.92 * hrReserve);
      return durationMinutes * intensityFactor;
    }
  }
  
  return 0;
};

/**
 * Calculate ATL (Acute Training Load)
 * @param {number} previousATL - Previous day's ATL
 * @param {number} todayTRIMP - Today's TRIMP value
 * @returns {number} - New ATL value
 */
export const calculateATL = (previousATL, todayTRIMP) => {
  return previousATL + (todayTRIMP - previousATL) / 7;
};

/**
 * Calculate CTL (Chronic Training Load)
 * @param {number} previousCTL - Previous day's CTL
 * @param {number} todayTRIMP - Today's TRIMP value
 * @returns {number} - New CTL value
 */
export const calculateCTL = (previousCTL, todayTRIMP) => {
  return previousCTL + (todayTRIMP - previousCTL) / 42;
};

/**
 * Calculate TSB (Training Stress Balance)
 * @param {number} ctl - Chronic Training Load
 * @param {number} atl - Acute Training Load
 * @returns {number} - Training Stress Balance
 */
export const calculateTSB = (ctl, atl) => {
  return ctl - atl;
};

/**
 * Update training load metrics for a user
 * @param {string} userId - User ID
 * @returns {Promise} - Promise resolving to updated training load data
 */
export const updateTrainingLoad = async (userId) => {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('max_hr, resting_hr')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // Get latest training load record
    const { data: latestTrainingLoad, error: loadError } = await supabase
      .from('training_load')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize previous values
    let previousATL = latestTrainingLoad?.atl || 0;
    let previousCTL = latestTrainingLoad?.ctl || 0;
    let lastDate = latestTrainingLoad ? new Date(latestTrainingLoad.date) : new Date(today);
    lastDate.setHours(0, 0, 0, 0);
    
    // If latest record is from today, we'll update it
    // Otherwise, we need to fill in missing days and create a new record
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0) {
      // Fill in missing days with decay
      for (let i = 1; i <= daysDiff; i++) {
        const currentDate = new Date(lastDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        // For missing days, TRIMP is 0 (no workout)
        previousATL = calculateATL(previousATL, 0);
        previousCTL = calculateCTL(previousCTL, 0);
        const tsb = calculateTSB(previousCTL, previousATL);
        
        // Only insert the last missing day or today
        if (i === daysDiff) {
          // Get today's workouts
          const { data: todayWorkouts, error: workoutsError } = await supabase
            .from('workouts')
            .select('id, duration, distance, avg_hr')
            .eq('user_id', userId)
            .gte('workout_date', currentDate.toISOString().split('T')[0])
            .lt(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
          
          if (workoutsError) {
            throw workoutsError;
          }
          
          // Calculate today's TRIMP from all workouts
          let todayTRIMP = 0;
          let todayDistance = 0;
          let todayDuration = 0;
          
          for (const workout of todayWorkouts || []) {
            todayTRIMP += calculateTRIMP(workout, profile);
            todayDistance += workout.distance || 0;
            todayDuration += workout.duration || 0;
          }
          
          // Update with today's workout data
          previousATL = calculateATL(previousATL, todayTRIMP);
          previousCTL = calculateCTL(previousCTL, todayTRIMP);
          const updatedTSB = calculateTSB(previousCTL, previousATL);
          
          // Insert or update training load record
          const { data, error } = await supabase
            .from('training_load')
            .upsert({
              user_id: userId,
              date: currentDate.toISOString().split('T')[0],
              atl: previousATL,
              ctl: previousCTL,
              tsb: updatedTSB,
              weekly_distance: calculateWeeklyMetric(userId, 'distance', currentDate),
              weekly_duration: calculateWeeklyMetric(userId, 'duration', currentDate)
            })
            .select();
          
          if (error) {
            throw error;
          }
          
          return data;
        }
      }
    } else if (daysDiff === 0 && latestTrainingLoad) {
      // Update today's record with latest workout data
      
      // Get today's workouts
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, duration, distance, avg_hr')
        .eq('user_id', userId)
        .gte('workout_date', today.toISOString().split('T')[0])
        .lt(new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (workoutsError) {
        throw workoutsError;
      }
      
      // Calculate today's TRIMP from all workouts
      let todayTRIMP = 0;
      let todayDistance = 0;
      let todayDuration = 0;
      
      for (const workout of todayWorkouts || []) {
        todayTRIMP += calculateTRIMP(workout, profile);
        todayDistance += workout.distance || 0;
        todayDuration += workout.duration || 0;
      }
      
      // Update with today's workout data
      const updatedATL = calculateATL(previousATL, todayTRIMP);
      const updatedCTL = calculateCTL(previousCTL, todayTRIMP);
      const updatedTSB = calculateTSB(updatedCTL, updatedATL);
      
      // Update training load record
      const { data, error } = await supabase
        .from('training_load')
        .update({
          atl: updatedATL,
          ctl: updatedCTL,
          tsb: updatedTSB,
          weekly_distance: await calculateWeeklyMetric(userId, 'distance', today),
          weekly_duration: await calculateWeeklyMetric(userId, 'duration', today)
        })
        .eq('id', latestTrainingLoad.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating training load:', error);
    throw error;
  }
};

/**
 * Calculate weekly metric (distance or duration)
 * @param {string} userId - User ID
 * @param {string} metric - Metric to calculate ('distance' or 'duration')
 * @param {Date} date - Date to calculate for
 * @returns {Promise<number>} - Weekly metric value
 */
export const calculateWeeklyMetric = async (userId, metric, date) => {
  // Calculate start of week (last 7 days)
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  
  // Get workouts for the week
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select(`id, ${metric}`)
    .eq('user_id', userId)
    .gte('workout_date', startDate.toISOString())
    .lte('workout_date', date.toISOString());
  
  if (error) {
    console.error(`Error calculating weekly ${metric}:`, error);
    return 0;
  }
  
  // Sum the metric
  return workouts.reduce((sum, workout) => sum + (workout[metric] || 0), 0);
};

export default {
  calculateTRIMP,
  calculateATL,
  calculateCTL,
  calculateTSB,
  updateTrainingLoad,
  calculateWeeklyMetric
};
