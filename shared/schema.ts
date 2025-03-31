import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  email: text("email").notNull().unique(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  orderId: text("order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  passphrase: text("passphrase").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Course subcontent table
export const courseSubcontents = pgTable("course_subcontents", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  url: text("url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSubcontentSchema = createInsertSchema(courseSubcontents).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").references(() => users.id),
  adminId: integer("admin_id").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// API Configuration table
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  credentials: jsonb("credentials").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => adminUsers.id),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  lastUpdated: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseSubcontent = typeof courseSubcontents.$inferSelect;
export type InsertCourseSubcontent = z.infer<typeof insertCourseSubcontentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ApiConfiguration = typeof apiConfigurations.$inferSelect;
export type InsertApiConfiguration = z.infer<typeof insertApiConfigSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Password change schema (for logged in users)
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeRequest = z.infer<typeof passwordChangeSchema>;

// Password reset schema (for forgotten passwords)
export const passwordResetRequestSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  passphrase: z.string().min(1, { message: "Security passphrase is required" }),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

// New password with passphrase verification
export const passwordResetSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  passphrase: z.string().min(1, { message: "Security passphrase is required" }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordReset = z.infer<typeof passwordResetSchema>;

// API Configuration schemas
export const wooCommerceConfigSchema = z.object({
  consumerKey: z.string().min(1, { message: "Consumer Key is required" }),
  consumerSecret: z.string().min(1, { message: "Consumer Secret is required" }),
  apiUrl: z.string().url({ message: "Valid URL is required" }).optional(),
});

export type WooCommerceConfig = z.infer<typeof wooCommerceConfigSchema>;

export const telegramConfigSchema = z.object({
  botToken: z.string().min(1, { message: "Bot Token is required" }),
});

export type TelegramConfig = z.infer<typeof telegramConfigSchema>;
