CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "political_actor_search_terms" (
	"id" integer PRIMARY KEY NOT NULL,
	"political_actor_id" integer NOT NULL,
	"term" text NOT NULL,
	"term_type" text NOT NULL,
	"language" text NOT NULL,
	"source_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "political_actor_search_term_unique" UNIQUE("political_actor_id","term","term_type","language"),
	CONSTRAINT "political_actor_search_term_content_check" CHECK (btrim("political_actor_search_terms"."term") <> '' and btrim("political_actor_search_terms"."language") <> ''),
	CONSTRAINT "political_actor_search_term_type_check" CHECK ("political_actor_search_terms"."term_type" in ('historical_name', 'alias', 'transliteration', 'spelling_variant'))
);
--> statement-breakpoint
CREATE TABLE "public_claim_tags" (
	"public_claim_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "public_claim_tags_public_claim_id_tag_id_pk" PRIMARY KEY("public_claim_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "source_record_tags" (
	"source_record_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "source_record_tags_source_record_id_tag_id_pk" PRIMARY KEY("source_record_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "tag_name_language_unique" UNIQUE("name","language"),
	CONSTRAINT "tag_content_check" CHECK (btrim("tags"."name") <> '' and btrim("tags"."language") <> '')
);
--> statement-breakpoint
ALTER TABLE "public_claims" DROP CONSTRAINT "public_claim_summary_check";--> statement-breakpoint
-- Existing rows predate language metadata. Preserve that fact instead of inventing a language.
ALTER TABLE "public_claims" ADD COLUMN "language" text;--> statement-breakpoint
UPDATE "public_claims" SET "language" = 'und';--> statement-breakpoint
ALTER TABLE "public_claims" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source_records" ADD COLUMN "source_language" text;--> statement-breakpoint
UPDATE "source_records" SET "source_language" = 'und';--> statement-breakpoint
ALTER TABLE "source_records" ALTER COLUMN "source_language" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "political_actor_search_terms" ADD CONSTRAINT "political_actor_search_terms_political_actor_id_political_actors_id_fk" FOREIGN KEY ("political_actor_id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "political_actor_search_terms" ADD CONSTRAINT "political_actor_search_terms_source_id_authoritative_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."authoritative_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_tags" ADD CONSTRAINT "public_claim_tags_public_claim_id_public_claims_id_fk" FOREIGN KEY ("public_claim_id") REFERENCES "public"."public_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_tags" ADD CONSTRAINT "public_claim_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_record_tags" ADD CONSTRAINT "source_record_tags_source_record_id_source_records_id_fk" FOREIGN KEY ("source_record_id") REFERENCES "public"."source_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_record_tags" ADD CONSTRAINT "source_record_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "political_actor_search_term_trgm_idx" ON "political_actor_search_terms" USING gin (lower("term") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "political_actor_search_term_english_idx" ON "political_actor_search_terms" USING gin (to_tsvector('english', "term")) WHERE "political_actor_search_terms"."language" = 'en' and "political_actor_search_terms"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "political_actor_search_term_french_idx" ON "political_actor_search_terms" USING gin (to_tsvector('french', "term")) WHERE "political_actor_search_terms"."language" = 'fr' and "political_actor_search_terms"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "tag_name_trgm_idx" ON "tags" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tag_name_english_idx" ON "tags" USING gin (to_tsvector('english', "name")) WHERE "tags"."language" = 'en' and "tags"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "tag_name_french_idx" ON "tags" USING gin (to_tsvector('french', "name")) WHERE "tags"."language" = 'fr' and "tags"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "person_name_trgm_idx" ON "person_names" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "political_actor_name_trgm_idx" ON "political_actors" USING gin (lower("current_display_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "public_claim_summary_trgm_idx" ON "public_claims" USING gin (lower("summary") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "public_claim_summary_english_idx" ON "public_claims" USING gin (to_tsvector('english', "summary")) WHERE "public_claims"."language" = 'en' and "public_claims"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "public_claim_summary_french_idx" ON "public_claims" USING gin (to_tsvector('french', "summary")) WHERE "public_claims"."language" = 'fr' and "public_claims"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "quotation_translation_text_trgm_idx" ON "quotation_translations" USING gin (lower("text") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "quotation_translation_text_english_idx" ON "quotation_translations" USING gin (to_tsvector('english', "text")) WHERE "quotation_translations"."language" = 'en' and "quotation_translations"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "quotation_translation_text_french_idx" ON "quotation_translations" USING gin (to_tsvector('french', "text")) WHERE "quotation_translations"."language" = 'fr' and "quotation_translations"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "quotation_text_trgm_idx" ON "quotations" USING gin (lower("text") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "quotation_text_english_idx" ON "quotations" USING gin (to_tsvector('english', "text")) WHERE "quotations"."source_language" = 'en' and "quotations"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "quotation_text_french_idx" ON "quotations" USING gin (to_tsvector('french', "text")) WHERE "quotations"."source_language" = 'fr' and "quotations"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "source_record_title_trgm_idx" ON "source_records" USING gin (lower("title") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "source_record_author_trgm_idx" ON "source_records" USING gin (lower("author") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "source_record_publisher_trgm_idx" ON "source_records" USING gin (lower("publisher") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "source_record_english_idx" ON "source_records" USING gin (to_tsvector('english', "title" || ' ' || coalesce("author", '') || ' ' || coalesce("publisher", ''))) WHERE "source_records"."source_language" = 'en' and "source_records"."review_state" = 'approved';--> statement-breakpoint
CREATE INDEX "source_record_french_idx" ON "source_records" USING gin (to_tsvector('french', "title" || ' ' || coalesce("author", '') || ' ' || coalesce("publisher", ''))) WHERE "source_records"."source_language" = 'fr' and "source_records"."review_state" = 'approved';--> statement-breakpoint
ALTER TABLE "public_claims" ADD CONSTRAINT "public_claim_summary_check" CHECK (btrim("public_claims"."summary") <> '' and btrim("public_claims"."language") <> '');--> statement-breakpoint
ALTER TABLE "source_records" ADD CONSTRAINT "source_record_language_check" CHECK (btrim("source_records"."source_language") <> '');