import { NextResponse, type NextRequest } from 'next/server';
import { syncConfiguredIcalFeeds } from '@/core/services/ical/sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const results = await syncConfiguredIcalFeeds();
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[ical-sync] failed', error);
    return NextResponse.json({ error: 'Calendar synchronization failed.' }, { status: 503 });
  }
}

export const POST = GET;
