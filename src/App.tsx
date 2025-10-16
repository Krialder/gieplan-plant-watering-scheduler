import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Gear, Database, Moon, Sun, Sparkle } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';
import type { YearData } from '@/types';
import { getCurrentYear } from '@/lib/dateUtils';
import { Toaster } from '@/components/ui/sonner';
import PeopleTab from '@/components/PeopleTab';
import ScheduleTab from '@/components/ScheduleTab';
import ManualTab from '@/components/ManualTab';
import DataTab from '@/components/DataTab';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'twilight';

function App() {
  const currentYear = getCurrentYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [theme, setTheme] = useKV<Theme>('giessplan-theme', 'light');
  
  const [yearData, setYearData] = useKV<YearData>(`giessplan-year-${selectedYear}`, {
    year: selectedYear,
    people: [],
    schedules: [],
    lastModified: new Date().toISOString()
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'twilight');
    if (theme) {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  const updateYearData = (updates: Partial<YearData>) => {
    setYearData((current) => {
      if (!current) {
        return {
          year: selectedYear,
          people: [],
          schedules: [],
          lastModified: new Date().toISOString(),
          ...updates
        };
      }
      return {
        ...current,
        ...updates,
        year: current.year,
        people: updates.people !== undefined ? updates.people : current.people,
        schedules: updates.schedules !== undefined ? updates.schedules : current.schedules,
        lastModified: new Date().toISOString()
      };
    });
  };

  const cycleTheme = () => {
    setTheme((currentTheme) => {
      if (currentTheme === 'light') return 'dark';
      if (currentTheme === 'dark') return 'twilight';
      return 'light';
    });
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon size={18} weight="fill" />;
    if (theme === 'twilight') return <Sparkle size={18} weight="fill" />;
    return <Sun size={18} weight="fill" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                GießPlan System
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Rotkreuz-Institut BBW · Berufsvorbereitung
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={cycleTheme}
                title={`Theme: ${theme}`}
              >
                {getThemeIcon()}
              </Button>
              
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

      <main className="container mx-auto px-6 py-6">
        <Tabs defaultValue="people" className="w-full">
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
              <Gear size={18} />
              <span className="hidden sm:inline">Manuell</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database size={18} />
              <span className="hidden sm:inline">Daten</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="mt-0">
            {yearData && (
              <PeopleTab 
                yearData={yearData} 
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            {yearData && (
              <ScheduleTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-0">
            {yearData && (
              <ManualTab 
                yearData={yearData}
                updateYearData={updateYearData}
              />
            )}
          </TabsContent>

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