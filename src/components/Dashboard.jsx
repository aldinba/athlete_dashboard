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

/**
 * Main Dashboard component that integrates all the dashboard elements
 */
const Dashboard = ({ userId }) => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch workouts when component mounts or refreshTrigger changes
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        
        // Fetch recent workouts
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            title,
            workout_date,
            duration,
            distance,
            avg_hr,
            max_hr,
            avg_cadence,
            elevation_gain,
            avg_pace,
            workout_type
          `)
          .eq('user_id', userId)
          .order('workout_date', { ascending: false })
          .limit(20);
        
        if (error) {
          throw error;
        }
        
        setWorkouts(data || []);
        
        // Select the most recent workout by default
        if (data && data.length > 0 && !selectedWorkout) {
          setSelectedWorkout(data[0]);
        }
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError('Failed to load workouts');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchWorkouts();
    }
  }, [userId, refreshTrigger, selectedWorkout]);

  // Handle file upload completion
  const handleUploadComplete = () => {
    // Refresh the dashboard data
    setRefreshTrigger(prev => prev + 1);
  };

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
          <div className="charts-row">
            <div className="chart-container large">
              <TrainingLoadChart userId={userId} />
            </div>
          </div>
          
          <div className="charts-row">
            <div className="chart-container">
              <WeeklyMileageChart userId={userId} />
            </div>
            <div className="chart-container">
              <TRIMPSessionChart userId={userId} />
            </div>
          </div>
          
          <WorkoutDetail workout={selectedWorkout} />
          
          {selectedWorkout && (
            <div className="workout-charts">
              <div className="chart-container">
                <HRZonesChart workoutId={selectedWorkout.id} />
              </div>
              <div className="chart-container">
                {/* Placeholder for future map component */}
                <div className="map-placeholder">
                  <h3>Route Map</h3>
                  <p>Map will be displayed here in Phase 2</p>
                </div>
              </div>
            </div>
          )}
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
