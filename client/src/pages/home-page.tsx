import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  FileText, 
  Users, 
  Building, 
  Upload, 
  CheckSquare, 
  DollarSign, 
  ClipboardCheck, 
  Clock
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/companies"],
  });

  // If a company exists, get its application
  const companyId = companies.length > 0 ? companies[0].id : null;
  
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const continueEnrollment = () => {
    if (!application) return;
    
    // Navigate to the current step or the first step
    const currentStep = application.currentStep;
    
    switch (currentStep) {
      case "carriers":
        navigate("/enrollment/carriers");
        break;
      case "company":
        navigate("/enrollment/company");
        break;
      case "ownership":
        navigate("/enrollment/ownership");
        break;
      case "employees":
        navigate("/enrollment/employees");
        break;
      case "documents":
        navigate("/enrollment/documents");
        break;
      case "plans":
        navigate("/enrollment/plans");
        break;
      case "contributions":
        navigate("/enrollment/contributions");
        break;
      case "review":
        navigate("/enrollment/review");
        break;
      default:
        navigate("/enrollment/carriers");
    }
  };

  const startNewEnrollment = () => {
    navigate("/enrollment/application-initiator");
  };

  const isLoading = isLoadingCompanies || isLoadingApplication;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Welcome, {user?.companyName || user?.username}</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Manage your health insurance enrollment application</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {application ? (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full">
                  <CardHeader className="pb-2">
                    <CardTitle>Your Enrollment Application</CardTitle>
                    <CardDescription>
                      Application Status: <span className="font-medium text-primary">{application.status.replace('_', ' ').toUpperCase()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-500">Progress</div>
                          <div className="text-sm font-medium text-primary">
                            {(application.completedSteps as string[]).length} of 7 steps completed
                          </div>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary" 
                            style={{ width: `${((application.completedSteps as string[]).length / 7) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={continueEnrollment} className="w-full sm:w-auto">
                          {application.status === "in_progress" 
                            ? "Continue Enrollment" 
                            : "View Application"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      Application Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="font-medium mb-2">
                      {application.status === "in_progress" && "In Progress"}
                      {application.status === "pending_review" && "Pending Review"}
                      {application.status === "submitted" && "Submitted"}
                      {application.status === "approved" && "Approved"}
                    </div>
                    <p className="text-sm text-gray-500">
                      {application.status === "in_progress" && "Complete all steps to submit your application."}
                      {application.status === "pending_review" && "Your application is being reviewed by our team."}
                      {application.status === "submitted" && "Your application has been submitted successfully."}
                      {application.status === "approved" && "Your application has been approved."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ClipboardCheck className="mr-2 h-5 w-5 text-primary" />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {application.currentStep === "company" && <li className="text-sm">• Complete company information</li>}
                      {application.currentStep === "ownership" && <li className="text-sm">• Add business owners</li>}
                      {application.currentStep === "employees" && <li className="text-sm">• Upload employee census</li>}
                      {application.currentStep === "documents" && <li className="text-sm">• Upload required documents</li>}
                      {application.currentStep === "plans" && <li className="text-sm">• Select health plans</li>}
                      {application.currentStep === "contributions" && <li className="text-sm">• Set up contributions</li>}
                      {application.currentStep === "review" && <li className="text-sm">• Review and sign application</li>}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-primary" />
                      Quick Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/enrollment/company")}>
                        <Building className="mr-2 h-4 w-4" />
                        Company Info
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/enrollment/documents")}>
                        <Upload className="mr-2 h-4 w-4" />
                        Documents
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/enrollment/review")}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Review & Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Get Started with Your Enrollment</CardTitle>
                  <CardDescription>
                    Begin the process of enrolling your company in health insurance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p>
                      Welcome to the Murillo Insurance Agency enrollment portal. To get started,
                      you'll need to provide some information about your company and employees.
                    </p>
                    <Button onClick={startNewEnrollment}>
                      Start Submission Process
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
