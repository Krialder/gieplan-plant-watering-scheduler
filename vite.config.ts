/**
 * vite.config.ts - Vite Build Configuration
 * 
 * This file configures Vite for the GießPlan React application build process.
 * Configuration includes:
 * - React support with SWC for fast compilation and hot reload
 * - TailwindCSS integration for utility-first styling
 * - Path aliases for clean imports (@/lib, @/components, etc.)
 * - Development server optimizations for the watering schedule system
 */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Project root path resolution
const projectRoot = process.env.PROJECT_ROOT || fileURLToPath(new URL('.', import.meta.url))

// Vite configuration for development and production builds
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // React support with SWC compiler
    tailwindcss(), // TailwindCSS processing
  ],
  resolve: {
    alias: {
      // Enable clean imports: import { utils } from '@/lib/utils'
      '@': resolve(projectRoot, 'src')
    }
  },
});
