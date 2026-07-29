import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("mawashi_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  maxQuantity: integer("max_quantity").notNull().default(10),
  price: numeric("price", { precision: 10, scale: 3 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteContentTable = pgTable("mawashi_site_content", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroText: text("hero_text").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  navLinks: text("nav_links").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ordersTable = pgTable("mawashi_orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  pickupDate: date("pickup_date", { mode: "string" }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("not_required"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const presenceTable = pgTable("mawashi_presence", {
  sessionId: text("session_id").primaryKey(),
  page: text("page").notNull(),
  label: text("label").notNull(),
  customerName: text("customer_name"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({ id: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertPresenceSchema = createInsertSchema(presenceTable);

export const productPriceSchema = z.coerce.number().nonnegative();
export type Product = typeof productsTable.$inferSelect;
export type SiteContent = typeof siteContentTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Presence = typeof presenceTable.$inferSelect;