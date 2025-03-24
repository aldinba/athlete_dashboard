import React from 'react';

/**
 * Component for displaying workout details
 */
const WorkoutDetail = ({ workout }) => {
  if (!workout) {
    return (
      <div className="workout-detail empty-state">
        <p>Select a workout to view details</p>
      </div>
    );
  }

  return (
    <div className="workout-detail">
      <h2>Workout Details</h2>
      
      <div className="workout-header">
        <h3>{workout.title || formatWorkoutType(workout.workout_type) || 'Workout'}</h3>
        <p className="workout-date">
          {new Date(workout.workout_date).toLocaleDateString()}
        </p>
      </div>
      
      <div className="workout-stats-grid">
        <div className="stat-item">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{formatDistance(workout.distance)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Duration</span>
          <span className="stat-value">{formatDuration(workout.duration)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Pace</span>
          <span className="stat-value">{formatPace(workout.avg_pace)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg HR</span>
          <span className="stat-value">{workout.avg_hr || 'N/A'} bpm</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max HR</span>
          <span className="stat-value">{workout.max_hr || 'N/A'} bpm</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Elevation</span>
          <span className="stat-value">{workout.elevation_gain || 0} m</span>
        </div>
      </div>
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

/**
 * Format pace in seconds per kilometer to human-readable format
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @returns {string} - Formatted pace
 */
const formatPace = (secondsPerKm) => {
  if (!secondsPerKm) return '0:00 /km';
  
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
};

export default WorkoutDetail;
