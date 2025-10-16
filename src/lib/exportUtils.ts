import type { Person, Schedule, YearData } from '@/types';
import { formatDateGerman } from './dateUtils';
import { isPersonActive } from './fairnessEngine';

export function generateCSV(data: string[][], includeHeader: boolean = true): string {
  return data
    .map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');
}

export function exportPeopleToCSV(people: Person[]): string {
  const headers = [
    'Name',
    'Ankunftsdatum',
    'Erwartetes Enddatum',
    'Tatsächliches Enddatum',
    'Status',
    'Erfahrungslevel',
    'Fairness-Score',
    'Zuweisungen pro Tag'
  ];
  
  const rows = people.map(person => [
    person.name,
    formatDateGerman(new Date(person.arrivalDate)),
    person.expectedDepartureDate ? formatDateGerman(new Date(person.expectedDepartureDate)) : '-',
    person.actualDepartureDate ? formatDateGerman(new Date(person.actualDepartureDate)) : '-',
    isPersonActive(person) ? 'Aktiv' : 'Inaktiv',
    person.experienceLevel === 'experienced' ? 'Erfahren' : 'Neu',
    person.fairnessMetrics.temporalFairnessScore.toFixed(2),
    person.fairnessMetrics.assignmentsPerDayPresent.toFixed(4)
  ]);
  
  return '\uFEFF' + generateCSV([headers, ...rows]);
}

export function exportScheduleToCSV(schedule: Schedule, people: Person[]): string {
  const headers = [
    'Woche',
    'Startdatum',
    'Person 1',
    'Person 2',
    'Mentor vorhanden',
    'Fairness Person 1',
    'Fairness Person 2'
  ];
  
  const rows = schedule.assignments.map(assignment => {
    const person1 = people.find(p => p.id === assignment.assignedPeople[0]);
    const person2 = people.find(p => p.id === assignment.assignedPeople[1]);
    
    return [
      assignment.weekNumber.toString(),
      formatDateGerman(new Date(assignment.weekStartDate)),
      person1?.name || 'Unbekannt',
      person2?.name || '-',
      assignment.hasMentor ? 'Ja' : 'Nein',
      assignment.fairnessScores[0]?.toFixed(2) || '-',
      assignment.fairnessScores[1]?.toFixed(2) || '-'
    ];
  });
  
  return '\uFEFF' + generateCSV([headers, ...rows]);
}

export function exportYearDataToCSV(yearData: YearData): string {
  const headers = [
    'Jahr',
    'Anzahl Personen',
    'Aktive Personen',
    'Anzahl Zeitpläne',
    'Letzte Änderung'
  ];
  
  const activePeople = yearData.people.filter(p => isPersonActive(p)).length;
  
  const row = [
    yearData.year.toString(),
    yearData.people.length.toString(),
    activePeople.toString(),
    yearData.schedules.length.toString(),
    formatDateGerman(new Date(yearData.lastModified))
  ];
  
  return '\uFEFF' + generateCSV([headers, row]);
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportJSONBackup(yearData: YearData): string {
  return JSON.stringify(yearData, null, 2);
}

export function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
