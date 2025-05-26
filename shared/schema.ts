import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Audit logs table for tracking user and admin actions
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  details: text('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Predefined audit action types
export enum AuditAction {
  // User actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',

  // Application actions
  APPLICATION_CREATE = 'application_create',
  APPLICATION_UPDATE = 'application_update',
  APPLICATION_SUBMIT = 'application_submit',
  APPLICATION_SIGN = 'application_sign',

  // Admin actions
  ADMIN_LOGIN = 'admin_login',
  ADMIN_PLAN_UPLOAD = 'admin_plan_upload',
  ADMIN_PLAN_DELETE = 'admin_plan_delete',
  ADMIN_USER_CREATE = 'admin_user_create',
  ADMIN_USER_UPDATE = 'admin_user_update',
}

// Predefined entity types
export enum EntityType {
  USER = 'user',
  APPLICATION = 'application',
  COMPANY = 'company',
  PLAN = 'plan',
  DOCUMENT = 'document',
  SIGNATURE = 'signature',
}

// Brokers/Agencies table for white-label system
export const brokers = pgTable('brokers', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyName: text('agency_name').notNull(),
  logoUrl: text('logo_url'),
  colorPrimary: text('color_primary').default('#3b82f6'), // Default blue
  colorSecondary: text('color_secondary').default('#1e40af'), // Default darker blue
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBrokerSchema = createInsertSchema(brokers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  brokerId: uuid('broker_id').references(() => brokers.id),
  role: text('role').default('employer').notNull(), // employer, admin, owner, staff
  companyName: text('company_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  brokerId: true,
  role: true,
  companyName: true,
});

// Companies table
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  phone: text('phone').notNull(),
  taxId: text('tax_id').notNull(),
  industry: text('industry').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Owners table
export const owners = pgTable('owners', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  title: text('title').notNull(),
  ownershipPercentage: integer('ownership_percentage').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  isEligibleForCoverage: boolean('is_eligible_for_coverage').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertOwnerSchema = createInsertSchema(owners).omit({
  id: true,
  createdAt: true,
});

// Employees table
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dob: text('dob').notNull(),
  ssn: text('ssn').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

// Documents table
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // DE-9C, Articles of Incorporation, etc.
  path: text('path').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

// Plans table
export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  carrier: text('carrier').notNull(), // e.g., "Anthem", "Blue Shield"
  planName: text('plan_name').notNull(),
  planType: text('plan_type').notNull(), // PPO, HMO, EPO
  metalTier: text('metal_tier'), // Bronze, Silver, Gold, Platinum
  contractCode: text('contract_code'),
  effectiveStart: timestamp('effective_start').notNull(),
  effectiveEnd: timestamp('effective_end').notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Legacy fields for backward compatibility
  name: text('name').notNull(),
  type: text('type').notNull(), // HMO, PPO, HSA
  network: text('network').notNull(),
  monthlyCost: integer('monthly_cost').notNull(), // in cents
  details: text('details'),
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

// Company Selected Plans
export const companyPlans = pgTable('company_plans', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  planId: integer('plan_id')
    .references(() => plans.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertCompanyPlanSchema = createInsertSchema(companyPlans).omit({
  id: true,
  createdAt: true,
});

// Contributions
export const contributions = pgTable('contributions', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  planId: integer('plan_id')
    .references(() => plans.id)
    .notNull(),
  employeeContribution: integer('employee_contribution').notNull(), // percentage
  dependentContribution: integer('dependent_contribution').notNull(), // percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
});

// Application Initiators table - who is filling out the application
export const applicationInitiators = pgTable('application_initiators', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  title: text('title').notNull(),
  relationshipToCompany: text('relationship_to_company').notNull(),
  isOwner: boolean('is_owner').default(false),
  isAuthorizedContact: boolean('is_authorized_contact').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertApplicationInitiatorSchema = createInsertSchema(applicationInitiators).omit({
  id: true,
  createdAt: true,
});

// Coverage Information - Benefits Selection
export const coverageInformation = pgTable('coverage_information', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),

  // Employee counts
  fullTimeEmployees: integer('full_time_employees').default(0),
  partTimeEmployees: integer('part_time_employees').default(0),
  temporaryEmployees: integer('temporary_employees').default(0),

  // Core Benefits
  medical: boolean('medical').default(false),
  dental: boolean('dental').default(false),
  vision: boolean('vision').default(false),
  life: boolean('life').default(false),
  std: boolean('std').default(false),
  ltd: boolean('ltd').default(false),

  // Voluntary Benefits
  accident: boolean('accident').default(false),
  criticalIllness: boolean('critical_illness').default(false),
  pet: boolean('pet').default(false),
  identityTheft: boolean('identity_theft').default(false),
  legal: boolean('legal').default(false),

  // Company Policy Benefits
  pto: boolean('pto').default(false),
  sickLeave: boolean('sick_leave').default(false),
  holidays: boolean('holidays').default(false),
  remoteWork: boolean('remote_work').default(false),

  // Tax-Advantaged & Wellness
  hsa: boolean('hsa').default(false),
  fsa: boolean('fsa').default(false),
  retirement401k: boolean('retirement_401k').default(false),
  simpleIra: boolean('simple_ira').default(false),
  eap: boolean('eap').default(false),
  gymSubsidy: boolean('gym_subsidy').default(false),

  // COBRA Logic
  had20PlusEmployees6Months: boolean('had_20_plus_employees_6_months').default(false),
  cobraType: text('cobra_type'), // "federal" or "cal-cobra"

  // Carrier selections
  medicalCarrier: text('medical_carrier'),
  dentalCarrier: text('dental_carrier'),
  visionCarrier: text('vision_carrier'),
  lifeCarrier: text('life_carrier'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertCoverageInformationSchema = createInsertSchema(coverageInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Applications
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id')
    .references(() => companies.id)
    .notNull(),
  initiatorId: integer('initiator_id').references(() => applicationInitiators.id),
  status: text('status').default('in_progress').notNull(), // in_progress, pending_review, submitted, approved
  selectedCarrier: text('selected_carrier'), // Selected insurance carrier
  signature: text('signature'),
  submittedAt: timestamp('submitted_at'),
  completedSteps: json('completed_steps').notNull().default(['company']),
  currentStep: text('current_step').default('company').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  companyId: true,
  createdAt: true,
});

// Define types
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = z.infer<typeof insertBrokerSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type CompanyPlan = typeof companyPlans.$inferSelect;
export type InsertCompanyPlan = z.infer<typeof insertCompanyPlanSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type ApplicationInitiator = typeof applicationInitiators.$inferSelect;
export type InsertApplicationInitiator = z.infer<typeof insertApplicationInitiatorSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;

// PDF Template Management
export const pdfTemplates = pgTable('pdf_templates', {
  id: serial('id').primaryKey(),
  carrierName: text('carrier_name').notNull(),
  formName: text('form_name').notNull(),
  version: text('version').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  uploadedBy: integer('uploaded_by')
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pdfFieldMappings = pgTable('pdf_field_mappings', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id')
    .notNull()
    .references(() => pdfTemplates.id),
  fieldName: text('field_name').notNull(),
  dataSource: text('data_source').notNull(), // 'company', 'owner', 'application', 'employee'
  dataField: text('data_field').notNull(), // actual field name from the table
  pageNumber: integer('page_number').default(1),
  xPosition: integer('x_position'),
  yPosition: integer('y_position'),
  width: integer('width'),
  height: integer('height'),
  fieldType: text('field_type').default('text').notNull(), // 'text', 'signature', 'checkbox', 'date'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const generatedPdfs = pgTable('generated_pdfs', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id')
    .notNull()
    .references(() => pdfTemplates.id),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  applicationId: integer('application_id').references(() => applications.id),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  generatedBy: integer('generated_by')
    .notNull()
    .references(() => users.id),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  status: text('status').default('completed').notNull(), // 'pending', 'completed', 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// PDF Relations (commented out for now - enable when using database)
// export const pdfTemplateRelations = relations(pdfTemplates, ({ one, many }) => ({
//   uploader: one(users, {
//     fields: [pdfTemplates.uploadedBy],
//     references: [users.id],
//   }),
//   fieldMappings: many(pdfFieldMappings),
//   generatedPdfs: many(generatedPdfs),
// }));

// export const pdfFieldMappingRelations = relations(pdfFieldMappings, ({ one }) => ({
//   template: one(pdfTemplates, {
//     fields: [pdfFieldMappings.templateId],
//     references: [pdfTemplates.id],
//   }),
// }));

// export const generatedPdfRelations = relations(generatedPdfs, ({ one }) => ({
//   template: one(pdfTemplates, {
//     fields: [generatedPdfs.templateId],
//     references: [pdfTemplates.id],
//   }),
//   company: one(companies, {
//     fields: [generatedPdfs.companyId],
//     references: [companies.id],
//   }),
//   application: one(applications, {
//     fields: [generatedPdfs.applicationId],
//     references: [applications.id],
//   }),
//   generator: one(users, {
//     fields: [generatedPdfs.generatedBy],
//     references: [users.id],
//   }),
// }));

// Insert schemas for PDF templates
export const insertPdfTemplateSchema = createInsertSchema(pdfTemplates).omit({
  id: true,
  createdAt: true,
  uploadedAt: true,
});

export const insertPdfFieldMappingSchema = createInsertSchema(pdfFieldMappings).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedPdfSchema = createInsertSchema(generatedPdfs).omit({
  id: true,
  createdAt: true,
  generatedAt: true,
});

// PDF Template types
export type PdfTemplate = typeof pdfTemplates.$inferSelect;
export type InsertPdfTemplate = z.infer<typeof insertPdfTemplateSchema>;
export type PdfFieldMapping = typeof pdfFieldMappings.$inferSelect;
export type InsertPdfFieldMapping = z.infer<typeof insertPdfFieldMappingSchema>;
export type GeneratedPdf = typeof generatedPdfs.$inferSelect;
export type InsertGeneratedPdf = z.infer<typeof insertGeneratedPdfSchema>;
