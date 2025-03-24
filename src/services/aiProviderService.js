/**
 * AI Provider Service
 * 
 * A flexible service that allows switching between different AI providers:
 * - OpenAI
 * - Google Gemini
 * - Hugging Face
 */

// Configuration for different AI providers
const AI_PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  HUGGINGFACE: 'huggingface'
};

/**
 * Get coaching advice from the selected AI provider
 * @param {Object} trainingData - The training data to analyze
 * @param {string} provider - The AI provider to use (defaults to GEMINI)
 * @returns {Promise<string>} - The coaching advice
 */
export async function getCoachingAdvice(trainingData, provider = AI_PROVIDERS.GEMINI) {
  switch (provider) {
    case AI_PROVIDERS.OPENAI:
      return getOpenAICoachingAdvice(trainingData);
    case AI_PROVIDERS.GEMINI:
      return getGeminiCoachingAdvice(trainingData);
    case AI_PROVIDERS.HUGGINGFACE:
      return getHuggingFaceCoachingAdvice(trainingData);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get coaching advice from OpenAI
 * @param {Object} trainingData - The training data to analyze
 * @returns {Promise<string>} - The coaching advice
 */
async function getOpenAICoachingAdvice(trainingData) {
  try {
    const response = await fetch('/api/coach/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trainingData }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.advice;
  } catch (error) {
    console.error('Error getting OpenAI coaching advice:', error);
    throw error;
  }
}

/**
 * Get coaching advice from Google Gemini
 * @param {Object} trainingData - The training data to analyze
 * @returns {Promise<string>} - The coaching advice
 */
async function getGeminiCoachingAdvice(trainingData) {
  try {
    const response = await fetch('/api/coach/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trainingData }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.advice;
  } catch (error) {
    console.error('Error getting Gemini coaching advice:', error);
    throw error;
  }
}

/**
 * Get coaching advice from Hugging Face
 * @param {Object} trainingData - The training data to analyze
 * @returns {Promise<string>} - The coaching advice
 */
async function getHuggingFaceCoachingAdvice(trainingData) {
  try {
    const response = await fetch('/api/coach/huggingface', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trainingData }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.advice;
  } catch (error) {
    console.error('Error getting Hugging Face coaching advice:', error);
    throw error;
  }
}

export { AI_PROVIDERS };
