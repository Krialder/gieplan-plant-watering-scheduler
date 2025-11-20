/**
 * Virtual History System Test - DEPRECATED
 * 
 * This test file is deprecated as the virtual history system has been removed.
 * The system now uses simple equal distribution: everyone gets the same average
 * number of assignments regardless of when they join.
 * 
 * New people start with 0 assignments and get assigned at the same RATE as
 * existing people going forward, without any catch-up or compensation for
 * "missed" time before they arrived.
 */

import { describe, it } from 'vitest';

describe('Virtual History System (DEPRECATED)', () => {
  it.skip('virtual history removed - using equal distribution instead', () => {
    // This test is skipped because virtual history has been removed
    // New approach: everyone gets same average assignments
  });
});
