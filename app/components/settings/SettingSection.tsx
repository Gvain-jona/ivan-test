'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SettingSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Reusable component for displaying a section of settings
 */
export function SettingSection({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  footer 
}: SettingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {Icon && <Icon className="mr-2 h-5 w-5 text-primary" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
