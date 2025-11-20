/**
 * ScheduleTab.tsx - Schedule Generation Component
 * 
 * This component handles the automatic generation of watering schedules based on fairness algorithms.
 * Functions:
 * - Generate fair 6-week watering schedules with configurable parameters
 * - Display existing schedules with week-by-week assignments
 * - Export schedules to CSV format for external use
 * - Delete unwanted schedules with confirmation
 * - Show warnings when mentor requirements cannot be met
 * - Validate input parameters and show appropriate error messages
 * - Ensure time-proportional fairness in assignment distribution
 */

import { useState, useRef } from 'react';
import type { YearData, Schedule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash, Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getTodayString, formatDateGerman, getNextMonday, parseDate, formatDate, getWeekNumber } from '@/lib/dateUtils';
import { exportScheduleToCSV, downloadCSV } from '@/lib/exportUtils';
import { isPersonActive } from '@/lib/fairnessEngine';

interface ScheduleTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData> | ((current: YearData | null) => Partial<YearData>)) => void;
}

export default function ScheduleTab({ yearData, updateYearData }: ScheduleTabProps) {
  // Form state for schedule generation parameters
  const [startDate, setStartDate] = useState(getTodayString());
  const [weeks, setWeeks] = useState(6);
  const [includeFutureArrivals, setIncludeFutureArrivals] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Use a ref for immediate lock (not dependent on React state updates)
  const generatingRef = useRef(false);

  // Calculate the next Monday from the selected date and show info about adjustment
  const selectedDate = parseDate(startDate);
  const nextMonday = getNextMonday(selectedDate);
  const nextMondayString = formatDate(nextMonday);
  const needsAdjustment = startDate !== nextMondayString;

  // Calculate how many people are active on the next Monday
  const activePeopleCount = yearData.people.filter(p => {
    try {
      return isPersonActive(p, nextMondayString);
    } catch (error) {
      return false;
    }
  }).length;

  // Generate a new schedule with specified parameters
  const handleGenerate = () => {
    // Prevent multiple simultaneous generations using both state and ref
    if (generating || generatingRef.current) {
      console.log('Generation already in progress, ignoring duplicate call');
      return;
    }
    
    generatingRef.current = true;
    setGenerating(true);
    
    try {
      console.log('Generating schedule with:');
      console.log('- Start date:', startDate);
      console.log('- Next Monday:', nextMondayString);
      console.log('- Weeks:', weeks);
      console.log('- Total people:', yearData.people.length);
      console.log('- Active people count:', activePeopleCount);
      console.log('- Existing schedules:', yearData.schedules.length);
      console.log('- People data:', yearData.people);
      
      const result = generateSchedule({
        startDate: nextMondayString, // Use next Monday instead of selected date
        weeks,
        people: yearData.people,
        existingSchedules: yearData.schedules,
        enforceNoConsecutive: true, // Prevent consecutive assignments
        requireMentor: true, // Ensure at least one experienced person per week
        includeFutureArrivals // Include people with future arrival dates if enabled
      });
      
      console.log('Generation result:', result);
      
      // Handle generation errors
      if (!result.success) {
        console.error('Schedule generation failed:', result.errors);
        toast.error('Fehler beim Erstellen des Zeitplans', {
          description: result.errors.join(', ')
        });
        return;
      }
      
      // Show warnings if any constraints couldn't be perfectly met
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }
      
      // Save the generated schedule and updated people (with virtual history)
      if (result.schedule) {
        updateYearData((current) => ({
          schedules: [...(current?.schedules || []), result.schedule!],
          people: result.updatedPeople || current?.people || []
        }));
        toast.success('Zeitplan erfolgreich erstellt');
      }
    } catch (error) {
      console.error('Exception during schedule generation:', error);
      toast.error('Fehler beim Erstellen des Zeitplans', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    } finally {
      setGenerating(false);
      generatingRef.current = false;
    }
  };

  // Delete a schedule with confirmation
  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Zeitplan wirklich löschen?')) {
      const updatedSchedules = yearData.schedules.filter(s => s.id !== scheduleId);
      
      updateYearData({
        schedules: updatedSchedules
      });
      toast.success('Zeitplan gelöscht');
    }
  };

  // Export schedule as CSV file
  const handleExportSchedule = (schedule: Schedule) => {
    const csv = exportScheduleToCSV(schedule, yearData.people);
    const filename = `giessplan-${schedule.startDate}.csv`;
    downloadCSV(csv, filename);
    toast.success('Zeitplan exportiert');
  };

  return (
    <div className="space-y-6">
      {/* Schedule generation form */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitplan generieren</CardTitle>
          <CardDescription>
            Erstellen Sie einen fairen 6-Wochen-Gießplan basierend auf zeitproportionaler Fairness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input parameters grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {needsAdjustment && (
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ Startet am nächsten Montag ({formatDateGerman(nextMonday)})
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="weeks">Anzahl Wochen</Label>
              <Input
                id="weeks"
                type="number"
                min="1"
                max="12"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              />
            </div>
          </div>
          
          {/* Option to include future arrivals */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeFutureArrivals"
              checked={includeFutureArrivals}
              onChange={(e) => setIncludeFutureArrivals(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="includeFutureArrivals" className="text-sm font-normal cursor-pointer">
              Personen mit zukünftigen Ankunftsdaten einbeziehen
            </Label>
          </div>
          
          {/* Warning when no people are available */}
          {yearData.people.length === 0 && (
            <Alert>
              <AlertDescription>
                Bitte fügen Sie zuerst Personen hinzu, bevor Sie einen Zeitplan erstellen.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Warning when people exist but none are active on selected date */}
          {yearData.people.length > 0 && activePeopleCount === 0 && (
            <Alert>
              <AlertDescription>
                Es sind keine Personen für das gewählte Startdatum ({formatDateGerman(new Date(startDate))}) aktiv. 
                Bitte wählen Sie ein anderes Datum oder stellen Sie sicher, dass die Ankunftsdaten der Personen korrekt sind.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Info about active people */}
          {activePeopleCount > 0 && (
            <Alert>
              <AlertDescription>
                {activePeopleCount} {activePeopleCount === 1 ? 'Person ist' : 'Personen sind'} für das gewählte Startdatum aktiv.
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGenerate}
            disabled={yearData.people.length === 0 || activePeopleCount === 0 || generating}
            className="w-full md:w-auto flex items-center gap-2"
          >
            <Calendar size={18} />
            {generating ? 'Generiere...' : 'Zeitplan generieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Display existing schedules */}
      {yearData.schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gespeicherte Zeitpläne</CardTitle>
            <CardDescription>
              Alle generierten Zeitpläne für {yearData.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {yearData.schedules.map(schedule => (
              <div
                key={schedule.id}
                className="border border-border rounded-lg p-4"
              >
                {/* Schedule header with metadata and actions */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Start: {formatDateGerman(new Date(schedule.startDate))}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {schedule.weeks} Wochen · Erstellt am {formatDateGerman(new Date(schedule.createdAt))}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportSchedule(schedule)}
                    >
                      <Download size={16} className="mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
                
                {/* Weekly assignment details */}
                <div className="space-y-2">
                  {schedule.assignments.map(assignment => {
                    const person1 = yearData.people.find(p => p.id === assignment.assignedPeople[0]);
                    const person2 = yearData.people.find(p => p.id === assignment.assignedPeople[1]);
                    const substitute1 = (assignment.substitutes && assignment.substitutes[0]) ? yearData.people.find(p => p.id === assignment.substitutes![0]) : null;
                    const substitute2 = (assignment.substitutes && assignment.substitutes[1]) ? yearData.people.find(p => p.id === assignment.substitutes![1]) : null;
                    
                    // Calculate calendar week number
                    const weekDate = parseDate(assignment.weekStartDate);
                    const calendarWeek = getWeekNumber(weekDate);
                    
                    return (
                      <div
                        key={assignment.weekNumber}
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">KW {calendarWeek}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateGerman(new Date(assignment.weekStartDate))}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{person1?.name || 'Unbekannt'}</span>
                            {person2 && (
                              <>
                                <span className="text-muted-foreground">+</span>
                                <span className="text-sm font-medium">{person2.name}</span>
                              </>
                            )}
                            
                            {/* Show substitutes if available */}
                            {(substitute1 || substitute2) && (
                              <>
                                <span className="text-muted-foreground mx-2">|</span>
                                <span className="text-xs text-muted-foreground">Ersatz:</span>
                                {substitute1 && (
                                  <span className="text-sm text-muted-foreground">{substitute1.name}</span>
                                )}
                                {substitute2 && (
                                  <>
                                    <span className="text-muted-foreground">,</span>
                                    <span className="text-sm text-muted-foreground">{substitute2.name}</span>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Warning badge for weeks without mentor */}
                          {!assignment.hasMentor && (
                            <Badge variant="destructive">Kein Mentor</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
