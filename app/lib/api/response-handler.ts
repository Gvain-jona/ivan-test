'use server';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Standard success response structure
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    totalCount?: number;
    pageCount?: number;
    currentPage?: number;
    [key: string]: any;
  };
}

/**
 * Create a standardized API success response
 *
 * @param data Response data
 * @param meta Optional metadata
 * @param status HTTP status code (default: 200)
 * @returns NextResponse with data and metadata
 */
export async function createApiResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status: number = 200
): Promise<NextResponse<ApiSuccessResponse<T>>> {
  // Create the success response
  const successResponse: ApiSuccessResponse<T> = {
    data,
    ...(meta && { meta })
  };

  // Create the response
  const response = NextResponse.json(
    successResponse,
    { status }
  );

  // Add cache control headers for GET requests (status 200)
  if (status === 200) {
    // Use a short cache time (10 seconds) to ensure fresh data
    // while still providing some caching benefit
    response.headers.set(
      'Cache-Control',
      'public, max-age=10, s-maxage=10, stale-while-revalidate=30, must-revalidate'
    );

    // Add ETag for conditional requests
    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    response.headers.set('ETag', `"${etag}"`);
  }

  return response;
}

/**
 * Create a standardized API created response
 *
 * @param data Created resource data
 * @param meta Optional metadata
 * @returns NextResponse with status 201
 */
export async function createCreatedResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta']
): Promise<NextResponse<ApiSuccessResponse<T>>> {
  return createApiResponse(data, meta, 201);
}

/**
 * Create a standardized API no content response
 *
 * @returns NextResponse with status 204
 */
export async function createNoContentResponse(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204 });
}
