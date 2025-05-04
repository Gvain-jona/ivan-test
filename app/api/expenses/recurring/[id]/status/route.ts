import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/unified-server';
import { handleApiError } from '@/lib/api/error-handler';

/**
 * PATCH /api/expenses/recurring/[id]/status
 * Updates the status of a recurring expense occurrence
 *
 * DEPRECATED: Use /api/expenses/recurring/[id] instead
 * This endpoint is kept for backward compatibility
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now async and needs to be awaited
    const { id } = await params;

    if (!id) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Occurrence ID is required',
        { param: 'id' }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'completed', 'skipped'].includes(status)) {
      return handleApiError(
        'VALIDATION_ERROR',
        'Valid status is required (pending, completed, or skipped)',
        { param: 'status' }
      );
    }

    // Forward the request to the main endpoint
    const mainEndpointUrl = new URL(`/api/expenses/recurring/${id}`, request.url);
    const mainEndpointRequest = new Request(mainEndpointUrl, {
      method: 'PATCH',
      headers: request.headers,
      body: JSON.stringify(body)
    });

    // Log deprecation warning
    console.warn(`DEPRECATED API CALL: /api/expenses/recurring/${id}/status is deprecated. Use /api/expenses/recurring/${id} instead.`);

    // Forward to the main endpoint
    const response = await fetch(mainEndpointRequest);
    return response;
  } catch (error) {
    return handleApiError(
      'SERVER_ERROR',
      'An unexpected error occurred',
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
