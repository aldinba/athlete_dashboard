"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, FileUp, Check, AlertCircle, Info } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { parseFitFile } from "@/lib/fit-parser"
import { createWorkout, saveWorkoutGpsPoints, formatPace, formatDuration } from "@/lib/workout-service"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { parseSimpleFitFile } from "@/lib/simple-fit-parser"

export default function ImportWorkoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [createdWorkoutId, setCreatedWorkoutId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [fitParserLoaded, setFitParserLoaded] = useState(false)

  // Preload the fit-file-parser library
  useEffect(() => {
    const loadFitParser = async () => {
      try {
        await import("fit-file-parser")
        setFitParserLoaded(true)
        setDebugInfo("FIT parser library loaded successfully")
      } catch (error) {
        console.error("Error loading FIT parser library:", error)
        setDebugInfo("Failed to load FIT parser library. GPX files will still work.")
      }
    }

    loadFitParser()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setDebugInfo(null)
    setSuccess(false)
    setIsUploading(true)
    setUploadProgress(10)
    setParsedData(null)
    setCreatedWorkoutId(null)

    // Display file info
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
    })

    try {
      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      if (fileExt !== "fit" && fileExt !== "gpx") {
        throw new Error(`Unsupported file format: .${fileExt}. Please upload a .FIT or .GPX file.`)
      }

      // Check if FIT parser is loaded for FIT files
      if (fileExt === "fit" && !fitParserLoaded) {
        setDebugInfo("FIT parser library not loaded. Trying to parse anyway...")
      }

      // Simulate progress
      setUploadProgress(30)
      setDebugInfo(`Reading ${fileExt.toUpperCase()} file...`)

      // Parse the file
      try {
        let workoutData

        if (fileExt === "fit") {
          try {
            // Try the main parser first
            workoutData = await parseFitFile(file)
          } catch (fitError) {
            console.error("Error with main FIT parser:", fitError)
            setDebugInfo(
              `FIT parser error: ${fitError instanceof Error ? fitError.message : String(fitError)}. Using simple parser...`,
            )

            // Fall back to the simple parser
            const simpleData = await parseSimpleFitFile(file)
            workoutData = {
              ...simpleData,
              pace: simpleData.duration / simpleData.distance, // Calculate pace
              coordinates: [], // No GPS data with simple parser
            }
          }
        } else {
          // For GPX files, use the regular parser
          workoutData = await parseFitFile(file)
        }

        setUploadProgress(60)
        setParsedData(workoutData)
        setDebugInfo(
          `File parsed successfully. Found ${workoutData.coordinates?.length || 0} GPS points. Saving to database...`,
        )

        if (!user) {
          throw new Error("You must be logged in to import workouts")
        }

        // Save to database
        const workout = await createWorkout({
          user_id: user.id,
          title: workoutData.title,
          type: workoutData.type,
          date: workoutData.date,
          distance: workoutData.distance,
          duration: workoutData.duration,
          pace: workoutData.pace,
          elevation_gain: workoutData.elevationGain,
          avg_heart_rate: workoutData.avgHeartRate,
          max_heart_rate: workoutData.maxHeartRate,
          notes: `Imported from ${file.name}`,
          gpx_file_url: null,
        })

        setCreatedWorkoutId(workout?.id || null)
        setDebugInfo(`Workout saved with ID: ${workout?.id}. Saving GPS data...`)

        // If we have GPS coordinates, save them too
        if (workout?.id && workoutData.coordinates && workoutData.coordinates.length > 0) {
          setUploadProgress(80)

          try {
            const success = await saveWorkoutGpsPoints(
              workout.id,
              workoutData.coordinates.map((coord) => ({
                latitude: coord.lat,
                longitude: coord.lng,
                elevation: coord.elevation,
                timestamp: coord.time,
                heart_rate: coord.heartRate,
                speed: coord.speed,
                cadence: null,
              })),
            )

            if (success) {
              setDebugInfo(`GPS data saved successfully (${workoutData.coordinates.length} points).`)
            } else {
              setDebugInfo(`Could not save GPS data. The workout_gps_points table may not exist.`)
            }
          } catch (error) {
            console.error("Error saving GPS data:", error)
            setDebugInfo(`Error saving GPS data: ${error instanceof Error ? error.message : "Unknown error"}`)
            // Continue with the import process even if GPS data couldn't be saved
          }
        }

        setUploadProgress(100)
        setSuccess(true)
        setIsUploading(false)
        setDebugInfo("Import completed successfully!")

        // Show success toast
        toast({
          title: "Workout imported successfully",
          description: `${workoutData.title} (${workoutData.distance.toFixed(2)} km) has been added to your activities.`,
          variant: "default",
        })

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (err) {
        console.error("Error importing workout:", err)
        setError(err instanceof Error ? err.message : "Failed to import workout")
        setDebugInfo(`Import failed at progress ${uploadProgress}%. See console for details.`)
        setIsUploading(false)
        setUploadProgress(0)

        // Show error toast
        toast({
          title: "Import failed",
          description: err instanceof Error ? err.message : "Failed to import workout",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error importing workout:", err)
      setError(err instanceof Error ? err.message : "Failed to import workout")
      setDebugInfo(`Import failed at progress ${uploadProgress}%. See console for details.`)
      setIsUploading(false)
      setUploadProgress(0)

      // Show error toast
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Failed to import workout",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
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
        <Button variant="ghost" onClick={() => router.push("/workouts/new")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Add Workout
        </Button>

        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Import Workout</h2>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Import from Device</CardTitle>
            <CardDescription>Upload a .FIT or .GPX file from your device to import workout data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="upload" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
                {debugInfo && <TabsTrigger value="debug">Debug Info</TabsTrigger>}
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-primary/10 border-primary/20">
                    <Check className="h-4 w-4 text-primary" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Workout imported successfully! You can view it in your activities.
                    </AlertDescription>
                  </Alert>
                )}

                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors ${
                    isUploading ? "pointer-events-none" : "cursor-pointer"
                  }`}
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    accept=".fit,.gpx"
                    className="hidden"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="space-y-4">
                      <FileUp className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-medium">Processing file...</h3>
                      <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                      {debugInfo && <p className="text-xs text-muted-foreground">{debugInfo}</p>}
                    </div>
                  ) : fileInfo ? (
                    <div className="space-y-4">
                      <FileUp className="h-12 w-12 text-primary mx-auto" />
                      <h3 className="text-lg font-medium">{fileInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{fileInfo.size}</p>
                      {success ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFileInfo(null)
                            setSuccess(false)
                            setParsedData(null)
                          }}
                        >
                          Import Another File
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Click to change file</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-medium">Drag & drop your file here</h3>
                      <p className="text-sm text-muted-foreground">or click to browse files</p>
                      <p className="text-xs text-muted-foreground">Supports .FIT and .GPX files from fitness devices</p>
                    </div>
                  )}
                </div>

                {parsedData && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-medium">Imported Workout Data</h3>
                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Title</p>
                        <p>{parsedData.title}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p>{parsedData.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p>{new Date(parsedData.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Distance</p>
                        <p>{parsedData.distance.toFixed(2)} km</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p>{formatDuration(parsedData.duration)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pace</p>
                        <p>{formatPace(parsedData.pace)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Elevation Gain</p>
                        <p>{parsedData.elevationGain} m</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                        <p>
                          {parsedData.avgHeartRate
                            ? `${parsedData.avgHeartRate} bpm (avg) / ${parsedData.maxHeartRate} bpm (max)`
                            : "Not available"}
                        </p>
                      </div>
                    </div>

                    {parsedData.coordinates && parsedData.coordinates.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">GPS Data</p>
                        <p>{parsedData.coordinates.length} data points imported</p>

                        {/* Show a sample of the first few GPS points */}
                        {parsedData.coordinates.length > 0 && (
                          <div className="mt-2 p-2 bg-muted/30 rounded-md text-xs overflow-auto max-h-32">
                            <p className="font-medium mb-1">Sample GPS data:</p>
                            <pre>
                              {JSON.stringify(parsedData.coordinates.slice(0, 3), null, 2)}
                              {parsedData.coordinates.length > 3 && "..."}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="help" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>How to import your workout</AlertTitle>
                  <AlertDescription>Follow these steps to import your workout data from your device:</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">From Garmin Connect</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Log in to Garmin Connect on your computer</li>
                      <li>Find the activity you want to export</li>
                      <li>Click on the activity to open it</li>
                      <li>Click the gear icon in the top right corner</li>
                      <li>Select "Export Original" to download the .FIT file</li>
                      <li>Upload the downloaded file here</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">From Strava</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Log in to Strava on your computer</li>
                      <li>Go to your activities page</li>
                      <li>Click on the activity you want to export</li>
                      <li>Click the "..." button in the top right</li>
                      <li>Select "Export GPX" to download the file</li>
                      <li>Upload the downloaded file here</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Supported File Types</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <strong>.FIT files</strong> - The native format for Garmin and many other fitness devices
                      </li>
                      <li>
                        <strong>.GPX files</strong> - A common format for GPS data that works with most fitness
                        platforms
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Troubleshooting</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Make sure your file is not corrupted</li>
                      <li>Try exporting the file again from your device or platform</li>
                      <li>If you're having issues with a .FIT file, try exporting as .GPX instead</li>
                      <li>Check that your file contains valid workout data</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {debugInfo && (
                <TabsContent value="debug" className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Debug Information</AlertTitle>
                    <AlertDescription>This information can help diagnose issues with file imports.</AlertDescription>
                  </Alert>

                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>

                    {error && (
                      <>
                        <h4 className="font-medium text-destructive mt-4">Error Details:</h4>
                        <pre className="text-xs whitespace-pre-wrap text-destructive">{error}</pre>
                      </>
                    )}

                    {parsedData && (
                      <>
                        <h4 className="font-medium mt-4">Parsed Data Summary:</h4>
                        <ul className="text-xs space-y-1">
                          <li>Title: {parsedData.title}</li>
                          <li>Type: {parsedData.type}</li>
                          <li>Date: {parsedData.date}</li>
                          <li>Distance: {parsedData.distance.toFixed(2)} km</li>
                          <li>Duration: {formatDuration(parsedData.duration)}</li>
                          <li>GPS Points: {parsedData.coordinates.length}</li>
                          <li>File Format: {fileInfo?.name.split(".").pop()?.toUpperCase()}</li>
                        </ul>
                      </>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!parsedData && activeTab === "upload" && (
              <div className="text-sm text-muted-foreground">
                <p>The following data will be imported:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Date and time</li>
                  <li>Distance</li>
                  <li>Duration</li>
                  <li>Heart rate data (if available)</li>
                  <li>Elevation data</li>
                  <li>GPS coordinates (if available)</li>
                </ul>
              </div>
            )}

            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                {createdWorkoutId && (
                  <Button variant="outline" onClick={() => router.push(`/workouts/${createdWorkoutId}`)}>
                    View Workout
                  </Button>
                )}
                <Button onClick={() => router.push("/activities")} disabled={!success}>
                  View All Activities
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

