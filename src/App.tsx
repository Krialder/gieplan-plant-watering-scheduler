/**
 * App.tsx - Main Application Component
 * 
 * This is the root component of the GießPlan (Watering Schedule) system for Rotkreuz-Institut BBW.
 * Functions:
 * - Manages application state including current year and theme
 * - Provides tabbed navigation between main features (People, Schedule, Manual, Data)
 * - Handles theme switching (light, dark, twilight)
 * - Manages year data persistence using file-based storage
 * - Renders header with application title and controls
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Settings, Database, Moon, Sun, Sparkles } from 'lucide-react';
import { useLocalKV } from '@/lib/storage';
import { loadYearDataFromFile, saveYearDataToFile, hasDataFolder } from '@/lib/fileStorage';
import type { YearData } from '@/types';
import { getCurrentYear } from '@/lib/dateUtils';
import { Toaster } from '@/components/ui/sonner';
import PeopleTab from '@/components/PeopleTab';
import ScheduleTab from '@/components/ScheduleTab';
import ManualTab from '@/components/ManualTab';
import DataTab from '@/components/DataTab';
import FolderSelector from '@/components/FolderSelector';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Supported theme types for the application
type Theme = 'light' | 'dark' | 'twilight';

function App() {
  // Get current year - now fixed to current year only
  const currentYear = getCurrentYear();
  
  // Theme state persisted in localStorage (lightweight, doesn't need file storage)
  const [theme, setTheme] = useLocalKV<Theme>('giessplan-theme', 'light');
  
  // Year-specific data - now managed with file storage
  const [yearData, setYearData] = useState<YearData>({
    year: currentYear,
    people: [],
    schedules: [],
    lastModified: new Date().toISOString()
  });
  
  const [dataLoaded, setDataLoaded] = useState(false);
  const [folderSelected, setFolderSelected] = useState(hasDataFolder());
  const [needsFolderReselect, setNeedsFolderReselect] = useState(false);

  // Check if we need to re-request folder access on mount
  useEffect(() => {
    if (hasDataFolder()) {
      // We had a folder before, but the handle is lost (page refresh)
      // Show a message that user needs to re-select
      setNeedsFolderReselect(true);
      setFolderSelected(false);
    }
  }, []);

  // Load data from file when folder is selected
  useEffect(() => {
    const loadData = async () => {
      if (!folderSelected) {
        // No folder selected - use empty defaults and mark as loaded
        setYearData({
          year: currentYear,
          people: [],
          schedules: [],
          lastModified: new Date().toISOString()
        });
        setDataLoaded(true);
        return;
      }

      try {
        console.log('📂 Loading data for year:', currentYear);
        const data = await loadYearDataFromFile(currentYear);
        if (data) {
          console.log('✅ Data loaded successfully:', data);
          setYearData(data);
        } else {
          // No file exists yet, use defaults
          console.log('📝 No existing file, using defaults');
          setYearData({
            year: currentYear,
            people: [],
            schedules: [],
            lastModified: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        // Use defaults on error
        setYearData({
          year: currentYear,
          people: [],
          schedules: [],
          lastModified: new Date().toISOString()
        });
        toast.error('Fehler beim Laden der Daten', {
          description: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      } finally {
        setDataLoaded(true);
      }
    };

    setDataLoaded(false);
    loadData();
  }, [currentYear, folderSelected]);

  // Migrate old schedules to add substitutes field if missing
  useEffect(() => {
    if (yearData && yearData.schedules) {
      let needsMigration = false;
      const migratedSchedules = yearData.schedules.map(schedule => {
        const migratedAssignments = schedule.assignments.map(assignment => {
          if (!assignment.substitutes) {
            needsMigration = true;
            return { ...assignment, substitutes: [] };
          }
          return assignment;
        });
        return { ...schedule, assignments: migratedAssignments };
      });

      if (needsMigration) {
        console.log('Migrating old schedule data to add substitutes field');
        const migratedData = {
          ...yearData,
          schedules: migratedSchedules,
          lastModified: new Date().toISOString()
        };
        setYearData(migratedData);
        // Save migrated data
        if (folderSelected) {
          saveYearDataToFile(migratedData).catch(console.error);
        }
      }
    }
  }, [dataLoaded]); // Run when data is loaded

  // Apply theme class to document root when theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'twilight');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Update year data with partial changes while preserving existing data
  const updateYearData = async (updates: Partial<YearData> | ((current: YearData | null) => Partial<YearData>)) => {
    setYearData((current) => {
      // Resolve updates if it's a function
      const resolvedUpdates = typeof updates === 'function' ? updates(current) : updates;
      
      // Merge updates with current data and update timestamp
      const updatedData = {
        ...current,
        ...resolvedUpdates,
        year: current.year, // Preserve original year
        people: resolvedUpdates.people !== undefined ? resolvedUpdates.people : current.people,
        schedules: resolvedUpdates.schedules !== undefined ? resolvedUpdates.schedules : current.schedules,
        lastModified: new Date().toISOString()
      };
      
      // Save to file asynchronously
      if (folderSelected) {
        console.log('💾 Saving data to file...', {
          people: updatedData.people.length,
          schedules: updatedData.schedules.length,
          year: updatedData.year
        });
        saveYearDataToFile(updatedData)
          .then(() => {
            console.log('✅ Data saved successfully');
          })
          .catch(error => {
            console.error('❌ Failed to save data:', error);
            toast.error('Fehler beim Speichern', {
              description: 'Die Daten konnten nicht gespeichert werden.'
            });
          });
      } else {
        console.warn('⚠️ No folder selected - data not saved to file');
      }
      
      return updatedData;
    });
  };

  // Cycle through available themes in sequence
  const cycleTheme = () => {
    setTheme((currentTheme) => {
      if (currentTheme === 'light') return 'dark';
      if (currentTheme === 'dark') return 'twilight';
      return 'light';
    });
  };

  // Get appropriate icon for current theme
  // Get appropriate icon for current theme
  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={18} />;
    if (theme === 'twilight') return <Sparkles size={18} />;
    return <Sun size={18} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toast notification system */}
      <Toaster />
      
      {/* Application header with title and controls */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Application title and subtitle */}
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                GießPlan System
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Rotkreuz-Institut BBW · Berufsvorbereitung
              </p>
            </div>
            
            {/* Theme toggle and year display */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {getThemeIcon()}
              </Button>
              
              {/* Current year display */}
              <div className="px-4 py-2 rounded-lg border border-input bg-card text-foreground font-medium">
                {currentYear}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with tabbed navigation */}
      <main className="container mx-auto px-6 py-6">
        {/* Folder selector - shown at top */}
        <div className="mb-6">
          <FolderSelector onFolderSelected={() => setFolderSelected(true)} />
        </div>
        
        {/* Show loading state or tabs */}
        {!dataLoaded ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Daten werden geladen...</p>
          </div>
        ) : (
          <Tabs defaultValue="people" className="w-full">
            {/* Tab navigation bar */}
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="people" className="flex items-center gap-2">
                <Users size={18} />
                <span className="hidden sm:inline">Personen</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar size={18} />
                <span className="hidden sm:inline">Zeitplan</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Settings size={18} />
                <span className="hidden sm:inline">Manuell</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database size={18} />
                <span className="hidden sm:inline">Daten</span>
              </TabsTrigger>
            </TabsList>

            {/* People management tab */}
            <TabsContent value="people" className="mt-0">
              <PeopleTab 
                yearData={yearData} 
                updateYearData={updateYearData}
              />
            </TabsContent>

            {/* Schedule generation tab */}
            <TabsContent value="schedule" className="mt-0">
              <ScheduleTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            </TabsContent>

            {/* Manual schedule editing tab */}
            <TabsContent value="manual" className="mt-0">
              <ManualTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            </TabsContent>

            {/* Data import/export tab */}
            <TabsContent value="data" className="mt-0">
              <DataTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default App;