/**
 * fileStorage.ts - File-based Storage using File System Access API
 * 
 * This module provides file-based persistence for the application data.
 * Users can select a folder where data will be saved as JSON files.
 * Functions:
 * - Request folder access from user
 * - Save data to JSON files in selected folder
 * - Load data from JSON files
 * - Auto-save on changes
 */

import type { YearData } from '@/types';

// Type definitions for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }): Promise<FileSystemDirectoryHandle>;
  }
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemFileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

let directoryHandle: FileSystemDirectoryHandle | null = null;

/**
 * Get the current directory handle (for internal use)
 */
export function getDirectoryHandle(): FileSystemDirectoryHandle | null {
  return directoryHandle;
}

/**
 * Set the directory handle (for internal use)
 */
export function setDirectoryHandle(handle: FileSystemDirectoryHandle | null): void {
  directoryHandle = handle;
  if (handle) {
    localStorage.setItem('giessplan-has-folder', 'true');
    localStorage.setItem('giessplan-folder-name', handle.name);
  } else {
    localStorage.removeItem('giessplan-has-folder');
    localStorage.removeItem('giessplan-folder-name');
  }
}

/**
 * Request user to select a folder for data storage
 */
export async function requestDataFolder(): Promise<boolean> {
  try {
    // Request directory access using File System Access API
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    
    // Store the handle
    setDirectoryHandle(handle);
    
    console.log('✅ Folder selected:', handle.name);
    return true;
  } catch (error) {
    console.error('Failed to request folder access:', error);
    
    // Check if user cancelled
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('User cancelled folder selection');
      return false;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if we have a folder selected
 */
export function hasDataFolder(): boolean {
  return directoryHandle !== null || localStorage.getItem('giessplan-has-folder') === 'true';
}

/**
 * Save year data to a JSON file in the selected folder
 */
export async function saveYearDataToFile(yearData: YearData): Promise<boolean> {
  if (!directoryHandle) {
    throw new Error('No folder selected. Please select a data folder first.');
  }

  try {
    const fileName = `giessplan-${yearData.year}.json`;
    
    // Get or create file handle
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    
    // Create writable stream
    const writable = await fileHandle.createWritable();
    
    // Write data as JSON with pretty formatting
    const data = JSON.stringify(yearData, null, 2);
    await writable.write(data);
    await writable.close();
    
    console.log(`📄 Saved data to ${fileName}:`, {
      people: yearData.people.length,
      schedules: yearData.schedules.length,
      lastModified: yearData.lastModified
    });
    return true;
  } catch (error) {
    console.error('Failed to save data to file:', error);
    throw error;
  }
}

/**
 * Load year data from a JSON file in the selected folder
 */
export async function loadYearDataFromFile(year: number): Promise<YearData | null> {
  if (!directoryHandle) {
    throw new Error('No folder selected. Please select a data folder first.');
  }

  try {
    const fileName = `giessplan-${year}.json`;
    
    // Try to get the file handle
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    
    // Read file
    const file = await fileHandle.getFile();
    const text = await file.text();
    
    // Parse JSON
    const data = JSON.parse(text) as YearData;
    
    console.log(`Loaded data from ${fileName}`);
    return data;
  } catch (error) {
    if ((error as any).name === 'NotFoundError') {
      // File doesn't exist yet - return null
      console.log(`No data file found for year ${year}`);
      return null;
    }
    console.error('Failed to load data from file:', error);
    throw error;
  }
}

/**
 * Get the name of the selected folder
 */
export function getFolderName(): string | null {
  if (directoryHandle) {
    return directoryHandle.name;
  }
  // Fallback to stored name if handle is lost
  return localStorage.getItem('giessplan-folder-name');
}

/**
 * Clear the folder selection
 */
export function clearFolderSelection(): void {
  setDirectoryHandle(null);
}

/**
 * List all year data files in the selected folder
 */
export async function listYearDataFiles(): Promise<number[]> {
  if (!directoryHandle) {
    return [];
  }

  try {
    const years: number[] = [];
    
    // @ts-ignore - Iterate through directory entries
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file' && name.startsWith('giessplan-') && name.endsWith('.json')) {
        const yearMatch = name.match(/giessplan-(\d+)\.json/);
        if (yearMatch) {
          years.push(parseInt(yearMatch[1]));
        }
      }
    }
    
    return years.sort((a, b) => b - a);
  } catch (error) {
    console.error('Failed to list files:', error);
    return [];
  }
}
