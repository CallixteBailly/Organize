CREATE TYPE "public"."document_type" AS ENUM('invoice', 'credit_note', 'quote', 'repair_order');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'finalized', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."line_type" AS ENUM('part', 'labor', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'check', 'online');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."repair_order_status" AS ENUM('draft', 'pending', 'approved', 'in_progress', 'completed', 'invoiced', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('entry', 'exit', 'adjustment', 'return');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'mechanic', 'secretary');--> statement-breakpoint
CREATE TABLE "garages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"siret" varchar(14) NOT NULL,
	"vat_number" varchar(20),
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(10) NOT NULL,
	"country" varchar(2) DEFAULT 'FR' NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(255),
	"logo_url" text,
	"invoice_prefix" varchar(10) DEFAULT 'FA' NOT NULL,
	"next_invoice_number" integer DEFAULT 1 NOT NULL,
	"quote_prefix" varchar(10) DEFAULT 'DE' NOT NULL,
	"next_quote_number" integer DEFAULT 1 NOT NULL,
	"repair_order_prefix" varchar(10) DEFAULT 'OR' NOT NULL,
	"next_repair_order_number" integer DEFAULT 1 NOT NULL,
	"settings" jsonb DEFAULT '{"defaultVatRate":20,"laborHourlyRate":50,"currency":"EUR","timezone":"Europe/Paris","lowStockAlertEnabled":true,"autoReminderDays":[7,15,30],"paymentTermsDays":30}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "garages_siret_unique" UNIQUE("siret")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'mechanic' NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'individual' NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"company_name" varchar(255),
	"siret" varchar(14),
	"vat_number" varchar(20),
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(10),
	"notes" text,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"license_plate" varchar(20),
	"vin" varchar(17),
	"brand" varchar(100),
	"model" varchar(100),
	"version" varchar(100),
	"year" integer,
	"engine_type" varchar(50),
	"mileage" integer,
	"color" varchar(50),
	"k_type_id" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plate_identity" (
	"plate" varchar(20) PRIMARY KEY NOT NULL,
	"make" varchar(100),
	"model" varchar(100),
	"year" integer,
	"fuel_type" varchar(50),
	"engine_code" varchar(100),
	"displacement" integer,
	"k_type_id" integer,
	"provider" varchar(20) DEFAULT 'largus' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" uuid,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"category_id" uuid,
	"reference" varchar(100) NOT NULL,
	"barcode" varchar(100),
	"oem_reference" varchar(100),
	"name" varchar(255) NOT NULL,
	"description" text,
	"brand" varchar(100),
	"purchase_price" numeric(10, 2),
	"selling_price" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) DEFAULT '20.00' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_quantity" integer DEFAULT 0 NOT NULL,
	"max_quantity" integer,
	"location" varchar(100),
	"unit" varchar(20) DEFAULT 'piece' NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"stock_item_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2),
	"reason" text,
	"repair_order_id" uuid,
	"order_id" uuid,
	"performed_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"contact_name" varchar(200),
	"email" varchar(255),
	"phone" varchar(20),
	"address" text,
	"website" varchar(255),
	"delivery_days" integer,
	"min_order_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"stock_item_id" uuid,
	"supplier_reference" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"total_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"expected_delivery_date" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"supplier_order_ref" varchar(100),
	"tracking_number" varchar(100),
	"ordered_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"stock_item_id" uuid,
	"catalog_entry_id" uuid,
	"reference" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"quantity_received" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"repair_order_number" varchar(50) NOT NULL,
	"status" "repair_order_status" DEFAULT 'draft' NOT NULL,
	"mileage_at_intake" integer,
	"customer_complaint" text,
	"diagnosis" text,
	"work_performed" text,
	"total_parts_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_labor_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_vat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"signature_data_url" text,
	"signed_at" timestamp with time zone,
	"quote_id" uuid,
	"invoice_id" uuid,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" uuid NOT NULL,
	"type" "line_type" NOT NULL,
	"stock_item_id" uuid,
	"reference" varchar(100),
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"total_ht" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"quote_number" varchar(50) NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp with time zone,
	"total_parts_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_labor_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_vat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"signature_data_url" text,
	"signed_at" timestamp with time zone,
	"repair_order_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"type" "line_type" NOT NULL,
	"stock_item_id" uuid,
	"reference" varchar(100),
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"total_ht" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"repair_order_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"document_type" "document_type" DEFAULT 'invoice' NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_address" text NOT NULL,
	"customer_siret" varchar(14),
	"customer_vat_number" varchar(20),
	"total_ht" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_vat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_ttc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"nf525_hash" text,
	"nf525_previous_hash" text,
	"nf525_sequence" integer,
	"credit_note_for_id" uuid,
	"notes" text,
	"payment_terms" text,
	"pdf_url" text,
	"sent_at" timestamp with time zone,
	"sent_via" varchar(20),
	"last_reminder_at" timestamp with time zone,
	"reminder_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"type" "line_type" NOT NULL,
	"stock_item_id" uuid,
	"reference" varchar(100),
	"description" varchar(500) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"total_ht" numeric(10, 2) NOT NULL,
	"total_vat" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"garage_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"stripe_payment_intent_id" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invitation_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_categories" ADD CONSTRAINT "stock_categories_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_category_id_stock_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."stock_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog" ADD CONSTRAINT "supplier_catalog_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog" ADD CONSTRAINT "supplier_catalog_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ordered_by_users_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_catalog_entry_id_supplier_catalog_id_fk" FOREIGN KEY ("catalog_entry_id") REFERENCES "public"."supplier_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_order_lines" ADD CONSTRAINT "repair_order_lines_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_order_lines" ADD CONSTRAINT "repair_order_lines_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_garage_id_garages_id_fk" FOREIGN KEY ("garage_id") REFERENCES "public"."garages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_garage_idx" ON "users" USING btree ("email","garage_id");--> statement-breakpoint
