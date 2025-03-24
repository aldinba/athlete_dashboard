# FIT File Parsing Implementation

This document outlines the implementation details for parsing FIT files in the Athlete Dashboard application.

## Overview

FIT (Flexible and Interoperable Data Transfer) files are a binary file format used by fitness devices like Garmin, Polar, and Suunto to store workout data. Our application needs to:

1. Allow users to upload FIT files
2. Parse these files to extract relevant workout metrics
3. Store the parsed data in our Supabase database
4. Calculate additional metrics based on the extracted data

## Libraries and Tools

After research, we've selected the following libraries:

1. **fit-file-parser** - A JavaScript library for parsing FIT files
   - Latest version: 1.21.0
   - GitHub: https://github.com/jimmykane/fit-parser
   - NPM: https://www.npmjs.com/package/fit-file-parser
   - Features:
     - Parses binary FIT files directly in JavaScript
     - Configurable units (km/h, m/s, etc.)
     - Multiple output modes (cascade, list, both)
     - Extracts all relevant workout data

2. **Supabase Storage** - For storing uploaded FIT files
   - Provides simple API for file uploads
   - Integrates with Supabase authentication
   - Allows setting permissions via Row Level Security

## Implementation Plan

### 1. File Upload Component

Create a React component that allows users to:
- Select FIT files from their device
- Upload files to Supabase Storage
- Show upload progress and status

