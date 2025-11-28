/**
 * Tests for Seeded Random Number Generator and Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SeededRandom,
  getGlobalRandom,
  seedGlobalRandom,
  random,
  sampleGumbel,
  gumbelMaxSample,
  gumbelSoftmax,
  chiSquareTest,
  calculateEntropy,
  calculateNormalizedEntropy
} from '../random';

describe('SeededRandom', () => {
  describe('Reproducibility', () => {
    it('should produce same sequence with same seed', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);
      
      const sequence1 = Array(100).fill(0).map(() => rng1.next());
      const sequence2 = Array(100).fill(0).map(() => rng2.next());
      
      expect(sequence1).toEqual(sequence2);
    });
    
    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(67890);
      
      const sequence1 = Array(100).fill(0).map(() => rng1.next());
      const sequence2 = Array(100).fill(0).map(() => rng2.next());
      
      expect(sequence1).not.toEqual(sequence2);
    });
    
    it('should reset to same sequence after reset', () => {
      const rng = new SeededRandom(42);
      
      const sequence1 = Array(50).fill(0).map(() => rng.next());
      
      rng.reset(42);
      const sequence2 = Array(50).fill(0).map(() => rng.next());
      
      expect(sequence1).toEqual(sequence2);
    });
  });
  
  describe('Distribution Quality', () => {
    it('should generate numbers in [0, 1)', () => {
      const rng = new SeededRandom(123);
      
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
    
    it('should have approximately uniform distribution', () => {
      const rng = new SeededRandom(456);
      const samples = Array(10000).fill(0).map(() => rng.next());
      
      // Chi-square test for uniformity
      const chiSq = chiSquareTest(samples, 10);
      
      // For 10 bins, critical value at p=0.01 is ~21.7
      // This is a very lenient test - good PRNG should pass easily
      expect(chiSq).toBeLessThan(25);
    });
    
    it('should pass chi-square test with multiple seeds', () => {
      const seeds = [1, 42, 12345, 99999];
      
      for (const seed of seeds) {
        const rng = new SeededRandom(seed);
        const samples = Array(5000).fill(0).map(() => rng.next());
        const chiSq = chiSquareTest(samples, 10);
        
        expect(chiSq).toBeLessThan(25);
      }
    });
  });
  
  describe('nextInt', () => {
    it('should generate integers in specified range', () => {
      const rng = new SeededRandom(789);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThan(20);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
    
    it('should cover full range over many samples', () => {
      const rng = new SeededRandom(101);
      const min = 0, max = 10;
      const counts = new Array(max - min).fill(0);
      
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(min, max);
        counts[value]++;
      }
      
      // All values should appear at least once
      for (const count of counts) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });
  
  describe('nextGaussian', () => {
    it('should generate approximately normal distribution', () => {
      const rng = new SeededRandom(202);
      const samples = Array(10000).fill(0).map(() => rng.nextGaussian(0, 1));
      
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
      const stdDev = Math.sqrt(variance);
      
      // Should be close to N(0, 1)
      expect(mean).toBeCloseTo(0, 1);
      expect(stdDev).toBeCloseTo(1, 1);
    });
    
    it('should respect mean and stdDev parameters', () => {
      const rng = new SeededRandom(303);
      const targetMean = 100;
      const targetStdDev = 15;
      
      const samples = Array(10000).fill(0).map(() => 
        rng.nextGaussian(targetMean, targetStdDev)
      );
      
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => 
        sum + Math.pow(x - mean, 2), 0) / samples.length;
      const stdDev = Math.sqrt(variance);
      
      expect(mean).toBeCloseTo(targetMean, 0);
      expect(stdDev).toBeCloseTo(targetStdDev, 0);
    });
  });
  
  describe('shuffle', () => {
    it('should shuffle array in place', () => {
      const rng = new SeededRandom(404);
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const original = [...array];
      
      rng.shuffle(array);
      
      // Should be different order (very high probability)
      expect(array).not.toEqual(original);
      
      // Should contain same elements
      expect(array.sort()).toEqual(original.sort());
    });
    
    it('should be reproducible with same seed', () => {
      const array1 = [1, 2, 3, 4, 5];
      const array2 = [1, 2, 3, 4, 5];
      
      const rng1 = new SeededRandom(505);
      const rng2 = new SeededRandom(505);
      
      rng1.shuffle(array1);
      rng2.shuffle(array2);
      
      expect(array1).toEqual(array2);
    });
  });
  
  describe('sample', () => {
    it('should sample k unique items', () => {
      const rng = new SeededRandom(606);
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      const sample = rng.sample(array, 5);
      
      expect(sample).toHaveLength(5);
      expect(new Set(sample).size).toBe(5); // All unique
      
      // All from original array
      for (const item of sample) {
        expect(array).toContain(item);
      }
    });
    
    it('should return all items if k >= array length', () => {
      const rng = new SeededRandom(707);
      const array = [1, 2, 3, 4, 5];
      
      const sample = rng.sample(array, 10);
      
      expect(sample).toHaveLength(5);
      expect(new Set(sample).size).toBe(5);
    });
  });
  
  describe('State Management', () => {
    it('should save and restore state', () => {
      const rng = new SeededRandom(808);
      
      // Generate some numbers
      Array(10).fill(0).forEach(() => rng.next());
      
      // Save state
      const state = rng.getState();
      
      // Generate more numbers
      const sequence1 = Array(10).fill(0).map(() => rng.next());
      
      // Restore state
      rng.setState(state);
      
      // Should produce same sequence
      const sequence2 = Array(10).fill(0).map(() => rng.next());
      
      expect(sequence1).toEqual(sequence2);
    });
  });
});

describe('Gumbel Distribution', () => {
  describe('sampleGumbel', () => {
    it('should generate Gumbel distributed samples', () => {
      const rng = new SeededRandom(909);
      const samples = Array(10000).fill(0).map(() => sampleGumbel(rng));
      
      // Gumbel(0,1) has mean ≈ 0.577 (Euler's constant)
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      
      expect(mean).toBeCloseTo(0.577, 0);
    });
    
    it('should handle edge cases without crashing', () => {
      const rng = new SeededRandom(1010);
      
      // Should not crash or produce NaN/Infinity
      for (let i = 0; i < 1000; i++) {
        const sample = sampleGumbel(rng);
        expect(isFinite(sample)).toBe(true);
      }
    });
  });
  
  describe('gumbelMaxSample', () => {
    it('should sample according to probabilities', () => {
      const rng = new SeededRandom(1111);
      const logProbs = [Math.log(0.1), Math.log(0.3), Math.log(0.6)];
      const counts = [0, 0, 0];
      
      // Run many trials
      for (let i = 0; i < 10000; i++) {
        const idx = gumbelMaxSample(logProbs, rng);
        counts[idx]++;
      }
      
      // Should approximate the probabilities
      expect(counts[0] / 10000).toBeCloseTo(0.1, 1);
      expect(counts[1] / 10000).toBeCloseTo(0.3, 1);
      expect(counts[2] / 10000).toBeCloseTo(0.6, 1);
    });
    
    it('should handle uniform probabilities', () => {
      const rng = new SeededRandom(1212);
      const logProbs = [0, 0, 0, 0]; // Uniform
      const counts = [0, 0, 0, 0];
      
      for (let i = 0; i < 10000; i++) {
        const idx = gumbelMaxSample(logProbs, rng);
        counts[idx]++;
      }
      
      // All should be approximately equal
      for (const count of counts) {
        expect(count / 10000).toBeCloseTo(0.25, 1);
      }
    });
  });
  
  describe('gumbelSoftmax', () => {
    it('should produce probability vector', () => {
      const rng = new SeededRandom(1313);
      const logProbs = [Math.log(0.2), Math.log(0.5), Math.log(0.3)];
      
      const probs = gumbelSoftmax(logProbs, 1.0, rng);
      
      expect(probs).toHaveLength(3);
      
      const sum = probs.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
      
      // All probabilities should be positive
      for (const p of probs) {
        expect(p).toBeGreaterThan(0);
        expect(p).toBeLessThan(1);
      }
    });
    
    it('should approach uniform at high temperature', () => {
      const rng = new SeededRandom(1414);
      const logProbs = [Math.log(0.1), Math.log(0.9)];
      
      const probs = gumbelSoftmax(logProbs, 100.0, rng);
      
      // At very high temperature, should be close to uniform
      expect(probs[0]).toBeCloseTo(0.5, 0);
      expect(probs[1]).toBeCloseTo(0.5, 0);
    });
    
    it('should approach deterministic at low temperature', () => {
      const rng = new SeededRandom(1515);
      const logProbs = [Math.log(0.1), Math.log(0.9)];
      
      const probs = gumbelSoftmax(logProbs, 0.01, rng);
      
      // At very low temperature, should be almost deterministic
      expect(probs[0]).toBeLessThan(0.1);
      expect(probs[1]).toBeGreaterThan(0.9);
    });
  });
});

describe('Entropy Functions', () => {
  describe('calculateEntropy', () => {
    it('should return 0 for deterministic distribution', () => {
      const probs = [1.0, 0, 0, 0];
      const entropy = calculateEntropy(probs);
      
      expect(entropy).toBe(0);
    });
    
    it('should return log(n) for uniform distribution', () => {
      const probs = [0.25, 0.25, 0.25, 0.25];
      const entropy = calculateEntropy(probs);
      
      expect(entropy).toBeCloseTo(Math.log(4), 10);
    });
    
    it('should be between 0 and log(n)', () => {
      const probs = [0.5, 0.3, 0.15, 0.05];
      const entropy = calculateEntropy(probs);
      
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThan(Math.log(4));
    });
  });
  
  describe('calculateNormalizedEntropy', () => {
    it('should return 0 for deterministic', () => {
      const probs = [1, 0, 0];
      const normalized = calculateNormalizedEntropy(probs);
      
      expect(normalized).toBe(0);
    });
    
    it('should return 1 for uniform', () => {
      const probs = [0.25, 0.25, 0.25, 0.25];
      const normalized = calculateNormalizedEntropy(probs);
      
      expect(normalized).toBeCloseTo(1, 10);
    });
    
    it('should be in range [0, 1]', () => {
      const probs = [0.6, 0.3, 0.1];
      const normalized = calculateNormalizedEntropy(probs);
      
      expect(normalized).toBeGreaterThan(0);
      expect(normalized).toBeLessThan(1);
    });
  });
});

describe('Global Random Instance', () => {
  it('should use global instance by default', () => {
    seedGlobalRandom(12345);
    
    const value1 = random(true);
    
    seedGlobalRandom(12345);
    const value2 = random(true);
    
    expect(value1).toBe(value2);
  });
  
  it('should use Math.random when seeded=false', () => {
    const value = random(false);
    
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });
});

describe('Chi-Square Test', () => {
  it('should detect uniform distribution', () => {
    const uniform = Array(1000).fill(0).map(() => Math.random());
    const chiSq = chiSquareTest(uniform, 10);
    
    // Should be close to expected value (10 bins)
    expect(chiSq).toBeLessThan(25);
  });
  
  it('should detect non-uniform distribution', () => {
    // Heavily biased toward 0
    const biased = Array(1000).fill(0).map(() => Math.random() * 0.2);
    const chiSq = chiSquareTest(biased, 10);
    
    // Should have high chi-square value
    expect(chiSq).toBeGreaterThan(100);
  });
});
