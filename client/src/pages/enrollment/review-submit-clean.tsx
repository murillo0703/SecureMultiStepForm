import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Company, Owner, Employee, Document, Plan, Contribution, Application } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { ProgressBar } from "@/components/layout/progress-bar";
import { EnrollmentChecklist } from "@/components/enrollment/checklist";
import { generatePDF, downloadPDF } from "@/utils/pdf-generator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckSquare,
  Download,
  Send
} from "lucide-react";

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
    queryKey: ["/api/companies"],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate("/enrollment/company");
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

  // Steps configuration for progress bar
  const steps = [
    { id: "company", label: "Company", href: "/enrollment/company" },
    { id: "ownership", label: "Owners", href: "/enrollment/ownership" },
    { id: "employees", label: "Employees", href: "/enrollment/employees" },
    { id: "documents", label: "Documents", href: "/enrollment/documents" },
    { id: "plans", label: "Plans", href: "/enrollment/plans" },
    { id: "contributions", label: "Contributions", href: "/enrollment/contributions" },
    { id: "review", label: "Submit", href: "/enrollment/review" },
  ];

  // Check for missing steps/requirements
  useEffect(() => {
    if (!application) return;

    const missing: string[] = [];
    
    // Check company
    if (!company) missing.push("Company Information");
    
    // Check owners (optional)
    
    // Check employees
    if (!employees.length) missing.push("Employee Information");
    
    // Check documents
    if (documents.length < 3) missing.push("Required Documents");
    
    // Check plans
    if (!plans.length) missing.push("Plan Selection");
    
    // Check contributions
    if (plans.length && !contributions.length) missing.push("Contribution Setup");
    
    setMissingSteps(missing);
  }, [application, company, owners, employees, documents, plans, contributions]);

  // Mutation for submitting the application - now handled in the signature page
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!application) throw new Error("Application not found");
      
      // No longer handling signature submission here
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      setSubmitting(false);
      setSubmitSuccess(true);
      
      toast({
        title: "Application submitted",
        description: "Your enrollment application has been successfully submitted.",
      });
    },
    onError: (error) => {
      setSubmitting(false);
      
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Signature capture is now handled in the separate signature page component

  const handleSubmit = () => {
    if (missingSteps.length > 0) {
      setIncompleteAlertOpen(true);
      return;
    }
    
    // Redirect to the new enhanced signature page with mobile support
    if (companyId) {
      navigate(`/enrollment/${companyId}/signature`);
    } else {
      toast({
        title: "Error",
        description: "Could not find company information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // This function is now handled in the signature page component
  const submitApplication = async () => {    
    setSubmitting(true);
    
    try {
      // Generate carrier-specific forms first
      if (plans.length > 0) {
        const uniqueCarriers = Array.from(new Set(plans.map(plan => plan.carrier)));
        
        // Create PDF for each carrier
        for (const carrier of uniqueCarriers) {
          const carrierPlans = plans.filter(plan => plan.carrier === carrier);
          const carrierContributions = contributions.filter(
            contribution => carrierPlans.some(plan => plan.id === contribution.planId)
          );
          
          if (carrierPlans.length > 0) {
            try {
              toast({
                title: "Generating forms",
                description: `Creating ${carrier} enrollment forms...`,
              });
              
              await generatePDF(
                carrier,
                company!,
                owners,
                employees,
                carrierPlans,
                carrierContributions,
                application!
              );
            } catch (error) {
              console.error(`Error generating ${carrier} form:`, error);
              toast({
                title: `${carrier} Form Error`,
                description: "Unable to generate carrier forms, but your application will still be submitted.",
                variant: "destructive",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in form generation:", error);
    }
    
    // Submit application regardless of form generation success
    submitMutation.mutate();
  };

  const generateAndDownloadPDF = async (carrier: string) => {
    if (!company || !application) return;
    
    try {
      setPdfGenerating(true);
      
      // Get the selected plan for this carrier
      const selectedPlans = plans.filter(plan => plan.carrier === carrier);
      if (!selectedPlans.length) throw new Error(`No plans selected for ${carrier}`);
      
      // Get contributions for these plans
      const planContributions = contributions.filter(
        contribution => selectedPlans.some(plan => plan.id === contribution.planId)
      );
      
      const pdfBlob = await generatePDF(
        carrier,
        company,
        owners,
        employees,
        selectedPlans,
        planContributions,
        application
      );
      
      // Download the PDF
      downloadPDF(pdfBlob, `${carrier}-Enrollment-${company.name}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `The ${carrier} enrollment PDF has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount / 100);
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

  // Group plans by carrier
  const plansByCarrier = plans.reduce((acc, plan) => {
    if (!acc[plan.carrier]) {
      acc[plan.carrier] = [];
    }
    acc[plan.carrier].push(plan);
    return acc;
  }, {} as Record<string, typeof plans>);

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          steps={steps} 
          currentStep="review" 
          completedSteps={application?.completedSteps as string[] || []}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="lg:flex-1">
            {/* Autosave Indicator */}
            <div className="flex items-center mb-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1 text-secondary" />
              <span>All changes autosaved</span>
            </div>

            {/* Success Banner */}
            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-green-800 font-medium">Application Submitted Successfully</h3>
                    <p className="text-green-700 mt-1">
                      Your application has been submitted and is now being reviewed by our team. 
                      You'll receive updates via email about the status of your application.
                    </p>
                    
                    {/* Carrier Forms Section */}
                    {plans.length > 0 && (
                      <div className="mt-4 bg-white p-4 rounded-md border border-green-200">
                        <h4 className="font-medium text-gray-800 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Carrier Application Forms
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          The following carrier forms have been prepared with your data:
                        </p>
                        <div className="space-y-2">
                          {Array.from(new Set(plans.map(plan => plan.carrier))).map((carrier) => (
                            <div key={carrier} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{carrier} Application</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex items-center"
                                onClick={() => generateAndDownloadPDF(carrier)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="text-green-700 border-green-300 hover:bg-green-100"
                        onClick={() => navigate("/")}
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Missing Requirements Warning */}
            {missingSteps.length > 0 && !submitSuccess && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-yellow-800 font-medium">Please complete missing information</h3>
                    <p className="text-yellow-700 mt-1">
                      Your application is missing the following required information:
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-yellow-700 space-y-1">
                      {missingSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                    <p className="text-yellow-700 mt-3">
                      Please complete these sections before submitting your application.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Review your enrollment information and submit your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Review content here */}
                <p className="text-sm text-gray-500 mb-4">
                  Please review all the information below before submitting your application.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0">
                <Button variant="outline" onClick={() => navigate("/enrollment/contributions")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Contributions
                </Button>

                {application?.status !== "submitted" && !submitSuccess && (
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Sign & Submit Application"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
            
          {/* Right sidebar with checklist component */}
          <div className="lg:w-80 flex-shrink-0">
            <EnrollmentChecklist companyId={companyId} />
          </div>
        </div>

        {/* Incomplete Application Alert */}
        <AlertDialog open={incompleteAlertOpen} onOpenChange={setIncompleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Incomplete Application</AlertDialogTitle>
              <AlertDialogDescription>
                You need to complete the following sections before submitting your application:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {missingSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}