```jsx
// FileUpload.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const FileUpload = ({ userId }) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!file.name.endsWith('.fit')) {
      setError('Only .fit files are supported');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `fit-files/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('workout-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      // Trigger file parsing
      await parseAndStoreFitFile(filePath, userId);

      return data.path;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fit-file-upload">
      <h3>Upload Workout File</h3>
      <input 
        type="file" 
        accept=".fit"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {file && (
        <div className="file-info">
          <p>Selected file: {file.name}</p>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      
      {uploading && (
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${progress}%` }}
          ></div>
          <span>{progress}%</span>
        </div>
      )}
      
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default FileUpload;
```

### 2. FIT File Parser Service

Create a service that:
- Downloads the uploaded FIT file from Supabase Storage
- Uses fit-file-parser to parse the file
- Extracts relevant workout metrics
- Stores the parsed data in the database

```jsx
// fitParserService.js
import { supabase } from '../lib/supabaseClient';
import FitParser from 'fit-file-parser';

export const parseAndStoreFitFile = async (filePath, userId) => {
  try {
    // Download file from Supabase Storage
    const { data, error } = await supabase.storage
      .from('workout-files')
      .download(filePath);

    if (error) {
      throw error;
    }

    // Convert to ArrayBuffer for parsing
    const arrayBuffer = await data.arrayBuffer();

    // Parse FIT file
    const fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'm',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'cascade',
    });

    return new Promise((resolve, reject) => {
      fitParser.parse(arrayBuffer, async (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          // Extract workout data
          const workoutData = extractWorkoutData(result);
          
          // Store in database
          const { data, error: dbError } = await storeWorkoutData(workoutData, userId, filePath);
          
          if (dbError) {
            throw dbError;
          }
          
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('Error parsing FIT file:', error);
    throw error;
  }
};

const extractWorkoutData = (fitData) => {
  // Default values
  let workoutData = {
    title: 'Workout',
    workout_date: new Date(),
    duration: 0,
    distance: 0,
    avg_hr: 0,
    max_hr: 0,
    avg_cadence: 0,
    elevation_gain: 0,
    avg_pace: 0,
    workout_type: 'other',
  };

  // Extract session data if available
  if (fitData.sessions && fitData.sessions.length > 0) {
    const session = fitData.sessions[0];
    
    workoutData.title = session.sport || 'Workout';
    workoutData.workout_date = new Date(session.start_time);
    workoutData.duration = session.total_timer_time || session.total_elapsed_time || 0;
    workoutData.distance = session.total_distance || 0;
    workoutData.avg_hr = session.avg_heart_rate || 0;
    workoutData.max_hr = session.max_heart_rate || 0;
    workoutData.avg_cadence = session.avg_cadence || 0;
    workoutData.elevation_gain = session.total_ascent || 0;
    
    // Calculate average pace (seconds per kilometer)
    if (session.total_distance > 0 && session.total_timer_time > 0) {
      workoutData.avg_pace = (session.total_timer_time / (session.total_distance / 1000));
    }
    
    // Determine workout type
    if (session.sport) {
      if (session.sport.toLowerCase() === 'running') {
        if (session.sub_sport) {
          const subSport = session.sub_sport.toLowerCase();
          if (subSport.includes('interval')) workoutData.workout_type = 'intervals';
          else if (subSport.includes('tempo')) workoutData.workout_type = 'tempo';
          else if (subSport.includes('long')) workoutData.workout_type = 'long run';
          else workoutData.workout_type = 'easy';
        } else {
          workoutData.workout_type = 'easy';
        }
      } else {
        workoutData.workout_type = session.sport.toLowerCase();
      }
    }
  }

  // Extract GPS data if available
  let gpsData = [];
  if (fitData.records && fitData.records.length > 0) {
    gpsData = fitData.records.map(record => ({
      timestamp: record.timestamp,
      position_lat: record.position_lat,
      position_long: record.position_long,
      altitude: record.altitude,
      heart_rate: record.heart_rate,
      cadence: record.cadence,
      speed: record.speed,
    })).filter(point => point.position_lat && point.position_long);
  }

  return {
    workout: workoutData,
    gps: gpsData
  };
};

const storeWorkoutData = async (workoutData, userId, fitFileUrl) => {
  // Insert workout data
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert([{
      user_id: userId,
      title: workoutData.workout.title,
      workout_date: workoutData.workout.workout_date,
      duration: workoutData.workout.duration,
      distance: workoutData.workout.distance,
      avg_hr: workoutData.workout.avg_hr,
      max_hr: workoutData.workout.max_hr,
      avg_cadence: workoutData.workout.avg_cadence,
      elevation_gain: workoutData.workout.elevation_gain,
      avg_pace: workoutData.workout.avg_pace,
      workout_type: workoutData.workout.workout_type,
      fit_file_url: fitFileUrl
    }])
    .select()
    .single();

  if (workoutError) {
    throw workoutError;
  }

  // Insert GPS data if available
  if (workoutData.gps.length > 0) {
    const { error: gpsError } = await supabase
      .from('gps_data')
      .insert([{
        workout_id: workout.id,
        user_id: userId,
        points: workoutData.gps
      }]);

    if (gpsError) {
      throw gpsError;
    }
  }

  return { data: workout, error: null };
};
```

### 3. Supabase Storage Configuration

Set up Supabase Storage bucket and policies:

```sql
-- Create a storage bucket for FIT files
CREATE POLICY "FIT files are accessible by file owner"
ON storage.objects FOR SELECT
USING (auth.uid() = CAST(storage.foldername(name)[1] AS uuid));

CREATE POLICY "Users can upload their own FIT files"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid()::text = storage.foldername(name)[1]);

CREATE POLICY "Users can update their own FIT files"
ON storage.objects FOR UPDATE
USING (auth.uid()::text = storage.foldername(name)[1]);

CREATE POLICY "Users can delete their own FIT files"
ON storage.objects FOR DELETE
USING (auth.uid()::text = storage.foldername(name)[1]);
```

### 4. Supabase Client Setup

```jsx
// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Integration with Frontend

The file upload component will be integrated into the dashboard UI, allowing users to:

1. Upload FIT files from their devices
2. See a list of their uploaded workouts
3. View detailed metrics for each workout
4. Visualize their training data through charts and maps

## Next Steps

1. Implement the file upload component
2. Create the FIT file parser service
3. Set up Supabase Storage bucket and policies
4. Test the upload and parsing functionality
5. Integrate with training metrics calculation
