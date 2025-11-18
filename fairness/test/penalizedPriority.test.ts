/**
 * Tests for Penalized Priority Calculation (L4 Regularization)
 */

import { describe, it, expect } from 'vitest';
import { 
  calculatePenalizedPriority,
  PENALTY_LAMBDA,
  TENURE_WEIGHT_SCALE 
} from '../penalizedPriority';

describe('Penalized Priority System', () => {
  describe('calculatePenalizedPriority', () => {
    it('should calculate base priority for zero deficit', () => {
      const result = calculatePenalizedPriority(0, 30);
      
      expect(result.basePriority).toBe(0);
      expect(result.penaltyBoost).toBe(0);
      expect(result.finalPriority).toBe(0);
    });

    it('should boost priority for positive deficit (underselected)', () => {
      const result = calculatePenalizedPriority(2, 30);
      
      expect(result.basePriority).toBeGreaterThan(0);
      expect(result.penaltyBoost).toBeGreaterThan(0);
      expect(result.finalPriority).toBeGreaterThan(result.basePriority);
    });

    it('should penalize for negative deficit (overselected)', () => {
      const result = calculatePenalizedPriority(-2, 30);
      
      expect(result.basePriority).toBeLessThan(0);
      expect(result.penaltyBoost).toBeLessThan(0);
      expect(result.finalPriority).toBeLessThan(result.basePriority);
    });

    it('should apply L4 penalty aggressively for large deficits', () => {
      const smallDeficit = calculatePenalizedPriority(1, 30);
      const largeDeficit = calculatePenalizedPriority(3, 30);
      
      // L4 penalty grows as deficit^3, so 3x deficit should give ~27x penalty boost
      const ratioActual = largeDeficit.penaltyBoost / smallDeficit.penaltyBoost;
      expect(ratioActual).toBeCloseTo(27, 0); // 3^3 = 27
    });

    it('should weight by tenure (longer tenure = more stable)', () => {
      const shortTenure = calculatePenalizedPriority(2, 30);
      const longTenure = calculatePenalizedPriority(2, 365);
      
      // Longer tenure should have higher tenure weight, lower volatility
      expect(longTenure.tenureWeight).toBeGreaterThan(shortTenure.tenureWeight);
      
      // But penalty boost should be less impactful for long tenure
      // (more stable, less reactive)
      const shortContribution = shortTenure.penaltyBoost * (1 / (shortTenure.tenureWeight + 1));
      const longContribution = longTenure.penaltyBoost * (1 / (longTenure.tenureWeight + 1));
      expect(longContribution).toBeLessThan(shortContribution);
    });

    it('should handle new members (tenure = 0) without division by zero', () => {
      const result = calculatePenalizedPriority(1, 0);
      
      expect(result.finalPriority).toBeDefined();
      expect(isFinite(result.finalPriority)).toBe(true);
    });

    it('should be symmetric for equal magnitude deficits', () => {
      const positive = calculatePenalizedPriority(2, 30);
      const negative = calculatePenalizedPriority(-2, 30);
      
      expect(positive.finalPriority).toBeCloseTo(-negative.finalPriority, 5);
    });

    it('should converge to zero as deficit approaches zero', () => {
      const verySmallDeficit = calculatePenalizedPriority(0.001, 30);
      
      expect(Math.abs(verySmallDeficit.finalPriority)).toBeLessThan(0.01);
    });

    it('should produce consistent ordering for different deficits', () => {
      const deficit1 = calculatePenalizedPriority(1, 30);
      const deficit2 = calculatePenalizedPriority(2, 30);
      const deficit3 = calculatePenalizedPriority(3, 30);
      
      expect(deficit1.finalPriority).toBeLessThan(deficit2.finalPriority);
      expect(deficit2.finalPriority).toBeLessThan(deficit3.finalPriority);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large deficits', () => {
      const result = calculatePenalizedPriority(100, 365);
      
      expect(isFinite(result.finalPriority)).toBe(true);
      expect(result.finalPriority).toBeGreaterThan(0);
    });

    it('should handle very small tenure', () => {
      const result = calculatePenalizedPriority(2, 1);
      
      expect(isFinite(result.finalPriority)).toBe(true);
    });

    it('should handle negative tenure gracefully', () => {
      // Should not happen in practice, but should not crash
      const result = calculatePenalizedPriority(2, -10);
      
      expect(isFinite(result.finalPriority)).toBe(true);
    });
  });
});
