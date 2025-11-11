/**
 * utils.ts - General Utility Functions
 * 
 * This module provides general utility functions for the application.
 * Functions:
 * - cn: Utility for merging CSS class names with Tailwind CSS support
 *   - Uses clsx for conditional class name handling
 *   - Uses tailwind-merge to resolve Tailwind class conflicts
 *   - Ensures proper class precedence and deduplication
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function for combining and merging CSS class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
