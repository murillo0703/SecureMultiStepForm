import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plan } from '@shared/schema';
import { validatePlanSelection } from '@/utils/form-validators';
import { Header } from '@/components/layout/header';
import { ProgressBar } from '@/components/layout/progress-bar';
import { EnrollmentChecklist } from '@/components/enrollment/checklist';
import { PdfFormGenerator } from '@/components/enrollment/pdf-form-generator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import { CheckCircle, ArrowRight, ArrowLeft, X, AlertCircle, FileText } from 'lucide-react';

export default function PlanSelection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [carrier, setCarrier] = useState('Anthem');
  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>(['HMO', 'PPO']);
  const [selectedMetalTiers, setSelectedMetalTiers] = useState<string[]>([
    'Gold',
    'Silver',
    'Bronze',
    'Platinum',
  ]);
  const [selectedPlans, setSelectedPlans] = useState<number[]>([]);
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

  // Fetch all available plans
  const { data: availablePlans = [], isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    enabled: !!companyId,
  });

  // Fetch selected plans for this company
  const { data: companyPlans = [], isLoading: isLoadingCompanyPlans } = useQuery<
    (Plan & { id: number })[]
  >({
    queryKey: [`/api/companies/${companyId}/plans`],
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

  // Initialize selected plans from companyPlans
  useEffect(() => {
    if (companyPlans.length > 0) {
      setSelectedPlans(companyPlans.map(plan => plan.id));
    }
  }, [companyPlans]);

  // Mutation for selecting a plan
  const selectPlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', `/api/companies/${companyId}/plans`, {
        planId,
        companyId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/plans`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      toast({
        title: 'Plan selected',
        description: 'The health plan has been added to your selections.',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to select plan: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation for removing a plan
  const removePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest('DELETE', `/api/companies/${companyId}/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/plans`] });
      toast({
        title: 'Plan removed',
        description: 'The health plan has been removed from your selections.',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: `Failed to remove plan: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Filter plans based on carrier, plan types and metal tiers
  const filteredPlans = availablePlans.filter(
    plan =>
      plan.carrier === carrier &&
      selectedPlanTypes.includes(plan.type) &&
      (plan.metalTier ? selectedMetalTiers.includes(plan.metalTier) : true)
  );

  const handleCarrierChange = (value: string) => {
    setCarrier(value);
  };

  const handlePlanTypeChange = (type: string) => {
    setSelectedPlanTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleMetalTierChange = (tier: string) => {
    setSelectedMetalTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const handlePlanSelection = (planId: number) => {
    if (companyPlans.some(plan => plan.id === planId)) {
      // Plan is already selected, remove it
      removePlanMutation.mutate(planId);
      setSelectedPlans(prev => prev.filter(id => id !== planId));
    } else {
      // Plan is not selected, add it
      selectPlanMutation.mutate(planId);
      setSelectedPlans(prev => [...prev, planId]);
    }
  };

  const handleRemovePlan = (planId: number) => {
    removePlanMutation.mutate(planId);
    setSelectedPlans(prev => prev.filter(id => id !== planId));
  };

  const handleContinue = () => {
    if (companyPlans.length === 0) {
      setConfirmDialogOpen(true);
    } else {
      navigate('/enrollment/contributions');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Loading state
  const isLoading =
    isLoadingCompanies ||
    isLoadingPlans ||
    isLoadingCompanyPlans ||
    isLoadingApplication ||
    selectPlanMutation.isPending ||
    removePlanMutation.isPending;

  if (!companyId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <ProgressBar
          steps={steps}
          currentStep="plans"
          completedSteps={(application?.completedSteps as string[]) || []}
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
                <CardTitle>Plan Selection</CardTitle>
                <CardDescription>Select health plans for your employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Insurance Carrier Selection */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Insurance Carrier</h3>
                    <RadioGroup
                      value={carrier}
                      onValueChange={handleCarrierChange}
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      <div
                        className={`border rounded-lg p-4 flex items-center cursor-pointer ${carrier === 'Anthem' ? 'border-primary bg-blue-50' : 'hover:border-primary hover:bg-blue-50'}`}
                      >
                        <RadioGroupItem value="Anthem" id="anthem" className="text-primary" />
                        <Label htmlFor="anthem" className="ml-3 cursor-pointer">
                          Anthem Blue Cross
                        </Label>
                      </div>
                      <div
                        className={`border rounded-lg p-4 flex items-center cursor-pointer ${carrier === 'Blue Shield' ? 'border-primary bg-blue-50' : 'hover:border-primary hover:bg-blue-50'}`}
                      >
                        <RadioGroupItem
                          value="Blue Shield"
                          id="blueshield"
                          className="text-primary"
                        />
                        <Label htmlFor="blueshield" className="ml-3 cursor-pointer">
                          Blue Shield
                        </Label>
                      </div>
                      <div
                        className={`border rounded-lg p-4 flex items-center cursor-pointer ${carrier === 'CCSB' ? 'border-primary bg-blue-50' : 'hover:border-primary hover:bg-blue-50'}`}
                      >
                        <RadioGroupItem value="CCSB" id="ccsb" className="text-primary" />
                        <Label htmlFor="ccsb" className="ml-3 cursor-pointer">
                          CCSB
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Plan Filters */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Plan Filters</h3>

                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border mb-4">
                      {/* Plan Types */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-2">Plan Types</h4>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hmo"
                              checked={selectedPlanTypes.includes('HMO')}
                              onCheckedChange={() => handlePlanTypeChange('HMO')}
                            />
                            <label
                              htmlFor="hmo"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              HMO
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="ppo"
                              checked={selectedPlanTypes.includes('PPO')}
                              onCheckedChange={() => handlePlanTypeChange('PPO')}
                            />
                            <label
                              htmlFor="ppo"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              PPO
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="hsa"
                              checked={selectedPlanTypes.includes('HSA')}
                              onCheckedChange={() => handlePlanTypeChange('HSA')}
                            />
                            <label
                              htmlFor="hsa"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              HSA
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Metal Tiers */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 mb-2">Metal Tiers</h4>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="platinum"
                              checked={selectedMetalTiers.includes('Platinum')}
                              onCheckedChange={() => handleMetalTierChange('Platinum')}
                            />
                            <label
                              htmlFor="platinum"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Platinum
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="gold"
                              checked={selectedMetalTiers.includes('Gold')}
                              onCheckedChange={() => handleMetalTierChange('Gold')}
                            />
                            <label
                              htmlFor="gold"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Gold
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="silver"
                              checked={selectedMetalTiers.includes('Silver')}
                              onCheckedChange={() => handleMetalTierChange('Silver')}
                            />
                            <label
                              htmlFor="silver"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Silver
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="bronze"
                              checked={selectedMetalTiers.includes('Bronze')}
                              onCheckedChange={() => handleMetalTierChange('Bronze')}
                            />
                            <label
                              htmlFor="bronze"
                              className="text-sm text-gray-600 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Bronze
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Available Plans</h3>
                    </div>

                    {/* Available Plans List */}
                    <div className="border border-gray-200 rounded-lg divide-y">
                      {filteredPlans.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No plans match your current selection.
                        </div>
                      ) : (
                        filteredPlans.map(plan => (
                          <div
                            key={plan.id}
                            className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                  <Checkbox
                                    id={`plan-${plan.id}`}
                                    checked={companyPlans.some(p => p.id === plan.id)}
                                    onCheckedChange={() => handlePlanSelection(plan.id)}
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label
                                    htmlFor={`plan-${plan.id}`}
                                    className="font-medium text-gray-700 cursor-pointer"
                                  >
                                    {plan.name}
                                  </label>
                                  <p className="text-gray-500">
                                    {plan.details || `Network: ${plan.network}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-0 flex flex-col sm:items-end text-sm">
                              <span className="font-medium text-gray-900">
                                {plan.metalTier || plan.type}
                              </span>
                              <span className="text-gray-500">{plan.network}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Selected Plans */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Selected Plans ({companyPlans.length})
                    </h3>

                    {companyPlans.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                        No plans selected yet. Please select at least one plan to continue.
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {companyPlans.map(plan => (
                          <div
                            key={plan.id}
                            className="border border-green-200 bg-green-50 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{plan.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {plan.metalTier ? `${plan.metalTier} tier` : plan.type}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500"
                                onClick={() => handleRemovePlan(plan.id)}
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>{plan.details || `Network: ${plan.network}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/enrollment/documents')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous: Documents
                </Button>
                <Button onClick={handleContinue}>
                  Next: Contributions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <EnrollmentChecklist companyId={companyId} />
          </div>
        </div>

        {/* Confirm Dialog for No Plans */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>No Plans Selected</AlertDialogTitle>
              <AlertDialogDescription>
                You haven't selected any health plans. At least one plan selection is required to
                continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmDialogOpen(false)}>
                Select Plans
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
