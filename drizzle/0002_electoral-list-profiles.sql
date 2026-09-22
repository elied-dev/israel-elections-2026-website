CREATE TABLE "candidacies" (
	"id" integer PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"electoral_list_id" integer NOT NULL,
	"edition_id" integer NOT NULL,
	CONSTRAINT "candidacy_person_electoral_list_unique" UNIQUE("person_id","electoral_list_id"),
	CONSTRAINT "candidacy_id_electoral_list_unique" UNIQUE("id","electoral_list_id")
);
--> statement-breakpoint
CREATE TABLE "candidacy_revisions" (
	"id" integer PRIMARY KEY NOT NULL,
	"candidacy_id" integer NOT NULL,
	"electoral_list_id" integer NOT NULL,
	"position" integer NOT NULL,
	"status" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "candidacy_revision_position_check" CHECK ("candidacy_revisions"."position" > 0),
	CONSTRAINT "candidacy_revision_status_check" CHECK ("candidacy_revisions"."status" in ('active', 'withdrawn', 'disqualified', 'replaced')),
	CONSTRAINT "candidacy_revision_dates_check" CHECK ("candidacy_revisions"."effective_to" is null or "candidacy_revisions"."effective_to" > "candidacy_revisions"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "electoral_list_parties" (
	"electoral_list_id" integer NOT NULL,
	"political_party_id" integer NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "electoral_list_parties_electoral_list_id_political_party_id_pk" PRIMARY KEY("electoral_list_id","political_party_id")
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "political_actor_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"actor_id" integer NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "political_actor_slug_dates_check" CHECK ("political_actor_slugs"."valid_to" is null or "political_actor_slugs"."valid_to" > "political_actor_slugs"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "political_actors" (
	"id" integer PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"current_display_name" text NOT NULL,
	"current_slug" text NOT NULL,
	CONSTRAINT "political_actors_current_slug_unique" UNIQUE("current_slug"),
	CONSTRAINT "political_actor_type_check" CHECK ("political_actors"."type" in ('person', 'political_party', 'electoral_list')),
	CONSTRAINT "political_actor_slug_not_numeric_check" CHECK ("political_actors"."current_slug" !~ '^[0-9]+$')
);
--> statement-breakpoint
CREATE TABLE "political_parties" (
	"id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidacies" ADD CONSTRAINT "candidacies_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electoral_lists" ADD CONSTRAINT "electoral_lists_id_edition_id_unique" UNIQUE("id","edition_id");--> statement-breakpoint
ALTER TABLE "candidacies" ADD CONSTRAINT "candidacy_electoral_list_edition_fk" FOREIGN KEY ("electoral_list_id","edition_id") REFERENCES "public"."electoral_lists"("id","edition_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidacy_revisions" ADD CONSTRAINT "candidacy_revisions_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidacy_revisions" ADD CONSTRAINT "candidacy_revision_candidacy_list_fk" FOREIGN KEY ("candidacy_id","electoral_list_id") REFERENCES "public"."candidacies"("id","electoral_list_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electoral_list_parties" ADD CONSTRAINT "electoral_list_parties_electoral_list_id_electoral_lists_id_fk" FOREIGN KEY ("electoral_list_id") REFERENCES "public"."electoral_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electoral_list_parties" ADD CONSTRAINT "electoral_list_parties_political_party_id_political_parties_id_fk" FOREIGN KEY ("political_party_id") REFERENCES "public"."political_parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electoral_list_parties" ADD CONSTRAINT "electoral_list_parties_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_id_political_actors_id_fk" FOREIGN KEY ("id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_actor_slugs" ADD CONSTRAINT "political_actor_slugs_actor_id_political_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_parties" ADD CONSTRAINT "political_parties_id_political_actors_id_fk" FOREIGN KEY ("id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidacy_revision_open_unique" ON "candidacy_revisions" USING btree ("candidacy_id") WHERE "candidacy_revisions"."effective_to" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "candidacy_revision_current_position_unique" ON "candidacy_revisions" USING btree ("electoral_list_id","position") WHERE "candidacy_revisions"."effective_to" is null and "candidacy_revisions"."status" = 'active' and "candidacy_revisions"."review_state" = 'approved';--> statement-breakpoint
-- Backfill Political Actor identities for existing Electoral Lists before the
-- electoral_lists -> political_actors foreign key below. The FK requires every
-- existing electoral_lists.id to already have a matching political_actors row;
-- running the backfill after the FK would fail against any pre-existing data.
INSERT INTO "political_actors" ("id", "type", "current_display_name", "current_slug")
SELECT "id", 'electoral_list', "name", 'electoral-list-' || "id"
FROM "electoral_lists";
--> statement-breakpoint
INSERT INTO "political_actor_slugs" ("slug", "actor_id", "valid_from")
SELECT 'electoral-list-' || "id", "id", now()
FROM "electoral_lists";
--> statement-breakpoint
ALTER TABLE "electoral_lists" ADD CONSTRAINT "electoral_lists_id_political_actors_id_fk" FOREIGN KEY ("id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;