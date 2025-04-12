'use client';

import { useState } from 'react';
import { useAuthV2 } from '@/app/context/auth-provider-v2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component for the new auth provider
 * 
 * This component is used to test the functionality of the new auth provider
 * without affecting the rest of the application.
 */
export function AuthTest() {
  const { 
    user, 
    profile, 
    isLoading, 
    signOut, 
    clearPinVerification,
    resetInactivityTimer,
    checkSupabaseHealth
  } = useAuthV2();
  
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean, error?: any } | null>(null);
  
  const handleCheckHealth = async () => {
    const status = await checkSupabaseHealth();
    setHealthStatus(status);
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Auth Provider V2 Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">User Info</h3>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify({ 
              id: user?.id,
              email: user?.email,
              authenticated: !!user
            }, null, 2)}
          </pre>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Profile Info</h3>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify({
              id: profile?.id,
              email: profile?.email,
              role: profile?.role,
              hasPinSet: !!profile?.pin,
              isVerified: profile?.is_verified
            }, null, 2)}
          </pre>
        </div>
        
        {healthStatus && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Health Check</h3>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button onClick={handleCheckHealth} variant="outline">
            Check Supabase Health
          </Button>
          
          <Button onClick={clearPinVerification} variant="outline">
            Clear PIN Verification
          </Button>
          
          <Button onClick={resetInactivityTimer} variant="outline">
            Reset Inactivity Timer
          </Button>
          
          <Button onClick={signOut} variant="destructive">
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
