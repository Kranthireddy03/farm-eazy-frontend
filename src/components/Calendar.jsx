import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';

const Calendar = ({ events = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-2">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-2 py-1">&#60;</button>
      <span className="font-bold">{format(currentMonth, 'MMMM yyyy')}</span>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-2 py-1">&#62;</button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const date = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold" key={i}>
          {format(addDays(date, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-1">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const hasEvent = events.some(e => isSameDay(new Date(e.date), day));
        days.push(
          <div
            className={`p-2 text-center rounded cursor-pointer border ${!isSameMonth(day, monthStart) ? 'text-slate-500' : isSameDay(day, selectedDate) ? 'bg-indigo-900/50 text-indigo-300' : ''} ${hasEvent ? 'border-indigo-500' : 'border-transparent'}`}
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
            title={hasEvent ? events.find(e => isSameDay(new Date(e.date), day)).title : ''}
          >
            {formattedDate}
            {hasEvent && <span className="block text-xs text-indigo-600">•</span>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>{days}</div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const renderEventList = () => {
    const dayEvents = events.filter(e => isSameDay(new Date(e.date), selectedDate));
    return (
      <div className="mt-2">
        <h4 className="font-semibold mb-1 text-white">Events on {format(selectedDate, 'PPP')}:</h4>
        {dayEvents.length === 0 ? (
          <div className="text-slate-400 text-sm">No events</div>
        ) : (
          <ul className="list-disc ml-5 text-sm text-slate-300">
            {dayEvents.map((e, idx) => (
              <li key={idx}>{e.title}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 w-full max-w-xl mx-auto text-white">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventList()}
    </div>
  );
};

export default Calendar;
