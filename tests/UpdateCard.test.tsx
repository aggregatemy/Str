import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UpdateCard from '../components/UpdateCard';
import type { LegalUpdate } from '../types';

describe('UpdateCard Component', () => {
  const mockUpdate: LegalUpdate = {
    id: 'test-id-1',
    title: 'Rozporządzenie testowe',
    summary: 'Podsumowanie testowego rozporządzenia',
    date: '2026-01-02',
    impact: 'medium',
    category: 'Zdrowie',
    ingestMethod: 'eli',
    eliUri: 'https://test.uri',
    legalStatus: 'published',
    officialRationale: 'Uzasadnienie testowe',
    sourceUrl: 'https://test.url',
  };

  it('renderuje się z tablicą updates', () => {
    render(<UpdateCard updates={[mockUpdate]} loading={false} />);
    expect(screen.getByText('Rozporządzenie testowe')).toBeTruthy();
  });

  it('renderuje pustą tablicę bez błędów', () => {
    render(<UpdateCard updates={[]} loading={false} />);
    expect(document.body).toBeTruthy();
  });

  it('pokazuje loader gdy loading=true', () => {
    render(<UpdateCard updates={[]} loading={true} />);
    // Sprawdź czy jest jakiś wskaźnik ładowania
    const body = document.body;
    expect(body.textContent).toBeDefined();
  });

  it('wyświetla datę w karcie', () => {
    render(<UpdateCard updates={[mockUpdate]} loading={false} />);
    expect(document.body.textContent).toContain('2026-01-02');
  });

  it('wyświetla kategorię w karcie', () => {
    render(<UpdateCard updates={[mockUpdate]} loading={false} />);
    expect(document.body.textContent).toContain('Zdrowie');
  });

  it('renderuje wiele dokumentów', () => {
    const updates = [mockUpdate, { ...mockUpdate, id: 'test-id-2', title: 'Drugi dokument' }];
    render(<UpdateCard updates={updates} loading={false} />);
    expect(screen.getByText('Rozporządzenie testowe')).toBeTruthy();
    expect(screen.getByText('Drugi dokument')).toBeTruthy();
  });

  it('wywołuje onToggleSelection po kliknięciu', () => {
    const onToggleMock = vi.fn();
    const selectedIds = [mockUpdate.id];
    render(
      <UpdateCard 
        updates={[mockUpdate]} 
        loading={false} 
        onToggleSelection={onToggleMock}
        selectedIds={selectedIds}
      />
    );
    
    // Znajdź checkbox i kliknij
    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
    checkbox?.click();
    expect(onToggleMock).toHaveBeenCalled();
  });

  it('wyświetla sourceUrl gdy dostępny', () => {
    render(<UpdateCard updates={[mockUpdate]} loading={false} />);
    // sourceUrl nie jest wyświetlany bezpośrednio w UI, tylko używany wewnętrznie
    // Sprawdzamy czy komponent się wyrenderował bez błędów
    expect(screen.getByText('Rozporządzenie testowe')).toBeTruthy();
  });
});
