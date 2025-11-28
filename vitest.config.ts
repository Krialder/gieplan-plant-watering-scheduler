/**
 * vitest.config.ts - Vitest Test Configuration
 * 
 * This file configures Vitest for the GießPlan test suite.
 * Configuration includes:
 * - React support for component testing
 * - jsdom environment for DOM simulation
 * - Global test utilities setup (vi, describe, it, expect)
 * - Test timeout configuration for long-running tests
 * - Coverage reporting with v8 provider
 * - Path aliases matching main TypeScript configuration
 * - Test file setup for common utilities and matchers
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Make test functions globally available
    environment: 'jsdom', // Browser-like environment for DOM testing
    setupFiles: './Test/setup.ts', // Global test setup and utilities
    testTimeout: 10000, // 10 second timeout per test for complex operations
    hookTimeout: 10000, // 10 second timeout for beforeEach/afterEach hooks
    coverage: {
      provider: 'v8', // Fast native code coverage
      reporter: ['text', 'json', 'html'], // Multiple coverage report formats
      include: ['src/**/*.ts', 'src/**/*.tsx'], // Source files to track
      exclude: [
        'src/**/*.d.ts', // Type definitions
        'src/main.tsx', // Entry point
        'src/vite-env.d.ts', // Vite type definitions
        'src/components/ui/**', // UI library components (external)
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // Match TypeScript path aliases
    }
  }
});
