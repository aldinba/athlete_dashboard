import { useState, useEffect } from 'react';
import { AI_PROVIDERS, getCoachingAdvice } from '../services/aiProviderService';

/**
 * SmartCoach component that provides AI-powered coaching advice
 * based on the user's training data
 */
const SmartCoach = ({ user, trainingData, supabaseClient }) => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(AI_PROVIDERS.GEMINI);

  // Function to fetch coaching advice
  const fetchCoachingAdvice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coachingAdvice = await getCoachingAdvice(trainingData, selectedProvider);
      setAdvice(coachingAdvice);
    } catch (err) {
      console.error('Error fetching coaching advice:', err);
      setError('Failed to get coaching advice. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch advice when component mounts or training data changes
  useEffect(() => {
    if (trainingData && Object.keys(trainingData).length > 0) {
      fetchCoachingAdvice();
    }
  }, [trainingData, selectedProvider]);

  // Handle provider change
  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value);
  };

  return (
    <div className="smart-coach">
      <div className="coach-header">
        <h2>AI Smart Coach</h2>
        <div className="provider-selector">
          <label htmlFor="ai-provider">AI Provider:</label>
          <select 
            id="ai-provider" 
            value={selectedProvider} 
            onChange={handleProviderChange}
            disabled={loading}
          >
            <option value={AI_PROVIDERS.GEMINI}>Google Gemini</option>
            <option value={AI_PROVIDERS.OPENAI}>OpenAI</option>
            <option value={AI_PROVIDERS.HUGGINGFACE}>Hugging Face</option>
          </select>
        </div>
      </div>
      
      <div className="coach-content">
        {loading ? (
          <div className="loading-indicator">
            <p>Analyzing your training data...</p>
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchCoachingAdvice}>Try Again</button>
          </div>
        ) : advice ? (
          <div className="advice-container">
            <div className="advice-text">{advice}</div>
            <button onClick={fetchCoachingAdvice} className="refresh-button">
              Get Fresh Advice
            </button>
          </div>
        ) : (
          <div className="no-data-message">
            <p>Upload training data to get personalized coaching advice.</p>
          </div>
        )}
      </div>
      
      <div className="coach-footer">
        <p className="provider-info">
          Powered by {selectedProvider === AI_PROVIDERS.OPENAI ? 'OpenAI' : 
                      selectedProvider === AI_PROVIDERS.GEMINI ? 'Google Gemini' : 
                      'Hugging Face'}
        </p>
      </div>
    </div>
  );
};

export default SmartCoach;
