"use client"

import * as React from "react"
import { useCallback, useState, useEffect } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { uploadFile, getPublicUrl } from "@/lib/supabase/storage"
import { Progress } from "./progress"

interface FileUploadProps {
  className?: string
  value?: string
  onChange: (url: string) => void
  onError?: (error: Error) => void
  bucketName?: string
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
  showPreview?: boolean
  buttonText?: string
  changeButtonText?: string
  uploadingText?: string
}

export function FileUpload({
  className,
  value,
  onChange,
  onError,
  bucketName = "logos",
  accept = "image/*",
  maxSize = 2, // 2MB default
  disabled = false,
  showPreview = true,
  buttonText = "Upload File",
  changeButtonText = "Change File",
  uploadingText = "Uploading...",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Reset success state after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (uploadSuccess) {
      timer = setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [uploadSuccess])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        onError?.(new Error(`File size exceeds ${maxSize}MB limit`))
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)
        setUploadError(null)
        setUploadSuccess(false)

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 300)

        // Create a unique path for the file
        const timestamp = new Date().getTime()
        const path = `${timestamp}-${file.name.replace(/\s+/g, '_')}`

        // Upload the file
        await uploadFile(bucketName, path, file)

        // Get the public URL
        const publicUrl = getPublicUrl(bucketName, path)

        // Clear the progress interval
        clearInterval(progressInterval)
        setUploadProgress(100)

        // Update the preview
        setPreviewUrl(publicUrl)

        // Call the onChange handler with the new URL
        onChange(publicUrl)

        // Show success state
        setUploadSuccess(true)
      } catch (error) {
        console.error("Error uploading file:", error)
        setUploadError(error instanceof Error ? error.message : "Failed to upload file")
        onError?.(error instanceof Error ? error : new Error("Failed to upload file"))
        setUploadProgress(0)
      } finally {
        setIsUploading(false)
      }
    },
    [bucketName, maxSize, onChange, onError]
  )

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    setUploadError(null)
    setUploadSuccess(false)
    onChange("")
  }, [onChange])

  return (
    <div className={cn("space-y-3", className)}>
      {showPreview && previewUrl && (
        <div className="relative w-full h-32 border rounded-md overflow-hidden bg-background/50">
          <Image
            src={previewUrl}
            alt="Uploaded file"
            fill
            className="object-contain p-2"
            onError={() => {
              setUploadError("Failed to load image. The file may be corrupted or inaccessible.")
              setPreviewUrl(null)
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading file...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && !isUploading && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
          <CheckCircle2 className="h-4 w-4" />
          <span>File uploaded successfully</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={disabled || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploadingText}
            </>
          ) : previewUrl ? (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {changeButtonText}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Supported formats: {accept.replace('image/*', 'JPG, PNG, SVG, GIF')} • Max size: {maxSize}MB
      </div>
    </div>
  )
}
