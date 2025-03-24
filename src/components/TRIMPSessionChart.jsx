import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Component for displaying TRIMP per session
 */
const TRIMPSessionChart = ({ userId, limit = 10 }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkoutTRIMP = async () => {
      try {
        setLoading(true);
        
        // Fetch recent workouts with their metrics
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            title,
            workout_date,
            duration,
            distance,
            workout_type,
            workout_metrics (
              trimp
            )
          `)
          .eq('user_id', userId)
          .order('workout_date', { ascending: false })
          .limit(limit);
        
        if (error) {
          throw error;
        }
        
        setWorkouts(data || []);
      } catch (err) {
        console.error('Error fetching workout TRIMP data:', err);
        setError('Failed to load workout TRIMP data');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchWorkoutTRIMP();
    }
  }, [userId, limit]);

  if (loading) {
    return <div className="loading">Loading workout TRIMP data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (workouts.length === 0) {
    return (
      <div className="no-data">
        <p>No workout data available. Upload some workouts to see your TRIMP values.</p>
      </div>
    );
  }

  // Format data for bar chart
  const chartData = workouts
    .filter(workout => workout.workout_metrics && workout.workout_metrics.length > 0)
    .map(workout => ({
      name: new Date(workout.workout_date).toLocaleDateString(),
      title: workout.title,
      trimp: parseFloat(workout.workout_metrics[0]?.trimp || 0).toFixed(1),
      type: workout.workout_type,
      duration: formatDuration(workout.duration),
      distance: formatDistance(workout.distance)
    }))
    .reverse(); // Show oldest to newest

  return (
    <div className="trimp-session-chart">
      <h3>TRIMP per Session</h3>
      
      {/* This would be replaced with actual Recharts implementation */}
      <div className="chart-placeholder">
        <p>Bar chart would be rendered here using Recharts</p>
        <pre>{JSON.stringify(chartData.slice(0, 5), null, 2)}</pre>
      </div>
      
      <div className="trimp-summary">
        <div className="metric">
          <h4>Average TRIMP</h4>
          <p className="value">
            {chartData.length > 0 ? 
              (chartData.reduce((sum, workout) => sum + parseFloat(workout.trimp), 0) / chartData.length).toFixed(1) : 
              '0'}
          </p>
        </div>
        <div className="metric">
          <h4>Max TRIMP</h4>
          <p className="value">
            {chartData.length > 0 ? 
              Math.max(...chartData.map(workout => parseFloat(workout.trimp))).toFixed(1) : 
              '0'}
          </p>
        </div>
        <div className="metric">
          <h4>Weekly TRIMP</h4>
          <p className="value">
            {calculateWeeklyTRIMP(chartData)}
          </p>
        </div>
      </div>
      
      <div className="trimp-explanation">
        <p>
          <strong>TRIMP</strong> (Training Impulse) quantifies workout intensity and duration.
          Higher values indicate harder workouts.
        </p>
      </div>
    </div>
  );
};

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format distance in meters to human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} - Formatted distance
 */
const formatDistance = (meters) => {
  if (!meters) return '0 km';
  
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
};

/**
 * Calculate weekly TRIMP from recent workouts
 * @param {Array} workouts - Recent workouts with TRIMP values
 * @returns {string} - Weekly TRIMP value
 */
const calculateWeeklyTRIMP = (workouts) => {
  if (!workouts || workouts.length === 0) return '0';
  
  // Get workouts from the last 7 days
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentWorkouts = workouts.filter(workout => {
    const workoutDate = new Date(workout.name);
    return workoutDate >= weekAgo && workoutDate <= now;
  });
  
  // Sum TRIMP values
  const weeklyTRIMP = recentWorkouts.reduce((sum, workout) => sum + parseFloat(workout.trimp), 0);
  
  return weeklyTRIMP.toFixed(1);
};

export default TRIMPSessionChart;
