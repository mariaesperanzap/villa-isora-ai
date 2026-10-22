CREATE TABLE "ical_feeds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE cascade,
  "provider" varchar(32) NOT NULL,
  "status" varchar(24) DEFAULT 'configured' NOT NULL,
  "last_attempt_at" timestamp with time zone,
  "last_success_at" timestamp with time zone,
  "last_event_count" integer,
  "error_code" varchar(64),
  "etag" text,
  "last_modified" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "ical_feeds_listing_provider_uq" ON "ical_feeds" ("listing_id", "provider");

CREATE TABLE "ical_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "feed_id" uuid NOT NULL REFERENCES "ical_feeds"("id") ON DELETE cascade,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE cascade,
  "uid_hash" varchar(64) NOT NULL,
  "check_in" date NOT NULL,
  "check_out" date NOT NULL,
  "status" varchar(16) DEFAULT 'active' NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "ical_events_feed_uid_uq" ON "ical_events" ("feed_id", "uid_hash");
CREATE INDEX "ical_events_listing_dates_idx" ON "ical_events" ("listing_id", "status", "check_in", "check_out");
