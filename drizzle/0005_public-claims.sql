CREATE TABLE "evidence_citations" (
	"id" integer PRIMARY KEY NOT NULL,
	"public_claim_id" integer NOT NULL,
	"source_version_id" integer NOT NULL,
	"locator_type" text NOT NULL,
	"locator" text NOT NULL,
	"locator_precision" text NOT NULL,
	"precision_explanation" text,
	"review_state" text NOT NULL,
	CONSTRAINT "evidence_citation_unique" UNIQUE("public_claim_id","source_version_id","locator_type","locator"),
	CONSTRAINT "evidence_citation_locator_type_check" CHECK ("evidence_citations"."locator_type" in ('quotation', 'page', 'timestamp', 'section', 'other')),
	CONSTRAINT "evidence_citation_locator_precision_check" CHECK ("evidence_citations"."locator_precision" in ('exact', 'best_available')),
	CONSTRAINT "evidence_citation_locator_check" CHECK (btrim("evidence_citations"."locator") <> '' and ("evidence_citations"."locator_precision" = 'exact' or ("evidence_citations"."precision_explanation" is not null and btrim("evidence_citations"."precision_explanation") <> '')))
);
--> statement-breakpoint
CREATE TABLE "public_claim_speakers" (
	"public_claim_id" integer NOT NULL,
	"political_actor_id" integer NOT NULL,
	CONSTRAINT "public_claim_speakers_public_claim_id_political_actor_id_pk" PRIMARY KEY("public_claim_id","political_actor_id")
);
--> statement-breakpoint
CREATE TABLE "public_claim_subjects" (
	"public_claim_id" integer NOT NULL,
	"political_actor_id" integer NOT NULL,
	CONSTRAINT "public_claim_subjects_public_claim_id_political_actor_id_pk" PRIMARY KEY("public_claim_id","political_actor_id")
);
--> statement-breakpoint
CREATE TABLE "public_claims" (
	"id" integer PRIMARY KEY NOT NULL,
	"summary" text NOT NULL,
	"statement_from" timestamp with time zone,
	"statement_from_precision" text NOT NULL,
	"statement_to" timestamp with time zone,
	"statement_to_precision" text NOT NULL,
	"reviewed_at" timestamp with time zone,
	"review_state" text NOT NULL,
	CONSTRAINT "public_claim_summary_check" CHECK (btrim("public_claims"."summary") <> ''),
	CONSTRAINT "public_claim_statement_from_precision_check" CHECK (("public_claims"."statement_from_precision" = 'unknown') = ("public_claims"."statement_from" is null)),
	CONSTRAINT "public_claim_statement_to_precision_check" CHECK (("public_claims"."statement_to_precision" = 'unknown') = ("public_claims"."statement_to" is null)),
	CONSTRAINT "public_claim_statement_precision_check" CHECK ("public_claims"."statement_from_precision" in ('day', 'month', 'year', 'unknown') and "public_claims"."statement_to_precision" in ('day', 'month', 'year', 'unknown')),
	CONSTRAINT "public_claim_statement_dates_check" CHECK ("public_claims"."statement_to" is null or "public_claims"."statement_from" is null or "public_claims"."statement_to" >= "public_claims"."statement_from"),
	CONSTRAINT "public_claim_review_check" CHECK ("public_claims"."review_state" <> 'approved' or "public_claims"."reviewed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "quotation_translations" (
	"id" integer PRIMARY KEY NOT NULL,
	"quotation_id" integer NOT NULL,
	"language" text NOT NULL,
	"text_direction" text NOT NULL,
	"text" text NOT NULL,
	"machine_assisted" boolean DEFAULT false NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "quotation_translation_content_check" CHECK (btrim("quotation_translations"."language") <> '' and btrim("quotation_translations"."text") <> ''),
	CONSTRAINT "quotation_translation_direction_check" CHECK ("quotation_translations"."text_direction" in ('ltr', 'rtl'))
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" integer PRIMARY KEY NOT NULL,
	"evidence_citation_id" integer NOT NULL,
	"source_language" text NOT NULL,
	"text_direction" text NOT NULL,
	"text" text NOT NULL,
	"review_state" text NOT NULL,
	CONSTRAINT "quotation_content_check" CHECK (btrim("quotations"."source_language") <> '' and btrim("quotations"."text") <> ''),
	CONSTRAINT "quotation_direction_check" CHECK ("quotations"."text_direction" in ('ltr', 'rtl'))
);
--> statement-breakpoint
ALTER TABLE "evidence_citations" ADD CONSTRAINT "evidence_citations_public_claim_id_public_claims_id_fk" FOREIGN KEY ("public_claim_id") REFERENCES "public"."public_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_citations" ADD CONSTRAINT "evidence_citations_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_speakers" ADD CONSTRAINT "public_claim_speakers_public_claim_id_public_claims_id_fk" FOREIGN KEY ("public_claim_id") REFERENCES "public"."public_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_speakers" ADD CONSTRAINT "public_claim_speakers_political_actor_id_political_actors_id_fk" FOREIGN KEY ("political_actor_id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_subjects" ADD CONSTRAINT "public_claim_subjects_public_claim_id_public_claims_id_fk" FOREIGN KEY ("public_claim_id") REFERENCES "public"."public_claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_claim_subjects" ADD CONSTRAINT "public_claim_subjects_political_actor_id_political_actors_id_fk" FOREIGN KEY ("political_actor_id") REFERENCES "public"."political_actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_translations" ADD CONSTRAINT "quotation_translations_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_evidence_citation_id_evidence_citations_id_fk" FOREIGN KEY ("evidence_citation_id") REFERENCES "public"."evidence_citations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quotation_translation_approved_language_unique" ON "quotation_translations" USING btree ("quotation_id","language") WHERE "quotation_translations"."review_state" = 'approved';