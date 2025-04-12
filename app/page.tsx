'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Function to calculate time until next Sunday 12am + 48 hours
function getTimeUntilFeatureActivation() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate days until next Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  
  // Create date object for next Sunday at 12am
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);
  
  // If today is Sunday and it's past 12am, use next Sunday
  if (dayOfWeek === 0 && now.getHours() >= 0) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }
  
  // Add 48 hours to next Sunday 12am
  const activationTime = new Date(nextSunday.getTime() + 48 * 60 * 60 * 1000);
  
  // Calculate time difference
  const timeDiff = activationTime.getTime() - now.getTime();
  
  // If countdown is finished
  if (timeDiff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  // Calculate hours, minutes, seconds
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

export default function Home() {
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilFeatureActivation());
  
  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilFeatureActivation());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Ivan Prints</h1>
          <p className="mt-2 text-gray-400">Business Management System</p>
          
          <div className="mt-6 bg-blue-900/30 border border-blue-800 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-300">Feature Activation Notice</h3>
                <p className="text-sm text-blue-400 mt-1">
                  Some features will be inactive until full product upload to the server is complete.
                </p>
                <div className="mt-2 flex items-center gap-2 font-medium text-sm">
                  <span className="text-blue-300">
                    Upload will finish in: <span className="text-blue-200 font-bold">
                      {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <a 
              href="/dashboard/orders" 
              className="block w-full rounded-md bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              View Orders Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}