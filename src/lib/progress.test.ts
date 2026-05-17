import { describe, it, expect } from 'vitest';
import { calculateProgress, getProgressColor, getProgressBarColor } from './progress';

describe('Progress Engine', () => {
  describe('calculateProgress', () => {
    it('should correctly calculate NUMERIC progress', () => {
      const progress = calculateProgress('NUMERIC', 100, 50);
      expect(progress).toBe(50);
    });

    it('should cap progress at 150% for standard UOMs', () => {
      // The implementation uses clamp(..., 0, 150)
      const progress = calculateProgress('NUMERIC', 100, 200);
      expect(progress).toBe(150);
    });

    it('should correctly calculate PERCENTAGE progress', () => {
      const progress = calculateProgress('PERCENTAGE', 100, 75);
      expect(progress).toBe(75);
    });

    it('should handle zero target', () => {
      const progress = calculateProgress('NUMERIC', 0, 50);
      expect(progress).toBe(100);
    });

    it('should calculate ZERO_BASED progress properly (lower is better)', () => {
      const progressZero = calculateProgress('ZERO_BASED', 0, 0);
      expect(progressZero).toBe(100);

      const progressFail = calculateProgress('ZERO_BASED', 0, 1);
      expect(progressFail).toBe(0);
    });
  });

  describe('getProgressColor', () => {
    it('should return green color for 100%', () => {
      expect(getProgressColor(100)).toBe('text-green-500');
    });

    it('should return yellow color for 50%', () => {
      expect(getProgressColor(50)).toBe('text-yellow-500');
    });

    it('should return red color for 0%', () => {
      expect(getProgressColor(0)).toBe('text-red-500');
    });
  });
});
