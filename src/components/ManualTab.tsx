/**
 * ManualTab.tsx - Manual Schedule Management Component
 * 
 * This component provides an interface for manually editing and adjusting watering schedules.
 * Functions:
 * - Edit individual week assignments
 * - Replace people in specific weeks
 * - Mark weeks as emergency with reason
 * - Add comments to assignments
 * - View and manage emergency weeks
 */

import { useState } from 'react';
import type { YearData, WeekAssignment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, MessageSquare, RefreshCw, Edit, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  replacePersonInWeek, 
  updateWeekAssignment, 
  addWeekComment, 
  markWeekAsEmergency, 
  clearEmergencyFlag,
  getEmergencyWeeks,
  swapPeopleGlobally,
  swapPeopleInTimeframe,
  removePersonFromTimeframe
} from '@/lib/scheduleEngine';
import { formatDateGerman, parseDate, getWeekNumber } from '@/lib/dateUtils';

interface ManualTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData> | ((current: YearData | null) => Partial<YearData>)) => void;
}

export default function ManualTab({ yearData, updateYearData }: ManualTabProps) {
  // State for person replacement
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [oldPersonId, setOldPersonId] = useState<string>('');
  const [newPersonId, setNewPersonId] = useState<string>('');
  
  // State for comments
  const [commentWeek, setCommentWeek] = useState<string>('');
  const [commentText, setCommentText] = useState<string>('');
  
  // State for emergency marking
  const [emergencyWeek, setEmergencyWeek] = useState<string>('');
  const [emergencyReason, setEmergencyReason] = useState<string>('');
  
  // State for global swap
  const [swapPerson1, setSwapPerson1] = useState<string>('');
  const [swapPerson2, setSwapPerson2] = useState<string>('');
  const [swapStartDate, setSwapStartDate] = useState<string>('');
  const [swapEndDate, setSwapEndDate] = useState<string>('');
  const [useTimeframe, setUseTimeframe] = useState<boolean>(false);

  // Get all assignments across all schedules
  const allAssignments: (WeekAssignment & { scheduleId: string })[] = [];
  yearData.schedules.forEach(schedule => {
    schedule.assignments.forEach(assignment => {
      allAssignments.push({ ...assignment, scheduleId: schedule.id });
    });
  });
  
  // Sort by date
  allAssignments.sort((a, b) => 
    new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
  );

  // Get emergency weeks
  const emergencyWeeks = getEmergencyWeeks(yearData.schedules);

  // Find the selected week's assignment to show current people
  const selectedWeekAssignment = selectedWeek 
    ? allAssignments.find(a => a.weekStartDate === selectedWeek)
    : null;

  // Get people assigned to selected week
  const peopleInSelectedWeek = selectedWeekAssignment
    ? selectedWeekAssignment.assignedPeople.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  // Get substitutes for selected week
  const substitutesInSelectedWeek = selectedWeekAssignment?.substitutes
    ? selectedWeekAssignment.substitutes.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  // Find comment week assignment
  const commentWeekAssignment = commentWeek
    ? allAssignments.find(a => a.weekStartDate === commentWeek)
    : null;

  const peopleInCommentWeek = commentWeekAssignment
    ? commentWeekAssignment.assignedPeople.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  const substitutesInCommentWeek = commentWeekAssignment?.substitutes
    ? commentWeekAssignment.substitutes.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  // Find emergency week assignment
  const emergencyWeekAssignment = emergencyWeek
    ? allAssignments.find(a => a.weekStartDate === emergencyWeek)
    : null;

  const peopleInEmergencyWeek = emergencyWeekAssignment
    ? emergencyWeekAssignment.assignedPeople.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  const substitutesInEmergencyWeek = emergencyWeekAssignment?.substitutes
    ? emergencyWeekAssignment.substitutes.map(id => 
        yearData.people.find(p => p.id === id)
      ).filter(Boolean)
    : [];

  // Handle week selection change
  const handleWeekChange = (weekDate: string) => {
    setSelectedWeek(weekDate);
    setOldPersonId(''); // Reset old person selection
    setNewPersonId(''); // Reset new person selection
  };

  // Handle person replacement in specific week
  const handleReplacePerson = () => {
    if (!selectedWeek || !oldPersonId || !newPersonId) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    const updatedSchedules = replacePersonInWeek(
      yearData.schedules,
      selectedWeek,
      oldPersonId,
      newPersonId
    );

    updateYearData({ schedules: updatedSchedules });
    
    const oldPerson = yearData.people.find(p => p.id === oldPersonId);
    const newPerson = yearData.people.find(p => p.id === newPersonId);
    
    toast.success(`${oldPerson?.name} durch ${newPerson?.name} ersetzt`);
    
    // Reset form
    setSelectedWeek('');
    setOldPersonId('');
    setNewPersonId('');
  };

  // Handle adding comment to week
  const handleAddComment = () => {
    if (!commentWeek || !commentText.trim()) {
      toast.error('Bitte Woche auswählen und Kommentar eingeben');
      return;
    }

    const updatedSchedules = addWeekComment(
      yearData.schedules,
      commentWeek,
      commentText.trim()
    );

    updateYearData({ schedules: updatedSchedules });
    toast.success('Kommentar hinzugefügt');
    
    // Reset form
    setCommentWeek('');
    setCommentText('');
  };

  // Handle marking week as emergency
  const handleMarkEmergency = () => {
    if (!emergencyWeek) {
      toast.error('Bitte Woche auswählen');
      return;
    }

    const updatedSchedules = markWeekAsEmergency(
      yearData.schedules,
      emergencyWeek,
      emergencyReason.trim() || undefined
    );

    updateYearData({ schedules: updatedSchedules });
    toast.warning('Woche als Notfall markiert');
    
    // Reset form
    setEmergencyWeek('');
    setEmergencyReason('');
  };

  // Handle clearing emergency flag
  const handleClearEmergency = (weekStartDate: string) => {
    const updatedSchedules = clearEmergencyFlag(yearData.schedules, weekStartDate);
    updateYearData({ schedules: updatedSchedules });
    toast.success('Notfall-Markierung entfernt');
  };

  // Handle global swap
  const handleGlobalSwap = () => {
    if (!swapPerson1 || !swapPerson2) {
      toast.error('Bitte beide Personen auswählen');
      return;
    }

    if (swapPerson1 === swapPerson2) {
      toast.error('Bitte unterschiedliche Personen auswählen');
      return;
    }

    let updatedSchedules;
    
    if (useTimeframe) {
      // Use timeframe-based swap
      updatedSchedules = swapPeopleInTimeframe(
        yearData.schedules,
        swapPerson1,
        swapPerson2,
        swapStartDate || undefined,
        swapEndDate || undefined
      );
    } else {
      // Use global swap
      updatedSchedules = swapPeopleGlobally(
        yearData.schedules,
        swapPerson1,
        swapPerson2
      );
    }

    updateYearData({ schedules: updatedSchedules });
    
    const person1 = yearData.people.find(p => p.id === swapPerson1);
    const person2 = yearData.people.find(p => p.id === swapPerson2);
    
    if (useTimeframe) {
      toast.success(`${person1?.name} und ${person2?.name} im Zeitraum getauscht`);
    } else {
      toast.success(`${person1?.name} und ${person2?.name} getauscht`);
    }
    
    // Reset form
    setSwapPerson1('');
    setSwapPerson2('');
    setSwapStartDate('');
    setSwapEndDate('');
  };

  // Handle person removal
  const handleRemovePerson = () => {
    if (!swapPerson1) {
      toast.error('Bitte Person auswählen');
      return;
    }

    const updatedSchedules = removePersonFromTimeframe(
      yearData.schedules,
      swapPerson1,
      swapStartDate || undefined,
      swapEndDate || undefined
    );

    updateYearData({ schedules: updatedSchedules });
    
    const person = yearData.people.find(p => p.id === swapPerson1);
    
    if (useTimeframe && (swapStartDate || swapEndDate)) {
      toast.success(`${person?.name} aus Zeitraum entfernt`);
    } else {
      toast.success(`${person?.name} aus allen Zuweisungen entfernt`);
    }
    
    // Reset form
    setSwapPerson1('');
    setSwapStartDate('');
    setSwapEndDate('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manuelle Verwaltung</CardTitle>
          <CardDescription>
            Zeitpläne manuell anpassen und Zuweisungen bearbeiten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Person in Woche ersetzen */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              <h3 className="font-semibold">Person in Woche ersetzen</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Woche auswählen</Label>
                <Select value={selectedWeek} onValueChange={handleWeekChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Woche wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAssignments.map(assignment => {
                      const weekDate = parseDate(assignment.weekStartDate);
                      const weekNum = getWeekNumber(weekDate);
                      return (
                        <SelectItem key={assignment.weekStartDate} value={assignment.weekStartDate}>
                          KW {weekNum} - {formatDateGerman(weekDate)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Show current people in selected week */}
              {selectedWeek && peopleInSelectedWeek.length > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Aktuell zugewiesen:</p>
                  <div className="flex flex-wrap gap-2">
                    {peopleInSelectedWeek.map((person) => (
                      <Badge key={person!.id} variant="secondary">
                        {person!.name}
                      </Badge>
                    ))}
                    {substitutesInSelectedWeek.length > 0 && (
                      <>
                        {substitutesInSelectedWeek.map((person) => (
                          <Badge key={person!.id} variant="outline">
                            {person!.name} (Ersatz)
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alte Person (ersetzen)</Label>
                  <Select 
                    value={oldPersonId} 
                    onValueChange={setOldPersonId}
                    disabled={!selectedWeek}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedWeek ? "Person wählen..." : "Erst Woche wählen"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedWeek && selectedWeekAssignment && 
                        selectedWeekAssignment.assignedPeople.map(personId => {
                          const person = yearData.people.find(p => p.id === personId);
                          return person ? (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ) : null;
                        })
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Neue Person</Label>
                  <Select 
                    value={newPersonId} 
                    onValueChange={setNewPersonId}
                    disabled={!selectedWeek}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedWeek ? "Person wählen..." : "Erst Woche wählen"} />
                    </SelectTrigger>
                    <SelectContent>
                      {yearData.people
                        .filter(p => !selectedWeekAssignment?.assignedPeople.includes(p.id))
                        .map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button onClick={handleReplacePerson} className="w-full" disabled={!selectedWeek || !oldPersonId || !newPersonId}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Person ersetzen
            </Button>
          </div>

          <Separator />

          {/* Personen global tauschen */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Personen global tauschen oder entfernen</h3>
            </div>
            
            {/* Timeframe option */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="useTimeframe" 
                checked={useTimeframe}
                onCheckedChange={(checked) => setUseTimeframe(checked as boolean)}
              />
              <Label 
                htmlFor="useTimeframe" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Nur in bestimmtem Zeitraum
              </Label>
            </div>

            {/* Timeframe inputs */}
            {useTimeframe && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label>Von (optional)</Label>
                  <Input
                    type="date"
                    value={swapStartDate}
                    onChange={(e) => setSwapStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bis (optional)</Label>
                  <Input
                    type="date"
                    value={swapEndDate}
                    onChange={(e) => setSwapEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Person 1</Label>
                <Select value={swapPerson1} onValueChange={setSwapPerson1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Person wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {yearData.people.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Person 2 (optional für Löschen)</Label>
                <Select value={swapPerson2} onValueChange={setSwapPerson2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Person wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {yearData.people.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleGlobalSwap} 
                variant="secondary" 
                className="w-full"
                disabled={!swapPerson1 || !swapPerson2}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {useTimeframe ? 'Im Zeitraum tauschen' : 'In allen Zeitplänen tauschen'}
              </Button>
              <Button 
                onClick={handleRemovePerson} 
                variant="destructive" 
                className="w-full"
                disabled={!swapPerson1}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {useTimeframe ? 'Aus Zeitraum entfernen' : 'Aus allen Zeitplänen entfernen'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Kommentar hinzufügen */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Kommentar zu Woche hinzufügen</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Woche auswählen</Label>
                <Select value={commentWeek} onValueChange={setCommentWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Woche wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAssignments.map(assignment => {
                      const weekDate = parseDate(assignment.weekStartDate);
                      const weekNum = getWeekNumber(weekDate);
                      return (
                        <SelectItem key={assignment.weekStartDate} value={assignment.weekStartDate}>
                          KW {weekNum} - {formatDateGerman(weekDate)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Show current people in comment week */}
              {commentWeek && peopleInCommentWeek.length > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Aktuell zugewiesen:</p>
                  <div className="flex flex-wrap gap-2">
                    {peopleInCommentWeek.map((person) => (
                      <Badge key={person!.id} variant="secondary">
                        {person!.name}
                      </Badge>
                    ))}
                    {substitutesInCommentWeek.length > 0 && (
                      <>
                        {substitutesInCommentWeek.map((person) => (
                          <Badge key={person!.id} variant="outline">
                            {person!.name} (Ersatz)
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Kommentar</Label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Kommentar eingeben..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAddComment} className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Kommentar hinzufügen
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notfall markieren */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Woche als Notfall markieren</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Woche auswählen</Label>
                <Select value={emergencyWeek} onValueChange={setEmergencyWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Woche wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAssignments.map(assignment => {
                      const weekDate = parseDate(assignment.weekStartDate);
                      const weekNum = getWeekNumber(weekDate);
                      return (
                        <SelectItem key={assignment.weekStartDate} value={assignment.weekStartDate}>
                          KW {weekNum} - {formatDateGerman(weekDate)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Show current people in emergency week */}
              {emergencyWeek && peopleInEmergencyWeek.length > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Aktuell zugewiesen:</p>
                  <div className="flex flex-wrap gap-2">
                    {peopleInEmergencyWeek.map((person) => (
                      <Badge key={person!.id} variant="secondary">
                        {person!.name}
                      </Badge>
                    ))}
                    {substitutesInEmergencyWeek.length > 0 && (
                      <>
                        {substitutesInEmergencyWeek.map((person) => (
                          <Badge key={person!.id} variant="outline">
                            {person!.name} (Ersatz)
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Grund (optional)</Label>
                <Input
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="z.B. Krankheit, Urlaub..."
                />
              </div>
              <Button onClick={handleMarkEmergency} variant="destructive" className="w-full">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Als Notfall markieren
              </Button>
            </div>
          </div>

          {/* Emergency Weeks List */}
          {emergencyWeeks.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Aktive Notfall-Wochen ({emergencyWeeks.length})</h3>
                <div className="space-y-2">
                  {emergencyWeeks.map(week => {
                    const weekDate = parseDate(week.weekStartDate);
                    const weekNum = getWeekNumber(weekDate);
                    const reason = (week as any).emergencyReason;
                    
                    return (
                      <Alert key={week.weekStartDate} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <div>
                            <strong>KW {weekNum}</strong> - {formatDateGerman(weekDate)}
                            {reason && <div className="text-sm mt-1">{reason}</div>}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearEmergency(week.weekStartDate)}
                          >
                            Entfernen
                          </Button>
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
