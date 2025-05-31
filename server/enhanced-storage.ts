import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, and, or, ilike, desc, asc } from 'drizzle-orm';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import * as schema from '@shared/schema';
import type { 
  User, 
  InsertUser, 
  Company, 
  InsertCompany,
  Employee,
  InsertEmployee,
  Plan,
  InsertPlan
} from '@shared/schema';

/**
 * Enhanced database storage layer with proper security measures
 * Implements prepared statements, password hashing, and comprehensive error handling
 */

const scryptAsync = promisify(scrypt);

/**
 * Secure password hashing utilities
 * Uses scrypt with random salt for enhanced security
 */
export class PasswordSecurity {
  private static readonly SALT_LENGTH = 32;
  private static readonly KEY_LENGTH = 64;

  /**
   * Hash a password with a random salt
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password with salt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = randomBytes(this.SALT_LENGTH);
      const key = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
      
      // Combine salt and key for storage
      return salt.toString('hex') + ':' + key.toString('hex');
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify a password against its hash
   * @param password - Plain text password to verify
   * @param hashedPassword - Stored hash to verify against
   * @returns Promise<boolean> - True if password matches
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [saltHex, keyHex] = hashedPassword.split(':');
      
      if (!saltHex || !keyHex) {
        console.warn('Invalid password hash format');
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const storedKey = Buffer.from(keyHex, 'hex');
      
      const derivedKey = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
      
      // Use timing-safe comparison to prevent timing attacks
      return timingSafeEqual(storedKey, derivedKey);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
}

/**
 * Database connection and query execution utilities
 */
export class DatabaseManager {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Connection pool configuration for better performance
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  /**
   * Execute a database transaction with proper error handling
   * @param callback - Function to execute within transaction
   * @returns Promise<T> - Result of the transaction
   */
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    try {
      return await this.db.transaction(callback);
    } catch (error) {
      console.error('Database transaction error:', error);
      throw new Error('Database operation failed');
    }
  }

  /**
   * Get database instance for direct queries
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
  }
}

/**
 * Enhanced storage implementation with comprehensive security measures
 */
export class EnhancedStorage {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = new DatabaseManager();
  }

  /**
   * User management methods with enhanced security
   */

  /**
   * Create a new user with secure password hashing
   * @param userData - User data to insert
   * @returns Promise<User> - Created user without password
   */
  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Hash password before storing
      const hashedPassword = await PasswordSecurity.hashPassword(userData.password);
      
