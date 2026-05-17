import { describe, it, expect } from 'vitest';
import { goalSchema, quarterlyUpdateSchema } from './validations';

describe('Validation Schemas', () => {
  describe('goalSchema', () => {
    it('should validate a correct goal', () => {
      const validGoal = {
        title: 'Improve performance',
        description: 'Decrease load times by 20% across all primary pages.',
        thrustArea: 'Customer Experience',
        uom: 'PERCENTAGE',
        target: 20,
        weightage: 25,
      };
      const result = goalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
    });

    it('should reject invalid weightage (over 100)', () => {
      const invalidGoal = {
        title: 'Improve performance',
        description: 'Decrease load times by 20% across all primary pages.',
        thrustArea: 'Customer Experience',
        uom: 'PERCENTAGE',
        target: 20,
        weightage: 150, // Invalid
      };
      const result = goalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum weightage is 100%');
      }
    });

    it('should reject short descriptions', () => {
      const invalidGoal = {
        title: 'Valid title',
        description: 'Short', // Too short
        thrustArea: 'Customer Experience',
        uom: 'PERCENTAGE',
        target: 20,
        weightage: 25,
      };
      const result = goalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
    });
  });

  describe('quarterlyUpdateSchema', () => {
    it('should validate a correct update', () => {
      const update = {
        achievement: 10,
        status: 'ON_TRACK',
        notes: 'Halfway there',
      };
      const result = quarterlyUpdateSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should reject negative achievements', () => {
      const update = {
        achievement: -5,
        status: 'ON_TRACK',
      };
      const result = quarterlyUpdateSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });
});
