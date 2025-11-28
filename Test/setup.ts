/**
 * setup.ts - Global Test Configuration and Setup
 * 
 * This file provides test environment configuration for all Vitest tests.
 * Configurations:
 * - Automatic cleanup after each test
 * - Jest DOM matchers for React Testing Library
 * - Global test utilities and helpers
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
