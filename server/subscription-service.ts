import Stripe from 'stripe';
import { storage } from './storage';
import { MODULES, ACCESS_LEVELS } from '@shared/schema';

let stripe: Stripe | null = null;

// Initialize Stripe when keys are available
export function initializeStripe() {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    return true;
  }
  return false;
}

// Default subscription plans with module access
export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    name: 'Basic',
    description: 'Essential features for small agencies',
    price: 4900, // $49/month
    billingInterval: 'monthly',
    features: ['Basic quoting', 'Up to 5 clients', 'Email support'],
    modules: {
      [MODULES.BASIC_QUOTING]: ACCESS_LEVELS.WRITE,
      [MODULES.CLIENT_MANAGEMENT]: ACCESS_LEVELS.READ,
      [MODULES.CRM]: ACCESS_LEVELS.NONE,
      [MODULES.ENHANCED_QUOTING]: ACCESS_LEVELS.NONE,
      [MODULES.AGENCY_MANAGEMENT]: ACCESS_LEVELS.NONE,
      [MODULES.RENEWAL_MANAGEMENT]: ACCESS_LEVELS.NONE,
      [MODULES.EMPLOYEE_BENEFITS]: ACCESS_LEVELS.NONE,
    },
    maxUsers: 2,
    maxCompanies: 5,
    maxQuotes: 25,
    maxSubmissions: 50,
    sortOrder: 1,
  },
  {
    name: 'Professional',
    description: 'Advanced features for growing agencies',
    price: 9900, // $99/month
    billingInterval: 'monthly',
    features: [
      'Enhanced quoting',
      'CRM integration',
      'Up to 50 clients',
      'Priority support',
      'Advanced analytics',
    ],
    modules: {
      [MODULES.BASIC_QUOTING]: ACCESS_LEVELS.WRITE,
      [MODULES.ENHANCED_QUOTING]: ACCESS_LEVELS.WRITE,
      [MODULES.CLIENT_MANAGEMENT]: ACCESS_LEVELS.WRITE,
      [MODULES.CRM]: ACCESS_LEVELS.WRITE,
      [MODULES.AGENCY_MANAGEMENT]: ACCESS_LEVELS.READ,
      [MODULES.RENEWAL_MANAGEMENT]: ACCESS_LEVELS.WRITE,
      [MODULES.EMPLOYEE_BENEFITS]: ACCESS_LEVELS.READ,
    },
    maxUsers: 10,
    maxCompanies: 50,
    maxQuotes: 100,
    maxSubmissions: 200,
    sortOrder: 2,
  },
  {
    name: 'Enterprise',
    description: 'Full-featured solution for large agencies',
    price: 19900, // $199/month
    billingInterval: 'monthly',
    features: [
      'All modules included',
      'Unlimited clients',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
    ],
    modules: {
      [MODULES.BASIC_QUOTING]: ACCESS_LEVELS.ADMIN,
      [MODULES.ENHANCED_QUOTING]: ACCESS_LEVELS.ADMIN,
      [MODULES.CLIENT_MANAGEMENT]: ACCESS_LEVELS.ADMIN,
      [MODULES.CRM]: ACCESS_LEVELS.ADMIN,
      [MODULES.AGENCY_MANAGEMENT]: ACCESS_LEVELS.ADMIN,
      [MODULES.RENEWAL_MANAGEMENT]: ACCESS_LEVELS.ADMIN,
      [MODULES.EMPLOYEE_BENEFITS]: ACCESS_LEVELS.ADMIN,
    },
    maxUsers: -1, // Unlimited
    maxCompanies: -1, // Unlimited
    maxQuotes: -1, // Unlimited
    maxSubmissions: -1, // Unlimited
    sortOrder: 3,
  },
];

export class SubscriptionService {
  static async createSubscription(brokerId: string, planId: number) {
    if (!stripe) {
      throw new Error('Stripe not initialized. Please provide API keys.');
    }

    const broker = await storage.getBroker(brokerId);
    if (!broker) {
      throw new Error('Broker not found');
    }

    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = broker.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: broker.billingEmail || `${broker.agencyName}@agency.com`,
        name: broker.agencyName,
        metadata: {
          brokerId: broker.id,
        },
      });
      stripeCustomerId = customer.id;
      await storage.updateBroker(brokerId, { stripeCustomerId });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: plan.stripePriceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription in database
    const brokerSubscription = await storage.createBrokerSubscription({
      brokerId,
      planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: { planName: plan.name },
    });

    // Grant module access based on plan
    await this.updateModuleAccess(brokerId, plan.modules);

    return {
      subscription: brokerSubscription,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
    };
  }

  static async updateModuleAccess(brokerId: string, modules: Record<string, string>) {
    // Remove existing module access
    await storage.removeModuleAccess(brokerId);

    // Grant new module access
    for (const [moduleName, accessLevel] of Object.entries(modules)) {
      if (accessLevel !== ACCESS_LEVELS.NONE) {
        await storage.createModuleAccess({
          brokerId,
          moduleName,
          accessLevel,
          isEnabled: true,
          grantedBy: 'subscription',
        });
      }
    }
  }

  static async cancelSubscription(brokerId: string, cancelAtPeriodEnd = true) {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const subscription = await storage.getBrokerSubscription(brokerId);
    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel in Stripe
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update in database
    await storage.updateBrokerSubscription(subscription.id, {
      cancelAtPeriodEnd,
      canceledAt: cancelAtPeriodEnd ? null : new Date(),
      status: cancelAtPeriodEnd ? subscription.status : 'canceled',
    });

    return subscription;
  }

  static async changePlan(brokerId: string, newPlanId: number) {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const currentSubscription = await storage.getBrokerSubscription(brokerId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    const newPlan = await storage.getSubscriptionPlan(newPlanId);
    if (!newPlan) {
      throw new Error('New subscription plan not found');
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId!
    );

    await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId!, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPlan.stripePriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update database
    await storage.updateBrokerSubscription(currentSubscription.id, {
      planId: newPlanId,
    });

    // Update module access
    await this.updateModuleAccess(brokerId, newPlan.modules);

    return await storage.getBrokerSubscription(brokerId);
  }

  static async checkModuleAccess(brokerId: string, moduleName: string): Promise<string> {
    const access = await storage.getModuleAccess(brokerId, moduleName);
    return access?.accessLevel || ACCESS_LEVELS.NONE;
  }

  static async trackUsage(brokerId: string, moduleName: string, action: string, resourceId?: string) {
    const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

    await storage.trackUsage({
      brokerId,
      moduleName,
      action,
      resourceId,
      billingPeriod,
      count: 1,
      metadata: { timestamp: new Date().toISOString() },
    });
  }
}