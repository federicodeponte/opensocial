// ABOUTME: Image picker component for selecting up to 4 images for posts
// ABOUTME: Shows image previews with remove functionality before upload

'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MAX_IMAGES_PER_POST, MAX_FILE_SIZE, ALLOWED_TYPES } from '@/lib/utils/image-upload'

interface ImagePickerProps {
  onImagesSelected: (files: File[]) => void
  selectedImages: File[]
}

export function ImagePicker({ onImagesSelected, selectedImages }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)

    // Validate number of images
    const totalImages = selectedImages.length + files.length
    if (totalImages > MAX_IMAGES_PER_POST) {
      setError(`Maximum ${MAX_IMAGES_PER_POST} images allowed`)
      return
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Invalid file type. Allowed: JPG, PNG, GIF, WebP')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
        return
      }
    }

    onImagesSelected([...selectedImages, ...files])

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    onImagesSelected(newImages)
    setError(null)
  }

  return (
    <div className="space-y-2">
      {/* Image Previews */}
      {selectedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selectedImages.map((file, index) => {
            const url = URL.createObjectURL(file)
            return (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Images Button */}
      {selectedImages.length < MAX_IMAGES_PER_POST && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Images ({selectedImages.length}/{MAX_IMAGES_PER_POST})
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
