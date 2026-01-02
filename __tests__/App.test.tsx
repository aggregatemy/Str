import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('displays the main header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Repozytorium Aktów/i);
    expect(headerElement).toBeInTheDocument();
  });

  it('has time range selector buttons', () => {
    render(<App />);
    expect(screen.getByText(/7 dni/i)).toBeInTheDocument();
    expect(screen.getByText(/30 dni/i)).toBeInTheDocument();
    expect(screen.getByText(/90 dni/i)).toBeInTheDocument();
  });

  it('has navigation tabs', () => {
    render(<App />);
    expect(screen.getByText(/Dane Faktograficzne/i)).toBeInTheDocument();
    expect(screen.getByText(/Zarchiwizowane/i)).toBeInTheDocument();
    expect(screen.getByText(/Parametry API/i)).toBeInTheDocument();
  });
});
