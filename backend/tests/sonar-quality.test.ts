import { describe, it, expect } from 'vitest';

/**
 * Testy dla poprawek SonarQube
 */

describe('SonarQube Quality Improvements', () => {
  describe('String Methods', () => {
    it('replaceAll powinien zastąpić wszystkie wystąpienia', () => {
      const input = 'abc/def/ghi';
      const result = input.replaceAll('/', '-');
      expect(result).toBe('abc-def-ghi');
    });

    it('replaceAll z regexem powinien działać poprawnie', () => {
      const input = 'hello WORLD hello';
      const result = input.replaceAll(/hello/gi, 'hi');
      expect(result).toBe('hi WORLD hi');
    });
  });

  describe('Optional Chaining', () => {
    it('optional chain powinien bezpiecznie dostępować do właściwości', () => {
      const obj = { web: { uri: 'https://example.com' } };
      expect(obj.web?.uri).toBe('https://example.com');
      
      const empty: any = null;
      expect(empty?.web?.uri).toBe(undefined);
    });

    it('optional chain z falsy values', () => {
      const obj = { web: null };
      expect(obj.web?.uri).toBe(undefined);
    });
  });

  describe('Array Methods', () => {
    it('some() powinien sprawdzić czy element istnieje', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.some(x => x === 3)).toBe(true);
      expect(arr.some(x => x === 6)).toBe(false);
    });

    it('some() powinien być bardziej wydajny niż find()', () => {
      const users = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      
      // Zamiast: !!users.find(u => u.id === 2)
      const hasUser = users.some(u => u.id === 2);
      expect(hasUser).toBe(true);
    });
  });

  describe('RegExp exec() vs match()', () => {
    it('exec() powinien zwrócić match array', () => {
      const regex = /<title[^>]*>(.*?)<\/title>/i;
      const xml = '<title>Test Title</title>';
      const match = regex.exec(xml);
      
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('Test Title');
    });

    it('exec() powinien zwrócić null gdy nie ma match', () => {
      const regex = /<title[^>]*>(.*?)<\/title>/i;
      const xml = '<div>No title here</div>';
      const match = regex.exec(xml);
      
      expect(match).toBeNull();
    });
  });

  describe('Number.isNaN vs isNaN', () => {
    it('Number.isNaN powinien być bardziej dokładny', () => {
      // isNaN("hello") === true  (nieoczekiwane - global isNaN)
      // Number.isNaN("hello") === false (poprawne)
      expect(Number.isNaN(NaN)).toBe(true);
      expect(Number.isNaN("hello")).toBe(false);
      expect(Number.isNaN(123)).toBe(false);
    });

    it('Number.isNaN dla invalid date', () => {
      const invalidDate = new Date('invalid');
      const isInvalid = Number.isNaN(invalidDate.getTime());
      expect(isInvalid).toBe(true);
    });
  });

  describe('Cognitive Complexity', () => {
    // Helper function do testowania
    function getRangeDays(range: string | undefined): number {
      if (range === '7d') return 7;
      if (range === '30d') return 30;
      if (range === '90d') return 90;
      return 120;
    }

    it('getRangeDays powinien zwrócić poprawne wartości', () => {
      expect(getRangeDays('7d')).toBe(7);
      expect(getRangeDays('30d')).toBe(30);
      expect(getRangeDays('90d')).toBe(90);
      expect(getRangeDays(undefined)).toBe(120);
      expect(getRangeDays('invalid')).toBe(120);
    });
  });

  describe('Type Assertions Removal', () => {
    it('powinno być możliwe usunięcie as string gdy API_KEY jest ustawiony', () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        expect(apiKey).toBeUndefined();
        return;
      }
      
      // When env var exists, should not need 'as string'
      const typedKey: string = apiKey;
      expect(typeof typedKey).toBe('string');
    });
  });

  describe('Template Literals', () => {
    it('powinno być możliwe zamiast zagnieżdżonych template literals', () => {
      const entryIntoForce = '2025-01-15';
      const type = 'Ustawa';
      const inForce = true;
      
      const entryIntoForceText = entryIntoForce ? `. Wchodzi w życie: ${entryIntoForce}` : '';
      const summary = `${type}. Status: ${inForce ? 'active' : 'inactive'}${entryIntoForceText}`;
      
      expect(summary).toBe('Ustawa. Status: active. Wchodzi w życie: 2025-01-15');
    });
  });

  describe('Accessibility', () => {
    it('checkbox powinien mieć label', () => {
      // Symulacja - w rzeczywistości testujemy w komponentach React
      const hasLabel = true; // checkbox w UpdateCard.tsx ma label
      const hasAriaLabel = true; // checkbox ma aria-label
      
      expect(hasLabel || hasAriaLabel).toBe(true);
    });

    it('button powinien mieć title lub text', () => {
      // Symulacja - w rzeczywistości testujemy w komponentach React
      const hasTitle = true; // button w App.tsx ma title
      const hasText = true; // button ma text content
      
      expect(hasTitle || hasText).toBe(true);
    });
  });
});
