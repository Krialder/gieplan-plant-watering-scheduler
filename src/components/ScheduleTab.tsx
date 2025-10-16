import { useState } from 'react';
import type { YearData, Schedule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash, Download } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { generateSchedule } from '@/lib/scheduleEngine';
import { getTodayString, formatDateGerman } from '@/lib/dateUtils';
import { exportScheduleToCSV, downloadCSV } from '@/lib/exportUtils';

interface ScheduleTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData>) => void;
}

export default function ScheduleTab({ yearData, updateYearData }: ScheduleTabProps) {
  const [startDate, setStartDate] = useState(getTodayString());
  const [weeks, setWeeks] = useState(6);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    
    const result = generateSchedule({
      startDate,
      weeks,
      people: yearData.people,
      existingSchedules: yearData.schedules,
      enforceNoConsecutive: true,
      requireMentor: true
    });
    
    if (!result.success) {
      toast.error('Fehler beim Erstellen des Zeitplans', {
        description: result.errors.join(', ')
      });
      setGenerating(false);
      return;
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        toast.warning(warning);
      });
    }
    
    if (result.schedule) {
      updateYearData({
        schedules: [...yearData.schedules, result.schedule]
      });
      toast.success('Zeitplan erfolgreich erstellt');
    }
    
    setGenerating(false);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Zeitplan wirklich löschen?')) {
      updateYearData({
        schedules: yearData.schedules.filter(s => s.id !== scheduleId)
      });
      toast.success('Zeitplan gelöscht');
    }
  };

  const handleExportSchedule = (schedule: Schedule) => {
    const csv = exportScheduleToCSV(schedule, yearData.people);
    const filename = `giessplan-${schedule.startDate}.csv`;
    downloadCSV(csv, filename);
    toast.success('Zeitplan exportiert');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zeitplan generieren</CardTitle>
          <CardDescription>
            Erstellen Sie einen fairen 6-Wochen-Gießplan basierend auf zeitproportionaler Fairness
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
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
          
          {yearData.people.length === 0 && (
            <Alert>
              <AlertDescription>
                Bitte fügen Sie zuerst Personen hinzu, bevor Sie einen Zeitplan erstellen.
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleGenerate}
            disabled={yearData.people.length === 0 || generating}
            className="w-full md:w-auto flex items-center gap-2"
          >
            <Calendar size={18} />
            {generating ? 'Generiere...' : 'Zeitplan generieren'}
          </Button>
        </CardContent>
      </Card>

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
                
                <div className="space-y-2">
                  {schedule.assignments.map(assignment => {
                    const person1 = yearData.people.find(p => p.id === assignment.assignedPeople[0]);
                    const person2 = yearData.people.find(p => p.id === assignment.assignedPeople[1]);
                    
                    return (
                      <div
                        key={assignment.weekNumber}
                        className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">Woche {assignment.weekNumber}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateGerman(new Date(assignment.weekStartDate))}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{person1?.name || 'Unbekannt'}</span>
                            {person2 && (
                              <>
                                <span className="text-muted-foreground">+</span>
                                <span className="text-sm">{person2.name}</span>
                              </>
                            )}
                          </div>
                          
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
