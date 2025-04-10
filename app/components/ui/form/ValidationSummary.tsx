'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ValidationSummaryProps {
  errors: Record<string, string[]>;
  title?: string;
  onSectionClick?: (section: string) => void;
}

/**
 * Component to display a summary of all validation errors
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  title = "Validation Errors", 
  onSectionClick 
}) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  // Group errors by section
  const errorsBySection: Record<string, string[]> = {};
  
  Object.entries(errors).forEach(([path, messages]) => {
    let section = 'general-info';
    
    if (path.startsWith('items')) {
      section = 'items';
    } else if (path.startsWith('payments')) {
      section = 'payments';
    } else if (path.startsWith('notes')) {
      section = 'notes';
    }
    
    if (!errorsBySection[section]) {
      errorsBySection[section] = [];
    }
    
    messages.forEach(message => {
      const fieldName = path.split('.').pop();
      errorsBySection[section].push(`${fieldName}: ${message}`);
    });
  });

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="mt-2">
          {Object.entries(errorsBySection).map(([section, messages]) => (
            <div key={section} className="mb-2">
              <h4 
                className="font-medium cursor-pointer hover:underline" 
                onClick={() => onSectionClick && onSectionClick(section)}
              >
                {section === 'general-info' ? 'General Information' : 
                 section === 'items' ? 'Order Items' : 
                 section === 'payments' ? 'Payments' : 
                 section === 'notes' ? 'Notes' : section}:
              </h4>
              <ul className="list-disc pl-5 mt-1">
                {messages.map((message, index) => (
                  <li key={index} className="text-sm">{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ValidationSummary;
