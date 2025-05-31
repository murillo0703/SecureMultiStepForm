import {
  brokers,
  Broker,
  InsertBroker,
  users,
  User,
  InsertUser,
  companies,
  Company,
  InsertCompany,
  owners,
  Owner,
  InsertOwner,
  employees,
  Employee,
  InsertEmployee,
  documents,
  Document,
  InsertDocument,
  plans,
  Plan,
  InsertPlan,
  companyPlans,
  CompanyPlan,
  InsertCompanyPlan,
  contributions,
  Contribution,
  InsertContribution,
  applications,
  Application,
  InsertApplication,
  UpdateApplication,
  applicationInitiators,
  ApplicationInitiator,
  InsertApplicationInitiator,
  auditLogs,
  AuditAction,
  EntityType,
} from '@shared/schema';
import createMemoryStore from 'memorystore';
import session from 'express-session';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Broker operations
  getBroker(id: string): Promise<Broker | undefined>;
  createBroker(broker: InsertBroker): Promise<Broker>;
  updateBroker(id: string, updates: Partial<InsertBroker>): Promise<Broker>;
  getBrokerByUserId(userId: number): Promise<Broker | undefined>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getUsersByBrokerId(brokerId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllBrokers(): Promise<Broker[]>;

  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompaniesByUserId(userId: number): Promise<Company[]>;
  getCompaniesByBroker(brokerId: string): Promise<Company[]>;

  // Owner operations
  createOwner(owner: InsertOwner): Promise<Owner>;
  getOwnersByCompanyId(companyId: number): Promise<Owner[]>;
  updateOwner(id: number, updates: Partial<InsertOwner>): Promise<Owner>;

  // Employee operations
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getEmployeesByCompanyId(companyId: number): Promise<Employee[]>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByCompanyId(companyId: number): Promise<Document[]>;
  deleteDocument(id: number): Promise<void>;

  // Plan operations
  createPlan(plan: InsertPlan): Promise<Plan>;
  getAllPlans(): Promise<Plan[]>;
  getPlanByNameAndCarrier(name: string, carrier: string): Promise<Plan | undefined>;
  getFilteredPlans(carrier?: string, coverageDate?: Date): Promise<Plan[]>;
  createBulkPlans(plans: InsertPlan[]): Promise<{ created: number; skipped: number }>;
  createCompanyPlan(companyPlan: InsertCompanyPlan): Promise<CompanyPlan>;
  getCompanyPlans(companyId: number): Promise<(CompanyPlan & Plan)[]>;
  deleteCompanyPlan(companyId: number, planId: number): Promise<void>;

  // Contribution operations
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByCompanyId(companyId: number): Promise<Contribution[]>;

  // Application Initiator operations
  createApplicationInitiator(initiator: InsertApplicationInitiator): Promise<ApplicationInitiator>;
  getApplicationInitiator(id: number): Promise<ApplicationInitiator | undefined>;
  getApplicationInitiatorByUserId(userId: number): Promise<ApplicationInitiator | undefined>;

  // Application operations
  createApplication(application: Partial<InsertApplication>): Promise<Application>;
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationByCompanyId(companyId: number): Promise<Application | undefined>;
  updateApplication(id: number, updates: Partial<UpdateApplication>): Promise<Application>;
  getAllApplications(): Promise<(Application & Company & User)[]>;
  getApplicationsByBroker(brokerId: string): Promise<Application[]>;
  getUsersByBroker(brokerId: string): Promise<User[]>;
  updateApplicationProgress(companyId: number, currentStep: string): Promise<void>;

  // Audit log operations
  createAuditLog(log: {
    userId: number;
    action: AuditAction;
    entityType: EntityType;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  getAuditLogs(filters?: {
    userId?: number;
    action?: AuditAction;
    entityType?: EntityType;
    entityId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any[]>;
  getRecentAuditLogs(limit?: number): Promise<any[]>;

  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private brokers: Map<string, Broker>;
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private owners: Map<number, Owner>;
  private employees: Map<number, Employee>;
  private documents: Map<number, Document>;
  private plans: Map<number, Plan>;
  private companyPlans: Map<number, CompanyPlan>;
  private contributions: Map<number, Contribution>;
  private applications: Map<number, Application>;
  private applicationInitiators: Map<number, ApplicationInitiator>;
  private auditLogs: Array<{
    id: number;
    userId: number;
    action: string;
    entityType: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  }>;

  // Counters for IDs
  private userIdCounter: number;
  private companyIdCounter: number;
  private ownerIdCounter: number;
  private employeeIdCounter: number;
  private documentIdCounter: number;
  private planIdCounter: number;
  private companyPlanIdCounter: number;
  private contributionIdCounter: number;
  private applicationIdCounter: number;
  private applicationInitiatorIdCounter: number;
  private auditLogIdCounter: number;

  public sessionStore: any; // Using 'any' to avoid session type conflicts

  constructor() {
    this.brokers = new Map();
    this.users = new Map();
    this.companies = new Map();
    this.owners = new Map();
    this.employees = new Map();
    this.documents = new Map();
    this.plans = new Map();
    this.companyPlans = new Map();
    this.contributions = new Map();
    this.applications = new Map();
    this.applicationInitiators = new Map();
    this.auditLogs = [];

    this.userIdCounter = 1;
    this.companyIdCounter = 1;
    this.ownerIdCounter = 1;
    this.employeeIdCounter = 1;
    this.documentIdCounter = 1;
    this.planIdCounter = 1;
    this.companyPlanIdCounter = 1;
    this.contributionIdCounter = 1;
    this.applicationIdCounter = 1;
    this.applicationInitiatorIdCounter = 1;
    this.auditLogIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Create default broker and admin user
    this.createBroker({
      agencyName: 'Murillo Insurance Agency',
      colorPrimary: '#3b82f6',
      colorSecondary: '#1e40af',
    }).then(broker => {
      this.createUser({
        username: 'admin',
        password:
          '65b5e0ed48d7c2451ecd7d843b747b87bc18bb76a28968a2769359fb5e863dcef63d94eddc9b4a4eb346fe94b491bc8eaf74a3d58c2a8d757e1beb95a4e3536f.b04e36d4c27ed588',
        email: 'admin@murilloinsuranceagency.com',
        name: 'Admin User',
        brokerId: broker.id,
        role: 'owner',
        companyName: 'Murillo Insurance Agency',
      });
    });
  }

  // Broker operations
  async getBroker(id: string): Promise<Broker | undefined> {
    return this.brokers.get(id);
  }

  async createBroker(broker: InsertBroker): Promise<Broker> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newBroker: Broker = {
      ...broker,
      id,
      logoUrl: broker.logoUrl || null,
      colorPrimary: broker.colorPrimary || '#3b82f6',
      colorSecondary: broker.colorSecondary || '#1e40af',
      createdAt: now,
      updatedAt: now,
    };
    this.brokers.set(id, newBroker);
    return newBroker;
  }

  async updateBroker(id: string, updates: Partial<InsertBroker>): Promise<Broker> {
    const existing = this.brokers.get(id);
    if (!existing) {
      throw new Error('Broker not found');
    }

    const updated: Broker = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.brokers.set(id, updated);
    return updated;
  }

  async getBrokerByUserId(userId: number): Promise<Broker | undefined> {
    const user = await this.getUser(userId);
    if (!user?.brokerId) return undefined;
    return this.getBroker(user.brokerId);
  }

  async getUsersByBrokerId(brokerId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.brokerId === brokerId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllBrokers(): Promise<Broker[]> {
    return Array.from(this.brokers.values());
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Company operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.companyIdCounter++;
    const now = new Date();
    const newCompany: Company = {
      ...company,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(id, newCompany);
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompaniesByUserId(userId: number): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(company => company.userId === userId);
  }

  async getCompaniesByBroker(brokerId: string): Promise<Company[]> {
    // Get all users associated with this broker
    const brokerUsers = await this.getUsersByBrokerId(brokerId);
    const brokerUserIds = brokerUsers.map(user => user.id);
    
    // Return companies owned by any of these users
    return Array.from(this.companies.values()).filter(company => 
      brokerUserIds.includes(company.userId)
    );
  }

  // Owner operations
  async createOwner(owner: InsertOwner): Promise<Owner> {
    const id = this.ownerIdCounter++;
    const now = new Date();
    const newOwner: Owner = {
      ...owner,
      id,
      createdAt: now,
    };
    this.owners.set(id, newOwner);
    return newOwner;
  }

  async getOwnersByCompanyId(companyId: number): Promise<Owner[]> {
    return Array.from(this.owners.values()).filter(owner => owner.companyId === companyId);
  }

  async updateOwner(id: number, updates: Partial<InsertOwner>): Promise<Owner> {
    const existingOwner = this.owners.get(id);
    if (!existingOwner) {
      throw new Error(`Owner with id ${id} not found`);
    }
    
    const updatedOwner: Owner = {
      ...existingOwner,
      ...updates,
    };
    this.owners.set(id, updatedOwner);
    return updatedOwner;
  }

  // Employee operations
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const now = new Date();
    const newEmployee: Employee = {
      ...employee,
      id,
      createdAt: now,
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async getEmployeesByCompanyId(companyId: number): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(employee => employee.companyId === companyId);
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const newDocument: Document = {
      ...document,
      id,
      uploadedAt: now,
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByCompanyId(companyId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(document => document.companyId === companyId);
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Plan operations
  async createPlan(plan: InsertPlan): Promise<Plan> {
    const id = this.planIdCounter++;
    const now = new Date();
    const newPlan: Plan = {
      ...plan,
      id,
      createdAt: now,
    };
    this.plans.set(id, newPlan);
    return newPlan;
  }

  async getAllPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  async getFilteredPlans(carrier?: string, coverageDate?: Date): Promise<Plan[]> {
    let plans = Array.from(this.plans.values());

    if (carrier) {
      plans = plans.filter(plan => plan.carrier === carrier);
    }

    if (coverageDate) {
      plans = plans.filter(
        plan => plan.effectiveStart <= coverageDate && plan.effectiveEnd >= coverageDate
      );
    }

    return plans;
  }

  async createBulkPlans(planList: InsertPlan[]): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const planData of planList) {
      const existing = await this.getPlanByNameAndCarrier(planData.name, planData.carrier);
      if (existing) {
        skipped++;
      } else {
        await this.createPlan(planData);
        created++;
      }
    }

    return { created, skipped };
  }

  async getPlanByNameAndCarrier(name: string, carrier: string): Promise<Plan | undefined> {
    return Array.from(this.plans.values()).find(
      plan => plan.name === name && plan.carrier === carrier
    );
  }

  async createCompanyPlan(companyPlan: InsertCompanyPlan): Promise<CompanyPlan> {
    const id = this.companyPlanIdCounter++;
    const now = new Date();
    const newCompanyPlan: CompanyPlan = {
      ...companyPlan,
      id,
      createdAt: now,
    };
    this.companyPlans.set(id, newCompanyPlan);
    return newCompanyPlan;
  }

  async getCompanyPlans(companyId: number): Promise<(CompanyPlan & Plan)[]> {
    const companyPlans = Array.from(this.companyPlans.values()).filter(
      companyPlan => companyPlan.companyId === companyId
    );

    return companyPlans.map(companyPlan => {
      const plan = this.plans.get(companyPlan.planId);
      if (!plan) throw new Error(`Plan with ID ${companyPlan.planId} not found`);
      return { ...companyPlan, ...plan };
    });
  }

  async deleteCompanyPlan(companyId: number, planId: number): Promise<void> {
    const companyPlanToDelete = Array.from(this.companyPlans.values()).find(
      companyPlan => companyPlan.companyId === companyId && companyPlan.planId === planId
    );

    if (companyPlanToDelete) {
      this.companyPlans.delete(companyPlanToDelete.id);
    }
  }

  // Contribution operations
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const id = this.contributionIdCounter++;
    const now = new Date();
    const newContribution: Contribution = {
      ...contribution,
      id,
      createdAt: now,
    };
    this.contributions.set(id, newContribution);
    return newContribution;
  }

  async getContributionsByCompanyId(companyId: number): Promise<Contribution[]> {
    return Array.from(this.contributions.values()).filter(
      contribution => contribution.companyId === companyId
    );
  }

  // Application operations
  async createApplication(application: Partial<InsertApplication>): Promise<Application> {
    const id = this.applicationIdCounter++;
    const now = new Date();
    const newApplication: Application = {
      id,
      companyId: application.companyId!,
      initiatorId: application.initiatorId || null,
      status: application.status || 'in_progress',
      completedSteps: application.completedSteps || [],
      currentStep: application.currentStep || 'application-initiator',
      createdAt: now,
      updatedAt: now,
      selectedCarrier: null,
      signature: null,
      submittedAt: null,
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplicationByCompanyId(companyId: number): Promise<Application | undefined> {
    return Array.from(this.applications.values()).find(
      application => application.companyId === companyId
    );
  }

  async updateApplication(id: number, updates: Partial<UpdateApplication>): Promise<Application> {
    const application = this.applications.get(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }

    const now = new Date();
    const updatedApplication: Application = {
      ...application,
      ...updates,
      updatedAt: now,
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async getAllApplications(): Promise<(Application & Company & User)[]> {
    return Array.from(this.applications.values()).map(application => {
      const company = this.companies.get(application.companyId);
      if (!company) throw new Error(`Company with ID ${application.companyId} not found`);

      const user = this.users.get(company.userId);
      if (!user) throw new Error(`User with ID ${company.userId} not found`);

      return { ...application, ...company, ...user };
    });
  }

  async getApplicationsByBroker(brokerId: string): Promise<Application[]> {
    // Get all companies associated with this broker's users
    const companies = await this.getCompaniesByBroker(brokerId);
    const companyIds = companies.map(company => company.id);
    
    // Return applications for these companies
    return Array.from(this.applications.values()).filter(application => 
      companyIds.includes(application.companyId)
    );
  }

  async getUsersByBroker(brokerId: string): Promise<User[]> {
    return this.getUsersByBrokerId(brokerId);
  }

  async updateApplicationProgress(companyId: number, currentStep: string): Promise<void> {
    const application = await this.getApplicationByCompanyId(companyId);
    if (!application) {
      throw new Error(`Application for company ID ${companyId} not found`);
    }

    // Update completed steps if not already included
    const completedSteps = application.completedSteps as string[];
    if (!completedSteps.includes(currentStep)) {
      completedSteps.push(currentStep);
    }

    await this.updateApplication(application.id, {
      currentStep,
      completedSteps,
    });
  }

  // Audit logging methods
  async createAuditLog(log: {
    userId: number;
    action: AuditAction;
    entityType: EntityType;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const auditLog = {
      id: this.auditLogIdCounter++,
      timestamp: new Date(),
      ...log,
    };
    this.auditLogs.push(auditLog);
    console.log(`Audit log created: ${auditLog.action} by user ${auditLog.userId}`);
  }

  async getAuditLogs(filters?: {
    userId?: number;
    action?: AuditAction;
    entityType?: EntityType;
    entityId?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<any[]> {
    let filteredLogs = [...this.auditLogs];

    if (filters) {
      if (filters.userId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }

      if (filters.action !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }

      if (filters.entityType !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.entityType === filters.entityType);
      }

      if (filters.entityId !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.entityId === filters.entityId);
      }

      if (filters.fromDate !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.fromDate!);
      }

      if (filters.toDate !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.toDate!);
      }
    }

    // Sort by timestamp (newest first)
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRecentAuditLogs(limit: number = 50): Promise<any[]> {
    // Sort logs by timestamp (newest first) and return the most recent ones
    return [...this.auditLogs]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Application Initiator operations
  async createApplicationInitiator(
    initiator: InsertApplicationInitiator
  ): Promise<ApplicationInitiator> {
    const id = this.applicationInitiatorIdCounter++;
    const newInitiator: ApplicationInitiator = {
      id,
      ...initiator,
      createdAt: new Date(),
    };
    this.applicationInitiators.set(id, newInitiator);
    return newInitiator;
  }

  async getApplicationInitiator(id: number): Promise<ApplicationInitiator | undefined> {
    return this.applicationInitiators.get(id);
  }

  async getApplicationInitiatorByUserId(userId: number): Promise<ApplicationInitiator | undefined> {
    for (const initiator of this.applicationInitiators.values()) {
      if (initiator.userId === userId) {
        return initiator;
      }
    }
    return undefined;
  }
}

// Replace MemStorage with DatabaseStorage for production use
export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Implementation methods will be added here
  async getBroker(id: string): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.id, id));
    return broker || undefined;
  }

  async createBroker(broker: InsertBroker): Promise<Broker> {
    const [newBroker] = await db.insert(brokers).values(broker).returning();
    return newBroker;
  }

  async updateBroker(id: string, updates: Partial<InsertBroker>): Promise<Broker> {
    const [updated] = await db.update(brokers).set(updates).where(eq(brokers.id, id)).returning();
    return updated;
  }

  async getBrokerByUserId(userId: number): Promise<Broker | undefined> {
    const [broker] = await db.select().from(brokers).where(eq(brokers.ownerId, userId));
    return broker || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUsersByBrokerId(brokerId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.brokerId, brokerId));
  }

  // Carrier-specific plan filtering methods
  async getAllPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }

  async getFilteredPlans(carrier?: string, coverageDate?: Date): Promise<Plan[]> {
    let query = db.select().from(plans);

    if (carrier && coverageDate) {
      query = query.where(
        and(
          eq(plans.carrier, carrier),
          lte(plans.effectiveStart, coverageDate),
          gte(plans.effectiveEnd, coverageDate)
        )
      );
    } else if (carrier) {
      query = query.where(eq(plans.carrier, carrier));
    }

    return await query;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async createBulkPlans(planList: InsertPlan[]): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const plan of planList) {
      try {
        // Check for duplicates
        const existing = await this.getPlanByNameAndCarrier(plan.planName, plan.carrier);
        if (existing) {
          skipped++;
          continue;
        }

        await this.createPlan(plan);
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return { created, skipped };
  }

  async getPlanByNameAndCarrier(name: string, carrier: string): Promise<Plan | undefined> {
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.planName, name), eq(plans.carrier, carrier)));
    return plan || undefined;
  }

  // Additional required methods...
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompaniesByUserId(userId: number): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.userId, userId));
  }

  // Stub methods for other operations (to be implemented as needed)
  async createOwner(owner: InsertOwner): Promise<Owner> {
    throw new Error('Not implemented');
  }
  async getOwnersByCompanyId(companyId: number): Promise<Owner[]> {
    throw new Error('Not implemented');
  }
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    throw new Error('Not implemented');
  }
  async getEmployeesByCompanyId(companyId: number): Promise<Employee[]> {
    throw new Error('Not implemented');
  }
  async createDocument(document: InsertDocument): Promise<Document> {
    throw new Error('Not implemented');
  }
  async getDocument(id: number): Promise<Document | undefined> {
    throw new Error('Not implemented');
  }
  async getDocumentsByCompanyId(companyId: number): Promise<Document[]> {
    throw new Error('Not implemented');
  }
  async deleteDocument(id: number): Promise<void> {
    throw new Error('Not implemented');
  }
  async createCompanyPlan(companyPlan: InsertCompanyPlan): Promise<CompanyPlan> {
    throw new Error('Not implemented');
  }
  async getCompanyPlans(companyId: number): Promise<(CompanyPlan & Plan)[]> {
    throw new Error('Not implemented');
  }
  async deleteCompanyPlan(companyId: number, planId: number): Promise<void> {
    throw new Error('Not implemented');
  }
  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    throw new Error('Not implemented');
  }
  async getContributionsByCompanyId(companyId: number): Promise<Contribution[]> {
    throw new Error('Not implemented');
  }
  async createApplication(application: Partial<InsertApplication>): Promise<Application> {
    throw new Error('Not implemented');
  }
  async getApplication(id: number): Promise<Application | undefined> {
    throw new Error('Not implemented');
  }
  async getApplicationByCompanyId(companyId: number): Promise<Application | undefined> {
    throw new Error('Not implemented');
  }
  async updateApplication(id: number, updates: Partial<UpdateApplication>): Promise<Application> {
    throw new Error('Not implemented');
  }
  async getAllApplications(): Promise<(Application & Company & User)[]> {
    throw new Error('Not implemented');
  }
  async updateApplicationProgress(companyId: number, currentStep: string): Promise<void> {
    throw new Error('Not implemented');
  }
  async createAuditLog(log: any): Promise<void> {
    throw new Error('Not implemented');
  }
  async getAuditLogs(filters?: any): Promise<any[]> {
    throw new Error('Not implemented');
  }
  async getRecentAuditLogs(limit?: number): Promise<any[]> {
    throw new Error('Not implemented');
  }
}

export const storage = new MemStorage();
// Uncomment to use PostgreSQL: export const storage = new DatabaseStorage();
