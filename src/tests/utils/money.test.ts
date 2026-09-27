import { describe, it, expect } from 'vitest';
import { koboToNaira, nairaToKobo, formatNaira } from '../../utils/money';

describe('money utilities', () => {
  describe('koboToNaira', () => {
    it('converts integer kobo to Naira correctly', () => {
      expect(koboToNaira(10000)).toBe(100);
      expect(koboToNaira(150050)).toBe(1500.50);
      expect(koboToNaira(0)).toBe(0);
    });

    it('handles invalid or non-numeric inputs gracefully', () => {
      expect(koboToNaira(NaN)).toBe(0);
    });
  });

  describe('nairaToKobo', () => {
    it('converts Naira number to kobo accurately without float rounding issues', () => {
      expect(nairaToKobo(100)).toBe(10000);
      expect(nairaToKobo(19.99)).toBe(1999);
      expect(nairaToKobo('1500.50')).toBe(150050);
    });

    it('returns 0 for empty or invalid values', () => {
      expect(nairaToKobo('')).toBe(0);
      expect(nairaToKobo(-50)).toBe(0);
    });
  });

  describe('formatNaira', () => {
    it('formats integer kobo into a currency string', () => {
      const formatted = formatNaira(150000);
      expect(formatted).toContain('1,500.00');
    });
  });
});
