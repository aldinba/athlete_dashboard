-- Create schema for Athlete Dashboard

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  max_hr INTEGER,
  resting_hr INTEGER,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  gender TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout metrics table
CREATE TABLE workout_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  avg_hr DECIMAL(5,2),
  max_hr INTEGER,
  avg_hr_percentage DECIMAL(5,4),
  avg_cadence INTEGER,
  elevation_gain INTEGER,
  calories INTEGER,
  avg_pace DECIMAL(6,2),
  trimp DECIMAL(6,2),
  intensity DECIMAL(5,2),
  hr_drift DECIMAL(5,4),
  pace_variability DECIMAL(5,4),
  vo2max_estimate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GPS data table
CREATE TABLE gps_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  elevation DECIMAL(6,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  heart_rate INTEGER,
  cadence INTEGER,
  speed DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HR zones table
CREATE TABLE hr_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  zone_1 INTEGER DEFAULT 0,
  zone_2 INTEGER DEFAULT 0,
  zone_3 INTEGER DEFAULT 0,
  zone_4 INTEGER DEFAULT 0,
  zone_5 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training load table
CREATE TABLE training_load (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  atl DECIMAL(6,2) NOT NULL,
  ctl DECIMAL(6,2) NOT NULL,
  tsb DECIMAL(6,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create coaching advice table
CREATE TABLE coaching_advice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  advice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workout_id)
);

-- Set up Row Level Security policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_load ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_advice ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

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

CREATE POLICY "Users can view their own workout metrics" 
  ON workout_metrics FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = workout_metrics.workout_id 
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own GPS data" 
  ON gps_data FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = gps_data.workout_id 
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own HR zones" 
  ON hr_zones FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM workouts 
    WHERE workouts.id = hr_zones.workout_id 
    AND workouts.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own training load" 
  ON training_load FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own coaching advice" 
  ON coaching_advice FOR SELECT 
  USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_workouts
BEFORE UPDATE ON workouts
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_workout_metrics
BEFORE UPDATE ON workout_metrics
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

