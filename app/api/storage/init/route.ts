import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BUCKETS, ensureBucketExists } from '@/lib/supabase/storage';

/**
 * API route to initialize storage buckets
 * This is useful for ensuring the logos bucket exists and is properly configured
 * GET /api/storage/init
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize the logos bucket
    const logosBucketResult = await ensureBucketExists(BUCKETS.LOGOS, true);
    
    // Initialize the invoices bucket
    const invoicesBucketResult = await ensureBucketExists(BUCKETS.INVOICES, true);
    
    return NextResponse.json({
      success: true,
      logosBucket: logosBucketResult,
      invoicesBucket: invoicesBucketResult,
    });
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    
    return NextResponse.json(
      { error: 'Failed to initialize storage buckets' },
      { status: 500 }
    );
  }
}
