import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FormattedInputField } from "@/components/ui/form-formatted-input";
import { getEnabledEnrollmentSteps } from "@/utils/enrollment-steps";
import { Header } from "@/components/layout/header";
import { ProgressBar } from "@/components/layout/progress-bar";
import { EnrollmentChecklist } from "@/components/enrollment/checklist";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema for authorized contact
const authorizedContactSchema = z.object({
  companyId: z.number(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").min(1, "Phone number is required"),
  isEligibleForCoverage: z.boolean().default(false),
});

type AuthorizedContactFormValues = z.infer<typeof authorizedContactSchema>;

export default function AuthorizedContact() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [validationError, setValidationError] = useState<string | null>(null);

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

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Use the enabled enrollment steps (without the Employee step)
  const steps = getEnabledEnrollmentSteps();

  // Form setup
  const form = useForm<AuthorizedContactFormValues>({
    resolver: zodResolver(authorizedContactSchema),
    defaultValues: {
      companyId: companyId || 0,
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone: "",
      isEligibleForCoverage: false,
    },
  });

  // Update companyId when it's available
  useEffect(() => {
    if (companyId) {
      form.setValue("companyId", companyId);
    }
  }, [companyId, form]);

  // Mutation for saving the authorized contact
  const saveMutation = useMutation({
    mutationFn: async (values: AuthorizedContactFormValues) => {
      // Format the data properly to prevent JSON parse errors
      const formattedValues = {
        ...values,
        companyId: Number(values.companyId),
        isEligibleForCoverage: Boolean(values.isEligibleForCoverage),
        // Ensure phone is formatted properly as a string
        phone: String(values.phone)
      };
      
      const res = await apiRequest("POST", `/api/companies/${companyId}/authorized-contact`, formattedValues);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save contact information");
      }
      return {};
    },
    onSuccess: () => {
      toast({
        title: "Contact saved",
        description: "The authorized contact has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      
      // Navigate to the documents page (skipping employees)
      navigate("/enrollment/documents");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save contact: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AuthorizedContactFormValues) => {
    saveMutation.mutate(values);
  };

  // Loading state
  const isLoading = isLoadingCompanies || isLoadingApplication || saveMutation.isPending;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar 
          steps={steps} 
          currentStep="authorized-contact" 
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

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Authorized Contact Information</CardTitle>
                <CardDescription>
                  Provide details for the primary contact person authorized to make decisions for this benefits submission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="HR Director" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormattedInputField
                        control={form.control}
                        name="phone"
                        label="Cell Phone Number"
                        placeholder="(555) 555-5555"
                        formatType="phone"
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isEligibleForCoverage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Eligible for Coverage</FormLabel>
                            <p className="text-sm text-gray-500">
                              Check this if this contact is eligible for health insurance coverage
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {validationError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                        <AlertCircle className="inline-block mr-2 h-4 w-4" />
                        {validationError}
                      </div>
                    )}

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={() => navigate("/enrollment/ownership")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous: Ownership
                      </Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving..." : "Save & Continue"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-80">
            <EnrollmentChecklist companyId={companyId} />
          </div>
        </div>
      </main>
    </div>
  );
}