CREATE INDEX "users_garage_idx" ON "users" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "customers_garage_idx" ON "customers" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("garage_id","phone");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("garage_id","email");--> statement-breakpoint
CREATE INDEX "customers_name_idx" ON "customers" USING btree ("garage_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "vehicles_garage_idx" ON "vehicles" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "vehicles_customer_idx" ON "vehicles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "vehicles_plate_idx" ON "vehicles" USING btree ("garage_id","license_plate");--> statement-breakpoint
CREATE INDEX "vehicles_vin_idx" ON "vehicles" USING btree ("garage_id","vin");--> statement-breakpoint
CREATE INDEX "plate_identity_make_idx" ON "plate_identity" USING btree ("make");--> statement-breakpoint
CREATE INDEX "plate_identity_ktypeid_idx" ON "plate_identity" USING btree ("k_type_id");--> statement-breakpoint
CREATE INDEX "stock_categories_garage_idx" ON "stock_categories" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "stock_items_garage_idx" ON "stock_items" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "stock_items_barcode_idx" ON "stock_items" USING btree ("garage_id","barcode");--> statement-breakpoint
CREATE INDEX "stock_items_reference_idx" ON "stock_items" USING btree ("garage_id","reference");--> statement-breakpoint
CREATE INDEX "stock_items_category_idx" ON "stock_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "stock_items_low_stock_idx" ON "stock_items" USING btree ("garage_id","quantity","min_quantity");--> statement-breakpoint
CREATE INDEX "stock_movements_garage_idx" ON "stock_movements" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "stock_movements_item_idx" ON "stock_movements" USING btree ("stock_item_id");--> statement-breakpoint
CREATE INDEX "stock_movements_date_idx" ON "stock_movements" USING btree ("garage_id","created_at");--> statement-breakpoint
CREATE INDEX "suppliers_garage_idx" ON "suppliers" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "supplier_catalog_supplier_idx" ON "supplier_catalog" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "supplier_catalog_item_idx" ON "supplier_catalog" USING btree ("stock_item_id");--> statement-breakpoint
CREATE INDEX "supplier_catalog_ref_idx" ON "supplier_catalog" USING btree ("supplier_id","supplier_reference");--> statement-breakpoint
CREATE INDEX "orders_garage_idx" ON "orders" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "orders_supplier_idx" ON "orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("garage_id","status");--> statement-breakpoint
CREATE INDEX "orders_date_idx" ON "orders" USING btree ("garage_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "repair_orders_garage_idx" ON "repair_orders" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "repair_orders_customer_idx" ON "repair_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "repair_orders_vehicle_idx" ON "repair_orders" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "repair_orders_status_idx" ON "repair_orders" USING btree ("garage_id","status");--> statement-breakpoint
CREATE INDEX "repair_orders_date_idx" ON "repair_orders" USING btree ("garage_id","created_at");--> statement-breakpoint
CREATE INDEX "repair_order_lines_ro_idx" ON "repair_order_lines" USING btree ("repair_order_id");--> statement-breakpoint
CREATE INDEX "quotes_garage_idx" ON "quotes" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "quotes_customer_idx" ON "quotes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("garage_id","status");--> statement-breakpoint
CREATE INDEX "quote_lines_quote_idx" ON "quote_lines" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "invoices_garage_idx" ON "invoices" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("garage_id","status");--> statement-breakpoint
CREATE INDEX "invoices_date_idx" ON "invoices" USING btree ("garage_id","issue_date");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_garage_idx" ON "invoices" USING btree ("garage_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_nf525_seq_idx" ON "invoices" USING btree ("garage_id","nf525_sequence");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice_idx" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_garage_idx" ON "payments" USING btree ("garage_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_tokens_token_idx" ON "invitation_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitation_tokens_user_idx" ON "invitation_tokens" USING btree ("user_id");