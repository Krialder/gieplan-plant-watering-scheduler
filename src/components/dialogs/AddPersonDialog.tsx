import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Person } from '@/types';
import { createPerson, normalizeGermanName, validatePersonData } from '@/lib/personManager';
import { getTodayString } from '@/lib/dateUtils';

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (person: Person) => void;
  existingPeople: Person[];
}

export default function AddPersonDialog({ open, onOpenChange, onAdd, existingPeople }: AddPersonDialogProps) {
  const [name, setName] = useState('');
  const [arrivalDate, setArrivalDate] = useState(getTodayString());
  const [expectedDepartureDate, setExpectedDepartureDate] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedName = normalizeGermanName(name);
    
    const validation = validatePersonData({
      name: normalizedName,
      arrivalDate,
      expectedDepartureDate: expectedDepartureDate || null
    });
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    const nameExists = existingPeople.some(p => 
      p.name.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (nameExists) {
      setErrors(['Eine Person mit diesem Namen existiert bereits']);
      return;
    }
    
    const person = createPerson(
      normalizedName,
      arrivalDate,
      expectedDepartureDate || null
    );
    
    onAdd(person);
    
    setName('');
    setArrivalDate(getTodayString());
    setExpectedDepartureDate('');
    setErrors([]);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setErrors([]);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Person hinzufügen</DialogTitle>
          <DialogDescription>
            Neue Person zum Berufsvorbereitungsprogramm hinzufügen
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="arrivalDate">Ankunftsdatum *</Label>
            <Input
              id="arrivalDate"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="expectedDepartureDate">Erwartetes Enddatum (optional)</Label>
            <Input
              id="expectedDepartureDate"
              type="date"
              value={expectedDepartureDate}
              onChange={(e) => setExpectedDepartureDate(e.target.value)}
            />
          </div>
          
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">Hinzufügen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
