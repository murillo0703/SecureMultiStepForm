import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { storage } from './storage';
import { 
  securityHeaders, 
  sanitizeInput, 
  validationRules, 
  handleValidationErrors 
} from './security-middleware';
import { ApplicationLogger, ErrorHandler, ResponseUtils } from './code-quality-utilities';

/**
 * Form Management API Routes
 * Handles form submissions, progress saving, and data persistence
 */

const router = Router();

// Apply security middleware to all routes
router.use(securityHeaders);
router.use(sanitizeInput);

// Save form progress
router.post('/save-progress', 
  [
    body('formId').isString().trim().isLength({ min: 1, max: 50 }),
    body('data').isObject(),
    body('currentStep').isInt({ min: 0, max: 20 }),
    body('lastSaved').isISO8601(),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { formId, data, currentStep, lastSaved } = req.body;
      const userId = req.user?.id;

      ApplicationLogger.info('Saving form progress', { 
        userId, 
        formId, 
        currentStep,
        fieldCount: Object.keys(data).length 
      });

      // Create or update form progress record
      const progressData = {
        userId,
        formId,
        formData: JSON.stringify(data),
        currentStep,
        lastSaved: new Date(lastSaved),
        isCompleted: false
      };

      // Check if progress already exists
      const existingProgress = await storage.getFormProgress(userId, formId);
      
      let savedProgress;
      if (existingProgress) {
        savedProgress = await storage.updateFormProgress(existingProgress.id, progressData);
      } else {
        savedProgress = await storage.createFormProgress(progressData);
      }

      ResponseUtils.success(res, savedProgress, 'Form progress saved successfully');
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'save form progress');
    }
  }
);

// Load form progress
router.get('/load-progress/:formId',
  [
    param('formId').isString().trim().isLength({ min: 1, max: 50 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { formId } = req.params;
      const userId = req.user?.id;

      const progress = await storage.getFormProgress(userId, formId);
      
      if (!progress) {
        return ResponseUtils.success(res, null, 'No saved progress found');
      }

      const responseData = {
        data: JSON.parse(progress.formData),
        currentStep: progress.currentStep,
        lastSaved: progress.lastSaved,
        isCompleted: progress.isCompleted
      };

      ResponseUtils.success(res, responseData, 'Form progress loaded successfully');
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'load form progress');
    }
  }
);

// Submit complete form
router.post('/submit',
  [
    body('formId').isString().trim().isLength({ min: 1, max: 50 }),
    body('formData').isObject(),
    body('submissionType').isIn(['enrollment', 'quote', 'application']),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { formId, formData, submissionType } = req.body;
      const userId = req.user?.id;

      ApplicationLogger.info('Processing form submission', { 
        userId, 
        formId, 
        submissionType,
        fieldCount: Object.keys(formData).length 
      });

      // Validate required fields based on submission type
      const validationError = validateFormSubmission(formData, submissionType);
      if (validationError) {
        return ResponseUtils.validationError(res, [validationError]);
      }

      // Create submission record
      const submission = await storage.createFormSubmission({
        userId,
        formId,
        submissionType,
        formData: JSON.stringify(formData),
        status: 'submitted',
        submittedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      });

      // Mark form progress as completed
      const existingProgress = await storage.getFormProgress(userId, formId);
      if (existingProgress) {
        await storage.updateFormProgress(existingProgress.id, { 
          isCompleted: true,
          completedAt: new Date()
        });
      }

      // Generate submission confirmation
      const confirmationData = {
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
        status: submission.status,
        nextSteps: getNextSteps(submissionType)
      };

      ApplicationLogger.info('Form submission completed', { 
        submissionId: submission.id,
        userId 
      });

      ResponseUtils.success(res, confirmationData, 'Form submitted successfully', 201);
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'submit form');
    }
  }
);

// Get submission history
router.get('/submissions',
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userId = req.user?.id;
      const submissions = await storage.getFormSubmissionsByUser(userId);

      const submissionData = submissions.map(submission => ({
        id: submission.id,
        formId: submission.formId,
        submissionType: submission.submissionType,
        status: submission.status,
        submittedAt: submission.submittedAt,
        // Don't expose full form data in list view
        hasData: !!submission.formData
      }));

      ResponseUtils.success(res, submissionData, 'Submissions retrieved successfully');
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'get submissions');
    }
  }
);

// Get specific submission details
router.get('/submissions/:id',
  [
    param('id').isInt({ min: 1 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const submissionId = parseInt(req.params.id);
      const userId = req.user?.id;

      const submission = await storage.getFormSubmission(submissionId);
      
      if (!submission || submission.userId !== userId) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const submissionData = {
        ...submission,
        formData: JSON.parse(submission.formData)
      };

      ResponseUtils.success(res, submissionData, 'Submission details retrieved');
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'get submission details');
    }
  }
);

// Delete form progress (restart form)
router.delete('/progress/:formId',
  [
    param('formId').isString().trim().isLength({ min: 1, max: 50 }),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { formId } = req.params;
      const userId = req.user?.id;

      const progress = await storage.getFormProgress(userId, formId);
      if (progress) {
        await storage.deleteFormProgress(progress.id);
      }

      ResponseUtils.success(res, null, 'Form progress cleared successfully');
    } catch (error) {
      ErrorHandler.handleApiError(error, req, res, 'clear form progress');
    }
  }
);

// Validation helper functions
function validateFormSubmission(formData: any, submissionType: string) {
  const requiredFields = getRequiredFields(submissionType);
  
  for (const field of requiredFields) {
    if (!formData[field] || formData[field].toString().trim() === '') {
      return {
        field,
        message: `${field} is required for ${submissionType} submission`
      };
    }
  }
  
  return null;
}

function getRequiredFields(submissionType: string): string[] {
  switch (submissionType) {
    case 'enrollment':
      return [
        'companyName', 'companyAddress', 'contactName', 
        'contactEmail', 'contactPhone', 'employeeCount'
      ];
    case 'quote':
      return [
        'companyName', 'contactEmail', 'employeeCount'
      ];
    case 'application':
      return [
        'companyName', 'contactName', 'contactEmail', 
        'contactPhone', 'requestedCoverage'
      ];
    default:
      return [];
  }
}

function getNextSteps(submissionType: string): string[] {
  switch (submissionType) {
    case 'enrollment':
      return [
        'Your enrollment application has been received',
        'A representative will contact you within 2 business days',
        'Please check your email for confirmation and next steps',
        'You can download a PDF copy of your submission'
      ];
    case 'quote':
      return [
        'Your quote request has been submitted',
        'You will receive a detailed quote within 1 business day',
        'Check your email for quote details and options'
      ];
    case 'application':
      return [
        'Your application has been received',
        'Processing typically takes 3-5 business days',
        'You will be notified of any additional requirements'
      ];
    default:
      return ['Your submission has been received and will be processed shortly'];
  }
}

export { router as formRoutes };