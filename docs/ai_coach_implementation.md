# AI Smart Coach Implementation

This document outlines the implementation of the AI Smart Coach feature for the Athlete Dashboard application.

## Overview

The AI Smart Coach will analyze an athlete's training data and provide personalized coaching advice based on their training history and goals. The coach will use OpenAI's API to generate insights and recommendations.

## Implementation Approach

We'll implement the AI Smart Coach using the following approach:

1. Create a serverless function to handle OpenAI API calls
2. Develop a prompt engineering strategy for generating coaching advice
3. Implement a React component to display the coaching advice
4. Integrate the component with the dashboard UI

## OpenAI API Integration

### Setting Up the API Client

We'll create a service to handle OpenAI API calls:

```javascript
// src/services/openaiService.js
import axios from 'axios';

const API_URL = '/api/coach'; // Our serverless function endpoint

export const getCoachingAdvice = async (trainingData) => {
  try {
    const response = await axios.post(API_URL, {
      trainingData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting coaching advice:', error);
    throw error;
  }
};
```

### Serverless Function Implementation

We'll create a serverless function to handle the OpenAI API calls. This function will:

1. Receive training data from the frontend
2. Format the data into a prompt for the OpenAI API
3. Call the OpenAI API
4. Return the generated coaching advice

```javascript
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
```

## React Component Implementation

We'll create a React component to display the coaching advice:

```jsx
// src/components/SmartCoach.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCoachingAdvice } from '../services/openaiService';

const SmartCoach = ({ userId }) => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  useEffect(() => {
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
```

## CSS Styling

We'll add some CSS to style the Smart Coach component:

```css
/* Add to Dashboard.css */

.coach-panel {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.coach-panel h3 {
  margin-top: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  color: #2c3e50;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  padding: 1rem;
  text-align: center;
}

.advice-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.advice-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  line-height: 1.6;
}

.advice-content p {
  margin-bottom: 1rem;
}

.last-updated {
  font-size: 0.8rem;
  color: #7f8c8d;
  text-align: right;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.refresh-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background-color: #2980b9;
}
```

## Environment Setup

To use the OpenAI API, we need to set up environment variables:

1. Create a `.env` file in the project root:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

2. Make sure the serverless function has access to these environment variables.

## Integration with Dashboard

Update the Dashboard component to use the new SmartCoach component:

```jsx
// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TrainingLoadChart from './TrainingLoadChart';
import WeeklyMileageChart from './WeeklyMileageChart';
import TRIMPSessionChart from './TRIMPSessionChart';
import HRZonesChart from './HRZonesChart';
import FileUpload from './FileUpload';
import WorkoutList from './WorkoutList';
import WorkoutDetail from './WorkoutDetail';
import SmartCoach from './SmartCoach';
import './Dashboard.css';

const Dashboard = ({ userId }) => {
  // ... existing code ...
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Athlete Dashboard</h1>
        <p>AI-Powered Running Analytics</p>
      </header>
      
      <div className="dashboard-grid">
        {/* Left sidebar with workout list */}
        <div className="sidebar">
          <FileUpload userId={userId} onUploadComplete={handleUploadComplete} />
          
          <WorkoutList 
            workouts={workouts}
            selectedWorkoutId={selectedWorkout?.id}
            onSelectWorkout={setSelectedWorkout}
            loading={loading}
            error={error}
          />
        </div>
        
        {/* Main content area with charts */}
        <div className="main-content">
          {/* ... existing code ... */}
        </div>
        
        {/* Right sidebar with AI coach */}
        <div className="sidebar coach-sidebar">
          <SmartCoach userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

## Testing

To test the AI Smart Coach functionality:

1. Set up the environment variables with a valid OpenAI API key
2. Upload some workout data to the application
3. Verify that the Smart Coach component displays personalized advice
4. Test the refresh functionality

## Next Steps

1. Refine the prompt engineering to improve the quality of coaching advice
2. Add more specific coaching advice based on different training goals
3. Implement a feature to save and track coaching advice over time
4. Add the ability for users to provide feedback on the coaching advice
