/**
 * ErrorFallback.tsx - Error Boundary Fallback Component
 * 
 * This component displays a user-friendly error message when the application encounters
 * an unhandled runtime error.
 * Functions:
 * - Shows formatted error information in development mode (rethrows for debugging)
 * - Displays user-friendly error UI in production
 * - Provides retry functionality to reset the error boundary
 * - Shows error details in a formatted code block
 * - Includes contact information for reporting issues
 */

import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
import { Button } from "./components/ui/button";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // In development mode, rethrow error for better debugging experience
  if (import.meta.env.DEV) throw error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Error alert with warning styling */}
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon />
          <AlertTitle>This application has encountered a runtime error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The error details are shown below. Contact the author and let them know about this issue.
          </AlertDescription>
        </Alert>
        
        {/* Error details display */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Error Details:</h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
        </div>
        
        {/* Reset button to retry the application */}
        <Button 
          onClick={resetErrorBoundary} 
          className="w-full"
          variant="outline"
        >
          <RefreshCwIcon />
          Try Again
        </Button>
      </div>
    </div>
  );
}
