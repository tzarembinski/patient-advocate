"use client";

import { useState, useRef, useEffect } from "react";

interface DateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  hasError?: boolean;
}

export default function DateInput({ value, onChange, id, className, hasError }: DateInputProps) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Parse incoming value (YYYY-MM-DD) into separate fields
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    } else {
      setMonth("");
      setDay("");
      setYear("");
    }
  }, [value]);

  // Combine fields and call onChange
  const updateValue = (m: string, d: string, y: string) => {
    if (m && d && y && m.length === 2 && d.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    } else if (!m && !d && !y) {
      onChange("");
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 2);

    // Auto-correct invalid months
    if (val.length === 2) {
      const monthNum = parseInt(val);
      if (monthNum > 12) val = "12";
      if (monthNum < 1) val = "01";
    }

    setMonth(val);
    updateValue(val, day, year);

    // Auto-advance when 2 digits entered
    if (val.length === 2) {
      dayRef.current?.focus();
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 2);

    // Auto-correct invalid days
    if (val.length === 2) {
      const dayNum = parseInt(val);
      if (dayNum > 31) val = "31";
      if (dayNum < 1) val = "01";
    }

    setDay(val);
    updateValue(month, val, year);

    // Auto-advance when 2 digits entered
    if (val.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(val);
    updateValue(month, day, val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'month' | 'day' | 'year') => {
    // Allow backspace to move to previous field when empty
    if (e.key === 'Backspace') {
      const target = e.target as HTMLInputElement;
      if (target.value === '') {
        if (field === 'day') {
          monthRef.current?.focus();
        } else if (field === 'year') {
          dayRef.current?.focus();
        }
      }
    }
    // Allow left/right arrows to navigate
    else if (e.key === 'ArrowRight') {
      if (field === 'month') dayRef.current?.focus();
      else if (field === 'day') yearRef.current?.focus();
    } else if (e.key === 'ArrowLeft') {
      if (field === 'year') dayRef.current?.focus();
      else if (field === 'day') monthRef.current?.focus();
    }
  };

  return (
    <div id={id} className={`flex items-center gap-1 ${className}`}>
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="MM"
        className={`w-12 px-2 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          hasError ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={2}
      />
      <span className="text-gray-500">/</span>
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="DD"
        className={`w-12 px-2 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          hasError ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={2}
      />
      <span className="text-gray-500">/</span>
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="YYYY"
        className={`w-16 px-2 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          hasError ? 'border-red-500' : 'border-gray-300'
        }`}
        maxLength={4}
      />
    </div>
  );
}
