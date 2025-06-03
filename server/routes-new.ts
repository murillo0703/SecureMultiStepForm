import type { Express } from "express";
import { createServer, type Server } from "http";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { validateAddress } from "./address-validation";
import { ErrorHandler, ApplicationLogger, PerformanceMonitor, ResponseUtils } from "./code-quality-utilities";

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
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

  // Company endpoints
  app.post('/api/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const company = await storage.createCompany({
        ...req.body,
        userId: req.user!.id
      });
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

  // Employee endpoints
  app.post('/api/employees', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const employee = await storage.createEmployee({
        ...req.body,
        companyId: req.body.companyId
      });
      res.status(201).json(employee);
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

  const httpServer = createServer(app);
  return httpServer;
}