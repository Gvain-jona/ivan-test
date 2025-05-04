'use client';

import React from 'react';
import { CheckSquare, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export function TasksTabContent() {
  return (
    <Card className="bg-transparent border-border/40">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Expense-related tasks</h3>
          <p className="text-muted-foreground max-w-md">This feature is currently under development. You'll be able to manage tasks related to your expenses here.</p>
          <Button variant="outline" className="mt-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
