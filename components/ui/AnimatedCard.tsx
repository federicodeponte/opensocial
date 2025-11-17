// ABOUTME: Animated card wrapper with hover effects
// ABOUTME: Provides smooth animations for interactive cards

'use client'

import { motion } from 'framer-motion'
import { type HTMLMotionProps } from 'framer-motion'

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  hoverScale?: number
  tapScale?: number
}

export function AnimatedCard({
  children,
  hoverScale = 1.02,
  tapScale = 0.98,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: hoverScale, transition: { duration: 0.2 } }}
      whileTap={{ scale: tapScale }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered list animation container
 */
export function StaggerContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade in up animation
 */
export function FadeInUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide in from left
 */
export function SlideInLeft({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Scale in animation
 */
export function ScaleIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  )
}
