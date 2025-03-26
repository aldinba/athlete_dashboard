import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { FitParser } from "https://esm.sh/fit-file-parser@1.9.5"

interface RequestBody {
  filePath: string
}

serve(async (req) => {
  try {
    // Get the request body
    const { filePath } = (await req.json()) as RequestBody

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the current user
    const authHeader = req.headers.get("Authorization")!
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Download the FIT file from storage
    const { data: fileData, error: downloadError } = await supabase.storage.from("workout-files").download(filePath)

    if (downloadError) {
      throw new Error(`Error downloading file: ${downloadError.message}`)
    }

    // Parse the FIT file
    const fitParser = new FitParser({
      force: true,
      speedUnit: "km/h",
      lengthUnit: "m",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "list",
    })

    const arrayBuffer = await fileData.arrayBuffer()
    const fitData = await new Promise((resolve, reject) => {
      fitParser.parse(arrayBuffer, (error, data) => {
        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      })
    })

    // Extract workout data
    const { sessions, records, activity } = fitData as any

    if (!sessions || sessions.length === 0) {
      throw new Error("No sessions found in FIT file")
    }

    const session = sessions[0]

    // Basic workout data
    const workoutData = {
      user_id: user.id,
      title: activity?.event || "Workout",
      type: session.sport || "Other",
      date: new Date(session.start_time).toISOString(),
      distance: session.total_distance || 0,
      duration: session.total_elapsed_time || 0,
    }

    // Insert workout
    const { data: workout, error: workoutError } = await supabase.from("workouts").insert(workoutData).select().single()

    if (workoutError) {
      throw new Error(`Error inserting workout: ${workoutError.message}`)
    }

    // Extract metrics
    const avgHr = session.avg_heart_rate || 0
    const maxHr = session.max_heart_rate || 0
    const avgCadence = session.avg_cadence || 0
    const elevationGain = session.total_ascent || 0
    const calories = session.total_calories || 0
    const avgPace = session.avg_speed ? 1000 / session.avg_speed / 60 : 0

    // Calculate TRIMP (Training Impulse)
    const userMaxHr = 220 - 30 // Default age of 30
    const hrRatio = avgHr / userMaxHr
    const duration = session.total_elapsed_time / 60 // in minutes

    // Banister's TRIMP formula
    const gender = "male" // Default
    const y = gender === "male" ? 1.92 : 1.67
    const trimp = duration * hrRatio * 0.64 * Math.exp(y * hrRatio)

    // Calculate intensity
    const intensity = avgHr / (userMaxHr * 0.7)

    // Calculate HR drift
    let hrDrift = 0
    if (records && records.length > 0) {
      const firstHalf = records.slice(0, Math.floor(records.length / 2))
      const secondHalf = records.slice(Math.floor(records.length / 2))

      const firstHalfAvgHr = firstHalf.reduce((sum, r) => sum + (r.heart_rate || 0), 0) / firstHalf.length
      const secondHalfAvgHr = secondHalf.reduce((sum, r) => sum + (r.heart_rate || 0), 0) / secondHalf.length

      hrDrift = (secondHalfAvgHr - firstHalfAvgHr) / firstHalfAvgHr
    }

    // Insert workout metrics
    const metricsData = {
      workout_id: workout.id,
      avg_hr: avgHr,
      max_hr: maxHr,
      avg_hr_percentage: avgHr / userMaxHr,
      avg_cadence: avgCadence,
      elevation_gain: elevationGain,
      calories: calories,
      avg_pace: avgPace,
      trimp: trimp,
      intensity: intensity,
      hr_drift: hrDrift,
      pace_variability: 0.05, // Default value
    }

    const { error: metricsError } = await supabase.from("workout_metrics").insert(metricsData)

    if (metricsError) {
      throw new Error(`Error inserting metrics: ${metricsError.message}`)
    }

    // Extract and insert GPS data
    if (records && records.length > 0) {
      const gpsData = records
        .filter((r) => r.position_lat && r.position_long)
        .map((r) => ({
          workout_id: workout.id,
          latitude: r.position_lat,
          longitude: r.position_long,
          elevation: r.altitude || 0,
          timestamp: new Date(r.timestamp).toISOString(),
          heart_rate: r.heart_rate || 0,
          cadence: r.cadence || 0,
          speed: r.speed || 0,
        }))

      if (gpsData.length > 0) {
        const { error: gpsError } = await supabase.from("gps_data").insert(gpsData)

        if (gpsError) {
          throw new Error(`Error inserting GPS data: ${gpsError.message}`)
        }
      }
    }

    // Calculate and update training load
    await updateTrainingLoad(supabase, user.id)

    return new Response(JSON.stringify({ success: true, workoutId: workout.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

async function updateTrainingLoad(supabase, userId) {
  // Get all workouts for the user
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select(`
      id,
      date,
      workout_metrics (trimp)
    `)
    .eq("user_id", userId)
    .order("date", { ascending: true })

  if (error) {
    throw new Error(`Error fetching workouts: ${error.message}`)
  }

  // Calculate ATL, CTL, and TSB for each day
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 42) // Go back 42 days

  const dailyLoad = []

  // Initialize daily load array
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    dailyLoad.push({
      date: new Date(d).toISOString().split("T")[0],
      trimp: 0,
    })
  }

  // Add TRIMP values to the appropriate days
  workouts.forEach((workout) => {
    const workoutDate = new Date(workout.date).toISOString().split("T")[0]
    const dayIndex = dailyLoad.findIndex((d) => d.date === workoutDate)

    if (dayIndex >= 0) {
      dailyLoad[dayIndex].trimp += workout.workout_metrics.trimp
    }
  })

  // Calculate ATL, CTL, and TSB
  const atlTimeConstant = 7 // 7-day time constant for ATL
  const ctlTimeConstant = 42 // 42-day time constant for CTL

  let atl = 0
  let ctl = 0

  const trainingLoad = dailyLoad.map((day) => {
    // Update ATL and CTL
    atl = day.trimp + atl * (1 - 1 / atlTimeConstant)
    ctl = day.trimp + ctl * (1 - 1 / ctlTimeConstant)

    // Calculate TSB
    const tsb = ctl - atl

    return {
      date: day.date,
      atl,
      ctl,
      tsb,
      user_id: userId,
    }
  })

  // Upsert training load data
  for (const day of trainingLoad) {
    const { error } = await supabase.from("training_load").upsert(day, { onConflict: "user_id, date" })

    if (error) {
      throw new Error(`Error upserting training load: ${error.message}`)
    }
  }
}

