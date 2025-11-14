/**
 * PeopleTab.tsx - People Management Component
 * 
 * This component handles the management of people (participants) in the watering schedule system.
 * Functions:
 * - Display list of all participants with their status and statistics
 * - Add new participants via dialog interface
 * - Mark participants as departed or returned
 * - Delete participants with confirmation
 * - Show fairness scores and assignment statistics
 * - Handle active/inactive status based on arrival/departure dates
 * - Provide visual indicators for experience level and activity status
 */

import { useState } from 'react';
import type { YearData, Person } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import AddPersonDialog from '@/components/dialogs/AddPersonDialog';
import { deletePerson, markPersonDeparture, markPersonReturn } from '@/lib/personManager';
import { isPersonActive, calculateAllFairnessScores } from '@/lib/fairnessEngine';
import { handlePersonDeletion } from '@/lib/scheduleEngine';
import { formatDateGerman } from '@/lib/dateUtils';

interface PeopleTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData> | ((current: YearData | null) => Partial<YearData>)) => void;
}

export default function PeopleTab({ yearData, updateYearData }: PeopleTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Calculate fairness scores for all people to display statistics
  const fairnessCalculations = calculateAllFairnessScores(yearData.people, yearData.schedules, false);

  // Handle adding a new person to the system
  const handleAddPerson = (person: Person) => {
    updateYearData({
      people: [...yearData.people, person]
    });
    toast.success(`${person.name} wurde hinzugefügt`);
    setShowAddDialog(false);
  };

  // Handle removing a person with confirmation dialog
  const handleRemovePerson = (personId: string) => {
    const person = yearData.people.find(p => p.id === personId);
    if (!person) return;

    if (confirm(`${person.name} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      // Delete person from people list
      const updatedPeople = deletePerson(yearData.people, personId);
      
      // Fill gaps in schedules using the mathematical gap-filling algorithm
      const updatedSchedules = handlePersonDeletion(
        yearData.schedules,
        personId,
        updatedPeople
      );
      
      updateYearData({
        people: updatedPeople,
        schedules: updatedSchedules
      });
      toast.success(`${person.name} wurde gelöscht und Lücken wurden automatisch gefüllt`);
    }
  };

  // Mark a person as departed with date and optional reason
  const handleMarkDeparture = (personId: string) => {
    const person = yearData.people.find(p => p.id === personId);
    if (!person) return;

    const departureDate = prompt('Enddatum (JJJJ-MM-TT):');
    if (!departureDate) return;

    const reason = prompt('Grund (optional):') || undefined;

    const updatedPerson = markPersonDeparture(person, departureDate, reason);
    updateYearData({
      people: yearData.people.map(p => p.id === personId ? updatedPerson : p)
    });
    toast.success(`${person.name} als ausgeschieden markiert`);
  };

  // Mark a person as returned with return date
  const handleMarkReturn = (personId: string) => {
    const person = yearData.people.find(p => p.id === personId);
    if (!person) return;

    const returnDate = prompt('Rückkehrdatum (JJJJ-MM-TT):');
    if (!returnDate) return;

    const updatedPerson = markPersonReturn(person, returnDate);
    updateYearData({
      people: yearData.people.map(p => p.id === personId ? updatedPerson : p)
    });
    toast.success(`${person.name} als zurückgekehrt markiert`);
  };

  // Get fairness calculation data for a specific person
  const getFairnessForPerson = (personId: string) => {
    return fairnessCalculations.find(calc => calc.personId === personId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personenverwaltung</CardTitle>
              <CardDescription>
                Teilnehmer des Berufsvorbereitungsprogramms verwalten
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
              <UserPlus size={18} />
              Person hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Empty state when no people are added yet */}
          {yearData.people.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Noch keine Personen hinzugefügt
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <UserPlus size={18} className="mr-2" />
                Erste Person hinzufügen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Render each person with their details and actions */}
              {yearData.people.map(person => {
                const fairness = getFairnessForPerson(person.id);
                const active = isPersonActive(person);
                
                return (
                  <div
                    key={person.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Person name and status badges */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{person.name}</h3>
                          <Badge variant={active ? 'default' : 'secondary'}>
                            {active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                          <Badge variant={person.experienceLevel === 'experienced' ? 'default' : 'outline'}>
                            {person.experienceLevel === 'experienced' ? 'Erfahren' : 'Neu'}
                          </Badge>
                        </div>
                        
                        {/* Person statistics grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Ankunft</p>
                            <p className="font-medium">{formatDateGerman(new Date(person.arrivalDate))}</p>
                          </div>
                          
                          {/* Show fairness statistics if available */}
                          {fairness && (
                            <>
                              <div>
                                <p className="text-muted-foreground">Tage anwesend</p>
                                <p className="font-medium">{fairness.daysPresent}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Zuweisungen</p>
                                <p className="font-medium">{fairness.totalAssignments}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Fairness-Score</p>
                                <p className={`font-medium ${
                                  fairness.fairnessScore > 1.1 ? 'text-destructive' :
                                  fairness.fairnessScore < 0.9 ? 'text-accent' :
                                  'text-foreground'
                                }`}>
                                  {fairness.fairnessScore.toFixed(2)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons for person management */}
                      <div className="flex items-center gap-2">
                        {active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkDeparture(person.id)}
                          >
                            <UserMinus size={16} className="mr-1" />
                            Ausscheiden
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkReturn(person.id)}
                          >
                            <Undo2 size={16} className="mr-1" />
                            Rückkehr
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemovePerson(person.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding new people */}
      <AddPersonDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddPerson}
        existingPeople={yearData.people}
      />
    </div>
  );
}
