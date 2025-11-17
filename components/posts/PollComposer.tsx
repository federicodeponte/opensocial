// ABOUTME: Component for creating polls when composing a post
// ABOUTME: Allows 2-4 poll options with optional expiration time

'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface PollData {
  options: string[]
  expiresInHours?: number
}

interface PollComposerProps {
  onPollChange: (poll: PollData | null) => void
  disabled?: boolean
}

export function PollComposer({ onPollChange, disabled = false }: PollComposerProps) {
  const [options, setOptions] = useState<string[]>(['', ''])
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(24)

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    updatePoll(newOptions, expiresInHours)
  }

  const handleAddOption = () => {
    if (options.length < 4) {
      const newOptions = [...options, '']
      setOptions(newOptions)
      updatePoll(newOptions, expiresInHours)
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      updatePoll(newOptions, expiresInHours)
    }
  }

  const handleExpirationChange = (value: string) => {
    const hours = value === 'never' ? undefined : parseInt(value)
    setExpiresInHours(hours)
    updatePoll(options, hours)
  }

  const updatePoll = (opts: string[], expires?: number) => {
    // Only emit poll data if at least 2 options have text
    const filledOptions = opts.filter((opt) => opt.trim().length > 0)
    if (filledOptions.length >= 2) {
      onPollChange({ options: filledOptions, expiresInHours: expires })
    } else {
      onPollChange(null)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Poll Options</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPollChange(null)}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              disabled={disabled}
              maxLength={100}
              className="flex-1"
            />
            {options.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                disabled={disabled}
                className="h-9 w-9 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {options.length < 4 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      )}

      <div className="pt-2 border-t border-border">
        <label htmlFor="poll-duration" className="text-sm font-medium mb-2 block">
          Poll Duration
        </label>
        <select
          id="poll-duration"
          value={expiresInHours?.toString() || 'never'}
          onChange={(e) => handleExpirationChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="1">1 hour</option>
          <option value="6">6 hours</option>
          <option value="24">1 day</option>
          <option value="72">3 days</option>
          <option value="168">1 week</option>
          <option value="never">Never expire</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {options.filter((opt) => opt.trim().length > 0).length} of 2-4 options filled
      </p>
    </div>
  )
}
