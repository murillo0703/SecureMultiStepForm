import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Company,
  Owner,
  Employee,
  Document,
  Plan,
  Contribution,
  Application,
} from '@shared/schema';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { generatePDF, downloadPDF } from '@/utils/pdf-generator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckSquare,
  Download,
  Send,
} from 'lucide-react';

export default function ReviewSubmit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [incompleteAlertOpen, setIncompleteAlertOpen] = useState(false);
  const [missingSteps, setMissingSteps] = useState<string[]>([]);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Get the first company
  const companyId = Array.isArray(companies) && companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate('/enrollment/company-information');
    }
  }, [companyId, isLoadingCompanies, navigate]);

  // Fetch company data
  const { data: company, isLoading: isLoadingCompany } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });

  // Fetch owners
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery<Owner[]>({
    queryKey: [`/api/companies/${companyId}/owners`],
    enabled: !!companyId,
  });

  // Fetch employees
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: [`/api/companies/${companyId}/employees`],
    enabled: !!companyId,
  });

  // Fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: [`/api/companies/${companyId}/documents`],
    enabled: !!companyId,
  });

  // Fetch selected plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<(Plan & { id: number })[]>({
    queryKey: [`/api/companies/${companyId}/plans`],
    enabled: !!companyId,
  });

  // Fetch contributions
  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery<Contribution[]>({
    queryKey: [`/api/companies/${companyId}/contributions`],
    enabled: !!companyId,
  });

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery<Application>({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Submit application mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/submit`);
      return res.json();
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      toast({
        title: 'Application submitted successfully!',
        description: 'Your enrollment application has been submitted for processing.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async () => {
    if (!company) {
      toast({
        title: 'Error',
        description: 'Could not find company information. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    submitMutation.mutate();
  };

  const handleContinue = () => {
    navigate('/enrollment/signature');
  };

  // Loading state
  const isLoading =
    isLoadingCompanies ||
    isLoadingCompany ||
    isLoadingOwners ||
    isLoadingEmployees ||
    isLoadingDocuments ||
    isLoadingPlans ||
    isLoadingContributions ||
    isLoadingApplication;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <ProgressSidebar />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Autosave Indicator */}
          <div className="flex items-center mb-6 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
            <span>All changes autosaved</span>
          </div>
          
          <div className="max-w-4xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
                  <p className="text-gray-600">
                    Review your enrollment information and submit your application
                  </p>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Application Review</CardTitle>
                <CardDescription>
                  Please review all information below before submitting your application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Company Information */}
                  {company && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Company Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Legal Name:</span> {company.legalName}
                        </div>
                        <div>
                          <span className="font-medium">Tax ID:</span> {company.taxId}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {company.phone}
                        </div>
                        <div>
                          <span className="font-medium">Employee Count:</span> {company.employeeCount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Plans */}
                  {plans.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Selected Plans</h3>
                      <div className="space-y-2">
                        {plans.map((plan) => (
                          <div key={plan.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{plan.name}</span>
                              <span className="text-gray-500 ml-2">({plan.carrier})</span>
                            </div>
                            <span className="text-sm text-gray-600">{plan.metalTier}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                <Button variant="outline" onClick={() => navigate('/enrollment/contribution-setup')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {application?.status !== 'submitted' && !submitSuccess && (
                  <Button onClick={handleContinue} className="w-full sm:w-auto">
                    Continue to Signature
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {submitSuccess && (
                  <div className="text-green-600 font-medium">
                    ✓ Application submitted successfully!
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}