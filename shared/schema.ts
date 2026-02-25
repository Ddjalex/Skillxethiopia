import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentOptions = pgTable("payment_options", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // TELEBIRR | CBE_BIRR | HELLOCASH
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  merchantId: text("merchant_id"),
  qrCodeUrl: text("qr_code_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentOptionSchema = createInsertSchema(paymentOptions).omit({ id: true, createdAt: true });
export type PaymentOption = typeof paymentOptions.$inferSelect;
export type InsertPaymentOption = z.infer<typeof insertPaymentOptionSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("USER"), // USER | ADMIN
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  instructorName: text("instructor_name").notNull(),
  priceStrategy: text("price_strategy").notNull().default("PAID"), // FREE | PAID
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  seasonNumber: integer("season_number").notNull(),
  price: text("price").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").notNull(),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  description: text("description"),
  durationSec: integer("duration_sec").notNull(),
  isPreview: boolean("is_preview").default(false),
  price: text("price").notNull(),
  videoProvider: text("video_provider").notNull().default("VIMEO"),
  videoRef: text("video_ref").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: text("item_type").notNull(), // SEASON | EPISODE
  itemId: integer("item_id").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default("ETB"),
  provider: text("provider").notNull().default("TELEBIRR"), // TELEBIRR | CBE_BIRR | HELLOCASH
  status: text("status").notNull().default("PENDING"), // PENDING | PAID | FAILED | REFUNDED
  transactionRef: text("transaction_ref"),
  paymentProofUrl: text("payment_proof_url"), // For manual verification/screenshot
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessGrants = pgTable("access_grants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: text("item_type").notNull(), // SEASON | EPISODE
  itemId: integer("item_id").notNull(),
  grantedBy: text("granted_by").notNull().default("SYSTEM"), // SYSTEM | ADMIN
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(6),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertSeasonSchema = createInsertSchema(seasons).omit({ id: true, createdAt: true });
export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true, createdAt: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true, createdAt: true, status: true }).extend({
  transactionRef: z.string().min(1, "Transaction reference is required"),
  paymentProofUrl: z.string().optional(),
});
export const insertAccessGrantSchema = createInsertSchema(accessGrants).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = { name: string; email: string; passwordHash: string; role?: string };
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Season = typeof seasons.$inferSelect;
export type InsertSeason = z.infer<typeof insertSeasonSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type AccessGrant = typeof accessGrants.$inferSelect;
export type InsertAccessGrant = z.infer<typeof insertAccessGrantSchema>;
