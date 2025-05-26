import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Company, Application } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { ProgressBar } from "@/components/layout/progress-bar";
import { getEnabledEnrollmentSteps } from "@/utils/enrollment-steps";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the carriers we support
const CARRIERS = [
  { id: "blue-shield", name: "Blue Shield", logo: "blue-shield-logo.png" },
  { id: "anthem", name: "Anthem", logo: "anthem-logo.png" },
  { id: "ccsb", name: "Covered CA Small Business (CCSB)", logo: "ccsb-logo.png" },
  { id: "health-net", name: "HealthNet", logo: "health-net-logo.png" },
  { id: "kaiser", name: "Kaiser", logo: "kaiser-logo.png" },
  { id: "united-healthcare", name: "United HealthCare", logo: "united-healthcare-logo.png" },
];

export default function CarriersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const steps = getEnabledEnrollmentSteps();

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Get the first company (for now we only support one company per user)
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery<Application>({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Mutation for proceeding to next step
  const proceedMutation = useMutation({
    mutationFn: async () => {
      // Store the selected carrier in localStorage for now
      // We'll save it to the application once the company is created
      localStorage.setItem("selectedCarrier", selectedCarrier);
      return { success: true };
    },
    onSuccess: () => {
      // Navigate to the next step (company info)
      navigate("/enrollment/company");
      
      toast({
        title: "Carrier selected",
        description: `You've selected ${CARRIERS.find(c => c.id === selectedCarrier)?.name}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingApplication || proceedMutation.isPending;

  // Handle form submission
  const handleContinue = () => {
    if (!selectedCarrier) {
      toast({
        title: "Please select a carrier",
        description: "You must select an insurance carrier to continue.",
        variant: "destructive",
      });
      return;
    }
    
    proceedMutation.mutate();
  };

  // Prefill from saved data
  useEffect(() => {
    // First check localStorage (for when no company exists yet)
    const savedCarrier = localStorage.getItem("selectedCarrier");
    if (savedCarrier) {
      setSelectedCarrier(savedCarrier);
    }
    // Then check application data (if company exists and has selectedCarrier)
    else if (application && 'selectedCarrier' in application && application.selectedCarrier) {
      setSelectedCarrier(application.selectedCarrier);
    }
  }, [application]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          steps={steps} 
          currentStep="carriers" 
          completedSteps={application?.completedSteps as string[] || []}
        />
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Select Insurance Carrier</CardTitle>
            <CardDescription>
              Choose the insurance carrier you want to apply for
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CARRIERS.map((carrier) => (
                <div 
                  key={carrier.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCarrier === carrier.id 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCarrier(carrier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{carrier.name}</div>
                    {selectedCarrier === carrier.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex justify-end">
              <Button
                onClick={handleContinue}
                disabled={isLoading || !selectedCarrier}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}