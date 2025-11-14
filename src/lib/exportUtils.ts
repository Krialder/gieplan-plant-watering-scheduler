/**
 * exportUtils.ts - Data Export and File Download Utilities
 * 
 * This module provides comprehensive data export functionality for the watering schedule system.
 * Functions:
 * - Generate properly formatted CSV files with German locale support
 * - Export people data with complete statistics and status information
 * - Export schedule data with assignment details and fairness metrics
 * - Create JSON backups containing all system data
 * - Handle file downloads with proper MIME types and encoding
 * - Support Excel/Sheets compatibility with BOM and proper escaping
 * - Provide year-level summary exports for reporting purposes
 */

import type { Person, Schedule, YearData } from '@/types';
import { formatDateGerman, getWeekNumber } from './dateUtils';
import { isPersonActive } from './fairnessEngine';

// Generate CSV string from 2D array data with proper escaping
export function generateCSV(data: string[][], includeHeader: boolean = true): string {
  return data
    .map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        // Escape cells containing commas, quotes, or newlines
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
    .join('\n');
}

// Export people data as CSV with comprehensive information
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
  
  // Add BOM for proper Excel/German locale support
  return '\uFEFF' + generateCSV([headers, ...rows]);
}

// Export schedule data as CSV with assignment details
export function exportScheduleToCSV(schedule: Schedule, people: Person[]): string {
  const headers = [
    'KW',
    'Startdatum',
    'Person 1',
    'Person 2',
    'Ersatz 1',
    'Ersatz 2',
    'Mentor vorhanden',
    'Fairness Person 1',
    'Fairness Person 2',
    'Notfall',
    'Kommentar'
  ];
  
  // Sort assignments by week start date to ensure chronological order
  const sortedAssignments = [...schedule.assignments].sort((a, b) => 
    new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
  );
  
  const rows = sortedAssignments.map(assignment => {
    const person1 = people.find(p => p.id === assignment.assignedPeople[0]);
    const person2 = people.find(p => p.id === assignment.assignedPeople[1]);
    const substitute1 = (assignment.substitutes && assignment.substitutes[0]) ? people.find(p => p.id === assignment.substitutes![0]) : null;
    const substitute2 = (assignment.substitutes && assignment.substitutes[1]) ? people.find(p => p.id === assignment.substitutes![1]) : null;
    
    // Get emergency info
    const isEmergency = (assignment as any).isEmergency || false;
    const emergencyReason = (assignment as any).emergencyReason || '';
    const emergencyText = isEmergency ? (emergencyReason || 'Ja') : 'Nein';
    
    // Get comment
    const comment = (assignment as any).comment || '-';
    
    // Calculate actual calendar week number from the date
    const weekStartDate = new Date(assignment.weekStartDate);
    const calendarWeek = getWeekNumber(weekStartDate);
    
    return [
      calendarWeek.toString(),
      formatDateGerman(new Date(assignment.weekStartDate)),
      person1?.name || 'Unbekannt',
      person2?.name || '-',
      substitute1?.name || '-',
      substitute2?.name || '-',
      assignment.hasMentor ? 'Ja' : 'Nein',
      assignment.fairnessScores[0]?.toFixed(2) || '-',
      assignment.fairnessScores[1]?.toFixed(2) || '-',
      emergencyText,
      comment
    ];
  });
  
  return '\uFEFF' + generateCSV([headers, ...rows]);
}

// Export year-level summary data as CSV
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

// Download CSV content as file
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
  
  // Clean up object URL
  URL.revokeObjectURL(url);
}

// Export complete year data as formatted JSON backup
export function exportJSONBackup(yearData: YearData): string {
  return JSON.stringify(yearData, null, 2);
}

// Download JSON content as file
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
  
  // Clean up object URL
  URL.revokeObjectURL(url);
}
