ALTER TABLE "reservations" ADD COLUMN "payment_status" varchar(24);
ALTER TABLE "reservations" ADD COLUMN "deposit_percent" numeric(5, 2);
ALTER TABLE "reservations" ADD COLUMN "deposit_due_on" date;
ALTER TABLE "reservations" ADD COLUMN "deposit_paid_at" timestamp with time zone;
ALTER TABLE "reservations" ADD COLUMN "balance_due_on" date;
ALTER TABLE "reservations" ADD COLUMN "balance_paid_at" timestamp with time zone;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_deposit_percent_check"
  CHECK ("deposit_percent" IS NULL OR ("deposit_percent" >= 0 AND "deposit_percent" <= 100));
