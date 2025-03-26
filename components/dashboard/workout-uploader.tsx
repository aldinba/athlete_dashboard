"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WorkoutUploaderProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export function WorkoutUploader({ isOpen, onClose, onUploadSuccess }: WorkoutUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleUpload() {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a .fit file to upload",
        variant: "destructive",
      })
      return
    }

    if (!file.name.endsWith(".fit")) {
      toast({
        title: "Invalid file format",
        description: "Please upload a .fit file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Check if Supabase is properly initialized
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase environment variables are missing. Please check your configuration.")
      }

      // 1. Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("workout-files")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Trigger the processing function
      const { error: processingError } = await supabase.functions.invoke("process-fit-file", {
        body: { filePath: uploadData.path },
      })

      if (processingError) throw processingError

      onUploadSuccess()
    } catch (err) {
      console.error("Error uploading workout:", err)
      setError(err instanceof Error ? err.message : "Failed to upload workout")
      toast({
        title: "Upload failed",
        description: "There was an error uploading your workout",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="file">Select .fit file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".fit"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isUploading}
              />
            </div>
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

