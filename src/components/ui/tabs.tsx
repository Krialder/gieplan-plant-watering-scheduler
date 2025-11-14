/**
 * tabs.tsx - Accessible Tabs Component
 * 
 * This file provides a complete tabs component system built on Radix UI primitives.
 * Features:
 * - Fully accessible tab navigation with keyboard support
 * - Styled tab list with active state indicators
 * - Customizable tab triggers with focus and hover states
 * - Content panels with proper ARIA relationships
 * - Dark mode support through design system variables
 * - Flexible styling with className overrides
 * - TypeScript support with proper prop forwarding
 */

"use client"

import { ComponentProps } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Root tabs container component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All Radix UI Tabs.Root props (value, onValueChange, etc.)
 * @returns Accessible tabs container with keyboard navigation
 */
function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * Tab list component containing tab triggers
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All Radix UI Tabs.List props
 * @returns Styled tab list with proper spacing and background
 */
function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Background styling with muted theme colors
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Individual tab trigger/button component
 * 
 * @param className - Additional CSS classes to merge with default styles  
 * @param props - All Radix UI Tabs.Trigger props
 * @returns Styled tab button with active, hover, and focus states
 */
function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styling: layout, typography, spacing
        "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow]",
        // Active state styling for selected tab
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-sm",
        // Focus states for keyboard accessibility
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1",
        // Disabled state styling
        "disabled:pointer-events-none disabled:opacity-50",
        // Icon sizing within tab triggers
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * Tab content panel component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All Radix UI Tabs.Content props  
 * @returns Content panel with proper focus management
 */
function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
