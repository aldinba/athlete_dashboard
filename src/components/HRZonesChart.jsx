import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Component for displaying heart rate zones distribution
 */
const HRZonesChart = ({ workoutId }) => {
  const [hrZones, setHrZones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHRZones = async () => {
      try {
        setLoading(true);
        
        // Fetch HR zones data for the workout
        const { data, error } = await supabase
          .from('workout_metrics')
          .select('hr_zones')
          .eq('workout_id', workoutId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setHrZones(data?.hr_zones || null);
      } catch (err) {
        console.error('Error fetching HR zones data:', err);
        setError('Failed to load heart rate zones data');
      } finally {
        setLoading(false);
      }
    };
    
    if (workoutId) {
      fetchHRZones();
    }
  }, [workoutId]);

  if (loading) {
    return <div className="loading">Loading heart rate zones data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!hrZones) {
    return (
      <div className="no-data">
        <p>No heart rate zones data available for this workout.</p>
      </div>
    );
  }

  // Format data for pie chart
  const pieData = [
    { name: 'Zone 1 (Recovery)', value: hrZones.zone1, color: '#8dd1e1' },
    { name: 'Zone 2 (Endurance)', value: hrZones.zone2, color: '#82ca9d' },
    { name: 'Zone 3 (Tempo)', value: hrZones.zone3, color: '#ffc658' },
    { name: 'Zone 4 (Threshold)', value: hrZones.zone4, color: '#ff8042' },
    { name: 'Zone 5 (VO2max)', value: hrZones.zone5, color: '#ff6361' }
  ];

  return (
    <div className="hr-zones-chart">
      <h3>Heart Rate Zones</h3>
      
      {/* This would be replaced with actual Recharts implementation */}
      <div className="chart-placeholder">
        <p>Pie chart would be rendered here using Recharts</p>
        <pre>{JSON.stringify(pieData, null, 2)}</pre>
      </div>
      
      <div className="zones-legend">
        {pieData.map((zone, index) => (
          <div key={index} className="zone-item">
            <span className="zone-color" style={{ backgroundColor: zone.color }}></span>
            <span className="zone-name">{zone.name}</span>
            <span className="zone-value">{zone.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
      
      <div className="zones-summary">
        <p>
          {getZonesSummary(hrZones)}
        </p>
      </div>
    </div>
  );
};

/**
 * Generate a summary of heart rate zones distribution
 * @param {Object} zones - Heart rate zones data
 * @returns {string} - Summary description
 */
const getZonesSummary = (zones) => {
  // Determine the primary training zone
  const zoneValues = [
    { name: 'recovery', value: zones.zone1 },
    { name: 'endurance', value: zones.zone2 },
    { name: 'tempo', value: zones.zone3 },
    { name: 'threshold', value: zones.zone4 },
    { name: 'high intensity', value: zones.zone5 }
  ];
  
  // Sort by value (descending)
  zoneValues.sort((a, b) => b.value - a.value);
  
  // Calculate time in aerobic zones (1-2) and anaerobic zones (4-5)
  const aerobicTime = zones.zone1 + zones.zone2;
  const anaerobicTime = zones.zone4 + zones.zone5;
  
  let summary = `Primary training zone: ${zoneValues[0].name} (${zoneValues[0].value.toFixed(1)}%). `;
  
  if (aerobicTime > 80) {
    summary += 'This was primarily an aerobic workout focused on building endurance.';
  } else if (anaerobicTime > 30) {
    summary += 'This was a high-intensity workout with significant anaerobic contribution.';
  } else if (zones.zone3 > 40) {
    summary += 'This was a tempo workout focused on improving lactate threshold.';
  } else {
    summary += 'This was a mixed workout with contributions from multiple energy systems.';
  }
  
  return summary;
};

export default HRZonesChart;
