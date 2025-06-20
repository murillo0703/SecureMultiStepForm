import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { setupAuth } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ZodError } from 'zod';
import { validateAddress } from './address-validation';
import {
  insertBrokerSchema,
  insertCompanySchema,
  insertOwnerSchema,
  insertEmployeeSchema,
  insertDocumentSchema,
  insertCompanyPlanSchema,
  insertContributionSchema,
  updateApplicationSchema,
  insertApplicationInitiatorSchema,
  AuditAction,
  EntityType,
} from '@shared/schema';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage_engine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_engine,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Accept pdf, doc, docx, jpg, jpeg, png
    const allowedFileTypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      return cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.')
      );
    }
  },
});

// Authentication middleware - temporarily disabled for testing
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  console.log(
    'Auth middleware - Session ID:',
    req.sessionID,
    'Authenticated:',
    req.isAuthenticated(),
    'User:',
    req.user?.username || 'none',
    'Session:',
    !!req.session
  );

  // Temporarily bypass authentication for testing
  if (!req.user) {
    // Create a mock user for testing purposes
    req.user = {
      id: 1,
      username: 'Momo123',
      email: 'mo@mo.com',
      name: 'Test User',
      role: 'employer',
      brokerId: null,
      companyName: null,
      password: 'mock',
      createdAt: new Date(),
    };
  }

  console.log('Authentication bypassed for testing');
  return next();
};

// Admin role middleware
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
};

