/**
 * table.tsx - Styled Table Components
 * 
 * This file provides a complete set of table components for data display.
 * Features:
 * - Responsive table wrapper with horizontal scrolling
 * - Semantic HTML table structure with proper accessibility
 * - Consistent styling with design system integration  
 * - Hover and selection states for interactive rows
 * - Checkbox integration with proper alignment
 * - Caption support for table descriptions
 * - Full TypeScript support with prop forwarding
 */

import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Main table component with responsive wrapper
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML table element attributes
 * @returns Table element wrapped in responsive container with horizontal scroll
 */
function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

/**
 * Table header section component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML thead element attributes
 * @returns Styled table header with bottom borders on rows
 */
function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

/**
 * Table body section component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML tbody element attributes
 * @returns Styled table body with border management for last row
 */
function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

/**
 * Table footer section component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML tfoot element attributes
 * @returns Styled table footer with background and border styling
 */
function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Table row component with interactive states
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML tr element attributes including data-state
 * @returns Styled table row with hover and selection states
 */
function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // Hover state for better UX
        "hover:bg-muted/50",
        // Selection state styling
        "data-[state=selected]:bg-muted",
        // Border and transition effects
        "border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

/**
 * Table header cell component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML th element attributes
 * @returns Styled table header cell with proper alignment and checkbox support
 */
function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // Basic styling: height, padding, alignment, typography
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap",
        // Checkbox integration with proper spacing and alignment
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Table data cell component
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML td element attributes
 * @returns Styled table cell with consistent padding and checkbox support
 */
function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // Basic cell styling with padding and alignment
        "p-2 align-middle whitespace-nowrap",
        // Checkbox integration with proper spacing and alignment
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Table caption component for accessibility
 * 
 * @param className - Additional CSS classes to merge with default styles
 * @param props - All HTML caption element attributes
 * @returns Styled table caption for screen readers and table description
 */
function TableCaption({
  className,
  ...props
}: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
