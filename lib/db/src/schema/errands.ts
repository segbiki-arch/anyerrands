import { pgTable, serial, text, numeric, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
export const reportReasonEnum = pgEnum("report_reason", ["work_not_done", "work_poor_quality", "no_show", "late", "other"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved"]);
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const errandStatusEnum = pgEnum("errand_status", ["open", "accepted", "completed"]);

export const helpersTable = pgTable("helpers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  bio: text("bio").notNull(),
  skills: text("skills").array().notNull().default([]),
  errandsCompleted: integer("errands_completed").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 1 }),
  available: boolean("available").notNull().default(true),
  avatarInitials: text("avatar_initials"),
  stripeAccountId: text("stripe_account_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
});

export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);

export const errandsTable = pgTable("errands", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: errandStatusEnum("status").notNull().default("open"),
  requesterName: text("requester_name").notNull(),
  requesterLocation: text("requester_location").notNull(),
  requesterAddress: text("requester_address"),
  requesterPhone: text("requester_phone"),
  estimatedDuration: text("estimated_duration"),
  budgetAmount: numeric("budget_amount", { precision: 10, scale: 2 }),
  helperId: integer("helper_id").references(() => helpersTable.id),
  helperName: text("helper_name"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }),
  paymentIntentId: text("payment_intent_id"),
  checkoutSessionId: text("checkout_session_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertHelperSchema = createInsertSchema(helpersTable).omit({ id: true, createdAt: true, errandsCompleted: true });
export type InsertHelper = z.infer<typeof insertHelperSchema>;
export type Helper = typeof helpersTable.$inferSelect;

export const insertErrandSchema = createInsertSchema(errandsTable).omit({ id: true, createdAt: true, updatedAt: true, status: true, helperId: true, helperName: true });
export type InsertErrand = z.infer<typeof insertErrandSchema>;
export type Errand = typeof errandsTable.$inferSelect;

export type Category = typeof categoriesTable.$inferSelect;

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  helperId: integer("helper_id").references(() => helpersTable.id).notNull(),
  errandId: integer("errand_id").references(() => errandsTable.id).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  errandId: integer("errand_id").references(() => errandsTable.id).notNull(),
  helperId: integer("helper_id").references(() => helpersTable.id).notNull(),
  reporterName: text("reporter_name").notNull(),
  reason: reportReasonEnum("reason").notNull(),
  description: text("description").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = z.object({
  reporterName: z.string().min(2),
  reason: z.enum(["work_not_done", "work_poor_quality", "no_show", "late", "other"]),
  description: z.string().min(10),
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