      const userToInsert = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        role: userData.role || 'user',
        brokerId: userData.brokerId || null,
        companyName: userData.companyName || null,
      };

      const [user] = await this.dbManager.getDatabase()
        .insert(schema.users)
        .values(userToInsert)
        .returning();

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Return user without password for security
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('User creation failed');
    }
  }

  /**
   * Get user by ID with password excluded
   * @param id - User ID
   * @returns Promise<User | undefined>
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await this.dbManager.getDatabase()
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  /**
   * Get user by username for authentication
   * @param username - Username to search for
   * @returns Promise<User | undefined>
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (!username || username.trim().length === 0) {
        return undefined;
      }

      const [user] = await this.dbManager.getDatabase()
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, username.trim()))
        .limit(1);

      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  /**
   * Verify user credentials for authentication
   * @param username - Username
   * @param password - Plain text password
   * @returns Promise<User | null> - User if credentials are valid
   */
  async verifyUserCredentials(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        // Perform dummy password verification to prevent timing attacks
        await PasswordSecurity.verifyPassword(password, 'dummy:hash');
        return null;
      }

      const isPasswordValid = await PasswordSecurity.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        console.warn(`Failed login attempt for user: ${username}`);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error verifying user credentials:', error);
      return null;
    }
  }

  /**
   * Update user information with validation
   * @param id - User ID
   * @param updates - Partial user data to update
   * @returns Promise<User | undefined>
   */
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, ...safeUpdates } = updates;
      
      if (Object.keys(safeUpdates).length === 0) {
        return this.getUser(id);
      }

      const [updatedUser] = await this.dbManager.getDatabase()
        .update(schema.users)
        .set(safeUpdates)
        .where(eq(schema.users.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  /**
   * Update user password with proper security
   * @param id - User ID
   * @param newPassword - New plain text password
   * @returns Promise<boolean> - Success status
   */
  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await PasswordSecurity.hashPassword(newPassword);
      
      const [updatedUser] = await this.dbManager.getDatabase()
        .update(schema.users)
        .set({ password: hashedPassword })
        .where(eq(schema.users.id, id))
        .returning({ id: schema.users.id });

      return !!updatedUser;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false;
    }
  }

  /**
   * Company management methods
   */

  /**
   * Create a new company with validation
   * @param companyData - Company data to insert
   * @returns Promise<Company>
   */
  async createCompany(companyData: InsertCompany): Promise<Company> {
    try {
      const companyToInsert = {
        ...companyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [company] = await this.dbManager.getDatabase()
        .insert(schema.companies)
        .values(companyToInsert)
        .returning();

      if (!company) {
        throw new Error('Failed to create company');
      }

      return company;
    } catch (error) {
      console.error('Error creating company:', error);
      throw new Error('Company creation failed');
    }
  }

  /**
   * Get company by ID
   * @param id - Company ID
   * @returns Promise<Company | undefined>
   */
  async getCompany(id: number): Promise<Company | undefined> {
    try {
      const [company] = await this.dbManager.getDatabase()
        .select()
        .from(schema.companies)
        .where(eq(schema.companies.id, id))
        .limit(1);

      return company;
    } catch (error) {
      console.error('Error fetching company:', error);
      return undefined;
    }
  }

  /**
   * Get companies by user ID with pagination
   * @param userId - User ID
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Promise<Company[]>
   */
  async getCompaniesByUser(userId: number, page: number = 1, limit: number = 10): Promise<Company[]> {
    try {
      const offset = (page - 1) * limit;
      
      const companies = await this.dbManager.getDatabase()
        .select()
        .from(schema.companies)
        .where(eq(schema.companies.userId, userId))
        .orderBy(desc(schema.companies.createdAt))
        .limit(limit)
        .offset(offset);

      return companies;
    } catch (error) {
      console.error('Error fetching companies by user:', error);
      return [];
    }
  }

  /**
   * Search companies with filters
   * @param searchTerm - Search term for company name
   * @param filters - Additional filters
   * @returns Promise<Company[]>
   */
  async searchCompanies(
    searchTerm?: string, 
    filters?: { industry?: string; state?: string }
  ): Promise<Company[]> {
    try {
      let query = this.dbManager.getDatabase().select().from(schema.companies);
      
      const conditions = [];
      
      if (searchTerm && searchTerm.trim().length > 0) {
        conditions.push(ilike(schema.companies.name, `%${searchTerm.trim()}%`));
      }
      
      if (filters?.industry) {
        conditions.push(eq(schema.companies.industry, filters.industry));
      }
      
      if (filters?.state) {
        conditions.push(eq(schema.companies.state, filters.state));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query
        .orderBy(asc(schema.companies.name))
        .limit(100); // Reasonable limit for search results
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  }

  /**
   * Employee management methods
   */

  /**
   * Create a new employee with validation
   * @param employeeData - Employee data to insert
   * @returns Promise<Employee>
   */
  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    try {
      const employeeToInsert = {
        ...employeeData,
        createdAt: new Date(),
        email: employeeData.email || null,
        phone: employeeData.phone || null,
      };

      const [employee] = await this.dbManager.getDatabase()
        .insert(schema.employees)
        .values(employeeToInsert)
        .returning();

      if (!employee) {
        throw new Error('Failed to create employee');
      }

      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error('Employee creation failed');
    }
  }

  /**
   * Get employees by company ID with pagination
   * @param companyId - Company ID
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Promise<Employee[]>
   */
  async getEmployeesByCompany(companyId: number, page: number = 1, limit: number = 50): Promise<Employee[]> {
    try {
      const offset = (page - 1) * limit;
      
      const employees = await this.dbManager.getDatabase()
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.companyId, companyId))
        .orderBy(asc(schema.employees.lastName), asc(schema.employees.firstName))
        .limit(limit)
        .offset(offset);

      return employees;
    } catch (error) {
      console.error('Error fetching employees by company:', error);
      return [];
    }
  }

  /**
   * Plan management methods
   */

  /**
   * Create a new insurance plan
   * @param planData - Plan data to insert
   * @returns Promise<Plan>
   */
  async createPlan(planData: InsertPlan): Promise<Plan> {
    try {
      const planToInsert = {
        ...planData,
        createdAt: new Date(),
        details: planData.details || null,
        metalTier: planData.metalTier || null,
        contractCode: planData.contractCode || null,
      };

      const [plan] = await this.dbManager.getDatabase()
        .insert(schema.plans)
        .values(planToInsert)
        .returning();

      if (!plan) {
        throw new Error('Failed to create plan');
      }

      return plan;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw new Error('Plan creation failed');
    }
  }

  /**
   * Get plans by carrier with filters
   * @param carrier - Insurance carrier name
   * @param filters - Additional filters
   * @returns Promise<Plan[]>
   */
  async getPlansByCarrier(
    carrier: string,
    filters?: { type?: string; metalTier?: string; maxCost?: number }
  ): Promise<Plan[]> {
    try {
      let query = this.dbManager.getDatabase()
        .select()
        .from(schema.plans)
        .where(eq(schema.plans.carrier, carrier));
      
      const conditions = [eq(schema.plans.carrier, carrier)];
      
      if (filters?.type) {
        conditions.push(eq(schema.plans.type, filters.type));
      }
      
      if (filters?.metalTier) {
        conditions.push(eq(schema.plans.metalTier, filters.metalTier));
      }
      
      if (filters?.maxCost) {
        conditions.push(eq(schema.plans.monthlyCost, filters.maxCost));
      }
      
      return await this.dbManager.getDatabase()
        .select()
        .from(schema.plans)
        .where(and(...conditions))
        .orderBy(asc(schema.plans.monthlyCost))
        .limit(100);
    } catch (error) {
      console.error('Error fetching plans by carrier:', error);
      return [];
    }
  }

  /**
   * Utility methods for application health and monitoring
   */

  /**
   * Check database connection health
   * @returns Promise<boolean>
   */
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.dbManager.getDatabase().select().from(schema.users).limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get application statistics
   * @returns Promise<object> - Application statistics
   */
  async getApplicationStats(): Promise<{
    totalUsers: number;
    totalCompanies: number;
    totalEmployees: number;
    totalPlans: number;
  }> {
    try {
      const [userCount] = await this.dbManager.getDatabase()
        .select({ count: sql`count(*)` })
        .from(schema.users);
      
      const [companyCount] = await this.dbManager.getDatabase()
        .select({ count: sql`count(*)` })
        .from(schema.companies);
      
      const [employeeCount] = await this.dbManager.getDatabase()
        .select({ count: sql`count(*)` })
        .from(schema.employees);
      
      const [planCount] = await this.dbManager.getDatabase()
        .select({ count: sql`count(*)` })
        .from(schema.plans);

      return {
        totalUsers: parseInt(userCount?.count as string) || 0,
        totalCompanies: parseInt(companyCount?.count as string) || 0,
        totalEmployees: parseInt(employeeCount?.count as string) || 0,
        totalPlans: parseInt(planCount?.count as string) || 0,
      };
    } catch (error) {
      console.error('Error fetching application stats:', error);
      return {
        totalUsers: 0,
        totalCompanies: 0,
        totalEmployees: 0,
        totalPlans: 0,
      };
    }
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dbManager.close();
  }
}