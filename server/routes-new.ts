import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { validateAddress } from "./address-validation";
import { ErrorHandler, ApplicationLogger, PerformanceMonitor, ResponseUtils } from "./code-quality-utilities";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Temporary bypass for development - create mock user if not authenticated
  if (!req.isAuthenticated()) {
    req.user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      role: 'employer',
      brokerId: 'test-broker-id',
      companyName: 'Test Company',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;
  }
  return next();
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

const isBroker = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'broker' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ error: 'Broker access required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User availability check
  app.post('/api/check-availability', async (req: Request, res: Response) => {
    try {
      const { field, value } = req.body;
      
      if (field === 'username') {
        const user = await storage.getUserByUsername(value);
        res.json({ available: !user });
      } else if (field === 'email') {
        const user = await storage.getUserByEmail?.(value);
        res.json({ available: !user });
      } else {
        res.status(400).json({ error: 'Invalid field' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Address validation endpoint
  app.post('/api/validate-address', validateAddress);

  // Feature flags endpoint
  app.get('/api/feature-flags', async (req: Request, res: Response) => {
    res.json({
      addressValidation: !!process.env.USPS_USER_ID,
      documentValidation: true,
      autoSave: true,
      advancedQuoting: true
    });
  });

  // Employer dashboard endpoints
  app.get('/api/employer/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const stats = {
        totalCompanies: 1,
        activeApplications: 2,
        completedApplications: 5,
        pendingQuotes: 3,
        totalEmployees: 45,
        monthlyRevenue: '$12,500'
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employer/applications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const applications = [
        {
          id: 1,
          companyName: 'Tech Innovations LLC',
          type: 'New Business',
          status: 'in_progress',
          effectiveDate: '2025-01-01',
          submittedDate: '2024-12-15',
          progress: 75
        },
        {
          id: 2,
          companyName: 'Marketing Solutions Inc',
          type: 'Renewal',
          status: 'pending_review',
          effectiveDate: '2025-02-01',
          submittedDate: '2024-12-20',
          progress: 90
        }
      ];
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employer/applications/new', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const application = {
        id: Date.now(),
        companyName: req.body.companyName || 'New Company',
        type: 'New Business',
        status: 'draft',
        effectiveDate: req.body.effectiveDate || new Date().toISOString().split('T')[0],
        submittedDate: new Date().toISOString().split('T')[0],
        progress: 0,
        userId: req.user!.id
      };
      res.status(201).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employer/company', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const company = {
        id: Date.now(),
        name: req.body.companyName || 'New Company',
        taxId: req.body.taxId || '',
        industry: req.body.industry || '',
        address: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        zip: req.body.zip || '',
        phone: req.body.phone || '',
        userId: req.user!.id,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Company endpoints
  app.get('/api/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const companies = [
        {
          id: 1,
          name: 'Tech Innovations LLC',
          taxId: '12-3456789',
          industry: '54',
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          phone: '(555) 123-4567'
        },
        {
          id: 2,
          name: 'Marketing Solutions Inc',
          taxId: '98-7654321',
          industry: '54',
          address: '456 Marketing Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90210',
          phone: '(555) 987-6543'
        }
      ];
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const company = {
        id: Date.now(),
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const company = await storage.getCompany(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/companies/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const company = await storage.updateCompany(parseInt(req.params.id), req.body);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Owners endpoints
  app.get('/api/owners', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.json([]);
      }
      
      const owners = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Smith',
          title: 'CEO',
          email: 'john@company.com',
          phone: '(555) 123-4567',
          ownershipPercentage: 60,
          relationshipToCompany: 'Owner',
          isEligibleForCoverage: true,
          isAuthorizedContact: true,
          companyId: parseInt(companyId as string)
        }
      ];
      res.json(owners);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/owners', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const owner = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(owner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee endpoints
  app.get('/api/employees', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;
      if (!companyId) {
        return res.json([]);
      }
      
      const employees = [
        {
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@company.com',
          phone: '(555) 987-6543',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          dob: '1990-05-15',
          ssn: '123-45-6789',
          companyId: parseInt(companyId as string)
        },
        {
          id: 2,
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@company.com',
          phone: '(555) 456-7890',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90210',
          dob: '1985-08-22',
          ssn: '987-65-4321',
          companyId: parseInt(companyId as string)
        }
      ];
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const employee = {
        id: Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees/census-upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Mock census upload - in production this would parse CSV/Excel files
      const uploadedEmployees = [
        {
          id: Date.now() + 1,
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@company.com',
          phone: '(555) 111-2222',
          address: '789 Pine St',
          city: 'Seattle',
          state: 'WA',
          zip: '98101',
          dob: '1988-03-10',
          ssn: '111-22-3333',
          companyId: req.body.companyId || 1
        },
        {
          id: Date.now() + 2,
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@company.com',
          phone: '(555) 333-4444',
          address: '321 Cedar Ave',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          dob: '1992-11-05',
          ssn: '444-55-6666',
          companyId: req.body.companyId || 1
        }
      ];
      
      res.status(201).json({
        message: 'Census uploaded successfully',
        employeesAdded: uploadedEmployees.length,
        employees: uploadedEmployees
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.query;
      const employees = await storage.getEmployeesByCompany(parseInt(companyId as string));
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const employee = await storage.updateEmployee(parseInt(req.params.id), req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      await storage.deleteEmployee(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quote endpoints
  app.post('/api/quotes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quote = await storage.createQuote({
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json(quote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/quotes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quotes = await storage.getQuotesByUser(req.user!.id);
      res.json(quotes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(parseInt(req.params.id));
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quote = await storage.updateQuote(parseInt(req.params.id), {
        ...req.body,
        updatedAt: new Date()
      });
      res.json(quote);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Plans endpoints
  app.get('/api/plans', async (req: Request, res: Response) => {
    try {
      const { carrier, type, state, effectiveDate } = req.query;
      const plans = await storage.getPlans({
        carrier: carrier as string,
        planType: type as string,
        state: state as string,
        effectiveDate: effectiveDate ? new Date(effectiveDate as string) : undefined
      });
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rating areas endpoint
  app.get('/api/rating-areas', async (req: Request, res: Response) => {
    const ratingAreas = [
      { zip: '90210', county: 'Los Angeles', state: 'CA', ratingArea: 1 },
      { zip: '10001', county: 'New York', state: 'NY', ratingArea: 1 },
      { zip: '60601', county: 'Cook', state: 'IL', ratingArea: 1 },
      { zip: '77001', county: 'Harris', state: 'TX', ratingArea: 1 },
      { zip: '33101', county: 'Miami-Dade', state: 'FL', ratingArea: 1 }
    ];
    res.json(ratingAreas);
  });

  // Carriers endpoint
  app.get('/api/carriers', async (req: Request, res: Response) => {
    const carriers = [
      { id: 'anthem', name: 'Anthem Blue Cross', states: ['CA', 'NY', 'TX'] },
      { id: 'kaiser', name: 'Kaiser Permanente', states: ['CA', 'OR', 'WA'] },
      { id: 'healthnet', name: 'Health Net', states: ['CA', 'AZ'] },
      { id: 'aetna', name: 'Aetna', states: ['NY', 'FL', 'TX'] },
      { id: 'cigna', name: 'Cigna', states: ['IL', 'OH', 'PA'] }
    ];
    res.json(carriers);
  });

  // Document upload endpoint
  app.post('/api/documents/upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Mock implementation for document upload
      const document = {
        id: Date.now(),
        filename: req.body.filename,
        originalName: req.body.originalName,
        mimeType: req.body.mimeType,
        size: req.body.size,
        uploadedBy: req.user!.id,
        uploadedAt: new Date()
      };
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate quote proposal
  app.post('/api/quotes/:id/proposal', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(parseInt(req.params.id));
      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Mock PDF generation
      const proposal = {
        id: Date.now(),
        quoteId: quote.id,
        filename: `proposal-${quote.id}.pdf`,
        generatedAt: new Date(),
        downloadUrl: `/api/proposals/${Date.now()}/download`
      };

      res.json(proposal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin endpoints
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/companies', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Broker endpoints
  app.get('/api/broker/companies', isAuthenticated, isBroker, async (req: Request, res: Response) => {
    try {
      const companies = req.user!.role === 'admin' 
        ? await storage.getAllCompanies()
        : await storage.getCompaniesByBroker(req.user!.brokerId || '');
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subscription module access endpoints
  app.get('/api/subscription/modules/:moduleName/access', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { moduleName } = req.params;
      const user = req.user!;
      
      const moduleAccess = {
        moduleName,
        accessLevel: user.role === 'master_admin' ? 'full' : 'read',
        hasAccess: true
      };
      
      res.json(moduleAccess);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/subscription/usage', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { moduleName, action, resourceId } = req.body;
      
      const usage = {
        id: Date.now(),
        userId: req.user!.id,
        moduleName,
        action,
        resourceId,
        timestamp: new Date()
      };
      
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rating areas endpoint
  app.get('/api/rating-areas', async (req: Request, res: Response) => {
    try {
      const ratingAreas = [
        { zip: '90210', county: 'Los Angeles', state: 'CA', ratingArea: 1 },
        { zip: '94102', county: 'San Francisco', state: 'CA', ratingArea: 2 },
        { zip: '93710', county: 'Fresno', state: 'CA', ratingArea: 3 }
      ];
      res.json(ratingAreas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Carriers endpoint
  app.get('/api/carriers', async (req: Request, res: Response) => {
    try {
      const carriers = [
        { id: 'anthem', name: 'Anthem Blue Cross', active: true },
        { id: 'blue_shield', name: 'Blue Shield of California', active: true },
        { id: 'kaiser', name: 'Kaiser Permanente', active: true },
        { id: 'health_net', name: 'Health Net', active: true },
        { id: 'sharp', name: 'Sharp Health Plan', active: true }
      ];
      res.json(carriers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Quote generation endpoint
  app.post('/api/quotes/generate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { zipCode, effectiveDate, employees, planTypes } = req.body;
      
      if (!zipCode || !effectiveDate || !planTypes?.length) {
        return res.status(400).json({ message: 'Missing required quote parameters' });
      }

      const quotes = planTypes.map((type: string, index: number) => ({
        id: `quote_${Date.now()}_${index}`,
        carrierName: ['Anthem Blue Cross', 'Kaiser Permanente', 'Health Net'][index % 3],
        planName: `${type.charAt(0).toUpperCase() + type.slice(1)} Plan ${index + 1}`,
        planType: type,
        monthlyPremium: 450 + (index * 50),
        deductible: 1000 + (index * 500),
        outOfPocketMax: 5000 + (index * 1000),
        network: 'PPO',
        metalTier: ['Bronze', 'Silver', 'Gold'][index % 3]
      }));

      res.json({ quotes, ratingArea: 1 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document management endpoints
  app.get('/api/documents', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/documents/upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const document = {
        id: Date.now(),
        filename: req.body.filename || `doc_${Date.now()}`,
        originalName: req.body.originalName || 'uploaded_file',
        mimeType: req.body.mimeType || 'application/octet-stream',
        size: req.body.size || 0,
        type: req.body.type || 'other',
        uploadedBy: req.user!.id,
        uploadedAt: new Date().toISOString(),
        companyId: req.user!.companyId
      };
      
      res.status(201).json(document);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // In a real implementation, this would delete from storage
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee census upload endpoint
  app.post('/api/employees/census-upload', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { employees } = req.body;
      
      if (!Array.isArray(employees)) {
        return res.status(400).json({ error: 'Invalid employees data' });
      }

      let imported = 0;
      const errors: string[] = [];

      for (const emp of employees) {
        try {
          if (!emp.fullName || !emp.dateOfBirth || !emp.email) {
            errors.push(`Missing required fields for employee: ${emp.fullName || 'Unknown'}`);
            continue;
          }

          const [firstName, ...lastNameParts] = emp.fullName.split(' ');
          const lastName = lastNameParts.join(' ');

          const employee = {
            firstName,
            lastName,
            email: emp.email,
            dob: emp.dateOfBirth,
            address: emp.address || '',
            ssn: emp.ssn || '',
            companyId: req.user!.companyId || 1,
            isActive: true,
            phone: '',
            city: '',
            state: '',
            zip: '',
            gender: null,
            salary: 0,
            hoursPerWeek: 40,
            hireDate: new Date().toISOString(),
            jobTitle: '',
            department: '',
            employeeId: `EMP${Date.now()}_${imported}`,
            benefitEligibilityDate: new Date().toISOString(),
            workLocation: '',
            manager: '',
            payrollFrequency: 'biweekly',
            exemptStatus: 'non-exempt',
            unionMember: false,
            cobEnrolled: false,
            notes: 'Imported from census upload'
          };

          await storage.createEmployee(employee);
          imported++;
        } catch (err: any) {
          errors.push(`Failed to import ${emp.fullName}: ${err.message}`);
        }
      }

      res.json({ 
        imported, 
        total: employees.length, 
        errors: errors.length > 0 ? errors : undefined 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}