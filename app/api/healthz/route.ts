import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { status: 'ok' | 'fail'; latencyMs?: number; error?: string }> = {};

  // Database connectivity check — lightweight single-row read
  try {
    const supabase = await createClient();
    const dbStart = Date.now();
    const { error } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    const latencyMs = Date.now() - dbStart;

    if (error) {
      checks.database = { status: 'fail', latencyMs, error: error.message };
    } else {
      checks.database = { status: 'ok', latencyMs };
    }
  } catch (err) {
    checks.database = {
      status: 'fail',
      error: err instanceof Error ? err.message : 'unexpected error',
    };
  }

  const allOk = Object.values(checks).every(c => c.status === 'ok');
  const statusCode = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptimeMs: Date.now() - startedAt,
      checks,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
