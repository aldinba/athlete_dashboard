"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createWorkout } from "@/lib/workout-service"
import { Upload } from "lucide-react"
import Link from "next/link"

export default function NewWorkoutPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [type, setType] = useState("Easy Run")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [distance, setDistance] = useState("")
  const [hours, setHours] = useState("0")
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")
  const [elevationGain, setElevationGain] = useState("")
  const [avgHeartRate, setAvgHeartRate] = useState("")
  const [maxHeartRate, setMaxHeartRate] = useState("")
  const [notes, setNotes] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!user) {
        throw new Error("You must be logged in to add a workout")
      }

      // Calculate duration in seconds
      const durationSeconds =
        Number.parseInt(hours) * 3600 + Number.parseInt(minutes) * 60 + (Number.parseInt(seconds) || 0)

      // Calculate pace in seconds per km
      const distanceValue = Number.parseFloat(distance)
      const paceSeconds = Math.round(durationSeconds / distanceValue)

      const workout = {
        user_id: user.id,
        title,
        type,
        date,
        distance: distanceValue,
        duration: durationSeconds,
        pace: paceSeconds,
        elevation_gain: Number.parseInt(elevationGain) || 0,
        avg_heart_rate: avgHeartRate ? Number.parseInt(avgHeartRate) : null,
        max_heart_rate: maxHeartRate ? Number.parseInt(maxHeartRate) : null,
        notes: notes || null,
      }

      await createWorkout(workout)
      router.push("/")
    } catch (error) {
      console.error("Error adding workout:", error)
      setError("Failed to add workout. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Add New Workout</h2>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
            <CardDescription>Enter the details of your workout</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Workout Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Morning Run"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Workout Type</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy Run">Easy Run</SelectItem>
                      <SelectItem value="Long Run">Long Run</SelectItem>
                      <SelectItem value="Tempo Run">Tempo Run</SelectItem>
                      <SelectItem value="Interval Training">Interval Training</SelectItem>
                      <SelectItem value="Recovery Run">Recovery Run</SelectItem>
                      <SelectItem value="Race">Race</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="elevation">Elevation Gain (m)</Label>
                  <Input
                    id="elevation"
                    type="number"
                    min="0"
                    value={elevationGain}
                    onChange={(e) => setElevationGain(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutes"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Seconds"
                      value={seconds}
                      onChange={(e) => setSeconds(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avg-hr">Average Heart Rate</Label>
                  <Input
                    id="avg-hr"
                    type="number"
                    min="0"
                    value={avgHeartRate}
                    onChange={(e) => setAvgHeartRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-hr">Max Heart Rate</Label>
                  <Input
                    id="max-hr"
                    type="number"
                    min="0"
                    value={maxHeartRate}
                    onChange={(e) => setMaxHeartRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How did the workout feel? Any observations?"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/workouts/import">
                    <Upload className="mr-2 h-4 w-4" />
                    Import from Device
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Workout"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

