/**
 * Seeded Pseudo-Random Number Generator (PRNG)
 * 
 * Provides high-quality, reproducible randomness for fairness calculations.
 * Uses Mulberry32 algorithm - simple, fast, and statistically sound.
 * 
 * Benefits:
 * - Seedable: Same seed = same sequence (reproducible tests)
 * - High quality: Passes statistical randomness tests
 * - Fast: Simple operations, no complex math
 * - Lightweight: ~10 lines of code
 */

/**
 * Mulberry32 PRNG
 * 
 * A simple and fast 32-bit PRNG with good statistical properties.
 * Period: 2^32 (over 4 billion numbers before repeating)
 * 
 * References:
 * - https://gist.github.com/tommyettinger/46a874c743aa721d5f8d
 * - https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
export class SeededRandom {
  private state: number;
  
  /**
   * Create a seeded random number generator
   * 
   * @param seed - Integer seed (0 to 2^32-1). Default uses current time.
   */
  constructor(seed?: number) {
    // Use timestamp as default seed if not provided
    this.state = seed !== undefined ? seed >>> 0 : (Date.now() % 0xFFFFFFFF) >>> 0;
  }
  
  /**
   * Generate next random number in [0, 1)
   * 
   * @returns Pseudo-random number in range [0, 1)
   */
  next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  
  /**
   * Generate random integer in range [min, max)
   * 
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random integer
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
  
  /**
   * Generate random number from normal distribution (Box-Muller transform)
   * 
   * @param mean - Mean of distribution
   * @param stdDev - Standard deviation
   * @returns Random number from N(mean, stdDev²)
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
  
  /**
   * Shuffle array in place (Fisher-Yates algorithm)
   * 
   * @param array - Array to shuffle
   * @returns Shuffled array (same reference)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Sample k items from array without replacement
   * 
   * @param array - Array to sample from
   * @param k - Number of items to sample
   * @returns Array of k randomly selected items
   */
  sample<T>(array: T[], k: number): T[] {
    if (k >= array.length) {
      return this.shuffle([...array]);
    }
    
    const result: T[] = [];
    const indices = new Set<number>();
    
    while (result.length < k) {
      const idx = this.nextInt(0, array.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        result.push(array[idx]);
      }
    }
    
    return result;
  }
  
  /**
   * Reset to initial seed
   * 
   * @param seed - New seed value
   */
  reset(seed: number): void {
    this.state = seed >>> 0;
  }
  
  /**
   * Get current state (for serialization)
   * 
   * @returns Current PRNG state
   */
  getState(): number {
    return this.state;
  }
  
  /**
   * Set state (for deserialization)
   * 
   * @param state - State to restore
   */
  setState(state: number): void {
    this.state = state >>> 0;
  }
}

/**
 * Global seeded random instance
 * Can be reseeded for reproducible tests
 */
let globalRandom: SeededRandom | null = null;

/**
 * Get global random instance (lazy initialization)
 * 
 * @returns Global SeededRandom instance
 */
export function getGlobalRandom(): SeededRandom {
  if (!globalRandom) {
    globalRandom = new SeededRandom();
  }
  return globalRandom;
}

/**
 * Seed the global random instance
 * 
 * @param seed - Seed value (undefined = use timestamp)
 */
export function seedGlobalRandom(seed?: number): void {
  globalRandom = new SeededRandom(seed);
}

/**
 * Generate random number using global instance or Math.random
 * 
 * @param useSeeded - Use seeded PRNG if true, Math.random if false
 * @returns Random number in [0, 1)
 */
export function random(useSeeded: boolean = true): number {
  if (useSeeded) {
    return getGlobalRandom().next();
  }
  return Math.random();
}

/**
 * Gumbel distribution sampling
 * Used for Gumbel-Max trick in differentiable sampling
 * 
 * The Gumbel distribution has CDF: F(x) = exp(-exp(-(x-μ)/β))
 * For standard Gumbel (μ=0, β=1): F(x) = exp(-exp(-x))
 * 
 * Inverse transform sampling:
 * G = -log(-log(U)) where U ~ Uniform(0,1)
 */
