import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCoachingAdvice } from '../services/openaiService';

const SmartCoach = ({ userId }) => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchCoachingAdvice = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recent workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(10);
      
      if (workoutsError) throw workoutsError;
      
      // Fetch training load data
      const { data: trainingLoad, error: loadError } = await supabase
        .from('training_load')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (loadError && loadError.code !== 'PGRST116') throw loadError;
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // If we have enough data, get coaching advice
      if (workouts && workouts.length > 0) {
        const trainingData = {
          recentWorkouts: workouts,
          trainingLoad: trainingLoad || {
            atl: 0,
            ctl: 0,
            tsb: 0,
            weekly_distance: 0
          },
          userProfile: profile || {}
        };
        
        const response = await getCoachingAdvice(trainingData);
        setAdvice(response.advice);
        setLastUpdated(new Date());
      } else {
        setAdvice("Upload some workouts to get personalized coaching advice!");
      }
    } catch (err) {
      console.error('Error fetching coaching advice:', err);
      setError('Failed to generate coaching advice. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCoachingAdvice();
  }, [userId]);
  
  const handleRefresh = () => {
    fetchCoachingAdvice();
  };
  
  return (
    <div className="coach-panel">
      <h3>AI Smart Coach</h3>
      
      {loading ? (
        <div className="loading-indicator">
          <p>Analyzing your training data...</p>
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRefresh} className="refresh-button">
            Try Again
          </button>
        </div>
      ) : !advice ? (
        <div className="no-data">
          <p>Upload some workouts to get personalized coaching advice!</p>
        </div>
      ) : (
        <div className="advice-container">
          <div className="advice-content">
            {advice.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index}>{paragraph}</p>
              ) : (
                <br key={index} />
              )
            ))}
          </div>
          
          {lastUpdated && (
            <div className="last-updated">
              <p>Last updated: {lastUpdated.toLocaleString()}</p>
              <button onClick={handleRefresh} className="refresh-button">
                Refresh Advice
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCoach;
