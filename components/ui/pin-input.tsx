'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from './input';

interface PinInputProps {
  length: number;
  value: string[];
  onChange: (value: string, index: number) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  disabled?: boolean;
}

export function PinInput({
  length = 4,
  value,
  onChange,
  type = 'text',
  placeholder = '•',
  disabled = false,
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value;
    
    // Only allow digits if type is number
    if (type === 'number' && !/^\d*$/.test(newValue)) {
      return;
    }
    
    // Take only the last character if more than one is pasted
    const sanitizedValue = newValue.slice(-1);
    
    // Call the onChange handler
    onChange(sanitizedValue, index);
    
    // Move focus to next input if value is entered
    if (sanitizedValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move focus to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Move focus to next input on right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Move focus to previous input on left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // If pasting a value that matches our length, distribute it across inputs
    if (pastedData.length === length) {
      const newValues = pastedData.split('');
      
      // If type is number, ensure all pasted values are digits
      if (type === 'number' && !newValues.every(val => /^\d$/.test(val))) {
        return;
      }
      
      // Update all values
      newValues.forEach((val, i) => {
        onChange(val, i);
      });
      
      // Focus the last input
      inputRefs.current[length - 1]?.focus();
    } else if (pastedData.length === 1) {
      // If pasting a single character, just use it for the current input
      onChange(pastedData, index);
      
      // Move focus to next input if there is one
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          id={`pin-${index}`}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode={type === 'number' ? 'numeric' : 'text'}
          pattern={type === 'number' ? '[0-9]*' : undefined}
          maxLength={1}
          className="w-12 h-12 text-center text-lg font-medium"
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
