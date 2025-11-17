// ABOUTME: Edit profile modal with form for updating profile information
// ABOUTME: Includes avatar and header image upload functionality

'use client'

import { useState } from 'react'
import { useUpdateProfile } from '@/lib/hooks/useProfile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/types/types'

interface EditProfileModalProps {
  profile: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileModal({ profile, open, onOpenChange }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [location, setLocation] = useState(profile.location || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const updateProfile = useUpdateProfile()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
    }
  }

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHeaderFile(file)
    }
  }

  const uploadImage = async (file: File, type: 'avatar' | 'header'): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch('/api/upload/profile-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`)
    }

    const data = await response.json()
    return data.data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setUploading(true)

      // Upload images if selected
      if (avatarFile) {
        setUploadProgress('Uploading avatar...')
        await uploadImage(avatarFile, 'avatar')
      }

      if (headerFile) {
        setUploadProgress('Uploading header image...')
        await uploadImage(headerFile, 'header')
      }

      setUploadProgress('Saving profile...')

      // Update profile
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
      })

      setUploading(false)
      setUploadProgress('')
      onOpenChange(false)
    } catch (error) {
      setUploading(false)
      setUploadProgress('')
      console.error('Failed to update profile:', error)
    }
  }

  const bioRemaining = 160 - bio.length
  const isBioOverLimit = bioRemaining < 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Image */}
          <div>
            <Label htmlFor="header">Header Image</Label>
            <div className="mt-2">
              {headerFile || profile.header_url ? (
                <div className="relative">
                  <img
                    src={
                      headerFile
                        ? URL.createObjectURL(headerFile)
                        : profile.header_url || ''
                    }
                    alt="Header"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <input
                    id="header"
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="header"
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-black/80 transition-colors text-sm"
                  >
                    Change
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="header"
                  className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <span className="text-gray-500">Click to upload header image</span>
                  <input
                    id="header"
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Avatar Image */}
          <div>
            <Label htmlFor="avatar">Avatar</Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative">
                {avatarFile || profile.avatar_url ? (
                  <img
                    src={
                      avatarFile
                        ? URL.createObjectURL(avatarFile)
                        : profile.avatar_url || ''
                    }
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold">
                    {(profile.display_name?.[0] || profile.username[0]).toUpperCase()}
                  </div>
                )}
              </div>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <label htmlFor="avatar" className="cursor-pointer">
                <Button type="button" variant="outline">
                  Change Avatar
                </Button>
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full min-h-[80px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={170}
            />
            <div
              className={`text-sm text-right mt-1 ${
                isBioOverLimit ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {bioRemaining} characters remaining
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you located?"
              maxLength={50}
            />
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateProfile.isPending || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isBioOverLimit || updateProfile.isPending || uploading}
            >
              {uploading || updateProfile.isPending
                ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress || 'Saving...'}
                  </span>
                )
                : 'Save Changes'}
            </Button>
          </div>

          {updateProfile.isError && (
            <div className="text-sm text-red-600">
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Failed to update profile'}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
