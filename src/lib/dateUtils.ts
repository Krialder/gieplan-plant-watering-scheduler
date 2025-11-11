/**
 * dateUtils.ts - Date Manipulation and Formatting Utilities
 * 
 * This module provides comprehensive date handling functionality for the watering schedule system.
 * Functions:
 * - Parse and format dates in various formats (ISO, German locale)
 * - Calculate date differences and ranges for scheduling
 * - Handle week-based calculations for schedule generation
 * - Validate date ranges for person availability periods
 * - Provide Monday-based week start calculations for consistent scheduling
 * - Support ISO week number calculations for reporting
 */

// Parse string date into Date object
export function parseDate(dateString: string): Date {
  // Handle empty or invalid input
  if (!dateString) {
    return new Date();
  }
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: "${dateString}"`);
    return new Date(); // Return current date as fallback
  }
  
  return date;
}

// Format Date object to ISO date string (YYYY-MM-DD)
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format Date object to German locale format (DD.MM.YYYY)
export function formatDateGerman(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Calculate number of days between two dates
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Add specified number of days to a date
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Add specified number of weeks to a date
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

// Get ISO week number for a given date
export function getWeekNumber(date: Date): number {
  // Create a copy to avoid modifying the original
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  return weekNo;
}

// Get Monday of the week containing the specified date
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday = 0
  d.setDate(diff);
  return d;
}

// Get the next Monday from the specified date (if date is Monday, returns next Monday)
export function getNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  
  // Calculate days until next Monday
  // If today is Monday (1), add 7 days
  // If today is Tuesday (2), add 6 days, etc.
  const daysUntilMonday = day === 0 ? 1 : (8 - day);
  
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

// Check if a date falls within a specified range
export function isDateInRange(date: string, startDate: string, endDate: string | null): boolean {
  const d = parseDate(date);
  const start = parseDate(startDate);
  
  // If no end date, check if date is after start
  if (endDate === null) {
    return d >= start;
  }
  
  // Check if date is within range
  const end = parseDate(endDate);
  return d >= start && d <= end;
}

// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

// Get today's date as ISO string
export function getTodayString(): string {
  return formatDate(new Date());
}
