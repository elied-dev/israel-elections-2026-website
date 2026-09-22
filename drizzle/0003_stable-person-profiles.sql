CREATE TABLE "office_tenures" (
	"id" integer PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"office_title" text NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_from_precision" text NOT NULL,
	"valid_to" timestamp with time zone,
	"valid_to_precision" text NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "office_tenure_valid_from_precision_check" CHECK (("office_tenures"."valid_from_precision" = 'unknown') = ("office_tenures"."valid_from" is null)),
	CONSTRAINT "office_tenure_valid_to_precision_check" CHECK (("office_tenures"."valid_to_precision" = 'unknown') = ("office_tenures"."valid_to" is null)),
	CONSTRAINT "office_tenure_precision_check" CHECK ("office_tenures"."valid_from_precision" in ('day', 'month', 'year', 'unknown') and "office_tenures"."valid_to_precision" in ('day', 'month', 'year', 'unknown')),
	CONSTRAINT "office_tenure_dates_check" CHECK ("office_tenures"."valid_to" is null or "office_tenures"."valid_from" is null or "office_tenures"."valid_to" >= "office_tenures"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "party_affiliations" (
	"id" integer PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"political_party_id" integer NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_from_precision" text NOT NULL,
	"valid_to" timestamp with time zone,
	"valid_to_precision" text NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "party_affiliation_valid_from_precision_check" CHECK (("party_affiliations"."valid_from_precision" = 'unknown') = ("party_affiliations"."valid_from" is null)),
	CONSTRAINT "party_affiliation_valid_to_precision_check" CHECK (("party_affiliations"."valid_to_precision" = 'unknown') = ("party_affiliations"."valid_to" is null)),
	CONSTRAINT "party_affiliation_precision_check" CHECK ("party_affiliations"."valid_from_precision" in ('day', 'month', 'year', 'unknown') and "party_affiliations"."valid_to_precision" in ('day', 'month', 'year', 'unknown')),
	CONSTRAINT "party_affiliation_dates_check" CHECK ("party_affiliations"."valid_to" is null or "party_affiliations"."valid_from" is null or "party_affiliations"."valid_to" >= "party_affiliations"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "person_names" (
	"id" integer PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_type" text NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_from_precision" text NOT NULL,
	"valid_to" timestamp with time zone,
	"valid_to_precision" text NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "person_name_type_check" CHECK ("person_names"."name_type" in ('name', 'alias')),
	CONSTRAINT "person_name_valid_from_precision_check" CHECK (("person_names"."valid_from_precision" = 'unknown') = ("person_names"."valid_from" is null)),
	CONSTRAINT "person_name_valid_to_precision_check" CHECK (("person_names"."valid_to_precision" = 'unknown') = ("person_names"."valid_to" is null)),
	CONSTRAINT "person_name_precision_check" CHECK ("person_names"."valid_from_precision" in ('day', 'month', 'year', 'unknown') and "person_names"."valid_to_precision" in ('day', 'month', 'year', 'unknown')),
	CONSTRAINT "person_name_dates_check" CHECK ("person_names"."valid_to" is null or "person_names"."valid_from" is null or "person_names"."valid_to" >= "person_names"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "political_status_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"political_status_id" integer NOT NULL,
	"party_affiliation_id" integer,
	"office_tenure_id" integer,
	"candidacy_id" integer,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "political_status_item_one_reference_check" CHECK (((case when "political_status_items"."party_affiliation_id" is null then 0 else 1 end) + (case when "political_status_items"."office_tenure_id" is null then 0 else 1 end) + (case when "political_status_items"."candidacy_id" is null then 0 else 1 end)) = 1)
);
--> statement-breakpoint
CREATE TABLE "political_statuses" (
	"id" integer PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"summary" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	"superseded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "office_tenures" ADD CONSTRAINT "office_tenures_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_tenures" ADD CONSTRAINT "office_tenures_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_affiliations" ADD CONSTRAINT "party_affiliations_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_affiliations" ADD CONSTRAINT "party_affiliations_political_party_id_political_parties_id_fk" FOREIGN KEY ("political_party_id") REFERENCES "public"."political_parties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_affiliations" ADD CONSTRAINT "party_affiliations_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_names" ADD CONSTRAINT "person_names_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_names" ADD CONSTRAINT "person_names_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_status_items" ADD CONSTRAINT "political_status_items_political_status_id_political_statuses_id_fk" FOREIGN KEY ("political_status_id") REFERENCES "public"."political_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_status_items" ADD CONSTRAINT "political_status_items_party_affiliation_id_party_affiliations_id_fk" FOREIGN KEY ("party_affiliation_id") REFERENCES "public"."party_affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_status_items" ADD CONSTRAINT "political_status_items_office_tenure_id_office_tenures_id_fk" FOREIGN KEY ("office_tenure_id") REFERENCES "public"."office_tenures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_status_items" ADD CONSTRAINT "political_status_items_candidacy_id_candidacies_id_fk" FOREIGN KEY ("candidacy_id") REFERENCES "public"."candidacies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_status_items" ADD CONSTRAINT "political_status_items_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_statuses" ADD CONSTRAINT "political_statuses_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_statuses" ADD CONSTRAINT "political_statuses_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "political_status_item_party_unique" ON "political_status_items" USING btree ("political_status_id","party_affiliation_id") WHERE "political_status_items"."party_affiliation_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "political_status_item_office_unique" ON "political_status_items" USING btree ("political_status_id","office_tenure_id") WHERE "political_status_items"."office_tenure_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "political_status_item_candidacy_unique" ON "political_status_items" USING btree ("political_status_id","candidacy_id") WHERE "political_status_items"."candidacy_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "political_status_current_approved_unique" ON "political_statuses" USING btree ("person_id") WHERE "political_statuses"."review_state" = 'approved' and "political_statuses"."superseded_at" is null;