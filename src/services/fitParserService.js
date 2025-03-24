import { supabase } from '../lib/supabaseClient';

/**
 * Parse and store FIT file data
 * @param {string} filePath - Path to the FIT file in Supabase storage
 * @param {string} userId - User ID who owns the file
 * @returns {Promise} - Promise resolving to the stored workout data
 */
export const parseAndStoreFitFile = async (filePath, userId) => {
  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('workout-files')
      .download(filePath);

    if (error) {
      throw error;
    }

    // Convert to ArrayBuffer for parsing
    const arrayBuffer = await data.arrayBuffer();

    // Dynamically import fit-file-parser to avoid server-side issues
    const FitParser = (await import('fit-file-parser')).default;

    // Parse FIT file
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade',
    });

    return new Promise((resolve, reject) => {
      fitParser.parse(arrayBuffer, async (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          // Extract workout data
          const workoutData = extractWorkoutData(result);
          
          // Store in database
          const { data, error: dbError } = await storeWorkoutData(workoutData, userId, filePath);
          
          if (dbError) {
            throw dbError;
          }
          
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('Error parsing FIT file:', error);
    throw error;
  }
};

/**
 * Extract relevant workout data from parsed FIT file
 * @param {Object} fitData - Parsed FIT file data
 * @returns {Object} - Extracted workout and GPS data
 */
const extractWorkoutData = (fitData) => {
  // Default values
  let workoutData = {
    title: 'Workout',
    workout_date: new Date(),
    duration: 0,
    distance: 0,
    avg_hr: 0,
    max_hr: 0,
    avg_cadence: 0,
    elevation_gain: 0,
    avg_pace: 0,
    workout_type: 'other',
  };

  // Extract session data if available
  if (fitData.sessions && fitData.sessions.length > 0) {
    const session = fitData.sessions[0];
    
    workoutData.title = session.sport || 'Workout';
    workoutData.workout_date = new Date(session.start_time);
    workoutData.duration = session.total_timer_time || session.total_elapsed_time || 0;
    workoutData.distance = session.total_distance || 0;
    workoutData.avg_hr = session.avg_heart_rate || 0;
    workoutData.max_hr = session.max_heart_rate || 0;
    workoutData.avg_cadence = session.avg_cadence || 0;
    workoutData.elevation_gain = session.total_ascent || 0;
    
    // Calculate average pace (seconds per kilometer)
    if (session.total_distance > 0 && session.total_timer_time > 0) {
      workoutData.avg_pace = (session.total_timer_time / (session.total_distance / 1000));
    }
    
    // Determine workout type
    if (session.sport) {
      if (session.sport.toLowerCase() === 'running') {
        if (session.sub_sport) {
          const subSport = session.sub_sport.toLowerCase();
          if (subSport.includes('interval')) workoutData.workout_type = 'intervals';
          else if (subSport.includes('tempo')) workoutData.workout_type = 'tempo';
          else if (subSport.includes('long')) workoutData.workout_type = 'long run';
          else workoutData.workout_type = 'easy';
        } else {
          workoutData.workout_type = 'easy';
        }
      } else {
        workoutData.workout_type = session.sport.toLowerCase();
      }
    }
  }

  // Extract GPS data if available
  let gpsData = [];
  if (fitData.records && fitData.records.length > 0) {
    gpsData = fitData.records.map(record => ({
      timestamp: record.timestamp,
      position_lat: record.position_lat,
      position_long: record.position_long,
      altitude: record.altitude,
      heart_rate: record.heart_rate,
      cadence: record.cadence,
      speed: record.speed,
    })).filter(point => point.position_lat && point.position_long);
  }

  return {
    workout: workoutData,
    gps: gpsData
  };
};

/**
 * Store extracted workout data in the database
 * @param {Object} workoutData - Extracted workout data
 * @param {string} userId - User ID who owns the workout
 * @param {string} fitFileUrl - URL to the stored FIT file
 * @returns {Promise} - Promise resolving to the stored workout data
 */
const storeWorkoutData = async (workoutData, userId, fitFileUrl) => {
  // Insert workout data
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert([{
      user_id: userId,
      title: workoutData.workout.title,
      workout_date: workoutData.workout.workout_date,
      duration: workoutData.workout.duration,
      distance: workoutData.workout.distance,
      avg_hr: workoutData.workout.avg_hr,
      max_hr: workoutData.workout.max_hr,
      avg_cadence: workoutData.workout.avg_cadence,
      elevation_gain: workoutData.workout.elevation_gain,
      avg_pace: workoutData.workout.avg_pace,
      workout_type: workoutData.workout.workout_type,
      fit_file_url: fitFileUrl
    }])
    .select()
    .single();

  if (workoutError) {
    throw workoutError;
  }

  // Insert GPS data if available
  if (workoutData.gps.length > 0) {
    const { error: gpsError } = await supabase
      .from('gps_data')
      .insert([{
        workout_id: workout.id,
        user_id: userId,
        points: workoutData.gps
      }]);

    if (gpsError) {
      throw gpsError;
    }
  }

  // Calculate and store workout metrics
  await calculateAndStoreWorkoutMetrics(workout.id, userId, workoutData);

  return { data: workout, error: null };
};

/**
 * Calculate and store workout metrics
 * @param {string} workoutId - Workout ID
 * @param {string} userId - User ID
 * @param {Object} workoutData - Workout data
 * @returns {Promise} - Promise resolving to the stored metrics
 */
const calculateAndStoreWorkoutMetrics = async (workoutId, userId, workoutData) => {
  // Calculate TRIMP (Training Impulse)
  // Using Banister's formula: TRIMP = duration (min) × intensity factor
  // where intensity factor = avg_hr_reserve × 0.64 × e^(1.92 × avg_hr_reserve)
  // and hr_reserve = (avg_hr - resting_hr) / (max_hr - resting_hr)
  
  // Get user's max and resting heart rates from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('max_hr, resting_hr')
    .eq('id', userId)
    .single();
  
  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return;
  }
  
  // Default values if not set in profile
  const maxHR = profile?.max_hr || 220 - 30; // Default formula: 220 - age (assuming 30)
  const restingHR = profile?.resting_hr || 60;
  
  // Calculate TRIMP
  let trimp = 0;
  if (workoutData.workout.avg_hr > 0 && workoutData.workout.duration > 0) {
    const durationMinutes = workoutData.workout.duration / 60;
    const hrReserve = (workoutData.workout.avg_hr - restingHR) / (maxHR - restingHR);
    
    if (hrReserve > 0) {
      // Banister's formula
      const intensityFactor = hrReserve * 0.64 * Math.exp(1.92 * hrReserve);
      trimp = durationMinutes * intensityFactor;
    }
  }
  
  // Calculate HR zones distribution
  const hrZones = calculateHRZones(workoutData.gps, maxHR, restingHR);
  
  // Calculate HR drift
  const hrDrift = calculateHRDrift(workoutData.gps);
  
  // Estimate VO2max using Firstbeat method (simplified)
  // This is a very simplified estimation and should be refined
  let vo2maxEstimate = 0;
  if (workoutData.workout.avg_hr > 0 && workoutData.workout.avg_pace > 0) {
    // Simple VO2max estimation based on heart rate and pace
    // VO2max ≈ 15 * (max speed in km/h) / (avg HR / max HR)
    const avgSpeedKmh = 3600 / workoutData.workout.avg_pace;
    vo2maxEstimate = 15 * avgSpeedKmh / (workoutData.workout.avg_hr / maxHR);
  }
  
  // Store workout metrics
  const { error: metricsError } = await supabase
    .from('workout_metrics')
    .insert([{
      workout_id: workoutId,
      user_id: userId,
      trimp: trimp,
      hr_zones: hrZones,
      hr_drift: hrDrift,
      vo2max_estimate: vo2maxEstimate
    }]);
  
  if (metricsError) {
    console.error('Error storing workout metrics:', metricsError);
  }
  
  return { trimp, hrZones, hrDrift, vo2maxEstimate };
};

/**
 * Calculate heart rate zones distribution
 * @param {Array} gpsData - GPS data with heart rate readings
 * @param {number} maxHR - Maximum heart rate
 * @param {number} restingHR - Resting heart rate
 * @returns {Object} - Distribution of time spent in each HR zone
 */
const calculateHRZones = (gpsData, maxHR, restingHR) => {
  // Define HR zones based on % of HR reserve (Karvonen method)
  const zones = {
    zone1: { min: 0, max: 0.6 },     // Recovery: <60% of HRR
    zone2: { min: 0.6, max: 0.7 },   // Endurance: 60-70% of HRR
    zone3: { min: 0.7, max: 0.8 },   // Tempo: 70-80% of HRR
    zone4: { min: 0.8, max: 0.9 },   // Threshold: 80-90% of HRR
    zone5: { min: 0.9, max: 1.0 }    // VO2max: >90% of HRR
  };
  
  // Initialize time spent in each zone
  const timeInZones = {
    zone1: 0,
    zone2: 0,
    zone3: 0,
    zone4: 0,
    zone5: 0
  };
  
  // Count points in each zone
  let pointsWithHR = 0;
  
  for (let i = 0; i < gpsData.length; i++) {
    const point = gpsData[i];
    
    if (point.heart_rate) {
      pointsWithHR++;
      
      // Calculate heart rate reserve percentage
      const hrr = (point.heart_rate - restingHR) / (maxHR - restingHR);
      
      // Determine zone
      if (hrr < zones.zone1.max) {
        timeInZones.zone1++;
      } else if (hrr < zones.zone2.max) {
        timeInZones.zone2++;
      } else if (hrr < zones.zone3.max) {
        timeInZones.zone3++;
      } else if (hrr < zones.zone4.max) {
        timeInZones.zone4++;
      } else {
        timeInZones.zone5++;
      }
    }
  }
  
  // Convert to percentages
  if (pointsWithHR > 0) {
    Object.keys(timeInZones).forEach(zone => {
      timeInZones[zone] = (timeInZones[zone] / pointsWithHR) * 100;
    });
  }
  
  return timeInZones;
};

/**
 * Calculate heart rate drift
 * @param {Array} gpsData - GPS data with heart rate readings
 * @returns {number} - Heart rate drift percentage
 */
const calculateHRDrift = (gpsData) => {
  if (!gpsData || gpsData.length < 10) {
    return 0;
  }
  
  // Split the workout into first and second half
  const midpoint = Math.floor(gpsData.length / 2);
  const firstHalf = gpsData.slice(0, midpoint);
  const secondHalf = gpsData.slice(midpoint);
  
  // Calculate average heart rate for each half
  const firstHalfHR = firstHalf.reduce((sum, point) => sum + (point.heart_rate || 0), 0) / firstHalf.length;
  const secondHalfHR = secondHalf.reduce((sum, point) => sum + (point.heart_rate || 0), 0) / secondHalf.length;
  
  // Calculate drift percentage
  if (firstHalfHR > 0) {
    return ((secondHalfHR - firstHalfHR) / firstHalfHR) * 100;
  }
  
  return 0;
};

export default {
  parseAndStoreFitFile,
  extractWorkoutData,
  storeWorkoutData
};
