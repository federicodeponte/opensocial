// ABOUTME: Theme provider wrapper for dark mode support
// ABOUTME: Uses next-themes for persistent theme management

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ComponentProps } from 'react'

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
