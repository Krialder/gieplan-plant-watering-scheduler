/**
 * main.tsx - Application Entry Point
 * 
 * This file initializes and mounts the React application to the DOM.
 * Functions:
 * - Sets up error boundary for graceful error handling
 * - Loads all required stylesheets (main CSS, theme CSS, Tailwind CSS)
 * - Renders the App component within an error boundary
 */

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

// Import stylesheets in order: main styles, theme variables, utility classes
import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Mount the application with error boundary protection
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
