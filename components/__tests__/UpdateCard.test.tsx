import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateCard from '../UpdateCard';
import { LegalUpdate } from '../../types';

const mockUpdates: LegalUpdate[] = [
  {
    id: 'test-1',
    eliUri: '/eli/test/1',
    ingestMethod: 'eli',
    title: 'Testowa ustawa',
    summary: 'Opis testowy',
    date: '2024-01-01',
    impact: 'high',
    category: 'Prawo',
    legalStatus: 'in_force',
    officialRationale: 'Uzasadnienie',
    sourceUrl: 'https://test.gov.pl'
  }
];

describe('UpdateCard', () => {
  it('powinien wyświetlić listę aktualizacji', () => {
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText('Testowa ustawa')).toBeInTheDocument();
    expect(screen.getByText('Uzasadnienie')).toBeInTheDocument();
  });

  it('powinien wyświetlić loader gdy loading=true', () => {
    render(
      <UpdateCard
        updates={[]}
        loading={true}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    const loaders = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loaders.length).toBeGreaterThan(0);
  });

  it('powinien wyświetlić komunikat gdy brak danych', () => {
    render(
      <UpdateCard
        updates={[]}
        loading={false}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText(/brak nowych danych/i)).toBeInTheDocument();
  });

  it('powinien wywołać callback przy zaznaczeniu', () => {
    const onToggle = vi.fn();
    
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        selectedIds={[]}
        onToggleSelection={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('test-1');
  });

  it('powinien wyświetlić badge dla metody ELI', () => {
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText('Protokół ELI API')).toBeInTheDocument();
  });

  it('powinien wywołać onSave przy kliknięciu zapisz', () => {
    const onSave = vi.fn();
    
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        onSave={onSave}
        isSaved={vi.fn(() => false)}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    const saveButton = screen.getByText(/archiwizuj dokument/i);
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(mockUpdates[0]);
  });

  it('powinien wyświetlić status zarchiwizowany gdy dokument jest zapisany', () => {
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        onSave={vi.fn()}
        isSaved={vi.fn(() => true)}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText(/zarchiwizowano/i)).toBeInTheDocument();
  });

  it('powinien zaznaczyć checkbox gdy update jest w selectedIds', () => {
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        selectedIds={['test-1']}
        onToggleSelection={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('powinien wyświetlić ELI URI gdy jest dostępne', () => {
    render(
      <UpdateCard
        updates={mockUpdates}
        loading={false}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText('/eli/test/1')).toBeInTheDocument();
  });

  it('powinien wyświetlić różne badges dla różnych metod ingest', () => {
    const updates: LegalUpdate[] = [
      { ...mockUpdates[0], id: '1', ingestMethod: 'eli' },
      { ...mockUpdates[0], id: '2', ingestMethod: 'rss', title: 'RSS Update' },
      { ...mockUpdates[0], id: '3', ingestMethod: 'scraper', title: 'Scraper Update' }
    ];

    render(
      <UpdateCard
        updates={updates}
        loading={false}
        selectedIds={[]}
        onToggleSelection={vi.fn()}
      />
    );

    expect(screen.getByText('Protokół ELI API')).toBeInTheDocument();
    expect(screen.getByText('Kanał RSS/XML')).toBeInTheDocument();
    expect(screen.getByText('Silnik Scrapera NFZ')).toBeInTheDocument();
  });
});
