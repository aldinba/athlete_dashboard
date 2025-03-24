// Hugging Face API handler for the Smart Coach feature
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient({ req, res });
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { trainingData } = req.body;
    
    // Call Hugging Face Inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          inputs: `You are an expert running coach analyzing training data for a runner. 
          Based on the following metrics, provide personalized coaching advice:
          
          Recent Training Data:
          ${JSON.stringify(trainingData, null, 2)}
          
          Please provide advice on:
          1. Current training status (improving, maintaining, overtraining)
          2. Recovery recommendations
          3. Suggested workout types for next sessions
          4. Any areas of concern or improvement
          
          Format your response in a conversational, encouraging tone.`
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }
    
    const result = await response.json();
    return res.status(200).json({ advice: result[0].generated_text });
  } catch (error) {
    console.error('Error generating coaching advice:', error);
    return res.status(500).json({ error: 'Failed to generate coaching advice' });
  }
}
