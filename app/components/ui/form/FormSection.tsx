import React from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
}

/**
 * A reusable form section component with title and description
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
  contentClassName,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className={cn('text-lg font-medium', titleClassName)}>
              {title}
            </h3>
          )}
          {description && (
            <p className={cn('text-sm text-gray-400', descriptionClassName)}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn('space-y-4', contentClassName)}>{children}</div>
    </div>
  );
};

export default FormSection; 