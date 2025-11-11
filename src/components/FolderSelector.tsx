/**
 * FolderSelector.tsx - Folder Selection Component
 * 
 * This component allows users to select a folder for saving application data.
 * Functions:
 * - Display current folder selection status
 * - Provide button to select new folder
 * - Show folder name when selected
 * - Handle folder selection errors
 * - Remind user to re-select folder after page refresh
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Folder, FolderOpen, AlertCircle } from 'lucide-react';
import { requestDataFolder, getFolderName, hasDataFolder, getDirectoryHandle } from '@/lib/fileStorage';

interface FolderSelectorProps {
  onFolderSelected?: () => void;
}

export default function FolderSelector({ onFolderSelected }: FolderSelectorProps) {
  const [folderName, setFolderName] = useState<string | null>(null);
  const [hasFolder, setHasFolder] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [needsReselect, setNeedsReselect] = useState(false);

  useEffect(() => {
    const hadFolder = hasDataFolder();
    const currentHandle = getDirectoryHandle();
    
    setHasFolder(currentHandle !== null);
    setFolderName(getFolderName());
    
    // If we had a folder but lost the handle, show re-select prompt
    if (hadFolder && !currentHandle) {
      setNeedsReselect(true);
    }
  }, []);

  const handleSelectFolder = async () => {
    setSelecting(true);
    try {
      const success = await requestDataFolder();
      if (success) {
        setHasFolder(true);
        setFolderName(getFolderName());
        setNeedsReselect(false);
        onFolderSelected?.();
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('aborted')) {
          // User cancelled - no error needed
          return;
        } else if (error.message.includes('SecurityError') || error.message.includes('system')) {
          alert('Dieser Ordner kann nicht verwendet werden.\n\nBitte wählen Sie einen Ordner in Ihrem Benutzerverzeichnis (z.B. Dokumente, Desktop).\n\nSystemordner und geschützte Verzeichnisse sind nicht erlaubt.');
        } else {
          alert('Fehler beim Öffnen des Ordners: ' + error.message);
        }
      }
    } finally {
      setSelecting(false);
    }
  };

  // Show re-select prompt if folder was previously selected but handle is lost
  if (needsReselect) {
    return (
      <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/50">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Bitte wählen Sie den Ordner <strong>{folderName || 'Gießplan_savefiles'}</strong> erneut aus, um die Daten zu laden.
            <span className="block text-xs mt-1 text-muted-foreground">
              (Aus Sicherheitsgründen muss der Zugriff nach jedem Neuladen bestätigt werden)
            </span>
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={handleSelectFolder}
            disabled={selecting}
          >
            <Folder className="h-4 w-4 mr-2" />
            {selecting ? 'Wählen...' : 'Ordner wählen'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasFolder && folderName) {
    return (
      <Alert>
        <FolderOpen className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Daten werden gespeichert in: <strong>{folderName}</strong></span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectFolder}
            disabled={selecting}
          >
            Ordner ändern
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Folder className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Bitte wählen Sie einen Ordner zum Speichern der Daten</span>
        <Button
          variant="default"
          size="sm"
          onClick={handleSelectFolder}
          disabled={selecting}
        >
          <Folder className="h-4 w-4 mr-2" />
          {selecting ? 'Wählen...' : 'Ordner wählen'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
