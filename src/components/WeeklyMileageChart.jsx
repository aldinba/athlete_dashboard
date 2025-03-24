import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Component for displaying weekly mileage trend
 */
const WeeklyMileageChart = ({ userId, weeks = 12 }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        
        // Calculate end date (today)
        const endDate = new Date();
        
        // Calculate start date (weeks ago)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * 7));
        
        // Fetch training load data for weekly distance
        const { data, error } = await supabase
          .from('training_load')
          .select('date, weekly_distance')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        // Process data to get weekly values (taking the last day of each week)
        const processedData = processWeeklyData(data || []);
        setWeeklyData(processedData);
      } catch (err) {
        console.error('Error fetching weekly mileage data:', err);
        setError('Failed to load weekly mileage data');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchWeeklyData();
    }
  }, [userId, weeks]);

  /**
   * Process daily data into weekly data
   * @param {Array} dailyData - Daily training load data
   * @returns {Array} - Weekly data
   */
  const processWeeklyData = (dailyData) => {
    if (!dailyData.length) return [];
    
    const weeklyData = [];
    let currentWeekStart = null;
    let currentWeekData = null;
    
    // Group by week
    dailyData.forEach(item => {
      const date = new Date(item.date);
      const weekStart = getWeekStart(date);
      
      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeekData) {
          weeklyData.push(currentWeekData);
        }
        
        currentWeekStart = weekStart;
        currentWeekData = {
          weekOf: weekStart.toLocaleDateString(),
          distance: parseFloat(item.weekly_distance || 0) / 1000, // Convert to km
        };
      } else {
        // Update with the latest value for the week
        currentWeekData.distance = parseFloat(item.weekly_distance || 0) / 1000;
      }
    });
    
    // Add the last week
    if (currentWeekData) {
      weeklyData.push(currentWeekData);
    }
    
    return weeklyData;
  };

  /**
   * Get the start of the week for a given date
   * @param {Date} date - Date to get week start for
   * @returns {Date} - Start of the week
   */
  const getWeekStart = (date) => {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay()); // Set to Sunday
    return result;
  };

  if (loading) {
    return <div className="loading">Loading weekly mileage data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (weeklyData.length === 0) {
    return (
      <div className="no-data">
        <p>No weekly mileage data available. Upload some workouts to see your weekly trends.</p>
      </div>
    );
  }

  return (
    <div className="weekly-mileage-chart">
      <h3>Weekly Mileage Trend</h3>
      
      {/* This would be replaced with actual Recharts implementation */}
      <div className="chart-placeholder">
        <p>Chart would be rendered here using Recharts</p>
        <pre>{JSON.stringify(weeklyData.slice(0, 5), null, 2)}</pre>
      </div>
      
      <div className="metrics-summary">
        <div className="metric">
          <h4>Current Week</h4>
          <p className="value">
            {weeklyData.length > 0 ? 
              `${weeklyData[weeklyData.length - 1].distance.toFixed(1)} km` : 
              '0 km'}
          </p>
        </div>
        <div className="metric">
          <h4>Average</h4>
          <p className="value">
            {weeklyData.length > 0 ? 
              `${(weeklyData.reduce((sum, week) => sum + week.distance, 0) / weeklyData.length).toFixed(1)} km` : 
              '0 km'}
          </p>
        </div>
        <div className="metric">
          <h4>4-Week Trend</h4>
          <p className="value">
            {weeklyData.length >= 4 ? 
              getWeeklyTrend(weeklyData.slice(-4)) : 
              'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Calculate weekly mileage trend
 * @param {Array} recentWeeks - Recent weekly data
 * @returns {string} - Trend description
 */
const getWeeklyTrend = (recentWeeks) => {
  if (recentWeeks.length < 2) return 'N/A';
  
  const firstWeek = recentWeeks[0].distance;
  const lastWeek = recentWeeks[recentWeeks.length - 1].distance;
  const percentChange = ((lastWeek - firstWeek) / firstWeek) * 100;
  
  if (percentChange > 15) return '↑ Increasing rapidly';
  if (percentChange > 5) return '↗ Increasing';
  if (percentChange < -15) return '↓ Decreasing rapidly';
  if (percentChange < -5) return '↘ Decreasing';
  return '→ Stable';
};

export default WeeklyMileageChart;
