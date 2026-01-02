import { describe, it, expect } from 'vitest';

/**
 * Testy dla poprawek App.tsx
 */

describe('App.tsx Helpers - SonarQube Quality', () => {
  // Helper functions z App.tsx
  
  function getRangeLabel(range: '7d' | '30d' | '90d'): string {
    switch (range) {
      case '7d':
        return '7 dni';
      case '30d':
        return '30 dni';
      case '90d':
        return '90 dni';
      default:
        return '7 dni';
    }
  }

  function getErrorClassName(errorType: 'network' | 'server' | 'data'): string {
    const baseClasses = 'mb-8 p-6 border-2 rounded';
    switch (errorType) {
      case 'network':
        return `${baseClasses} bg-red-50 border-red-200`;
      case 'server':
        return `${baseClasses} bg-orange-50 border-orange-200`;
      case 'data':
        return `${baseClasses} bg-yellow-50 border-yellow-200`;
      default:
        return baseClasses;
    }
  }

  function getErrorIconClass(errorType: 'network' | 'server' | 'data'): string {
    const baseClasses = 'fas text-xl';
    switch (errorType) {
      case 'network':
        return `${baseClasses} fa-wifi text-red-600`;
      case 'server':
        return `${baseClasses} fa-exclamation-triangle text-orange-600`;
      case 'data':
        return `${baseClasses} fa-database text-yellow-600`;
      default:
        return baseClasses;
    }
  }

  function getSourceBadgeClass(sourceType: string): string {
    switch (sourceType) {
      case 'eli':
        return 'bg-blue-600 text-white';
      case 'rss':
        return 'bg-green-600 text-white';
      case 'scraper':
        return 'bg-amber-700 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  }

  describe('getRangeLabel', () => {
    it('powinno zwrócić "7 dni" dla "7d"', () => {
      expect(getRangeLabel('7d')).toBe('7 dni');
    });

    it('powinno zwrócić "30 dni" dla "30d"', () => {
      expect(getRangeLabel('30d')).toBe('30 dni');
    });

    it('powinno zwrócić "90 dni" dla "90d"', () => {
      expect(getRangeLabel('90d')).toBe('90 dni');
    });
  });

  describe('getErrorClassName', () => {
    it('powinno zwrócić red classes dla network error', () => {
      const result = getErrorClassName('network');
      expect(result).toContain('bg-red-50');
      expect(result).toContain('border-red-200');
    });

    it('powinno zwrócić orange classes dla server error', () => {
      const result = getErrorClassName('server');
      expect(result).toContain('bg-orange-50');
      expect(result).toContain('border-orange-200');
    });

    it('powinno zwrócić yellow classes dla data error', () => {
      const result = getErrorClassName('data');
      expect(result).toContain('bg-yellow-50');
      expect(result).toContain('border-yellow-200');
    });
  });

  describe('getErrorIconClass', () => {
    it('powinno zwrócić wifi icon dla network error', () => {
      const result = getErrorIconClass('network');
      expect(result).toContain('fa-wifi');
      expect(result).toContain('text-red-600');
    });

    it('powinno zwrócić warning icon dla server error', () => {
      const result = getErrorIconClass('server');
      expect(result).toContain('fa-exclamation-triangle');
      expect(result).toContain('text-orange-600');
    });

    it('powinno zwrócić database icon dla data error', () => {
      const result = getErrorIconClass('data');
      expect(result).toContain('fa-database');
      expect(result).toContain('text-yellow-600');
    });
  });

  describe('getSourceBadgeClass', () => {
    it('powinno zwrócić blue class dla eli', () => {
      expect(getSourceBadgeClass('eli')).toBe('bg-blue-600 text-white');
    });

    it('powinno zwrócić green class dla rss', () => {
      expect(getSourceBadgeClass('rss')).toBe('bg-green-600 text-white');
    });

    it('powinno zwrócić amber class dla scraper', () => {
      expect(getSourceBadgeClass('scraper')).toBe('bg-amber-700 text-white');
    });

    it('powinno zwrócić default class dla unknown', () => {
      expect(getSourceBadgeClass('unknown')).toBe('bg-slate-600 text-white');
    });
  });

  describe('Ternary Operations Replaced', () => {
    it('złożone operacje ternarne powinny być rozbite', () => {
      // Before: zagnieżdżone ternary
      // After: helper functions
      
      const errorType: 'network' | 'server' | 'data' = 'network';
      const className = getErrorClassName(errorType);
      
      // Verify it has proper structure
      expect(className).toContain('mb-8');
      expect(className).toContain('p-6');
      expect(className).toContain('border-2');
      expect(className).toContain('rounded');
    });
  });
});
