import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const selectAuditLogSchema = createSelectSchema(auditLogs);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Predefined audit action types for consistency
export enum AuditAction {
  // User actions
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  
  // Application actions
  APPLICATION_CREATE = "application_create",
  APPLICATION_UPDATE = "application_update",
  APPLICATION_SUBMIT = "application_submit",
  APPLICATION_SIGN = "application_sign",
  
  // Admin actions
  ADMIN_LOGIN = "admin_login",
  ADMIN_PLAN_UPLOAD = "admin_plan_upload",
  ADMIN_PLAN_DELETE = "admin_plan_delete",
  ADMIN_USER_CREATE = "admin_user_create",
  ADMIN_USER_UPDATE = "admin_user_update",
}

// Predefined entity types for consistency
export enum EntityType {
  USER = "user",
  APPLICATION = "application",
  COMPANY = "company",
  PLAN = "plan",
  DOCUMENT = "document",
  SIGNATURE = "signature",
}