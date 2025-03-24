import React from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Component for displaying a list of workouts
 */
const WorkoutList = ({ workouts, selectedWorkoutId, onSelectWorkout, loading, error }) => {
  if (loading) {
    return <div className="loading">Loading workouts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="no-data">
        <p>No workouts found. Upload your first workout to get started!</p>
      </div>
    );
  }

  return (
    <div className="workout-list">
      <h3>Recent Workouts</h3>
      <ul>
        {workouts.map(workout => (
          <li 
            key={workout.id} 
            className={selectedWorkoutId === workout.id ? 'selected' : ''}
            onClick={() => onSelectWorkout(workout)}
          >
            <div className="workout-item">
              <div className="workout-date">
                {new Date(workout.workout_date).toLocaleDateString()}
              </div>
              <div className="workout-title">
                {workout.title || formatWorkoutType(workout.workout_type) || 'Workout'}
              </div>
              <div className="workout-stats">
                {formatDistance(workout.distance)} • {formatDuration(workout.duration)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Format workout type to be more readable
 * @param {string} type - Workout type
 * @returns {string} - Formatted workout type
 */
const formatWorkoutType = (type) => {
  if (!type) return 'Workout';
  
  // Capitalize first letter and replace underscores with spaces
  return type.charAt(0).toUpperCase() + 
    type.slice(1).replace(/_/g, ' ');
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

export default WorkoutList;
