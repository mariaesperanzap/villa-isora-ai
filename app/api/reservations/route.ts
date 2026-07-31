import { and, between, desc, eq, gte, lte, SQL } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/core/db';
import { reservations } from '@/core/db/schema';
import { getSessionWorkspace } from '@/core/lib/session';
import {
  createDirectBookingForWorkspace,
  DirectBookingConflictError,
  DirectBookingNotFoundError,
  DirectBookingValidationError,
} from '@/core/services/direct-bookings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getSessionWorkspace();
  if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get('limit') ?? 50), 200);
  const offset = Math.max(Number(sp.get('offset') ?? 0), 0);
  const status = sp.get('status');
  const platform = sp.get('platform');
  const listingId = sp.get('listingId');
  const from = sp.get('from');
  const to = sp.get('to');

  const filters: SQL[] = [eq(reservations.workspaceId, ctx.workspace.id)];
  if (status) filters.push(eq(reservations.status, status));
  if (platform) filters.push(eq(reservations.platform, platform));
  if (listingId) filters.push(eq(reservations.listingId, listingId));
  if (from && to) filters.push(between(reservations.checkIn, from, to));
  else if (from) filters.push(gte(reservations.checkIn, from));
  else if (to) filters.push(lte(reservations.checkIn, to));

  const rows = await db
    .select()
    .from(reservations)
    .where(and(...filters))
    .orderBy(desc(reservations.checkIn))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    data: rows,
    pagination: { limit, offset, returned: rows.length },
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionWorkspace();
  if (!ctx) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | {
        listingId?: unknown;
        checkIn?: unknown;
        checkOut?: unknown;
        guestName?: unknown;
        guestEmail?: unknown;
        guestPhone?: unknown;
        guestCount?: unknown;
        totalPrice?: unknown;
      }
    | null;

  try {
    if (!body || typeof body.listingId !== 'string') {
      throw new DirectBookingValidationError('Property is required.');
    }
    const result = await createDirectBookingForWorkspace({
      workspaceId: ctx.workspace.id,
      listingId: body.listingId,
      checkIn: typeof body.checkIn === 'string' ? body.checkIn : '',
      checkOut: typeof body.checkOut === 'string' ? body.checkOut : '',
      guestName: typeof body.guestName === 'string' ? body.guestName : '',
      guestEmail: typeof body.guestEmail === 'string' ? body.guestEmail : null,
      guestPhone: typeof body.guestPhone === 'string' ? body.guestPhone : null,
      guestCount:
        typeof body.guestCount === 'number' ? body.guestCount : Number.NaN,
      totalPrice:
        body.totalPrice === null || body.totalPrice === undefined
          ? null
          : typeof body.totalPrice === 'number'
            ? body.totalPrice
            : Number.NaN,
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof DirectBookingValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof DirectBookingNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof DirectBookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[direct-bookings] creation failed', error);
    return NextResponse.json(
      { error: 'The booking could not be created. Please try again.' },
      { status: 500 },
    );
  }
}
