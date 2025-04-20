"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { uploadFile, getPublicUrl } from "@/lib/supabase/storage"

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
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null)
  
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
        
        // Create a unique path for the file
        const timestamp = new Date().getTime()
        const path = `${timestamp}_${file.name.replace(/\s+/g, '_')}`
        
        // Upload the file
        await uploadFile(bucketName, path, file)
        
        // Get the public URL
        const publicUrl = getPublicUrl(bucketName, path)
        
        // Update the preview
        setPreviewUrl(publicUrl)
        
        // Call the onChange handler with the new URL
        onChange(publicUrl)
      } catch (error) {
        console.error("Error uploading file:", error)
        onError?.(error instanceof Error ? error : new Error("Failed to upload file"))
      } finally {
        setIsUploading(false)
      }
    },
    [bucketName, maxSize, onChange, onError]
  )

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    onChange("")
  }, [onChange])

  return (
    <div className={cn("space-y-2", className)}>
      {showPreview && previewUrl && (
        <div className="relative w-full h-32 border rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Uploaded file"
            fill
            className="object-contain"
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
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : previewUrl ? "Change Logo" : "Upload Logo"}
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
    </div>
  )
}
