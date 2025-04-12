'use client';

import { AuthProviderV2 } from '@/app/context/auth-provider-v2';
import { AuthTest } from '@/app/components/auth/auth-test';

/**
 * Test page for the new auth provider
 * 
 * This page wraps the test component with the new auth provider
 * to test its functionality in isolation.
 */
export default function AuthTestPage() {
  return (
    <AuthProviderV2>
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Auth Provider V2 Test Page</h1>
        <p className="mb-6 text-muted-foreground">
          This page tests the new auth provider implementation without affecting the rest of the application.
        </p>
        <AuthTest />
      </div>
    </AuthProviderV2>
  );
}
