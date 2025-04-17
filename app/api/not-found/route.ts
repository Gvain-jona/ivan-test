import { NextResponse } from 'next/server';

/**
 * This API route is used as a destination for development-only routes in production
 * It simply returns a 404 Not Found response
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Route not found' },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Route not found' },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Route not found' },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Route not found' },
    { status: 404 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Route not found' },
    { status: 404 }
  );
}
