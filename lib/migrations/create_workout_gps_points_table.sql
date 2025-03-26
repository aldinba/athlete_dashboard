-- Create workout_gps_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_gps_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  elevation NUMERIC(8, 2),
  timestamp TIMESTAMP WITH TIME ZONE,
  heart_rate INTEGER,
  speed NUMERIC(8, 2),
  cadence INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_gps_points_workout_id ON workout_gps_points(workout_id);

-- Set up Row Level Security
ALTER TABLE workout_gps_points ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_gps_points
CREATE POLICY "Users can view their own GPS data"
ON workout_gps_points FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM workouts WHERE id = workout_id
  )
);

CREATE POLICY "Users can insert their own GPS data"
ON workout_gps_points FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM workouts WHERE id = workout_id
  )
);

CREATE POLICY "Users can delete their own GPS data"
ON workout_gps_points FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM workouts WHERE id = workout_id
  )
);

