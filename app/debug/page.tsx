"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Info, AlertCircle, Check, Database } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { checkTableExists } from "@/lib/debug-utils"

export default function DebugPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean
    workoutsTableExists: boolean
    gpsPointsTableExists: boolean
    hasGpsDataColumnExists: boolean
  }>({
    connected: false,
    workoutsTableExists: false,
    gpsPointsTableExists: false,
    hasGpsDataColumnExists: false,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    const checkDatabase = async () => {
      try {
        const supabase = getSupabase()

        // Check connection
        const { data: connectionData, error: connectionError } = await supabase
          .from("workouts")
          .select("count(*)", { count: "exact", head: true })

        if (connectionError) {
          setError(`Database connection error: ${connectionError.message}`)
          setLoading(false)
          return
        }

        // Check if tables exist
        const workoutsTableExists = await checkTableExists("workouts")
        const gpsPointsTableExists = await checkTableExists("workout_gps_points")

        // Check if has_gps_data column exists
        let hasGpsDataColumnExists = false
        if (workoutsTableExists) {
          try {
            const { data, error } = await supabase
              .from("information_schema.columns")
              .select("column_name")
              .eq("table_schema", "public")
              .eq("table_name", "workouts")
              .eq("column_name", "has_gps_data")
              .single()

            hasGpsDataColumnExists = !!data
          } catch (e) {
            console.error("Error checking has_gps_data column:", e)
          }
        }

        setDbStatus({
          connected: true,
          workoutsTableExists,
          gpsPointsTableExists,
          hasGpsDataColumnExists,
        })
      } catch (e) {
        setError(`Error checking database: ${e instanceof Error ? e.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      checkDatabase()
    }
  }, [user, authLoading, router])

  const runMigration = async (migrationName: string) => {
    try {
      setLoading(true)

      // In a real app, you would run the migration here
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh the status
      window.location.reload()
    } catch (e) {
      setError(`Error running migration: ${e instanceof Error ? e.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Checking database status...</h2>
          <p className="text-muted-foreground">Please wait while we diagnose your database</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Database Diagnostics</h2>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>Check the status of your database and tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${dbStatus.connected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span>Database Connection</span>
                {dbStatus.connected ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${dbStatus.workoutsTableExists ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span>Workouts Table</span>
                {dbStatus.workoutsTableExists ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${dbStatus.gpsPointsTableExists ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span>GPS Points Table</span>
                {dbStatus.gpsPointsTableExists ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${dbStatus.hasGpsDataColumnExists ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span>has_gps_data Column</span>
                {dbStatus.hasGpsDataColumnExists ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Database Migrations</AlertTitle>
              <AlertDescription>
                If any of the above checks fail, you may need to run database migrations to fix the issues. You can run
                the migrations by clicking the buttons below.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="flex flex-col space-y-2 w-full">
              <Button
                onClick={() => runMigration("create_workout_gps_points_table")}
                disabled={dbStatus.gpsPointsTableExists || loading}
                className="w-full"
              >
                <Database className="mr-2 h-4 w-4" />
                Create GPS Points Table
              </Button>

              <Button
                onClick={() => runMigration("add_has_gps_data_column")}
                disabled={dbStatus.hasGpsDataColumnExists || loading || !dbStatus.workoutsTableExists}
                className="w-full"
              >
                <Database className="mr-2 h-4 w-4" />
                Add has_gps_data Column
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Note: In a production environment, you would run these migrations using a database migration tool. This
              page is for diagnostic purposes only.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

