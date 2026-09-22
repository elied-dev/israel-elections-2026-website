CREATE TABLE "policy_positions" (
	"public_claim_id" integer PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	CONSTRAINT "policy_position_topic_check" CHECK (btrim("policy_positions"."topic") <> '')
);
--> statement-breakpoint
ALTER TABLE "policy_positions" ADD CONSTRAINT "policy_positions_public_claim_id_public_claims_id_fk" FOREIGN KEY ("public_claim_id") REFERENCES "public"."public_claims"("id") ON DELETE no action ON UPDATE no action;