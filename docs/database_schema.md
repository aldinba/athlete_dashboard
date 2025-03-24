# Athlete Dashboard - Database Schema Design

This document outlines the database schema for the Athlete Dashboard application using Supabase (PostgreSQL).

## Tables Overview

1. **users** - User authentication and profile information
2. **workouts** - Individual workout sessions uploaded by users
3. **workout_metrics** - Calculated metrics for each workout
4. **training_load** - Aggregated training load metrics over time
5. **user_settings** - User preferences and configuration
6. **shoes** - Tracking running shoes and their mileage (Phase 2)

## Schema Details

### users
This table is automatically created and managed by Supabase Auth.

```sql
-- This table is managed by Supabase Auth
-- Reference fields that will be available:
-- id: UUID (primary key)
-- email: String
-- created_at: Timestamp
-- updated_at: Timestamp
```

### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  weight NUMERIC(5,2),  -- in kg
  height NUMERIC(5,2),  -- in cm
  birth_date DATE,
  gender TEXT,
  max_hr INTEGER,       -- maximum heart rate
  resting_hr INTEGER,   -- resting heart rate
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();
```

### workouts
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  workout_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,  -- in seconds
  distance NUMERIC(10,2),     -- in meters
  avg_hr INTEGER,             -- average heart rate
  max_hr INTEGER,             -- maximum heart rate
  avg_cadence INTEGER,        -- average cadence (steps per minute)
  elevation_gain NUMERIC(8,2),-- in meters
  avg_pace NUMERIC(6,2),      -- in seconds per kilometer
  workout_type TEXT,          -- e.g., 'easy', 'tempo', 'intervals', 'long run'
  notes TEXT,
  weather_temp NUMERIC(4,1),  -- temperature in celsius
  weather_condition TEXT,     -- e.g., 'sunny', 'rainy', 'cloudy'
  fit_file_url TEXT,          -- URL to the stored FIT file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workouts" 
  ON workouts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
  ON workouts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
  ON workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION update_workouts_updated_at();
```

### workout_metrics
```sql
CREATE TABLE workout_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  trimp NUMERIC(8,2),          -- Training Impulse
  hr_zones JSON,               -- Time spent in each HR zone
  hr_drift NUMERIC(5,2),       -- Heart rate drift percentage
  vo2max_estimate NUMERIC(5,2),-- Estimated VO2max
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workout_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own workout metrics" 
  ON workout_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout metrics" 
  ON workout_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout metrics" 
  ON workout_metrics FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout metrics" 
  ON workout_metrics FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_workout_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_metrics_updated_at
BEFORE UPDATE ON workout_metrics
FOR EACH ROW
EXECUTE FUNCTION update_workout_metrics_updated_at();
```

### training_load
```sql
CREATE TABLE training_load (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  atl NUMERIC(8,2),            -- Acute Training Load
  ctl NUMERIC(8,2),            -- Chronic Training Load
  tsb NUMERIC(8,2),            -- Training Stress Balance
  weekly_distance NUMERIC(10,2),-- Weekly distance in meters
  weekly_duration INTEGER,     -- Weekly duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE training_load ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own training load" 
  ON training_load FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training load" 
  ON training_load FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training load" 
  ON training_load FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training load" 
  ON training_load FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_training_load_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_load_updated_at
BEFORE UPDATE ON training_load
FOR EACH ROW
EXECUTE FUNCTION update_training_load_updated_at();
```

### user_settings
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  hr_zones JSON,               -- Custom heart rate zones
  distance_unit TEXT DEFAULT 'km', -- 'km' or 'mi'
  theme TEXT DEFAULT 'light',  -- 'light' or 'dark'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at();
```

### gps_data
```sql
CREATE TABLE gps_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  points JSONB NOT NULL,       -- Array of GPS points with lat, lng, elevation, time, hr, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE gps_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own GPS data" 
  ON gps_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GPS data" 
  ON gps_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GPS data" 
  ON gps_data FOR DELETE 
  USING (auth.uid() = user_id);
```

### shoes (Phase 2)
```sql
CREATE TABLE shoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  purchase_date DATE,
  retired BOOLEAN DEFAULT false,
  distance_tracked NUMERIC(10,2) DEFAULT 0, -- in meters
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shoes" 
  ON shoes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shoes" 
  ON shoes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shoes" 
  ON shoes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shoes" 
  ON shoes FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for setting updated_at on update
CREATE OR REPLACE FUNCTION update_shoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shoes_updated_at
BEFORE UPDATE ON shoes
FOR EACH ROW
EXECUTE FUNCTION update_shoes_updated_at();
```

## Database Relationships

1. **users** ← one-to-one → **profiles**
2. **users** ← one-to-many → **workouts**
3. **workouts** ← one-to-one → **workout_metrics**
4. **workouts** ← one-to-one → **gps_data**
5. **users** ← one-to-many → **training_load**
6. **users** ← one-to-one → **user_settings**
7. **users** ← one-to-many → **shoes** (Phase 2)

## Row Level Security (RLS)

All tables have Row Level Security enabled with policies that ensure:
- Users can only view their own data
- Users can only insert data associated with their user ID
- Users can only update their own data
- Users can only delete their own data

This ensures that each user's data is completely isolated and secure.

## Indexes

```sql
-- Create indexes for performance optimization
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_workout_date ON workouts(workout_date);
CREATE INDEX idx_workout_metrics_workout_id ON workout_metrics(workout_id);
CREATE INDEX idx_workout_metrics_user_id ON workout_metrics(user_id);
CREATE INDEX idx_training_load_user_id_date ON training_load(user_id, date);
CREATE INDEX idx_gps_data_workout_id ON gps_data(workout_id);
```

## Storage Buckets

In addition to the database tables, we'll need to set up Supabase Storage buckets:

```sql
-- Create a storage bucket for FIT files
CREATE POLICY "FIT files are accessible by file owner"
ON storage.objects FOR SELECT
USING (auth.uid() = CAST(owner AS uuid));

CREATE POLICY "Users can upload their own FIT files"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid() = CAST(owner AS uuid));

CREATE POLICY "Users can update their own FIT files"
ON storage.objects FOR UPDATE
USING (auth.uid() = CAST(owner AS uuid));

CREATE POLICY "Users can delete their own FIT files"
ON storage.objects FOR DELETE
USING (auth.uid() = CAST(owner AS uuid));
```

## Functions and Triggers

We'll implement several PostgreSQL functions to automate calculations:

1. Function to calculate and update training load metrics when a new workout is added
2. Function to update shoe mileage when a workout is added or updated (Phase 2)
