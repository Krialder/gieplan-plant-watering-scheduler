/**
 * Tests for Softmax Selection System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectWithSoftmax,
  calculateSoftmaxProbabilities,
  weightedRandomSelection,
  TEMPERATURE_DEFAULT
} from '../softmaxSelection';

describe('Softmax Selection System', () => {
  describe('calculateSoftmaxProbabilities', () => {
    it('should normalize probabilities to sum to 1', () => {
      const deficits = [1, 2, 3, 0, -1];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 1.0);
      
      const sum = probabilities.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should assign higher probability to higher deficit', () => {
      const deficits = [1, 3, 2];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 1.0);
      
      // Highest deficit (3) should have highest probability
      expect(probabilities[1]).toBeGreaterThan(probabilities[0]);
      expect(probabilities[1]).toBeGreaterThan(probabilities[2]);
      
      // Middle deficit (2) should have middle probability
      expect(probabilities[2]).toBeGreaterThan(probabilities[0]);
    });

    it('should be sensitive to temperature parameter', () => {
      const deficits = [1, 3];
      
      const lowTemp = calculateSoftmaxProbabilities(deficits, 0.5);
      const highTemp = calculateSoftmaxProbabilities(deficits, 2.0);
      
      // Low temperature = more deterministic (larger difference)
      const lowDiff = Math.abs(lowTemp[1] - lowTemp[0]);
      const highDiff = Math.abs(highTemp[1] - highTemp[0]);
      
      expect(lowDiff).toBeGreaterThan(highDiff);
    });

    it('should assign equal probabilities for equal deficits', () => {
      const deficits = [2, 2, 2, 2];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 1.0);
      
      for (const prob of probabilities) {
        expect(prob).toBeCloseTo(0.25, 5);
      }
    });

    it('should handle negative deficits correctly', () => {
      const deficits = [-2, -1, 0, 1, 2];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 1.0);
      
      // Positive deficits should have higher probability
      expect(probabilities[4]).toBeGreaterThan(probabilities[0]);
      expect(probabilities[3]).toBeGreaterThan(probabilities[1]);
    });

    it('should handle very large deficits without overflow', () => {
      const deficits = [100, 200, 300];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 1.0);
      
      expect(isFinite(probabilities[0])).toBe(true);
      expect(isFinite(probabilities[1])).toBe(true);
      expect(isFinite(probabilities[2])).toBe(true);
      
      const sum = probabilities.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should approach deterministic selection at low temperature', () => {
      const deficits = [1, 5];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 0.1);
      
      // With very low temperature, highest deficit should get ~100% probability
      expect(probabilities[1]).toBeGreaterThan(0.99);
    });

    it('should approach uniform distribution at high temperature', () => {
      const deficits = [1, 5];
      
      const probabilities = calculateSoftmaxProbabilities(deficits, 10.0);
      
      // With very high temperature, probabilities should be similar
      const diff = Math.abs(probabilities[1] - probabilities[0]);
      expect(diff).toBeLessThan(0.2);
    });
  });

  describe('weightedRandomSelection', () => {
    it('should select specified number of items', () => {
      const probabilities = [0.2, 0.3, 0.3, 0.2];
      
      const selected = weightedRandomSelection(probabilities, 2);
      
      expect(selected).toHaveLength(2);
    });

    it('should not select duplicates', () => {
      const probabilities = [0.25, 0.25, 0.25, 0.25];
      
      const selected = weightedRandomSelection(probabilities, 3);
      
      const uniqueSelected = new Set(selected);
      expect(uniqueSelected.size).toBe(3);
    });

    it('should respect probability weights over many trials', () => {
      const probabilities = [0.8, 0.1, 0.1];
      const trials = 1000;
      const counts = [0, 0, 0];
      
      // Run many trials selecting 1 item each time
      for (let i = 0; i < trials; i++) {
        const selected = weightedRandomSelection(probabilities, 1);
        counts[selected[0]]++;
      }
      
      // Index 0 should be selected ~80% of the time
      expect(counts[0]).toBeGreaterThan(700);
      expect(counts[0]).toBeLessThan(900);
    });

    it('should handle edge case of selecting all items', () => {
      const probabilities = [0.25, 0.25, 0.25, 0.25];
      
      const selected = weightedRandomSelection(probabilities, 4);
      
      expect(selected).toHaveLength(4);
      expect(new Set(selected).size).toBe(4);
    });

    it('should handle selecting zero items', () => {
      const probabilities = [0.5, 0.5];
      
      const selected = weightedRandomSelection(probabilities, 0);
      
      expect(selected).toHaveLength(0);
    });

    it('should renormalize probabilities after each selection', () => {
      const probabilities = [0.5, 0.3, 0.2];
      
      // Select 2 items - this requires renormalization after first selection
      const selected = weightedRandomSelection(probabilities, 2);
      
      expect(selected).toHaveLength(2);
      expect(new Set(selected).size).toBe(2);
    });
  });

  describe('selectWithSoftmax', () => {
    it('should select specified team size', () => {
      const deficits = [2, 1, 3, 0, 1.5];
      const personIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 2);
      
      expect(result.selectedIds).toHaveLength(2);
    });

    it('should return probabilities for all people', () => {
      const deficits = [2, 1, 3];
      const personIds = ['p1', 'p2', 'p3'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 1);
      
      expect(result.probabilities.size).toBe(3);
      
      const totalProb = Array.from(result.probabilities.values()).reduce((a, b) => a + b, 0);
      expect(totalProb).toBeCloseTo(1.0, 5);
    });

    it('should return expected deficits', () => {
      const deficits = [2, 1, 3];
      const personIds = ['p1', 'p2', 'p3'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 1);
      
      expect(result.expectedDeficits.size).toBe(3);
      expect(result.expectedDeficits.get('p1')).toBe(2);
      expect(result.expectedDeficits.get('p2')).toBe(1);
      expect(result.expectedDeficits.get('p3')).toBe(3);
    });

    it('should prefer higher deficit people probabilistically', () => {
      const deficits = [10, 1, 1, 1];
      const personIds = ['high', 'low1', 'low2', 'low3'];
      
      // Run multiple trials
      let highSelected = 0;
      const trials = 100;
      
      for (let i = 0; i < trials; i++) {
        const result = selectWithSoftmax(personIds, deficits, 1.0, 1);
        if (result.selectedIds.includes('high')) {
          highSelected++;
        }
      }
      
      // Person with high deficit should be selected most of the time
      expect(highSelected).toBeGreaterThan(50);
    });

    it('should handle all equal deficits', () => {
      const deficits = [1, 1, 1, 1];
      const personIds = ['p1', 'p2', 'p3', 'p4'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 2);
      
      expect(result.selectedIds).toHaveLength(2);
      
      // All should have equal probability
      for (const prob of result.probabilities.values()) {
        expect(prob).toBeCloseTo(0.25, 5);
      }
    });

    it('should handle mismatched array lengths', () => {
      const deficits = [1, 2];
      const personIds = ['p1', 'p2', 'p3'];
      
      expect(() => {
        selectWithSoftmax(personIds, deficits, 1.0, 1);
      }).toThrow();
    });

    it('should not select more people than available', () => {
      const deficits = [1, 2];
      const personIds = ['p1', 'p2'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 5);
      
      expect(result.selectedIds.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Temperature Effects', () => {
    it('should be more deterministic with low temperature', () => {
      const deficits = [1, 5];
      const personIds = ['low', 'high'];
      
      // Low temperature - should almost always select 'high'
      let highSelected = 0;
      for (let i = 0; i < 50; i++) {
        const result = selectWithSoftmax(personIds, deficits, 0.2, 1);
        if (result.selectedIds[0] === 'high') highSelected++;
      }
      
      expect(highSelected).toBeGreaterThan(45); // >90%
    });

    it('should be more random with high temperature', () => {
      const deficits = [1, 5];
      const personIds = ['low', 'high'];
      
      // High temperature - should have more variance
      let highSelected = 0;
      for (let i = 0; i < 100; i++) {
        const result = selectWithSoftmax(personIds, deficits, 5.0, 1);
        if (result.selectedIds[0] === 'high') highSelected++;
      }
      
      // Should be selected more often but not overwhelmingly
      expect(highSelected).toBeGreaterThan(50);
      expect(highSelected).toBeLessThan(85);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single person', () => {
      const result = selectWithSoftmax(['p1'], [1], 1.0, 1);
      
      expect(result.selectedIds).toEqual(['p1']);
      expect(result.probabilities.get('p1')).toBe(1.0);
    });

    it('should handle zero team size', () => {
      const result = selectWithSoftmax(['p1', 'p2'], [1, 2], 1.0, 0);
      
      expect(result.selectedIds).toHaveLength(0);
    });

    it('should handle all negative deficits', () => {
      const deficits = [-5, -3, -1];
      const personIds = ['p1', 'p2', 'p3'];
      
      const result = selectWithSoftmax(personIds, deficits, 1.0, 1);
      
      // Should still select someone (least negative = highest priority)
      expect(result.selectedIds).toHaveLength(1);
    });

    it('should handle very small temperature', () => {
      const result = selectWithSoftmax(['p1', 'p2'], [1, 2], 0.001, 1);
      
      expect(result.selectedIds).toHaveLength(1);
    });

    it('should handle very large temperature', () => {
      const result = selectWithSoftmax(['p1', 'p2'], [1, 2], 100, 1);
      
      expect(result.selectedIds).toHaveLength(1);
    });
  });
});
