import type { YearData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from '@phosphor-icons/react';

interface ManualTabProps {
  yearData: YearData;
  updateYearData: (updates: Partial<YearData>) => void;
}

export default function ManualTab({ yearData, updateYearData }: ManualTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manuelle Verwaltung</CardTitle>
          <CardDescription>
            Zeitpläne manuell anpassen und Zuweisungen bearbeiten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info size={20} />
            <AlertDescription>
              Die manuelle Verwaltungsfunktion ermöglicht es, einzelne Zuweisungen im Zeitplan zu bearbeiten.
              Diese Funktion wird in einer zukünftigen Version implementiert.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 space-y-4">
            <div className="border border-border rounded-lg p-6 text-center">
              <h3 className="font-semibold mb-2">Zukünftige Funktionen</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Einzelne Wochen bearbeiten</li>
                <li>• Personen austauschen</li>
                <li>• Notfall-Überschreibungen</li>
                <li>• Kommentare zu Zuweisungen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
