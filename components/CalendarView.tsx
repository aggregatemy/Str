
import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css'; // Custom styles to override default

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  highlightedDates?: string[]; // ISO strings YYYY-MM-DD
}

const CalendarView: React.FC<CalendarViewProps> = ({ selectedDate, onDateChange, highlightedDates = [] }) => {
  return (
    <div className="bg-white p-4 border border-slate-200 rounded shadow-sm">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Kalendarz Zmian Prawa</h3>
      <Calendar 
        onChange={(value) => {
           if (value instanceof Date) onDateChange(value);
           else if (Array.isArray(value) && value[0]) onDateChange(value[0]);
           else onDateChange(null);
        }}
        value={selectedDate}
        locale="pl-PL"
        className="text-xs font-sans border-none w-full"
        tileClassName={({ date, view }) => {
           if (view === 'month') {
             const dateStr = date.toISOString().split('T')[0];
             if (highlightedDates.includes(dateStr)) {
               return 'font-bold text-red-700 bg-red-50';
             }
           }
           return '';
        }}
      />
      {selectedDate && (
        <button 
          onClick={() => onDateChange(null)}
          className="mt-4 w-full py-2 bg-slate-100 text-[9px] font-black uppercase text-slate-600 hover:bg-slate-200 transition-all"
        >
          Wyczyść datę
        </button>  
      )}
    </div>
  );
};

export default CalendarView;
