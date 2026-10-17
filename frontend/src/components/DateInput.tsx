'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateInputProps {
  value?: string | null; // ISO YYYY-MM-DD
  onChange: (isoValue: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function isoToDMY(iso?: string | null): string {
  if (!iso) return '';
  const dateOnly = iso.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateOnly;
}

export function dmyToISO(dmy: string): string | null {
  const parts = dmy.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    }
  }
  return null;
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  required = false,
  className = '',
  disabled = false,
}: DateInputProps) {
  const [displayText, setDisplayText] = useState(() => isoToDMY(value));
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayText(isoToDMY(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');

    // Tự động chèn dấu / khi gõ số ngày và tháng
    if (raw.length === 2 && !raw.includes('/') && e.target.value.length > displayText.length) {
      raw = `${raw}/`;
    } else if (raw.length === 5 && (raw.match(/\//g) || []).length === 1 && e.target.value.length > displayText.length) {
      raw = `${raw}/`;
    }

    if (raw.length > 10) {
      raw = raw.slice(0, 10);
    }

    setDisplayText(raw);

    const iso = dmyToISO(raw);
    if (iso) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    const iso = dmyToISO(displayText);
    if (iso) {
      onChange(iso);
      setDisplayText(isoToDMY(iso));
    } else if (!displayText.trim()) {
      onChange('');
    } else {
      // Khôi phục giá trị hợp lệ trước đó nếu nhập sai
      setDisplayText(isoToDMY(value));
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedIso = e.target.value;
    if (selectedIso) {
      onChange(selectedIso);
      setDisplayText(isoToDMY(selectedIso));
    }
  };

  const openPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateRef.current && 'showPicker' in HTMLInputElement.prototype) {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current?.focus();
      }
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  const cleanIso = value ? value.split('T')[0] : '';

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        className="w-full pl-3 pr-10 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium font-mono text-slate-800 bg-white shadow-xs"
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-[#014D2F] hover:bg-emerald-50 transition-colors"
        title="Chọn từ lịch"
        aria-label="Chọn từ lịch"
      >
        <CalendarIcon className="w-4 h-4 text-[#014D2F]" />
      </button>

      {/* Hidden native date input to trigger browser calendar picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={cleanIso}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}
