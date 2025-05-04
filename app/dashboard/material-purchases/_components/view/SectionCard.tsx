'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={cn(
      "p-3 rounded-lg border border-border/40 bg-muted/5",
      className
    )}>
      {children}
    </div>
  );
}

interface SectionCardLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCardLabel({ children, className }: SectionCardLabelProps) {
  return (
    <p className={cn(
      "text-xs text-muted-foreground mb-1",
      className
    )}>
      {children}
    </p>
  );
}

interface SectionCardValueProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionCardValue({ children, className }: SectionCardValueProps) {
  return (
    <p className={cn(
      "text-lg font-medium",
      className
    )}>
      {children}
    </p>
  );
}
