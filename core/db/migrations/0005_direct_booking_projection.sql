ALTER TABLE "calendar_days"
ADD COLUMN "reservation_id" uuid;

ALTER TABLE "calendar_days"
ADD CONSTRAINT "calendar_days_reservation_id_reservations_id_fk"
FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id")
ON DELETE cascade;

CREATE INDEX "calendar_days_reservation_id_idx"
ON "calendar_days" ("reservation_id");
