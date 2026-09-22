CREATE TABLE "source_records" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"author" text,
	"publisher" text,
	"publication_date" timestamp with time zone,
	"availability" text NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "source_record_availability_check" CHECK ("source_records"."availability" in ('available', 'unavailable'))
);
--> statement-breakpoint
CREATE TABLE "source_reuse" (
	"id" integer PRIMARY KEY NOT NULL,
	"source_version_id" integer NOT NULL,
	"material_type" text NOT NULL,
	"retained_material" text NOT NULL,
	"reuse_basis" text NOT NULL,
	"required_attribution" text NOT NULL,
	"review_state" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_version_locations" (
	"id" integer PRIMARY KEY NOT NULL,
	"source_version_id" integer NOT NULL,
	"url" text NOT NULL,
	"location_type" text NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "source_version_location_unique" UNIQUE("source_version_id","url"),
	CONSTRAINT "source_version_location_type_check" CHECK ("source_version_locations"."location_type" in ('original', 'mirror'))
);
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" integer PRIMARY KEY NOT NULL,
	"source_record_id" integer NOT NULL,
	"change_type" text NOT NULL,
	"change_summary" text,
	"previous_version_id" integer,
	"observed_published_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone NOT NULL,
	"checksum" text,
	"review_state" text NOT NULL,
	CONSTRAINT "source_versions_id_record_unique" UNIQUE("id","source_record_id"),
	CONSTRAINT "source_version_change_type_check" CHECK ("source_versions"."change_type" in ('original', 'edition', 'update', 'translation', 'correction')),
	CONSTRAINT "source_version_predecessor_check" CHECK (("source_versions"."change_type" = 'original' and "source_versions"."previous_version_id" is null and "source_versions"."change_summary" is null) or ("source_versions"."change_type" <> 'original' and "source_versions"."previous_version_id" is not null and "source_versions"."change_summary" is not null))
);
--> statement-breakpoint
ALTER TABLE "source_reuse" ADD CONSTRAINT "source_reuse_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_version_locations" ADD CONSTRAINT "source_version_locations_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_record_id_source_records_id_fk" FOREIGN KEY ("source_record_id") REFERENCES "public"."source_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_version_predecessor_fk" FOREIGN KEY ("previous_version_id","source_record_id") REFERENCES "public"."source_versions"("id","source_record_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "source_version_original_approved_unique" ON "source_versions" USING btree ("source_record_id") WHERE "source_versions"."change_type" = 'original' and "source_versions"."review_state" = 'approved';