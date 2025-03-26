import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RequestBody {
  workoutId: string
  forceRegenerate?: boolean
}

serve(async (req) => {
  try {
    // Get the request body
    const { workoutId, forceRegenerate = false } = (await req.json()) as RequestBody

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

    // Check if we already have advice for this workout
    if (!forceRegenerate) {
      const { data: existingAdvice, error: fetchError } = await supabase
        .from("coaching_advice")
        .select("advice")
        .eq("workout_id", workoutId)
        .single()

      if (!fetchError && existingAdvice) {
        return new Response(JSON.stringify({ advice: existingAdvice.advice }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Fetch workout details
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select(`
        *,
        workout_metrics(*),
        training_load(atl, ctl, tsb)
      `)
      .eq("id", workoutId)
      .single()

    if (workoutError) {
      throw new Error(`Error fetching workout: ${workoutError.message}`)
    }

    // Fetch user's recent workouts
    const { data: recentWorkouts, error: recentError } = await supabase
      .from("workouts")
      .select(`
        id,
        date,
        type,
        distance,
        duration,
        workout_metrics(trimp)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10)

    if (recentError) {
      throw new Error(`Error fetching recent workouts: ${recentError.message}`)
    }

    // Prepare data for the AI
    const workoutData = {
      date: new Date(workout.date).toLocaleDateString(),
      type: workout.type,
      distance: (workout.distance / 1000).toFixed(2) + " km",
      duration: formatDuration(workout.duration),
      avgHr: Math.round(workout.workout_metrics.avg_hr) + " bpm",
      maxHr: workout.workout_metrics.max_hr + " bpm",
      avgPace: formatPace(workout.workout_metrics.avg_pace),
      elevationGain: workout.workout_metrics.elevation_gain + " m",
      trimp: workout.workout_metrics.trimp.toFixed(1),
      intensity: workout.workout_metrics.intensity.toFixed(2),
      hrDrift: (workout.workout_metrics.hr_drift * 100).toFixed(1) + "%",
      trainingLoad: {
        atl: workout.training_load?.atl.toFixed(1) || "N/A",
        ctl: workout.training_load?.ctl.toFixed(1) || "N/A",
        tsb: workout.training_load?.tsb.toFixed(1) || "N/A",
      },
    }

    const recentWorkoutsData = recentWorkouts.map((w) => ({
      date: new Date(w.date).toLocaleDateString(),
      type: w.type,
      distance: (w.distance / 1000).toFixed(2) + " km",
      duration: formatDuration(w.duration),
      trimp: w.workout_metrics.trimp.toFixed(1),
    }))

    // Generate coaching advice using OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not found")
    }

    const prompt = `
      You are an expert endurance coach analyzing a workout. Provide personalized coaching advice based on the following data:
      
      CURRENT WORKOUT:
      ${JSON.stringify(workoutData, null, 2)}
      
      RECENT WORKOUTS:
      ${JSON.stringify(recentWorkoutsData, null, 2)}
      
      Please provide:
      1. A brief analysis of this workout (intensity, effort, etc.)
      2. What physiological adaptations this workout likely stimulated
      3. Recovery recommendations
      4. Suggestions for future workouts based on the training load metrics
      
      Format your response in HTML with appropriate headings and paragraphs. Be specific, actionable, and encouraging.
    `

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert endurance coach providing personalized advice." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    const aiResponse = await response.json()

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || "Unknown error"}`)
    }

    const advice = aiResponse.choices[0].message.content

    // Store the advice in the database
    const { error: insertError } = await supabase.from("coaching_advice").upsert(
      {
        workout_id: workoutId,
        user_id: user.id,
        advice,
        created_at: new Date().toISOString(),
      },
      { onConflict: "workout_id" },
    )

    if (insertError) {
      throw new Error(`Error storing advice: ${insertError.message}`)
    }

    return new Response(JSON.stringify({ advice }), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatPace(pace) {
  const minutes = Math.floor(pace)
  const seconds = Math.floor((pace - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`
}

