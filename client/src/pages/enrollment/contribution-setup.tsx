import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plan, Contribution } from '@shared/schema';
import { contributionValidationSchema } from '@/utils/form-validators';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { Company } from '@shared/schema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
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
import { CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

// Form schema
type ContributionFormValues = z.infer<typeof contributionValidationSchema>;

export default function ContributionSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch companies for this user
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
  });

  // Get the first company
  const companyId = companies.length > 0 ? companies[0].id : null;

  // Redirect if no company exists
  useEffect(() => {
    if (!isLoadingCompanies && !companyId) {
      navigate('/enrollment/company');
    }
  }, [companyId, isLoadingCompanies, navigate]);

  // Fetch selected plans for this company
  const { data: companyPlans = [], isLoading: isLoadingCompanyPlans } = useQuery<
    (Plan & { id: number })[]
  >({
    queryKey: [`/api/companies/${companyId}/plans`],
    enabled: !!companyId,
  });

  // Fetch existing contributions
  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery<Contribution[]>({
    queryKey: [`/api/companies/${companyId}/contributions`],
    enabled: !!companyId,
  });

  // Fetch application data
  const { data: application, isLoading: isLoadingApplication } = useQuery({
    queryKey: [`/api/companies/${companyId}/application`],
    enabled: !!companyId,
  });

  // Steps configuration for progress bar
  const steps = [
    { id: 'company', label: 'Company', href: '/enrollment/company' },
    { id: 'ownership', label: 'Owners', href: '/enrollment/ownership' },
    { id: 'employees', label: 'Employees', href: '/enrollment/employees' },
    { id: 'documents', label: 'Documents', href: '/enrollment/documents' },
    { id: 'plans', label: 'Plans', href: '/enrollment/plans' },
    { id: 'contributions', label: 'Contributions', href: '/enrollment/contributions' },
    { id: 'review', label: 'Submit', href: '/enrollment/review' },
  ];

  // Initialize selected plan
  useEffect(() => {
    if (companyPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(companyPlans[0].id);
    }
  }, [companyPlans, selectedPlanId]);

  // Form setup
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionValidationSchema),
    defaultValues: {
      companyId: companyId || 0,
      planId: selectedPlanId || 0,
      employeeContribution: 50,
      dependentContribution: 0,
    },
  });

  // Update form values when selectedPlanId changes
  useEffect(() => {
    if (companyId && selectedPlanId) {
      // Find existing contribution for this plan
      const existingContribution = contributions.find(
        contribution => contribution.planId === selectedPlanId
      );

      form.setValue('companyId', companyId);
      form.setValue('planId', selectedPlanId);

      if (existingContribution) {
        form.setValue('employeeContribution', existingContribution.employeeContribution);
        form.setValue('dependentContribution', existingContribution.dependentContribution);
      } else {
        // Reset to defaults if no existing contribution
        form.setValue('employeeContribution', 50);
        form.setValue('dependentContribution', 0);
      }
    }
  }, [companyId, selectedPlanId, contributions, form]);

  // Mutation for saving contribution
  const contributionMutation = useMutation({
    mutationFn: async (values: ContributionFormValues) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/contributions`, values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Contribution saved',
        description: 'Your contribution has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/contributions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to save contribution: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ContributionFormValues) => {
    contributionMutation.mutate(values);
  };

  // Handle plan selection
  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
  };

  const handleContinue = () => {
    // If we have plans but no contributions, show confirmation dialog
    if (companyPlans.length > 0 && contributions.length === 0) {
      setConfirmDialogOpen(true);
    } else {
      navigate('/enrollment/review');
    }
  };

  // Check if the current selected plan has a contribution
  const hasContribution = selectedPlanId
    ? contributions.some(contribution => contribution.planId === selectedPlanId)
    : false;

  // Get the selected plan details
  const selectedPlan = companyPlans.find(plan => plan.id === selectedPlanId);

  // Loading state
  const isLoading =
    isLoadingCompanies ||
    isLoadingCompanyPlans ||
    isLoadingContributions ||
    isLoadingApplication ||
    contributionMutation.isPending;

  if (!companyId) return null;

  // If no plans are selected, redirect to plan selection
  if (companyPlans.length === 0 && !isLoadingCompanyPlans) {
    navigate('/enrollment/plans');
    return null;
  }

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
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Contribution Setup</h1>
                  <p className="text-gray-600">
                    Define how much your company will contribute to employee health insurance premiums
                  </p>
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Contribution Setup</CardTitle>
                <CardDescription>
                  Define how much your company will contribute to employee health insurance
                  premiums.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Plan Selector Tabs */}
                  {companyPlans.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {companyPlans.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => handlePlanSelect(plan.id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium 
                            ${
                              selectedPlanId === plan.id
                                ? 'bg-primary text-white'
                                : contributions.some(c => c.planId === plan.id)
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                            } transition-colors`}
                        >
                          {plan.name}
                          {contributions.some(c => c.planId === plan.id) && (
                            <CheckCircle className="ml-1.5 h-3.5 w-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Plan Details */}
                  {selectedPlan && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-800">
                        Selected Plan: {selectedPlan.name}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Plan Type: {selectedPlan.type} | Network: {selectedPlan.network}
                      </p>
                      {selectedPlan.details && (
                        <p className="text-sm text-blue-700 mt-1">{selectedPlan.details}</p>
                      )}
                    </div>
                  )}

                  {/* Contribution Form */}
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="employeeContribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Contribution Percentage</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={50}
                                  max={100}
                                  step={1}
                                  onValueChange={vals => field.onChange(vals[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <div className="w-16">
                                <Input
                                  type="number"
                                  min={50}
                                  max={100}
                                  value={field.value}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </div>
                              <span className="text-sm font-medium">%</span>
                            </div>
                            <FormDescription>
                              Percentage of employee premium covered by employer (minimum 50%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dependentContribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dependent Contribution Percentage</FormLabel>
                            <div className="flex items-center space-x-4">
                              <FormControl>
                                <Slider
                                  value={[field.value]}
                                  min={0}
                                  max={100}
                                  step={1}
                                  onValueChange={vals => field.onChange(vals[0])}
                                  className="flex-1"
                                />
                              </FormControl>
                              <div className="w-16">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={field.value}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </div>
                              <span className="text-sm font-medium">%</span>
                            </div>
                            <FormDescription>
                              Percentage of dependent premium covered by employer
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={contributionMutation.isPending}>
                          {contributionMutation.isPending
                            ? 'Saving...'
                            : hasContribution
                              ? 'Update Contribution'
                              : 'Save Contribution'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/enrollment/plans')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Plans
                </Button>
                <Button onClick={handleContinue}>
                  Next: Review & Submit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            {/* Confirm Dialog for Missing Contributions */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Missing Contribution Information</AlertDialogTitle>
                  <AlertDialogDescription>
                    You haven't defined contributions for your selected plans. This information is
                    required for your application.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay on this page</AlertDialogCancel>
                  <AlertDialogAction onClick={() => navigate('/enrollment/review')}>
                    Continue anyway
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
