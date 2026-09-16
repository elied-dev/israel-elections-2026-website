CREATE TABLE "application_readiness" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "application_readiness" ("id", "name") VALUES (1, 'application');
