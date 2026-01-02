
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarView from '../components/CalendarView';

describe('CalendarView Component', () => {
  it('renderuje się poprawnie', () => {
    render(<CalendarView selectedDate={null} onDateChange={() => {}} />);
    expect(screen.getByText(/Kalendarz Zmian Prawa/i)).toBeTruthy();
  });

  it('wyświetla przycisk wyczyść datę gdy data jest wybrana', () => {
    render(<CalendarView selectedDate={new Date()} onDateChange={() => {}} />);
    expect(screen.getByText(/Wyczyść datę/i)).toBeTruthy();
  });

  it('nie wyświetla przycisku wyczyść datę gdy data nie jest wybrana', () => {
    render(<CalendarView selectedDate={null} onDateChange={() => {}} />);
    expect(screen.queryByText(/Wyczyść datę/i)).toBeNull();
  });

  it('wywołuje onDateChange(null) po kliknięciu wyczyść', () => {
    const onDateChange = vi.fn();
    render(<CalendarView selectedDate={new Date()} onDateChange={onDateChange} />);
    
    const button = screen.getByText(/Wyczyść datę/i);
    fireEvent.click(button);
    
    expect(onDateChange).toHaveBeenCalledWith(null);
  });
});
