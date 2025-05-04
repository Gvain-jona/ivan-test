'use client';

import { CalendarDemo } from '@/components/ui/fullscreen-calendar-demo';

export default function CalendarDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">FullScreenCalendar Demo</h1>
      <div className="border rounded-lg overflow-hidden">
        <CalendarDemo />
      </div>
    </div>
  );
}
