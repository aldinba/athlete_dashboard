"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Upload, FileUp } from "lucide-react"
import { parseFitFile } from "@/lib/fit-parser"
import { formatFileSize } from "@/lib/debug-utils"

export default function GpxTestPage() {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)
    setIsProcessing(true)
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

      // Parse the file
      const parsedData = await parseFitFile(file)
      setResult(parsedData)
    } catch (err) {
      console.error("Error parsing file:", err)
      setError(err instanceof Error ? err.message : "Failed to parse file")
    } finally {
      setIsProcessing(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">GPX/FIT Parser Test</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload a GPX or FIT file</CardTitle>
          <CardDescription>Test the parser with your own file</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors ${
              isProcessing ? "pointer-events-none" : "cursor-pointer"
            }`}
            onClick={triggerFileInput}
          >
            <input
              type="file"
              accept=".fit,.gpx"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isProcessing}
            />

            {isProcessing ? (
              <div className="space-y-4">
                <FileUp className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Processing file...</h3>
              </div>
            ) : fileInfo ? (
              <div className="space-y-4">
                <FileUp className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-medium">{fileInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{fileInfo.size}</p>
                <p className="text-sm text-muted-foreground">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Drag & drop your file here</h3>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
                <p className="text-xs text-muted-foreground">Supports .FIT and .GPX files</p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Parser Result</CardTitle>
            <CardDescription>
              File: {fileInfo?.name} ({fileInfo?.size})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p>{result.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p>{result.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{new Date(result.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Distance</p>
                <p>{result.distance.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p>
                  {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pace</p>
                <p>
                  {Math.floor(result.pace / 60)}:{(result.pace % 60).toString().padStart(2, "0")} /km
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Elevation Gain</p>
                <p>{result.elevationGain} m</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                <p>
                  {result.avgHeartRate
                    ? `${result.avgHeartRate} bpm (avg) / ${result.maxHeartRate} bpm (max)`
                    : "Not available"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">GPS Data</p>
              <p>{result.coordinates.length} data points</p>
            </div>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                The parser has successfully extracted the workout data. You can now import this workout.
              </AlertDescription>
            </Alert>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Sample GPS Points (first 3):</p>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-60">
                {JSON.stringify(result.coordinates.slice(0, 3), null, 2)}
              </pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setResult(null)}>Clear Result</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