export function sampleGumbel(rng: SeededRandom = getGlobalRandom()): number {
  const u = rng.next();
  // Avoid log(0) by clamping
  const clamped = Math.max(1e-20, Math.min(1 - 1e-20, u));
  return -Math.log(-Math.log(clamped));
}

/**
 * Gumbel-Max trick for sampling from categorical distribution
 * 
 * Mathematical property:
 *   argmax_i (log(p_i) + G_i) ~ Categorical(p)
 * where G_i are i.i.d. Gumbel(0,1) random variables
 * 
 * This is "differentiable" in the sense that it can be used with
 * gradient-based optimization (Gumbel-Softmax / Concrete distribution)
 * 
 * @param logProbs - Log probabilities (doesn't need to be normalized)
 * @param rng - Random number generator
 * @returns Index of sampled category
 */
export function gumbelMaxSample(
  logProbs: number[],
  rng: SeededRandom = getGlobalRandom()
): number {
  let maxIdx = 0;
  let maxValue = -Infinity;
  
  for (let i = 0; i < logProbs.length; i++) {
    const gumbel = sampleGumbel(rng);
    const value = logProbs[i] + gumbel;
    
    if (value > maxValue) {
      maxValue = value;
      maxIdx = i;
    }
  }
  
  return maxIdx;
}

/**
 * Gumbel-Softmax (Concrete Distribution)
 * 
 * A continuous relaxation of the categorical distribution.
 * As temperature → 0, becomes one-hot (deterministic argmax)
 * As temperature → ∞, becomes uniform
 * 
 * Formula:
 *   p_i = exp((log(π_i) + G_i) / τ) / Σ_j exp((log(π_j) + G_j) / τ)
 * 
 * where G_i ~ Gumbel(0,1) and τ is temperature
 * 
 * @param logProbs - Log probabilities
 * @param temperature - Temperature parameter
 * @param rng - Random number generator
 * @returns Probability vector (sums to 1)
 */
export function gumbelSoftmax(
  logProbs: number[],
  temperature: number = 1.0,
  rng: SeededRandom = getGlobalRandom()
): number[] {
  const n = logProbs.length;
  const gumbels = new Array(n);
  
  // Add Gumbel noise
  for (let i = 0; i < n; i++) {
    gumbels[i] = logProbs[i] + sampleGumbel(rng);
  }
  
  // Apply softmax with temperature
  const maxGumbel = Math.max(...gumbels);
  const expValues = gumbels.map(g => Math.exp((g - maxGumbel) / temperature));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  
  return expValues.map(e => e / sumExp);
}

/**
 * Test randomness quality using chi-square test
 * 
 * @param samples - Array of random numbers in [0, 1)
 * @param bins - Number of bins for histogram
 * @returns Chi-square statistic (lower is better, ~bins expected)
 */
export function chiSquareTest(samples: number[], bins: number = 10): number {
  const counts = new Array(bins).fill(0);
  const expected = samples.length / bins;
  
  for (const sample of samples) {
    const bin = Math.min(bins - 1, Math.floor(sample * bins));
    counts[bin]++;
  }
  
  let chiSq = 0;
  for (const count of counts) {
    chiSq += Math.pow(count - expected, 2) / expected;
  }
  
  return chiSq;
}

/**
 * Calculate entropy of a probability distribution
 * 
 * H(p) = -Σ p_i log(p_i)
 * 
 * Max entropy = log(n) when uniform
 * Min entropy = 0 when deterministic
 * 
 * @param probs - Probability distribution
 * @returns Entropy in nats (use log base e)
 */
export function calculateEntropy(probs: number[]): number {
  let entropy = 0;
  
  for (const p of probs) {
    if (p > 0) {
      entropy -= p * Math.log(p);
    }
  }
  
  return entropy;
}

/**
 * Calculate normalized entropy (0 to 1)
 * 
 * @param probs - Probability distribution
 * @returns Normalized entropy (1 = uniform, 0 = deterministic)
 */
export function calculateNormalizedEntropy(probs: number[]): number {
  const entropy = calculateEntropy(probs);
  const maxEntropy = Math.log(probs.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}
