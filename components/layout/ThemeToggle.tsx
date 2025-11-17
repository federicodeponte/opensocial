// ABOUTME: Theme toggle component for switching between light/dark mode
// ABOUTME: Displays sun/moon icon with smooth transitions

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 relative"
    >
      <motion.div
        initial={false}
        animate={{
          scale: theme === 'dark' ? 0 : 1,
          rotate: theme === 'dark' ? 90 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Sun className="h-4 w-4" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: theme === 'dark' ? 1 : 0,
          rotate: theme === 'dark' ? 0 : -90,
        }}
        transition={{ duration: 0.2 }}
        className="absolute"
      >
        <Moon className="h-4 w-4" />
      </motion.div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
