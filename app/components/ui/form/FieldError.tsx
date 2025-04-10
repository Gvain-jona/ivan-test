'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  errors?: string[];
  fieldName?: string;
}

/**
 * Component to display field-specific errors inline
 */
export const FieldError: React.FC<FieldErrorProps> = ({ errors, fieldName }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="mt-1 text-sm text-destructive flex items-start gap-1.5">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        {errors.map((error, index) => (
          <div key={index} className="leading-tight">
            {error}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldError;
