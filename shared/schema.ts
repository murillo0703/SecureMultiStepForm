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
  subdomain: text('subdomain').unique(), // For white-label subdomains
  customDomain: text('custom_domain').unique(), // Custom domain support
  subscriptionTier: text('subscription_tier').default('basic').notNull(), // basic, premium, enterprise
  subscriptionStatus: text('subscription_status').default('active').notNull(), // active, suspended, cancelled
  maxUsers: integer('max_users').default(10).notNull(),
  maxSubmissions: integer('max_submissions').default(100).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  billingEmail: text('billing_email'),
  isActive: boolean('is_active').default(true).notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  lastBillingDate: timestamp('last_billing_date'),
  nextBillingDate: timestamp('next_billing_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBrokerSchema = createInsertSchema(brokers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Subscription Plans table for defining SaaS tiers
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Basic, Premium, Enterprise
  description: text('description'),
  price: integer('price').notNull(), // Price in cents
  billingInterval: text('billing_interval').default('monthly').notNull(), // monthly, yearly
  maxUsers: integer('max_users').notNull(),
  maxSubmissions: integer('max_submissions').notNull(),
  features: json('features'), // Array of feature flags
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Billing History table for tracking payments
export const billingHistory = pgTable('billing_history', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').references(() => brokers.id).notNull(),
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').default('usd').notNull(),
  status: text('status').notNull(), // paid, failed, pending, refunded
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeInvoiceId: text('stripe_invoice_id'),
  description: text('description'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
});

// Usage Metrics table for tracking broker usage
export const usageMetrics = pgTable('usage_metrics', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').references(() => brokers.id).notNull(),
  metricType: text('metric_type').notNull(), // submissions, users, storage
  value: integer('value').notNull(),
  period: text('period').notNull(), // daily, monthly, yearly
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export const insertUsageMetricsSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  recordedAt: true,
});

// Employer Locations - Central source of truth for company information
export const employerLocations = pgTable('employer_locations', {
  id: serial('id').primaryKey(),
  companyName: text('company_name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  county: text('county').notNull(),
  ratingArea: text('rating_area').notNull(),
  phone: text('phone'),
  taxId: text('tax_id'),
  industry: text('industry'),
  sicCode: text('sic_code'),
  naicsCode: text('naics_code'),
  employeeCount: integer('employee_count').default(1),
  brokerId: uuid('broker_id').references(() => brokers.id),
  effectiveDate: timestamp('effective_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Users table for authentication with enhanced roles
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  brokerId: uuid('broker_id').references(() => brokers.id),
  locationId: integer('location_id').references(() => employerLocations.id),
  role: text('role').default('employer').notNull(), // master_admin, broker_admin, broker_staff, employer
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  brokerId: true,
  locationId: true,
  role: true,
});

export const insertEmployerLocationSchema = createInsertSchema(employerLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Advanced Quoting System
export const quoteProjects = pgTable('quote_projects', {
  id: serial('id').primaryKey(),
  projectName: text('project_name').notNull(),
  locationId: integer('location_id').references(() => employerLocations.id).notNull(),
  brokerId: uuid('broker_id').references(() => brokers.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  effectiveDate: timestamp('effective_date').notNull(),
  renewalDate: timestamp('renewal_date'),
  status: text('status').default('draft').notNull(), // draft, active, locked, purchased
  tier: text('tier').default('basic').notNull(), // basic, premium
  totalEmployees: integer('total_employees').default(1),
  totalDependents: integer('total_dependents').default(0),
  selectedCarrier: text('selected_carrier'),
  lockedAt: timestamp('locked_at'),
  purchasedAt: timestamp('purchased_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Employee and Dependent Information for Quotes
export const quoteEmployees = pgTable('quote_employees', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quoteProjects.id).notNull(),
  employeeType: text('employee_type').notNull(), // employee, spouse, child
  age: integer('age').notNull(),
  zipCode: text('zip_code').notNull(),
  tier: text('tier').notNull(), // employee, employee_spouse, employee_child, family
  tobaccoUse: boolean('tobacco_use').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Benefit Type Selection for Quotes
export const quoteBenefitSelections = pgTable('quote_benefit_selections', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quoteProjects.id).notNull(),
  benefitType: text('benefit_type').notNull(), // medical, dental, vision, life, disability
  isSelected: boolean('is_selected').default(false),
  metalTier: text('metal_tier'), // bronze, silver, gold, platinum
  network: text('network'),
  deductible: integer('deductible'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Carrier Selection and Plan Filtering
export const quoteCarrierPlans = pgTable('quote_carrier_plans', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quoteProjects.id).notNull(),
  carrier: text('carrier').notNull(),
  planId: integer('plan_id').references(() => plans.id).notNull(),
  isSelected: boolean('is_selected').default(false),
  monthlyPremium: integer('monthly_premium').notNull(), // in cents
  annualPremium: integer('annual_premium').notNull(), // in cents
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Contribution Models
export const quoteContributionModels = pgTable('quote_contribution_models', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quoteProjects.id).notNull(),
  modelName: text('model_name').notNull(),
  benefitType: text('benefit_type').notNull(),
  employeeContribution: integer('employee_contribution').default(0), // percentage or fixed amount
  spouseContribution: integer('spouse_contribution').default(0),
  childContribution: integer('child_contribution').default(0),
  familyContribution: integer('family_contribution').default(0),
  contributionType: text('contribution_type').default('percentage'), // percentage, fixed
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Document Generation and Proposals
export const quoteDocuments = pgTable('quote_documents', {
  id: serial('id').primaryKey(),
  quoteId: integer('quote_id').references(() => quoteProjects.id).notNull(),
  documentType: text('document_type').notNull(), // proposal, summary, carrier_app, census
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  isPublic: boolean('is_public').default(false),
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
  relationshipToCompany: text('relationship_to_company'),
  isEligibleForCoverage: boolean('is_eligible_for_coverage').default(false),
  isAuthorizedContact: boolean('is_authorized_contact').default(false),
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
