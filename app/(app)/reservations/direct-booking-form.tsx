'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function DirectBookingForm(props: {
  listingId: string;
  listingName: string;
  currency: string;
  maxGuests: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const totalValue = String(form.get('totalPrice') ?? '').trim();
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listingId: props.listingId,
          checkIn: form.get('checkIn'),
          checkOut: form.get('checkOut'),
          guestName: form.get('guestName'),
          guestEmail: form.get('guestEmail'),
          guestPhone: form.get('guestPhone'),
          guestCount: Number(form.get('guestCount')),
          totalPrice: totalValue ? Number(totalValue) : null,
        }),
      });
      const payload = (await response.json()) as {
        data?: { confirmationCode?: string };
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? 'The booking could not be created.');
        return;
      }
      formElement.reset();
      setSuccess(`Created ${payload.data?.confirmationCode ?? 'direct booking'}.`);
      router.refresh();
    } catch {
      setError('The booking could not be created. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="card p-4">
      <summary className="cursor-pointer font-medium">Create test direct booking</summary>
      <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submit}>
        <div className="md:col-span-3 text-xs muted">
          Property: {props.listingName}. Test data only; nothing is sent externally.
        </div>
        <Field label="Guest name"><input className="input" name="guestName" required /></Field>
        <Field label="Guest email"><input className="input" name="guestEmail" type="email" /></Field>
        <Field label="Guest phone"><input className="input" name="guestPhone" /></Field>
        <Field label="Check-in"><input className="input" name="checkIn" type="date" required /></Field>
        <Field label="Check-out"><input className="input" name="checkOut" type="date" required /></Field>
        <Field label="Guests">
          <input className="input" name="guestCount" type="number" min="1" max={props.maxGuests} defaultValue="2" required />
        </Field>
        <Field label={`Total (${props.currency})`}>
          <input className="input" name="totalPrice" type="number" min="0" step="0.01" />
        </Field>
        <div className="md:col-span-2 flex items-end justify-end">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create direct booking'}
          </button>
        </div>
        {error ? <div className="md:col-span-3 text-sm text-red-300">{error}</div> : null}
        {success ? <div className="md:col-span-3 text-sm text-emerald-300">{success}</div> : null}
      </form>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs muted uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}
