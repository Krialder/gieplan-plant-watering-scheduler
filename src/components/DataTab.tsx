/**
 * DataTab.tsx - Data Management and Export Component
 * 
 * This component handles data import/export functionality and displays system statistics.
 * Functions:
 * - Display overview statistics (people count, schedules, last modified date)
 * - Export people data to CSV format for Excel/Sheets compatibility
 * - Create complete JSON backups containing all system data
 * - Provide data deletion functionality with multiple confirmations
 * - Show system information and feature documentation
 * - Display warnings and helpful information about data operations
 * - Handle file downloads for CSV and JSON exports
 */

import type { YearData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Database, Trash, Info } from 'lucide-react';
import { toast } from 'sonner';
import { exportPeopleToCSV, exportJSONBackup, downloadCSV, downloadJSON } from '@/lib/exportUtils';
import { formatDateGerman } from '@/lib/dateUtils';

interface DataTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData>) => void;
  selectedYear: number;
}

export default function DataTab({ yearData, updateYearData, selectedYear }: DataTabProps) {
  // Export people data as CSV file
  const handleExportPeople = () => {
    const csv = exportPeopleToCSV(yearData.people);
    downloadCSV(csv, `personen-${selectedYear}.csv`);
    toast.success('Personen exportiert');
  };

  // Create complete JSON backup of all data
  const handleExportBackup = () => {
    const json = exportJSONBackup(yearData);
    downloadJSON(json, `giessplan-backup-${selectedYear}.json`);
    toast.success('Backup erstellt');
  };

  // Clear all data with double confirmation for safety
  const handleClearData = () => {
    if (confirm('Alle Daten für dieses Jahr löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      if (confirm('Sind Sie sicher? Dies löscht ALLE Personen und Zeitpläne!')) {
        updateYearData({
          people: [],
          schedules: []
        });
        toast.success('Alle Daten gelöscht');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics overview card */}
      <Card>
        <CardHeader>
          <CardTitle>Datenübersicht</CardTitle>
          <CardDescription>
            Statistiken und Informationen für {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Personen insgesamt</p>
              <p className="text-3xl font-bold">{yearData.people.length}</p>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Zeitpläne</p>
              <p className="text-3xl font-bold">{yearData.schedules.length}</p>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Letzte Änderung</p>
              <p className="text-lg font-semibold">
                {formatDateGerman(new Date(yearData.lastModified))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export functionality card */}
      <Card>
        <CardHeader>
          <CardTitle>Daten exportieren</CardTitle>
          <CardDescription>
            Exportieren Sie Ihre Daten für die Verwendung mit anderen Tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportPeople}
              variant="outline"
              className="flex items-center gap-2"
              disabled={yearData.people.length === 0}
            >
              <Download size={18} />
              Personen als CSV
            </Button>
            
            <Button
              onClick={handleExportBackup}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database size={18} />
              Vollständiges Backup (JSON)
            </Button>
          </div>
          
          {/* Information about export formats */}
          <Alert>
            <Info size={20} />
            <AlertDescription>
              CSV-Dateien können mit Microsoft Excel oder Google Sheets geöffnet werden.
              JSON-Backups enthalten alle Daten und können wiederhergestellt werden.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Data management card */}
      <Card>
        <CardHeader>
          <CardTitle>Datenverwaltung</CardTitle>
          <CardDescription>
            Löschen oder zurücksetzen von Daten
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Warning alert for destructive actions */}
          <Alert className="mb-4">
            <AlertDescription>
              <strong>Warnung:</strong> Das Löschen von Daten kann nicht rückgängig gemacht werden.
              Erstellen Sie vor dem Löschen ein Backup.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleClearData}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash size={18} />
            Alle Daten löschen
          </Button>
        </CardContent>
      </Card>

      {/* System information card */}
      <Card>
        <CardHeader>
          <CardTitle>Über GießPlan System</CardTitle>
          <CardDescription>
            Systeminfomationen und Dokumentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Organisation:</strong> Rotkreuz-Institut BBW
            </p>
            <p>
              <strong>Programm:</strong> Berufsvorbereitung
            </p>
          </div>
          
          {/* Feature list */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="font-semibold mb-2">Kernfunktionen</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Zeitproportionale Fairness-Berechnung</li>
              <li>✓ Hochfluktuations-Management</li>
              <li>✓ Intelligente Mentoren-Paarung</li>
              <li>✓ 6-Wochen-Zeitplan-Generierung</li>
              <li>✓ Mehrstufiges Backup-System</li>
              <li>✓ CSV/Excel-Export</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
