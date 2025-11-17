// ABOUTME: Animated like button with heart burst effect
// ABOUTME: Uses framer-motion for smooth animations

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnimatedLikeButtonProps {
  isLiked: boolean
  likesCount: number
  onToggle: () => void
  disabled?: boolean
}

export function AnimatedLikeButton({
  isLiked,
  likesCount,
  onToggle,
  disabled,
}: AnimatedLikeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className="group relative"
    >
      <motion.div
        initial={false}
        animate={{
          scale: isLiked ? [1, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Heart
          className={`h-4 w-4 ${
            isLiked
              ? 'fill-red-500 text-red-500'
              : 'text-gray-500 group-hover:text-red-500'
          }`}
        />

        {/* Heart burst animation */}
        <AnimatePresence>
          {isLiked && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full"
                  initial={{
                    opacity: 1,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: 0,
                    scale: 1.5,
                    x: Math.cos((i * Math.PI) / 3) * 20,
                    y: Math.sin((i * Math.PI) / 3) * 20,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.span
          key={likesCount}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1 text-sm"
        >
          {likesCount}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
