CREATE TABLE "authoritative_sources" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_editions" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "electoral_lists" (
	"id" integer PRIMARY KEY NOT NULL,
	"edition_id" integer NOT NULL,
	"name" text NOT NULL,
	"ballot_identifier" text,
	"source_id" integer,
	"review_state" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "electoral_lists" ADD CONSTRAINT "electoral_lists_edition_id_election_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."election_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electoral_lists" ADD CONSTRAINT "electoral_lists_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "election_editions" ("id", "name", "status") VALUES (1, '2026 Knesset election', 'active');