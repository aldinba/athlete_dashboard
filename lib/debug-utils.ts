// Debug utility functions

// Function to log messages with a timestamp
export function logWithTime(message: string): void {
  const now = new Date()
  const timestamp = now.toLocaleTimeString()
  console.log(`[${timestamp}] ${message}`)
}

// Function to format file size in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " bytes"
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + " KB"
  } else {
    return (bytes / 1048576).toFixed(1) + " MB"
  }
}

// Check if a table exists in the database
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    // Query the information_schema to check if the table exists
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .single()

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error in checkTableExists for ${tableName}:`, error)
    return false
  }
}

// Import getSupabase to avoid errors
import { getSupabase } from "./supabase"

