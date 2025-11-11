/**
 * storage.ts - Local Storage 
 * 
 * This module provides a localStorage-based e.
 * Functions:
 * - Reactive state management with localStorage persistence
 * - Type-safe storage with JSON serialization
 * - React hook interface 
 * - Automatic state synchronization across components
 * - Error handling for storage quota and serialization issues
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook
 * 
 * @param key - Storage key for the value
 * @param defaultValue - Default value if key doesn't exist
 * @returns [value, setValue] tuple similar to useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with value from localStorage or default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  /**
   * Update both state and localStorage
   * Supports both direct values and updater functions like useState
   */
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Handle updater function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update state
      setStoredValue(valueToStore);
      
      // Update localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Alias for useLocalStorage 
 * This allows us to do a simple find/replace: useKV -> useLocalKV
 */
export const useLocalKV = useLocalStorage;

/**
 * Clear all application data from localStorage
 * Useful for data reset functionality
 */
export function clearAllData(): void {
  const keys = Object.keys(localStorage);
  const appKeys = keys.filter(key => key.startsWith('giessplan-'));
  
  appKeys.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Get all stored data keys for the application
 * Useful for debugging and data export
 */
export function getAllDataKeys(): string[] {
  const keys = Object.keys(localStorage);
  return keys.filter(key => key.startsWith('giessplan-'));
}

/**
 * Export all application data as JSON
 * Useful for backup functionality
 */
export function exportAllLocalData(): Record<string, any> {
  const keys = getAllDataKeys();
  const data: Record<string, any> = {};
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    } catch (error) {
      console.warn(`Error reading key "${key}":`, error);
    }
  });
  
  return data;
}

/**
 * Import data from exported JSON
 * Useful for restore functionality
 */
export function importLocalData(data: Record<string, any>): void {
  Object.entries(data).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error importing key "${key}":`, error);
    }
  });
}