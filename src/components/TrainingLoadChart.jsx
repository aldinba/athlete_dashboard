import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import trainingMetricsService from '../services/trainingMetricsService';

/**
 * Component for displaying training load metrics
 */
const TrainingLoadChart = ({ userId, days = 90 }) => {
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        setLoading(true);
        
        // Calculate end date (today)
        const endDate = new Date();
        
        // Calculate start date (days ago)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Fetch training load data
        const { data, error } = await supabase
          .from('training_load')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        // Update training load if needed
        await trainingMetricsService.updateTrainingLoad(userId);
        
        setTrainingData(data || []);
      } catch (err) {
        console.error('Error fetching training data:', err);
        setError('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchTrainingData();
    }
  }, [userId, days]);

  // Format data for charts
  const chartData = trainingData.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    atl: parseFloat(item.atl).toFixed(1),
    ctl: parseFloat(item.ctl).toFixed(1),
    tsb: parseFloat(item.tsb).toFixed(1),
  }));

  if (loading) {
    return <div className="loading">Loading training data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (trainingData.length === 0) {
    return (
      <div className="no-data">
        <p>No training data available. Upload some workouts to see your training metrics.</p>
      </div>
    );
  }

  return (
    <div className="training-load-chart">
      <h3>Training Load</h3>
      
      {/* This would be replaced with actual Recharts implementation */}
      <div className="chart-placeholder">
        <p>Chart would be rendered here using Recharts</p>
        <pre>{JSON.stringify(chartData.slice(0, 5), null, 2)}</pre>
      </div>
      
      <div className="metrics-summary">
        <div className="metric">
          <h4>ATL (Fatigue)</h4>
          <p className="value">{trainingData.length > 0 ? parseFloat(trainingData[trainingData.length - 1].atl).toFixed(1) : 0}</p>
        </div>
        <div className="metric">
          <h4>CTL (Fitness)</h4>
          <p className="value">{trainingData.length > 0 ? parseFloat(trainingData[trainingData.length - 1].ctl).toFixed(1) : 0}</p>
        </div>
        <div className="metric">
          <h4>TSB (Form)</h4>
          <p className="value">{trainingData.length > 0 ? parseFloat(trainingData[trainingData.length - 1].tsb).toFixed(1) : 0}</p>
        </div>
      </div>
      
      <div className="training-status">
        <h4>Training Status</h4>
        {trainingData.length > 0 && (
          <p>{getTrainingStatus(parseFloat(trainingData[trainingData.length - 1].tsb))}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Get training status based on TSB value
 * @param {number} tsb - Training Stress Balance
 * @returns {string} - Training status description
 */
const getTrainingStatus = (tsb) => {
  if (tsb > 20) return "Very fresh - Ready for a race or hard workout";
  if (tsb > 10) return "Fresh - Good race form";
  if (tsb > 0) return "Recovered - Ready for quality training";
  if (tsb > -10) return "Neutral - Balanced training";
  if (tsb > -20) return "Fatigued - Building fitness";
  if (tsb > -30) return "Very fatigued - Consider easier training";
  return "Highly fatigued - Recovery needed";
};

export default TrainingLoadChart;
