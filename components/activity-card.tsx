"use client"

import Link from "next/link"
import { Activity, ArrowUpRight, Clock, Mountain, Upload, Trash2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { deleteWorkout } from "@/lib/workout-service"

interface ActivityCardProps {
  id: string
  date: string
  title: string
  distance: string
  duration: string
  pace: string
  elevation: string
  isImported?: boolean
  onDelete?: () => void
}

export function ActivityCard({
  id,
  date,
  title,
  distance,
  duration,
  pace,
  elevation,
  isImported,
  onDelete,
}: ActivityCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteWorkout(id)
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error("Error deleting workout:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{date}</p>
          <Badge variant={isImported ? "secondary" : "outline"} className="font-normal">
            {isImported ? (
              <span className="flex items-center">
                <Upload className="h-3 w-3 mr-1" />
                Imported
              </span>
            ) : (
              "Running"
            )}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold tracking-tight pt-2">{title}</h3>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm">{distance}</div>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm">{duration}</div>
          </div>
          <div className="flex items-center">
            <ArrowUpRight className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm">{pace}</div>
          </div>
          <div className="flex items-center">
            <Mountain className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm">{elevation}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Link href={`/workouts/${id}`} className="text-sm text-primary hover:underline">
          View Details
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the workout and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}

