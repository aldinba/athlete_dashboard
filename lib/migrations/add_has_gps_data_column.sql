-- Add has_gps_data column to workouts table if it doesn't exist
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS has_gps_data BOOLEAN DEFAULT FALSE;

