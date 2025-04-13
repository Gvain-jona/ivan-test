'use client';

import { useEffect, useState } from 'react';
import AuthHandler from './AuthHandler';

/**
 * Client component wrapper for AuthHandler
 * This is needed because we can't use dynamic imports with ssr: false in Server Components
 */
export default function AuthHandlerWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only render AuthHandler on the client side
  if (!isMounted) return null;
  
  return <AuthHandler />;
}
