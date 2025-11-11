/**
 * App.tsx - Main Application Component
 * 
 * This is the root component of the GießPlan (Watering Schedule) system for Rotkreuz-Institut BBW.
 * Functions:
 * - Manages application state including selected year and theme
 * - Provides tabbed navigation between main features (People, Schedule, Manual, Data)
 * - Handles theme switching (light, dark, twilight)
 * - Manages year data persistence using localStorage
 * - Renders header with application title and controls
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Settings, Database, Moon, Sun, Sparkles } from 'lucide-react';
import { useLocalKV } from '@/lib/storage';
import type { YearData } from '@/types';
import { getCurrentYear } from '@/lib/dateUtils';
import { Toaster } from '@/components/ui/sonner';
import PeopleTab from '@/components/PeopleTab';
import ScheduleTab from '@/components/ScheduleTab';
import ManualTab from '@/components/ManualTab';
import DataTab from '@/components/DataTab';
import { Button } from '@/components/ui/button';

// Supported theme types for the application
type Theme = 'light' | 'dark' | 'twilight';

function App() {
  // Get current year and set as default selection
  const currentYear = getCurrentYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Theme state persisted in localStorage
  const [theme, setTheme] = useLocalKV<Theme>('giessplan-theme', 'light');
  
  // Year-specific data persisted in localStorage with unique key per year
  const [yearData, setYearData] = useLocalKV<YearData>(`giessplan-year-${selectedYear}`, {
    year: selectedYear,
    people: [],
    schedules: [],
    lastModified: new Date().toISOString()
  });

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
        setYearData(prev => ({
          ...prev!,
          schedules: migratedSchedules,
          lastModified: new Date().toISOString()
        }));
      }
    }
  }, [selectedYear]); // Run when year changes

  // Apply theme class to document root when theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'twilight');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Update year data with partial changes while preserving existing data
  const updateYearData = (updates: Partial<YearData>) => {
    setYearData((current) => {
      // Initialize with defaults if no current data
      if (!current) {
        return {
          year: selectedYear,
          people: [],
          schedules: [],
          lastModified: new Date().toISOString(),
          ...updates
        };
      }
      // Merge updates with current data and update timestamp
      return {
        ...current,
        ...updates,
        year: current.year, // Preserve original year
        people: updates.people !== undefined ? updates.people : current.people,
        schedules: updates.schedules !== undefined ? updates.schedules : current.schedules,
        lastModified: new Date().toISOString()
      };
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
            
            {/* Theme toggle and year selection controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {getThemeIcon()}
              </Button>
              
              {/* Year selection dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 rounded-lg border border-input bg-background text-foreground font-medium"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with tabbed navigation */}
      <main className="container mx-auto px-6 py-6">
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
            {yearData && (
              <PeopleTab 
                yearData={yearData} 
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

          {/* Schedule generation tab */}
          <TabsContent value="schedule" className="mt-0">
            {yearData && (
              <ScheduleTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

          {/* Manual schedule editing tab */}
          <TabsContent value="manual" className="mt-0">
            {yearData && (
              <ManualTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

          {/* Data import/export tab */}
          <TabsContent value="data" className="mt-0">
            {yearData && (
              <DataTab 
                yearData={yearData}
                updateYearData={updateYearData}
                selectedYear={selectedYear}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;