// ABOUTME: Modal for creating new communities
// ABOUTME: Form with name, slug, description, type selection

'use client'

import { useState } from 'react'
import { X, Users, Lock, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCreateCommunity } from '@/lib/hooks/useCommunities'
import type { CommunityType } from '@/lib/types/community'

interface CreateCommunityModalProps {
  open: boolean
  onClose: () => void
  userId: string
}

export function CreateCommunityModal({ open, onClose, userId }: CreateCommunityModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CommunityType>('public')

  const createCommunity = useCreateCommunity()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !slug.trim() || !description.trim()) {
      return
    }

    await createCommunity.mutateAsync({
      userId,
      input: {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        type,
      },
    })

    // Reset form
    setName('')
    setSlug('')
    setDescription('')
    setType('public')
    onClose()
  }

  const communityTypes = [
    {
      type: 'public' as const,
      icon: Users,
      title: 'Public',
      description: 'Anyone can join and see posts',
    },
    {
      type: 'private' as const,
      icon: Lock,
      title: 'Private',
      description: 'Members must be approved to join',
    },
    {
      type: 'secret' as const,
      icon: EyeOff,
      title: 'Secret',
      description: 'Only invited members can join and see content',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Community</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Community Type</label>
            <div className="grid grid-cols-3 gap-3">
              {communityTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    type === item.type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  <item.icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Community Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Web Developers"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">{name.length}/100 characters</p>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Community URL *
            </label>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-2">/communities/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="web-developers"
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                pattern="[a-z0-9-]+"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your community about?"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createCommunity.isPending ||
                !name.trim() ||
                !slug.trim() ||
                !description.trim()
              }
            >
              {createCommunity.isPending ? 'Creating...' : 'Create Community'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
