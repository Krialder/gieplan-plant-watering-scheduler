/**
 * input.tsx - Styled Input Component
 * 
 * This file provides a reusable styled input component based on HTML input element.
 * Features:
 * - Consistent styling with design system integration
 * - Focus states with ring indicators for accessibility
 * - Error states with destructive styling for validation feedback
 * - File input support with custom styling
 * - Dark mode support through CSS variables
 * - Disabled states with proper visual feedback
 * - Full TypeScript support with proper prop forwarding
 */

import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Styled input component with design system integration
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param type - HTML input type (text, email, password, file, etc.)
 * @param props - All other HTML input attributes and React props
 * @returns Styled input element with proper accessibility and focus management
 */
function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styling: size, spacing, typography, borders
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Focus states for accessibility and user feedback
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Error states for form validation feedback
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
