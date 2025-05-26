import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Circle, User, Building, Shield, FileText, CreditCard, PenTool } from "lucide-react";

const enrollmentSteps = [
  {
    id: "application-initiator",
    label: "Application Initiator",
    description: "Who's completing this application",
    icon: User,
    path: "/enrollment/application-initiator"
  },
  {
    id: "company-information",
    label: "Company Information", 
    description: "Basic company details",
    icon: Building,
    path: "/enrollment/company-information"
  },
  {
    id: "coverage-information",
    label: "Coverage Information",
    description: "Benefits and employee count",
    icon: Shield,
    path: "/enrollment/coverage-information"
  },
  {
    id: "ownership-info",
    label: "Ownership Information",
    description: "Company owners and contacts",
    icon: User,
    path: "/enrollment/ownership-info"
  },
  {
    id: "document-upload",
    label: "Document Upload",
    description: "Required documentation",
    icon: FileText,
    path: "/enrollment/document-upload"
  },
  {
    id: "contribution-setup",
    label: "Contribution Setup",
    description: "Payment and contribution rates",
    icon: CreditCard,
    path: "/enrollment/contribution-setup"
  },
  {
    id: "digital-signature",
    label: "Digital Signature",
    description: "Final signature and submission",
    icon: PenTool,
    path: "/enrollment/digital-signature"
  }
];

export function ProgressSidebar() {
  const [location] = useLocation();
  
  const getCurrentStepIndex = () => {
    const currentStep = enrollmentSteps.findIndex(step => step.path === location);
    return currentStep >= 0 ? currentStep : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed";
    if (index === currentStepIndex) return "current";
    return "upcoming";
  };

  return (
    <Card className="h-fit">
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2">Enrollment Progress</h3>
          <div className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {enrollmentSteps.length}
          </div>
        </div>

        <div className="space-y-4">
          {enrollmentSteps.map((step, index) => {
            const status = getStepStatus(index);
            const IconComponent = step.icon;
            
            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : status === "current"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    {status === "completed" ? (
                      <Check className="w-4 h-4" />
                    ) : status === "current" ? (
                      <IconComponent className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                  {index < enrollmentSteps.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-2 ${
                        status === "completed" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm ${
                      status === "current"
                        ? "text-blue-600"
                        : status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / enrollmentSteps.length) * 100}%`
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            {Math.round(((currentStepIndex + 1) / enrollmentSteps.length) * 100)}% Complete
          </div>
        </div>
      </CardContent>
    </Card>
  );
}