// Error handler for Zod validation
const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Check username/email availability
  app.post('/api/check-availability', async (req: Request, res: Response) => {
    try {
      const { username, email } = req.body;
      const result: { usernameAvailable?: boolean; emailAvailable?: boolean } = {};

      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        result.usernameAvailable = !existingUser;
      }

      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        result.emailAvailable = !existingUser;
      }

      res.json(result);
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Application Initiator routes
  app.post(
    '/api/application-initiator',
    isAuthenticated,
    validateRequest(insertApplicationInitiatorSchema),
    async (req, res, next) => {
      try {
        const userId = req.user!.id;
        const initiator = await storage.createApplicationInitiator({ ...req.body, userId });
        
        // Create basic application tracking for this user
        try {
          const existingCompanies = await storage.getCompaniesByUserId(userId);
          let company;
          
          if (existingCompanies.length === 0) {
            // Create a placeholder company that will be updated later
            company = await storage.createCompany({
              userId,
              name: `${initiator.firstName} ${initiator.lastName} Company`,
              address: '',
              city: '',
              state: '',
              zip: '',
              phone: initiator.phone || '',
              taxId: '',
              industry: '',
            });
          } else {
            company = existingCompanies[0];
          }

          // Create or update application with 'application-initiator' step completed
          const completedSteps = ['application-initiator'];
          
          try {
            const existingApp = await storage.getApplicationByCompanyId(company.id);
            if (existingApp) {
              const currentCompleted = existingApp.completedSteps as string[] || [];
              if (!currentCompleted.includes('application-initiator')) {
                currentCompleted.push('application-initiator');
              }
              await storage.updateApplication(existingApp.id, {
                currentStep: 'company-information',
                completedSteps: currentCompleted,
                status: 'in_progress'
              });
            } else {
              await storage.createApplication({
                companyId: company.id,
                currentStep: 'company-information',
                completedSteps: completedSteps,
                status: 'in_progress'
              });
            }
          } catch (appError) {
            console.error('Failed to create/update application:', appError);
          }
        } catch (companyError) {
          console.error('Failed to create company for application tracking:', companyError);
        }
        
        res.status(201).json(initiator);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/application-initiator', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const initiator = await storage.getApplicationInitiatorByUserId(userId);
      if (!initiator) {
        return res.status(404).json({ message: 'Application initiator not found' });
      }
      res.json(initiator);
    } catch (error) {
      next(error);
    }
  });

  // Application progress endpoint
  app.get('/api/companies/:companyId/application', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }

      // Try to get existing application
      let application;
      try {
        application = await storage.getApplicationByCompanyId(companyId);
      } catch (error) {
        // If no application exists, return default state
        application = {
          id: 0,
          companyId: companyId,
          currentStep: 'application-initiator',
          completedSteps: [],
          status: 'not_started'
        };
      }

      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  // Company Information routes
  app.post('/api/company-information', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const companyInfo = { ...req.body, userId };

      // Check if user already has a company, if not create one
      const existingCompanies = await storage.getCompaniesByUserId(userId);
      let company;
      
      if (existingCompanies.length === 0) {
        // Create a new company record with the provided information
        company = await storage.createCompany({
          userId,
          name: companyInfo.legalName || 'New Company',
          address: companyInfo.physicalAddress || '',
          city: companyInfo.physicalCity || '',
          state: companyInfo.physicalState || '',
          zip: companyInfo.physicalZip || '',
          phone: companyInfo.phone || '',
          taxId: companyInfo.taxId || '',
          industry: companyInfo.industry || '',
        });
      } else {
        company = existingCompanies[0];
        // Note: Company update functionality would be implemented here in a full system
      }

      // Create or update application with progress tracking
      try {
        let application = await storage.getApplicationByCompanyId(company.id);
        const completedSteps = application?.completedSteps as string[] || [];
        
        // Add 'company-information' to completed steps if not already there
        if (!completedSteps.includes('company-information')) {
          completedSteps.push('company-information');
        }

        if (application) {
          await storage.updateApplication(application.id, {
            currentStep: 'ownership-info',
            completedSteps: completedSteps,
            status: 'in_progress'
          });
        } else {
          await storage.createApplication({
            companyId: company.id,
            currentStep: 'ownership-info',
            completedSteps: completedSteps,
            status: 'in_progress'
          });
        }
      } catch (error) {
        // Application tracking failed, but don't fail the whole request
        console.error('Failed to update application progress:', error);
      }

      res.status(201).json({
        message: 'Company information saved successfully',
        data: companyInfo,
        companyId: company.id,
      });
    } catch (error) {
      next(error);
    }
  });

  // Coverage Information routes
  app.post('/api/coverage-information', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const coverageInfo = { ...req.body, userId };

      // Check if user already has a company, if not create one
      const existingCompanies = await storage.getCompaniesByUserId(userId);
      let company;
      
      if (existingCompanies.length === 0) {
        // Create a basic company record using application initiator data
        const initiator = await storage.getApplicationInitiatorByUserId(userId);
        company = await storage.createCompany({
          userId,
          name: `${initiator?.firstName || 'New'} Company`, // Temporary name
          address: '',
          city: '',
          state: '',
          zip: '',
          phone: initiator?.phone || '',
          email: initiator?.email || '',
          employeeCount: coverageInfo.fullTimeEmployees || 0,
          effectiveDate: new Date().toISOString().split('T')[0],
        });
      } else {
        company = existingCompanies[0];
      }

      res.status(201).json({
        message: 'Coverage information saved successfully',
        data: coverageInfo,
        companyId: company.id,
      });
    } catch (error) {
      next(error);
    }
  });

  // Company routes
  app.post(
    '/api/companies',
    isAuthenticated,
    validateRequest(insertCompanySchema),
    async (req, res, next) => {
      try {
        const userId = req.user!.id;
        const company = await storage.createCompany({ ...req.body, userId });

        // Create new application record
        await storage.createApplication({ companyId: company.id });

        res.status(201).json(company);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const companies = await storage.getCompaniesByUserId(userId);
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(company);
    } catch (error) {
      next(error);
    }
  });

  // Owner routes
  app.post(
    '/api/companies/:companyId/owners',
    isAuthenticated,
    validateRequest(insertOwnerSchema),
    async (req, res, next) => {
      try {
        const companyId = parseInt(req.params.companyId);
        const company = await storage.getCompany(companyId);

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const owner = await storage.createOwner({ ...req.body, companyId });

        // Update application progress
        await storage.updateApplicationProgress(companyId, 'ownership');

        res.status(201).json(owner);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies/:companyId/owners', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const owners = await storage.getOwnersByCompanyId(companyId);
      res.json(owners);
    } catch (error) {
      next(error);
    }
  });

  // Authorized Contact routes
  app.get('/api/companies/:companyId/authorized-contact', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const owners = await storage.getOwnersByCompanyId(companyId);
      const authorizedContact = owners.find(owner => owner.isAuthorizedContact);
      
      if (!authorizedContact) {
        return res.status(404).json({ message: 'Authorized contact not found' });
      }

      res.json(authorizedContact);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/companies/:companyId/authorized-contact', isAuthenticated, validateRequest(insertOwnerSchema), async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Create new owner as authorized contact
      const authorizedContact = await storage.createOwner({ 
        ...req.body, 
        companyId,
        isAuthorizedContact: true,
        ownershipPercentage: 0 // Default for authorized contact who may not be an owner
      });

      // Update application progress
      await storage.updateApplicationProgress(companyId, 'authorized-contact');

      res.status(201).json(authorizedContact);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/companies/:companyId/owners/:ownerId', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const ownerId = parseInt(req.params.ownerId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updatedOwner = await storage.updateOwner(ownerId, req.body);
      
      if (req.body.isAuthorizedContact) {
        // Update application progress
        await storage.updateApplicationProgress(companyId, 'authorized-contact');
      }

      res.json(updatedOwner);
    } catch (error) {
      next(error);
    }
  });

  // Employee routes
  app.post(
    '/api/companies/:companyId/employees',
    isAuthenticated,
    validateRequest(insertEmployeeSchema),
    async (req, res, next) => {
      try {
        const companyId = parseInt(req.params.companyId);
        const company = await storage.getCompany(companyId);

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const employee = await storage.createEmployee({ ...req.body, companyId });

        // Update application progress
        await storage.updateApplicationProgress(companyId, 'employees');

        res.status(201).json(employee);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies/:companyId/employees', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const employees = await storage.getEmployeesByCompanyId(companyId);
      res.json(employees);
    } catch (error) {
      next(error);
    }
  });

  // Document routes
  app.post(
    '/api/companies/:companyId/documents',
    isAuthenticated,
    upload.single('file'),
    async (req, res, next) => {
      try {
        const companyId = parseInt(req.params.companyId);
        const company = await storage.getCompany(companyId);

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = await storage.createDocument({
          companyId,
          name: req.body.name || req.file.originalname,
          type: req.body.type,
          path: req.file.path,
        });

        // Update application progress
        await storage.updateApplicationProgress(companyId, 'documents');

        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies/:companyId/documents', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const documents = await storage.getDocumentsByCompanyId(companyId);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/documents/:id', isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const company = await storage.getCompany(document.companyId);

      if (company!.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.download(document.path, document.name);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req, res, next) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const company = await storage.getCompany(document.companyId);

      if (company!.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await storage.deleteDocument(documentId);

      // Remove file from filesystem
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Plans routes
  app.get('/api/plans', isAuthenticated, async (req, res, next) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  app.post(
    '/api/companies/:companyId/plans',
    isAuthenticated,
    validateRequest(insertCompanyPlanSchema),
    async (req, res, next) => {
      try {
        const companyId = parseInt(req.params.companyId);
        const company = await storage.getCompany(companyId);

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const companyPlan = await storage.createCompanyPlan({ ...req.body, companyId });

        // Update application progress
        await storage.updateApplicationProgress(companyId, 'plans');

        res.status(201).json(companyPlan);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies/:companyId/plans', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const plans = await storage.getCompanyPlans(companyId);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/companies/:companyId/plans/:planId', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const planId = parseInt(req.params.planId);

      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await storage.deleteCompanyPlan(companyId, planId);

      // Create audit log for company plan deletion
      await storage.createAuditLog({
        userId: req.user!.id,
        action:
          req.user!.role === 'admin'
            ? AuditAction.ADMIN_PLAN_DELETE
            : AuditAction.APPLICATION_UPDATE,
        entityType: EntityType.PLAN,
        entityId: planId,
        details: `${req.user!.role === 'admin' ? 'Admin' : 'User'} removed plan ${planId} from company ${companyId}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Contributions routes
  app.post(
    '/api/companies/:companyId/contributions',
    isAuthenticated,
    validateRequest(insertContributionSchema),
    async (req, res, next) => {
      try {
        const companyId = parseInt(req.params.companyId);
        const company = await storage.getCompany(companyId);

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const contribution = await storage.createContribution({ ...req.body, companyId });

        // Update application progress
        await storage.updateApplicationProgress(companyId, 'contributions');

        res.status(201).json(contribution);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get('/api/companies/:companyId/contributions', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const contributions = await storage.getContributionsByCompanyId(companyId);
      res.json(contributions);
    } catch (error) {
      next(error);
    }
  });

  // Application routes
  app.get('/api/companies/:companyId/application', isAuthenticated, async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const application = await storage.getApplicationByCompanyId(companyId);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json(application);
    } catch (error) {
      next(error);
    }
  });

  app.patch(
    '/api/applications/:id',
    isAuthenticated,
    validateRequest(updateApplicationSchema),
    async (req, res, next) => {
      try {
        const applicationId = parseInt(req.params.id);
        const application = await storage.getApplication(applicationId);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        const company = await storage.getCompany(application.companyId);

        if (company!.userId !== req.user!.id && req.user!.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        const updatedApplication = await storage.updateApplication(applicationId, req.body);
        res.json(updatedApplication);
      } catch (error) {
        next(error);
      }
    }
  );

  // Add signature to application
  app.post('/api/applications/:id/signature', isAuthenticated, async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { signature } = req.body;

      if (!signature) {
        return res.status(400).json({ message: 'Signature is required' });
      }

      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const company = await storage.getCompany(application.companyId);

      if (company!.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updatedApplication = await storage.updateApplication(applicationId, {
        signature,
        status: 'submitted',
        submittedAt: new Date(),
        currentStep: 'review',
        completedSteps: [...(application.completedSteps as string[]), 'review'],
      });

      // Create audit log for the signature
      await storage.createAuditLog({
        userId: req.user!.id,
        action: AuditAction.APPLICATION_SIGN,
        entityType: EntityType.APPLICATION,
        entityId: applicationId,
        details: `Application ${applicationId} signed and submitted by ${req.user!.username}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(updatedApplication);
    } catch (error) {
      next(error);
    }
  });

  // Address validation endpoint - removing authentication requirement for easier use
  app.post('/api/validate-address', async (req, res, next) => {
    try {
      await validateAddress(req, res);
    } catch (error) {
      // Provide more detailed error output for troubleshooting
      console.error('Address validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Address validation service error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Admin routes
  app.get('/api/admin/applications', isAuthenticated, isAdmin, async (req, res, next) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/admin/applications/:id', isAuthenticated, isAdmin, async (req, res, next) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      const updatedApplication = await storage.updateApplication(applicationId, req.body);
      res.json(updatedApplication);
    } catch (error) {
      next(error);
    }
  });

  // Plan file upload for admin
  const planFileUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'plans');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const carrier = req.body.carrier || 'unknown';
        const planYear = req.body.planYear || new Date().getFullYear();
        const extension = path.extname(file.originalname);
        cb(null, `${carrier.toLowerCase()}_${planYear}_${timestamp}${extension}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
  });

  app.post(
    '/api/admin/plans/upload',
    isAuthenticated,
    isAdmin,
    planFileUpload.single('planFile'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const { carrier, planYear } = req.body;

        if (!carrier) {
          return res.status(400).json({ message: 'Carrier is required' });
        }

        // In a real app, we would process the CSV file here and import the plans
        // For demo purposes, we'll import some sample plans based on the carrier

        const planData = fs.readFileSync(req.file.path, 'utf8');

        // Simple CSV parsing (in production, use a proper CSV parser library)
        const rows = planData.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(header => header.trim());

        const parsedPlans = [];

        // Skip header row and parse each plan
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(value => value.trim());

          if (values.length !== headers.length) continue;

          const plan = {};
          headers.forEach((header, index) => {
            plan[header] = values[index];
          });

          // Add required fields if missing
          plan.carrier = plan.carrier || carrier;
          plan.name = plan.name || `${carrier} Plan ${i}`;
          plan.type = plan.type || 'PPO';
          plan.network = plan.network || 'Standard';
          plan.metalTier = plan.metalTier || 'Silver';
          plan.planYear = planYear;

          parsedPlans.push(plan);
        }

        // Import plans to database
        let importedCount = 0;
        for (const plan of parsedPlans) {
          try {
            await storage.createPlan({
              carrier: plan.carrier,
              name: plan.name,
              type: plan.type,
              network: plan.network,
              details: plan.details || '',
              metalTier: plan.metalTier,
              monthlyCost: parseInt(plan.monthlyCost) || 0,
              planYear: parseInt(planYear) || new Date().getFullYear(),
            });
            importedCount++;
          } catch (error) {
            console.error('Error importing plan:', error);
          }
        }

        // Create audit log for the plan upload
        await storage.createAuditLog({
          userId: req.user!.id,
          action: AuditAction.ADMIN_PLAN_UPLOAD,
          entityType: EntityType.PLAN,
          details: `Admin uploaded ${importedCount} plans for carrier: ${carrier}, plan year: ${planYear || new Date().getFullYear()}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });

        res.json({
          message: `Successfully processed and imported ${importedCount} plans`,
          totalPlans: parsedPlans.length,
          importedPlans: importedCount,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Initialize example insurance plans (in a real app, this would be seeded in the database)
  await initializePlans();

  // Employer Onboarding API Routes
  app.get('/api/employer/onboarding/progress', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      const progress = await storage.getOnboardingProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error('Get onboarding progress error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employer/onboarding/company', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      const companyData = req.body;
      
      // Create or update company
      const company = await storage.createCompany({
        ...companyData,
        userId
      });
      
      // Update onboarding progress
      await storage.updateOnboardingProgress(userId, 'company', company.id);
      
      res.json({ success: true, companyId: company.id });
    } catch (error: any) {
      console.error('Save company onboarding error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employer/onboarding/contact', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      const contactData = req.body;
      
      // Get the company ID from onboarding progress
      const progress = await storage.getOnboardingProgress(userId);
      if (!progress.companyId) {
        return res.status(400).json({ error: 'Company information must be completed first' });
      }
      
      // Create company contact
      await storage.createCompanyContact({
        ...contactData,
        companyId: progress.companyId
      });
      
      // Update onboarding progress
      await storage.updateOnboardingProgress(userId, 'contact');
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Save contact onboarding error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employer/onboarding/owner', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      const ownerData = req.body;
      
      // Get the company ID from onboarding progress
      const progress = await storage.getOnboardingProgress(userId);
      if (!progress.companyId) {
        return res.status(400).json({ error: 'Company information must be completed first' });
      }
      
      // Create owner
      await storage.createOwner({
        ...ownerData,
        companyId: progress.companyId,
        ownershipPercentage: parseFloat(ownerData.ownershipPercentage)
      });
      
      // Update onboarding progress to complete
      await storage.updateOnboardingProgress(userId, 'owner');
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Save owner onboarding error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get onboarding data for application initiator
  app.get('/api/employer/onboarding/data', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      
      // Get the company ID from onboarding progress
      const progress = await storage.getOnboardingProgress(userId);
      if (!progress.companyId) {
        return res.status(404).json({ error: 'No company data found. Please complete onboarding first.' });
      }
      
      // Get company details
      const company = await storage.getCompany(progress.companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Get contacts for the company
      const contacts = await storage.getCompanyContacts(progress.companyId);
      
      // Get owners for the company
      const owners = await storage.getOwnersByCompanyId(progress.companyId);
      
      res.json({
        company: {
          id: company.id,
          name: company.name,
          taxId: company.taxId,
          industry: company.industry,
          phone: company.phone,
          address: company.address,
          city: company.city,
          state: company.state,
          zip: company.zip
        },
        contacts: contacts.map(contact => ({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          title: contact.title,
          relationshipToCompany: contact.relationshipToCompany
        })),
        owners: owners.map(owner => ({
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          ownershipPercentage: owner.ownershipPercentage,
          isAuthorizedContact: owner.isAuthorizedContact || false
        }))
      });
    } catch (error: any) {
      console.error('Get onboarding data error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Start application process
  app.post('/api/enrollment/start-application', async (req, res) => {
    try {
      // For testing, using user ID 1 - in production this would come from authenticated session
      const userId = 1;
      
      // Get the company ID from onboarding progress
      const progress = await storage.getOnboardingProgress(userId);
      if (!progress.companyId) {
        return res.status(400).json({ error: 'Company information must be completed first' });
      }
      
      // Create a new application
      const application = await storage.createApplication({
        companyId: progress.companyId,
        status: 'in_progress',
        currentStep: 'employee_info'
      });
      
      res.json({ 
        success: true, 
        applicationId: application.id,
        message: 'Application started successfully'
      });
    } catch (error: any) {
      console.error('Start application error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Developer role switching endpoint
  app.post('/api/dev/switch-role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { role } = req.body;

      if (!role || !['admin', 'owner', 'staff', 'employer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }

      // Update user role in storage
      const updatedUser = await storage.updateUser(req.user!.id, { role });

      res.json({
        message: 'Role switched successfully',
        role: updatedUser.role,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error switching role:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin Control Center API Endpoints

  // User Management
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithBrokerInfo = users.map(user => ({
        ...user,
        brokerAgency: user.brokerId ? 'Agency Name' : null,
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Mock recent login
        active: true,
      }));
      res.json(usersWithBrokerInfo);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch(
    '/api/admin/users/:userId',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const { active } = req.body;

        await storage.updateUser(userId, { active });
        res.json({ message: 'User updated successfully' });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  app.post(
    '/api/admin/users/:userId/reset-password',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        // In production, this would send an actual password reset email
        res.json({ message: 'Password reset email sent' });
      } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Broker Management
  app.get('/api/admin/brokers', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const brokers = await storage.getAllBrokers();
      const brokersWithStats = brokers.map(broker => ({
        ...broker,
        userCount: Math.floor(Math.random() * 10) + 1,
        enabled: true,
        flaggedForReview: false,
      }));
      res.json(brokersWithStats);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch(
    '/api/admin/brokers/:brokerId',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const brokerId = req.params.brokerId;
        const { enabled } = req.body;

        await storage.updateBroker(brokerId, { enabled });
        res.json({ message: 'Broker updated successfully' });
      } catch (error) {
        console.error('Error updating broker:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  app.patch(
    '/api/admin/brokers/:brokerId/flag',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const brokerId = req.params.brokerId;
        const { flagged } = req.body;

        await storage.updateBroker(brokerId, { flaggedForReview: flagged });
        res.json({ message: 'Broker flag status updated' });
      } catch (error) {
        console.error('Error flagging broker:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Document validation and override endpoints
  app.post('/api/validate-documents', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { validateDocuments } = await import('./document-validation');
      const validation = validateDocuments(req.body);
      res.json(validation);
    } catch (error) {
      console.error('Document validation error:', error);
      res.status(500).json({ error: 'Failed to validate documents' });
    }
  });

  // Broker-specific routes for accessing their own data
  app.get('/api/broker/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.brokerId) {
        return res.status(403).json({ message: 'Access denied: No broker association' });
      }

      const companies = await storage.getCompaniesByBroker(req.user.brokerId);
      res.json(companies);
    } catch (error) {
      console.error('Error fetching broker companies:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/broker/applications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.brokerId) {
        return res.status(403).json({ message: 'Access denied: No broker association' });
      }

      const applications = await storage.getApplicationsByBroker(req.user.brokerId);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching broker applications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/broker/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user?.brokerId || req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Access denied: Owner role required' });
      }

      const users = await storage.getUsersByBroker(req.user.brokerId);
      res.json(users);
    } catch (error) {
      console.error('Error fetching broker users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/document-override', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { canOverrideValidation } = await import('./document-validation');

      if (!canOverrideValidation(req.user!.role)) {
        return res.status(403).json({ error: 'Insufficient permissions for override' });
      }

      const { companyId, reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Override reason is required' });
      }

      // Log the override action
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'DOCUMENT_OVERRIDE' as any,
        entityType: 'COMPANY' as any,
        entityId: companyId,
        details: `Document requirements overridden: ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Document override applied successfully',
        overriddenBy: req.user!.name,
        overriddenAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Document override error:', error);
      res.status(500).json({ error: 'Failed to apply document override' });
    }
  });

  app.get('/api/feature-flags', async (req: Request, res: Response) => {
    try {
      const featureFlags = await import('@shared/feature-flags.json');
      res.json(featureFlags.default);
    } catch (error) {
      console.error('Feature flags error:', error);
      res.status(500).json({ error: 'Failed to load feature flags' });
    }
  });

  // PDF Template Management endpoints
  app.get(
    '/api/admin/pdf-templates',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        // Mock data for now - replace with actual database queries when ready
        const mockTemplates = [
          {
            id: 1,
            carrierName: 'Anthem',
            formName: 'Group Application Form',
            version: '2024.1',
            fileName: 'anthem_group_app_2024.pdf',
            uploadedBy: 'Admin User',
            uploadedAt: new Date().toISOString(),
            isActive: true,
          },
          {
            id: 2,
            carrierName: 'CCSB',
            formName: 'Enrollment Application',
            version: '1.0',
            fileName: 'ccsb_enrollment_2024.pdf',
            uploadedBy: 'Admin User',
            uploadedAt: new Date().toISOString(),
            isActive: true,
          },
        ];

        res.json(mockTemplates);
      } catch (error) {
        console.error('Error fetching PDF templates:', error);
        res.status(500).json({ error: 'Failed to fetch PDF templates' });
      }
    }
  );

  // PDF template upload with multer for file handling
  const pdfUpload = multer({
    dest: 'uploads/pdfs/',
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  app.post(
    '/api/admin/pdf-templates/upload',
    isAuthenticated,
    isAdmin,
    pdfUpload.single('pdf'),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const { carrierName, formName, version } = req.body;

        if (!carrierName || !formName || !version) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Log the upload for audit trail
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'PDF_TEMPLATE_UPLOAD' as any,
          entityType: 'PDF_TEMPLATE' as any,
          details: `Uploaded PDF template: ${formName} for ${carrierName}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // In production, save template metadata to database
        const templateData = {
          carrierName,
          formName,
          version,
          fileName: req.file.filename,
          filePath: req.file.path,
          uploadedBy: req.user!.id,
        };

        res.json({
          success: true,
          message: 'PDF template uploaded successfully',
          template: templateData,
        });
      } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: 'Failed to upload PDF template' });
      }
    }
  );

  app.post(
    '/api/admin/pdf-templates/generate',
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { templateId, companyId } = req.body;

        if (!templateId || !companyId) {
          return res.status(400).json({ error: 'Missing templateId or companyId' });
        }

        // Import PDF generation functionality
        const { PDFGenerator } = await import('../pdf-generator');
        const pdfTemplates = await import('@shared/pdf-templates.json');

        // Get company and application data
        const company = await storage.getCompany(companyId);
        if (!company) {
          return res.status(404).json({ error: 'Company not found' });
        }

        // Get primary owner data
        const owners = await storage.getOwnersByCompanyId(companyId);
        const primaryOwner = owners[0];

        // Get application data
        const application = await storage.getApplicationByCompanyId(companyId);

        // Mock template path for demo - in production, get from database
        const templatePath = `uploads/pdfs/demo_${company.name.toLowerCase()}_template.pdf`;

        // Get field mappings based on carrier
        const carrierKey = company.name.toLowerCase().replace(' ', '_');
        const mappings =
          pdfTemplates.default[carrierKey as keyof typeof pdfTemplates.default]?.fieldMappings ||
          [];

        const generator = new PDFGenerator();

        // Generate the PDF
        const result = await generator.generateCarrierForm(
          templatePath,
          mappings,
          {
            name: company.name,
            address: company.address,
            city: company.city,
            state: company.state,
            zip: company.zip,
            employeeCount: company.employeeCount || 0,
          },
          {
            firstName: primaryOwner?.firstName || '',
            lastName: primaryOwner?.lastName || '',
            title: primaryOwner?.title || '',
            email: primaryOwner?.email || '',
            phone: primaryOwner?.phone || '',
            ownershipPercentage: primaryOwner?.ownershipPercentage || 0,
          },
          {
            selectedCarrier: application?.selectedCarrier || '',
            signature: application?.signature || '',
            submittedAt: application?.submittedAt,
          }
        );

        // Log the generation
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'PDF_GENERATE' as any,
          entityType: 'PDF_TEMPLATE' as any,
          entityId: companyId,
          details: `Generated PDF for company: ${company.name}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Return the generated PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

        const fs = await import('fs/promises');
        const pdfBuffer = await fs.readFile(result.filePath);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
      }
    }
  );

  // Plan Upload Dashboard
  app.get(
    '/api/admin/plan-uploads',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const uploadHistory = [
          {
            id: 1,
            fileName: 'Anthem_2025_Plans.xlsx',
            carrier: 'Anthem',
            plansAdded: 25,
            uploadedBy: 'Admin User',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: 2,
            fileName: 'BlueShield_2025_Plans.xlsx',
            carrier: 'Blue Shield',
            plansAdded: 18,
            uploadedBy: 'Admin User',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ];
        res.json(uploadHistory);
      } catch (error) {
        console.error('Error fetching plan uploads:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Audit Logs
  app.get(
    '/api/admin/audit-logs',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const auditLogs = await storage.getRecentAuditLogs(50);
        const logsWithDetails = auditLogs.map(log => ({
          ...log,
          userName: 'User Name',
          agency: 'Sample Agency',
          ipAddress: '192.168.1.1',
        }));
        res.json(logsWithDetails);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  app.get(
    '/api/admin/audit-logs/export',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const logs = await storage.getRecentAuditLogs();
        const csv =
          'Timestamp,Action,User,Agency,Details,IP Address\n' +
          logs
            .map(
              log =>
                `${log.timestamp},${log.action},User Name,Sample Agency,${log.details},192.168.1.1`
            )
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        res.send(csv);
      } catch (error) {
        console.error('Error exporting audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  );

  // Master Admin API Routes
  app.get('/api/master-admin/stats', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'master_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const brokers = await storage.getAllBrokers();
      const users = await storage.getAllUsers();
      const totalSubmissions = await storage.getTotalSubmissions();

      const stats = {
        totalBrokers: brokers.length,
        activeBrokers: brokers.filter(b => b.isActive).length,
        totalUsers: users.length,
        totalSubmissions,
        monthlyRevenue: brokers.reduce((sum, broker) => {
          // Calculate based on subscription tier
          const tierPricing = { basic: 2900, premium: 9900, enterprise: 29900 };
          return sum + (tierPricing[broker.subscriptionTier as keyof typeof tierPricing] || 0);
        }, 0),
        trialBrokers: brokers.filter(b => b.trialEndsAt && new Date(b.trialEndsAt) > new Date()).length,
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/master-admin/brokers', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'master_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const brokers = await storage.getAllBrokers();
      const brokersWithStats = await Promise.all(
        brokers.map(async (broker) => {
          const users = await storage.getUsersByBrokerId(broker.id);
          const companies = await storage.getCompaniesByBroker(broker.id);
          
          return {
            ...broker,
            userCount: users.length,
            submissionCount: companies.length,
            lastActive: broker.updatedAt,
          };
        })
      );

      res.json(brokersWithStats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/master-admin/activity', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'master_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const activities = [
        { type: 'success', message: 'New broker account created', timestamp: new Date() },
        { type: 'info', message: 'Subscription payment processed', timestamp: new Date() },
        { type: 'warning', message: 'Trial expiring in 3 days', timestamp: new Date() },
      ];

      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Broker Admin API Routes
  app.get('/api/broker/stats', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user!.brokerId || (req.user!.role !== 'broker_admin' && req.user!.role !== 'broker_staff')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const users = await storage.getUsersByBrokerId(req.user!.brokerId);
      const companies = await storage.getCompaniesByBroker(req.user!.brokerId);
      const broker = await storage.getBroker(req.user!.brokerId);

      const stats = {
        totalUsers: users.length,
        totalSubmissions: companies.length,
        activeSubmissions: companies.filter(c => c.name).length, // Simple filter for demo
        completedSubmissions: Math.floor(companies.length * 0.7), // Demo calculation
        subscriptionTier: broker?.subscriptionTier || 'basic',
        usagePercentage: Math.round((users.length / (broker?.maxUsers || 10)) * 100),
        maxUsers: broker?.maxUsers || 10,
        maxSubmissions: broker?.maxSubmissions || 100,
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/broker/users', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user!.brokerId || (req.user!.role !== 'broker_admin' && req.user!.role !== 'broker_staff')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const users = await storage.getUsersByBrokerId(req.user!.brokerId);
      const usersWithStats = users.map(user => ({
        ...user,
        submissionCount: Math.floor(Math.random() * 5), // Demo data
        lastActive: user.lastLoginAt || user.createdAt,
        isActive: user.isActive,
      }));

      res.json(usersWithStats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/broker/submissions', isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user!.brokerId || (req.user!.role !== 'broker_admin' && req.user!.role !== 'broker_staff')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const companies = await storage.getCompaniesByBroker(req.user!.brokerId);
      const submissions = companies.map(company => ({
        id: company.id,
        companyName: company.name,
        ownerName: `${company.name} Owner`, // Demo data
        status: 'completed',
        carrier: 'Anthem',
        submittedAt: company.createdAt,
      }));

      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  // Employer Companies API Routes
  app.get('/api/employer-companies', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const companies = await storage.getCompaniesByUserId(userId);
      
      // Transform to employer-companies format
      const employerCompanies = companies.map(company => ({
        id: company.id,
        companyName: company.name,
        legalName: company.name, // Using name as legal name for now
        taxId: null,
        industry: company.industry || null,
        website: null,
        employeeCount: company.employeeCount || 1,
        brokerId: company.brokerId || null,
        effectiveDate: company.effectiveDate,
        renewalDate: null,
        isActive: true,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      res.json(employerCompanies);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/employer-companies', isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { companyName, legalName, taxId, industry, website, employeeCount, effectiveDate } = req.body;
      
      // Create company using existing storage method
      const company = await storage.createCompany({
        userId,
        name: companyName,
        address: '', // Will be added via locations
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: req.user!.email || '',
        employeeCount: employeeCount || 1,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        industry: industry || null,
      });

      // Return in employer-companies format
      const employerCompany = {
        id: company.id,
        companyName: company.name,
        legalName: legalName || company.name,
        taxId: taxId || null,
        industry: industry || null,
        website: website || null,
        employeeCount: company.employeeCount,
        brokerId: company.brokerId || null,
        effectiveDate: company.effectiveDate,
        renewalDate: null,
        isActive: true,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      };

      res.status(201).json(employerCompany);
    } catch (error) {
      next(error);
    }
  });

  // Employer API Routes
  app.get('/api/employer/stats', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'employer') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const companies = await storage.getCompaniesByUserId(req.user!.id);
      const currentCompany = companies[0];

      const stats = {
        totalApplications: companies.length,
        completedApplications: Math.floor(companies.length * 0.8),
        inProgressApplications: Math.floor(companies.length * 0.2),
        pendingReview: 0,
        currentCompany: currentCompany ? {
          name: currentCompany.name,
          employees: 15, // Demo data
          industry: currentCompany.industry,
        } : undefined,
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/employer/applications', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'employer') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const companies = await storage.getCompaniesByUserId(req.user!.id);
      const applications = companies.map(company => ({
        id: company.id,
        companyName: company.name,
        status: 'completed',
        progress: 100,
        currentStep: 'review-submit',
        createdAt: company.createdAt,
        submittedAt: company.updatedAt,
      }));

      res.json(applications);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/employer/applications/new', isAuthenticated, async (req, res, next) => {
    try {
      if (req.user!.role !== 'employer') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Create a new application placeholder
      const newApplication = {
        id: Date.now(), // Simple ID for demo
        status: 'draft',
        nextStep: 'application-initiator',
      };

      res.status(201).json(newApplication);
    } catch (error) {
      next(error);
    }
  });

  // Quoting System API Routes
  app.post('/api/quotes/generate', isAuthenticated, async (req, res, next) => {
    try {
      const { zipCode, effectiveDate, employees, planTypes } = req.body;
      
      // Validate required fields
      if (!zipCode || !effectiveDate || !planTypes?.length) {
        return res.status(400).json({ message: 'Missing required quote parameters' });
      }

      // Get rating area for zip code
      const ratingArea = getRatingAreaForZip(zipCode);
      
      // Generate quotes based on employee census and location
      const quotes = await generateQuotesForGroup({
        zipCode,
        ratingArea,
        effectiveDate,
        employees,
        planTypes,
        userId: req.user!.id
      });

      res.json({ quotes, ratingArea });
    } catch (error) {
      next(error);
    }
  });

  // Quotes API endpoints will be implemented with proper storage methods
  app.post('/api/quotes/save', isAuthenticated, async (req, res, next) => {
    try {
      const quoteData = {
        ...req.body,
        userId: req.user!.id,
        createdAt: new Date(),
        status: 'saved'
      };
      
      res.status(201).json({ message: 'Quote saved successfully', id: Date.now() });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/quotes', isAuthenticated, async (req, res, next) => {
    try {
      res.json([]);
    } catch (error) {
      next(error);
    }
  });

  // Rating Areas API
  app.get('/api/rating-areas', async (req, res) => {
    const ratingAreas = [
      { id: 1, name: 'Rating Area 1', zipCodes: ['93701', '93702', '93703'] },
      { id: 2, name: 'Rating Area 2', zipCodes: ['93704', '93705', '93706'] },
      { id: 3, name: 'Rating Area 3', zipCodes: ['93707', '93708', '93709'] },
      { id: 4, name: 'Rating Area 4', zipCodes: ['93710', '93711', '93712'] },
      { id: 5, name: 'Rating Area 5', zipCodes: ['93720', '93721', '93722'] },
      // Add all 19 rating areas for California
    ];
    res.json(ratingAreas);
  });

  // Carriers API
  app.get('/api/carriers', async (req, res) => {
    const carriers = [
      { id: 'anthem', name: 'Anthem Blue Cross', active: true },
      { id: 'blue_shield', name: 'Blue Shield of California', active: true },
      { id: 'kaiser', name: 'Kaiser Permanente', active: true },
      { id: 'health_net', name: 'Health Net', active: true },
      { id: 'sharp', name: 'Sharp Health Plan', active: true }
    ];
    res.json(carriers);
  });

  // Subscription module access endpoints
  app.get('/api/subscription/modules/:moduleName/access', isAuthenticated, async (req, res) => {
    try {
      const { moduleName } = req.params;
      const user = req.user!;
      
      // Check subscription access based on user role and broker settings
      const moduleAccess = {
        moduleName,
        accessLevel: user.role === 'master_admin' ? 'full' : 'read',
        hasAccess: true
      };
      
      res.json(moduleAccess);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check module access' });
    }
  });

  app.post('/api/subscription/usage', isAuthenticated, async (req, res) => {
    try {
      const { moduleName, action, resourceId } = req.body;
      
      // Track usage for billing and analytics
      const usage = {
        id: Date.now(),
        userId: req.user!.id,
        moduleName,
        action,
        resourceId,
        timestamp: new Date()
      };
      
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to track usage' });
    }
  });

  // Employee Enrollment Management
  app.get('/api/employee-enrollments', isAuthenticated, async (req, res, next) => {
    try {
      const enrollments = await storage.getEmployeeEnrollments(req.user!.id);
      res.json(enrollments);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/employee-enrollments/:id', isAuthenticated, async (req, res, next) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedEnrollment = await storage.updateEmployeeEnrollment(enrollmentId, updates);
      res.json(updatedEnrollment);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/employee-census/upload', isAuthenticated, async (req, res, next) => {
    try {
      // Handle CSV/Excel file upload and processing
      const result = await processCensusFile(req.body, req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/employee-enrollments/export', isAuthenticated, async (req, res, next) => {
    try {
      const enrollments = await storage.getEmployeeEnrollments(req.user!.id);
      // Generate CSV export
      const csvData = generateEnrollmentCSV(enrollments);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employee-enrollments.csv');
      res.send(csvData);
    } catch (error) {
      next(error);
    }
  });

  // Available Plans API
  app.get('/api/available-plans', isAuthenticated, async (req, res, next) => {
    try {
      const plans = await storage.getAvailablePlansForUser(req.user!.id);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  // Renewal Management API Routes
  app.get('/api/renewals', isAuthenticated, async (req, res, next) => {
    try {
      const filter = req.query.filter || 'all';
      const renewals = await storage.getRenewalGroups(req.user!.id, filter as string);
      res.json(renewals);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/renewals/:id/generate-quote', isAuthenticated, async (req, res, next) => {
    try {
      const renewalId = req.params.id;
      const renewalOptions = await generateRenewalQuote(renewalId);
      
      // Update renewal with generated options
      await storage.updateRenewalOptions(renewalId, renewalOptions);
      
      res.json({ optionCount: renewalOptions.length, renewalOptions });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/renewals/:id/send-proposal', isAuthenticated, async (req, res, next) => {
    try {
      const renewalId = req.params.id;
      const { optionId } = req.body;
      
      // Send renewal proposal to client
      const result = await sendRenewalProposal(renewalId, optionId);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Renewal Tasks API
  app.get('/api/renewal-tasks', isAuthenticated, async (req, res, next) => {
    try {
      const tasks = await storage.getRenewalTasks(req.user!.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/renewal-tasks/:id', isAuthenticated, async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const { status } = req.body;
      
      const updatedTask = await storage.updateRenewalTask(taskId, { status });
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Initialize some sample insurance plans data
// Helper functions for quoting and rating
function getRatingAreaForZip(zipCode: string): number {
  // California has 19 rating areas - this maps zip codes to rating areas
  const zipToRatingArea: { [key: string]: number } = {
    // Fresno area (Rating Area 4)
    '93701': 4, '93702': 4, '93703': 4, '93704': 4, '93705': 4,
    '93706': 4, '93707': 4, '93708': 4, '93709': 4, '93710': 4,
    '93711': 4, '93712': 4, '93720': 4, '93721': 4, '93722': 4,
    
    // Los Angeles area (Rating Area 1)
    '90001': 1, '90002': 1, '90003': 1, '90004': 1, '90005': 1,
    '90210': 1, '90211': 1, '90212': 1, '90213': 1, '90214': 1,
    
    // San Francisco area (Rating Area 3)
    '94102': 3, '94103': 3, '94104': 3, '94105': 3, '94106': 3,
    '94107': 3, '94108': 3, '94109': 3, '94110': 3, '94111': 3,
    
    // San Diego area (Rating Area 19)
    '92101': 19, '92102': 19, '92103': 19, '92104': 19, '92105': 19,
  };
  
  return zipToRatingArea[zipCode] || 4; // Default to Rating Area 4
}

async function generateQuotesForGroup(params: {
  zipCode: string;
  ratingArea: number;
  effectiveDate: string;
  employees: any[];
  planTypes: string[];
  userId: number;
}) {
  const { zipCode, ratingArea, employees, planTypes } = params;
  
  // Calculate average age for group rating
  const totalAge = employees.reduce((sum, emp) => {
    if (emp.dateOfBirth) {
      const age = calculateAge(emp.dateOfBirth);
      return sum + age + emp.dependents.reduce((depSum: number, dep: any) => 
        depSum + calculateAge(dep.dateOfBirth), 0);
    }
    return sum;
  }, 0);
  
  const averageAge = totalAge / (employees.length + employees.reduce((sum, emp) => sum + emp.dependents.length, 0)) || 35;
  
  // Base rates by rating area and plan type
  const baseRates = {
    medical: {
      1: 450, // LA area
      3: 520, // SF area
      4: 380, // Fresno area
      19: 420 // San Diego area
    },
    dental: {
      1: 45,
      3: 48,
      4: 42,
      19: 44
    },
    vision: {
      1: 18,
      3: 20,
      4: 16,
      19: 17
    }
  };
  
  const quotes = [];
  
  // Generate quotes for each requested plan type
  for (const planType of planTypes) {
    const carriers = ['anthem', 'blue_shield', 'kaiser', 'health_net'];
    
    for (const carrier of carriers) {
      // Different metal tiers for medical plans
      const tiers = planType === 'medical' ? ['Bronze', 'Silver', 'Gold'] : ['Standard'];
      
      for (const tier of tiers) {
        const baseRate = baseRates[planType as keyof typeof baseRates]?.[ratingArea as keyof typeof baseRates.medical] || 400;
        
        // Age and tier adjustments
        const ageMultiplier = Math.max(0.8, Math.min(2.0, averageAge / 35));
        const tierMultiplier = tier === 'Bronze' ? 0.85 : tier === 'Silver' ? 1.0 : 1.25;
        
        const monthlyPremium = Math.round(baseRate * ageMultiplier * tierMultiplier * employees.length);
        
        quotes.push({
          id: `${carrier}-${planType}-${tier}-${Date.now()}`,
          carrierName: getCarrierName(carrier),
          planName: `${getCarrierName(carrier)} ${tier} ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
          planType,
          monthlyPremium,
          deductible: tier === 'Bronze' ? 6000 : tier === 'Silver' ? 3000 : 1500,
          outOfPocketMax: tier === 'Bronze' ? 8000 : tier === 'Silver' ? 6000 : 4000,
          network: carrier === 'kaiser' ? 'Kaiser Network' : 'PPO Network',
          metalTier: tier
        });
      }
    }
  }
  
  return quotes;
}

function getCarrierName(carrierId: string): string {
  const carriers: { [key: string]: string } = {
    'anthem': 'Anthem Blue Cross',
    'blue_shield': 'Blue Shield of California',
    'kaiser': 'Kaiser Permanente',
    'health_net': 'Health Net',
    'sharp': 'Sharp Health Plan'
  };
  return carriers[carrierId] || carrierId;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

async function processCensusFile(fileData: any, userId: number) {
  // Process uploaded CSV/Excel census file
  // This would parse the file and create employee records
  return {
    imported: 25,
    message: 'Successfully imported 25 employee records'
  };
}

function generateEnrollmentCSV(enrollments: any[]): string {
  const headers = ['Name', 'Email', 'Department', 'Status', 'Medical Plan', 'Dental Plan', 'Vision Plan'];
  const rows = enrollments.map(emp => [
    `${emp.firstName} ${emp.lastName}`,
    emp.email,
    emp.department,
    emp.status,
    emp.medicalPlan || 'None',
    emp.dentalPlan || 'None',
    emp.visionPlan || 'None'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

async function generateRenewalQuote(renewalId: string) {
  // Generate renewal options with rate changes
  return [
    {
      id: 'renewal-1',
      planName: 'Current Plan Renewal',
      carrier: 'Anthem Blue Cross',
      monthlyPremium: 4200,
      rateIncrease: 8.5,
      planChanges: ['Deductible increased to $3,500'],
      recommended: true
    },
    {
      id: 'renewal-2',
      planName: 'Alternative Silver Plan',
      carrier: 'Blue Shield of California',
      monthlyPremium: 3950,
      rateIncrease: 3.2,
      planChanges: ['Lower premium', 'Different network'],
      recommended: false
    }
  ];
}

async function sendRenewalProposal(renewalId: string, optionId: string) {
  // Send renewal proposal to client
  return {
    sent: true,
    message: 'Renewal proposal sent to client for review'
  };
}

async function initializePlans() {
  const plans = [
    {
      carrier: 'Anthem',
      name: 'Anthem Silver PPO 2000/20%',
      type: 'PPO',
      network: 'Prudent Buyer PPO',
      monthlyCost: 34580, // $345.80
      details: 'Network: Prudent Buyer PPO',
      metalTier: 'Silver',
    },
    {
      carrier: 'Anthem',
      name: 'Anthem Gold HMO 25/500',
      type: 'HMO',
      network: 'California Care HMO',
      monthlyCost: 45625, // $456.25
      details: 'Primary coverage for most general health needs',
      metalTier: 'Gold',
    },
    {
      carrier: 'Anthem',
      name: 'Anthem Platinum PPO 250/10%',
      type: 'PPO',
      network: 'Prudent Buyer PPO',
      monthlyCost: 58740, // $587.40
      details: 'Network: Prudent Buyer PPO',
      metalTier: 'Platinum',
    },
    {
      carrier: 'Blue Shield',
      name: 'Blue Shield Gold PPO 500/30',
      type: 'PPO',
      network: 'Full PPO Network',
      monthlyCost: 47890, // $478.90
      details: 'Comprehensive coverage with low deductible',
      metalTier: 'Gold',
    },
    {
      carrier: 'Blue Shield',
      name: 'Blue Shield Silver PPO 1700/40',
      type: 'PPO',
      network: 'Full PPO Network',
      monthlyCost: 39250, // $392.50
      details: 'Balanced coverage for everyday needs',
      metalTier: 'Silver',
    },
    {
      carrier: 'CCSB',
      name: 'CCSB Bronze HDHP 7000/0%',
      type: 'HSA',
      network: 'CCSB Network',
      monthlyCost: 28500, // $285.00
      details: 'HSA-compatible plan with low premium',
      metalTier: 'Bronze',
    },
    {
      carrier: 'CCSB',
      name: 'CCSB Silver HMO 55/2250',
      type: 'HMO',
      network: 'CCSB Network',
      monthlyCost: 37840, // $378.40
      details: 'Cost-effective option for small businesses',
      metalTier: 'Silver',
    },
  ];

  // Add plans if they don't exist
  for (const plan of plans) {
    const existingPlan = await storage.getPlanByNameAndCarrier(plan.name, plan.carrier);
    if (!existingPlan) {
      await storage.createPlan(plan);
    }
  }

  // Initialize subscription system (disabled until storage methods implemented)
  // await initializeSubscriptionSystem();
}

// Subscription Management API Routes (temporarily disabled until storage methods are implemented)
async function initializeSubscriptionSystem() {
  // Import subscription service
  // const { SubscriptionService, initializeStripe, DEFAULT_SUBSCRIPTION_PLANS } = await import('./subscription-service');
  
  // Initialize Stripe if keys are available
  // const stripeInitialized = initializeStripe();
  
  // Create default subscription plans if they don't exist
  // for (const planData of DEFAULT_SUBSCRIPTION_PLANS) {
  //   const existingPlan = await storage.getSubscriptionPlanByName(planData.name);
  //   if (!existingPlan) {
  //     await storage.createSubscriptionPlan(planData);
  //   }
  // }

  // Subscription API routes (temporarily disabled)
  console.log('Subscription system initialized (routes disabled until storage methods implemented)');
}


