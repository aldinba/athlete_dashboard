// api/coach.js
const { OpenAI } = require('openai');

module.exports = async function (req, res) {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const { trainingData } = req.body;
    
    // Format the training data for the prompt
    const formattedData = formatTrainingData(trainingData);
    
    // Generate the prompt
    const prompt = generatePrompt(formattedData);
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert running coach who specializes in analyzing training data and providing personalized advice. Your advice should be encouraging, specific, and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Return the coaching advice
    res.status(200).json({
      advice: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to generate coaching advice' });
  }
};

// Format training data for the prompt
function formatTrainingData(data) {
  const {
    recentWorkouts,
    trainingLoad,
    userProfile
  } = data;
  
  // Format recent workouts
  const workoutsText = recentWorkouts.map(workout => {
    return `- ${new Date(workout.workout_date).toLocaleDateString()}: ${workout.workout_type || 'Workout'}, ${(workout.distance / 1000).toFixed(2)}km, ${Math.floor(workout.duration / 60)} minutes, Avg HR: ${workout.avg_hr || 'N/A'}`;
  }).join('\n');
  
  // Format training load metrics
  const loadText = `
Current ATL (Fatigue): ${trainingLoad.atl.toFixed(1)}
Current CTL (Fitness): ${trainingLoad.ctl.toFixed(1)}
Current TSB (Form): ${trainingLoad.tsb.toFixed(1)}
Weekly Distance: ${(trainingLoad.weekly_distance / 1000).toFixed(1)}km
  `;
  
  // Format user profile
  const profileText = `
Age: ${userProfile.age || 'Unknown'}
Gender: ${userProfile.gender || 'Unknown'}
Experience Level: ${userProfile.experience_level || 'Unknown'}
Goals: ${userProfile.goals || 'General fitness'}
  `;
  
  return {
    workoutsText,
    loadText,
    profileText
  };
}

// Generate the prompt for OpenAI
function generatePrompt(formattedData) {
  return `
Please analyze this runner's training data and provide personalized coaching advice:

## Recent Workouts
${formattedData.workoutsText}

## Training Load Metrics
${formattedData.loadText}

## Athlete Profile
${formattedData.profileText}

Based on this data, please provide:
1. An assessment of their current training status (overtraining, undertraining, or optimal)
2. Recommendations for their next 1-2 workouts
3. Any areas of concern or improvement
4. A motivational message

Keep your response concise, practical, and encouraging.
`;
}
