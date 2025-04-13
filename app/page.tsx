'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [processingAuth, setProcessingAuth] = useState(true);

  useEffect(() => {
    // Check for authentication tokens in URL
    const hasAuthTokens = typeof window !== 'undefined' && 
      (window.location.search.includes('token=') || 
       window.location.hash.includes('access_token='));
    
    // If we have auth tokens, give more time for processing
    if (hasAuthTokens) {
      console.log('Auth tokens detected in URL, waiting for processing...');
      // Set a longer timeout to allow auth processing to complete
      const timer = setTimeout(() => {
        setProcessingAuth(false);
      }, 3000); // 3 seconds should be enough for auth processing
      
      return () => clearTimeout(timer);
    } else {
      // No tokens, don't need extra processing time
      setProcessingAuth(false);
    }
  }, []);

  useEffect(() => {
    // Only redirect when not loading and not processing auth
    if (!isLoading && !processingAuth) {
      if (user) {
        router.push('/dashboard/orders');
      } else {
        router.push('/auth/signin');
      }
    }
  }, [user, isLoading, processingAuth, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-900 p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Ivan Prints</h1>
          <p className="mt-2 text-gray-400">Business Management System</p>
          <div className="mt-6">
            <p className="text-gray-400">
              {isLoading || processingAuth ? 'Processing authentication...' : 'Redirecting...'}
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-800">
                <div className="animate-pulse h-full w-full bg-blue-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}