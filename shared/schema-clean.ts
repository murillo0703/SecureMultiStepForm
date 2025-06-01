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

// Re-export core tables from original schema
export * from './schema';

// Subscription system tables
export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Basic, Professional, Enterprise
  description: text('description'),
  price: integer('price').notNull(), // Price in cents per month
  billingInterval: text('billing_interval').default('monthly').notNull(), // monthly, yearly
  stripePriceId: text('stripe_price_id'), // Stripe price ID for subscriptions
  features: json('features').notNull(), // JSON array of features/modules
  modules: json('modules').notNull(), // JSON object with module access levels
  maxUsers: integer('max_users').default(1),
  maxCompanies: integer('max_companies').default(1),
  maxQuotes: integer('max_quotes').default(10),
  maxSubmissions: integer('max_submissions').default(100),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Broker Subscriptions - Track active subscriptions for brokers
export const brokerSubscriptions = pgTable('broker_subscriptions', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  planId: integer('plan_id').references(() => subscriptionPlans.id).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status').notNull(), // active, canceled, past_due, trialing
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  metadata: json('metadata'), // Additional subscription data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscription Invoices - Track billing history
export const subscriptionInvoices = pgTable('subscription_invoices', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').references(() => brokerSubscriptions.id).notNull(),
  stripeInvoiceId: text('stripe_invoice_id'),
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').default('usd'),
  status: text('status').notNull(), // paid, open, void, uncollectible
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  hostedInvoiceUrl: text('hosted_invoice_url'),
  invoicePdf: text('invoice_pdf'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Module Access Control - Track which modules brokers have access to
export const moduleAccess = pgTable('module_access', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  moduleName: text('module_name').notNull(), // basic_quoting, enhanced_quoting, crm, etc.
  accessLevel: text('access_level').notNull(), // none, read, write, admin
  isEnabled: boolean('is_enabled').default(true),
  expiresAt: timestamp('expires_at'), // For temporary access
  grantedBy: text('granted_by'), // subscription, manual, trial
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payment Methods - Store broker payment information
export const paymentMethods = pgTable('payment_methods', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  stripePaymentMethodId: text('stripe_payment_method_id').notNull(),
  type: text('type').notNull(), // card, bank_account
  brand: text('brand'), // visa, mastercard, etc.
  last4: text('last4'),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Usage Tracking - Monitor module usage for billing and limits
export const usageTracking = pgTable('usage_tracking', {
  id: serial('id').primaryKey(),
  brokerId: uuid('broker_id').notNull(),
  moduleName: text('module_name').notNull(),
  action: text('action').notNull(), // quote_created, client_added, etc.
  resourceId: text('resource_id'), // ID of the resource being tracked
  billingPeriod: text('billing_period').notNull(), // YYYY-MM format
  count: integer('count').default(1),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Subscription schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrokerSubscriptionSchema = createInsertSchema(brokerSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertModuleAccessSchema = createInsertSchema(moduleAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Module definitions and access levels
export const MODULES = {
  BASIC_QUOTING: 'basic_quoting',
  ENHANCED_QUOTING: 'enhanced_quoting',
  CRM: 'crm',
  CLIENT_MANAGEMENT: 'client_management',
  AGENCY_MANAGEMENT: 'agency_management',
  RENEWAL_MANAGEMENT: 'renewal_management',
  EMPLOYEE_BENEFITS: 'employee_benefits',
} as const;

export const ACCESS_LEVELS = {
  NONE: 'none',
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
} as const;

export type Module = typeof MODULES[keyof typeof MODULES];
export type AccessLevel = typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];

// Type exports for subscription system
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type BrokerSubscription = typeof brokerSubscriptions.$inferSelect;
export type InsertBrokerSubscription = z.infer<typeof insertBrokerSubscriptionSchema>;
export type ModuleAccess = typeof moduleAccess.$inferSelect;
export type InsertModuleAccess = z.infer<typeof insertModuleAccessSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;