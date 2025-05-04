'use client';

import React from 'react';

interface SettingItemProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Reusable component for displaying a setting item with title, description, and control
 */
export function SettingItem({ title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
