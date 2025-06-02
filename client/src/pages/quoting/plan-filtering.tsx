import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Filter, 
  Search, 
  ArrowRight,
  Heart,
  Eye,
  Shield,
  Activity,
  AlertCircle,
  TrendingUp,
  Calculator,
  Compare,
  Settings,
  Info,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Plan {
  id: number;
  carrier: string;
  planName: string;
  planType: string;
  network: string;
  metalTier?: string;
  monthlyPremium: number;
  deductible?: number;
  coinsurance?: number;
  copay?: number;
  maxOutOfPocket?: number;
  features: string[];
  isPopular: boolean;
  ratingFactors: {
    ageBasedRating: boolean;
    areaFactor: number;
    groupSize: number;
    industryFactor: number;
  };
}

interface ContributionModel {
  planType: string;
  employeeContribution: number;
  spouseContribution: number;
  childrenContribution: number;
  familyContribution: number;
  contributionType: 'percentage' | 'fixed_amount';
  maxEmployerContribution?: number;
}

const planTypeIcons = {
  medical: Heart,
  dental: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-1.5c.33.08.66.5 1 .5s.67-.42 1-.5V17c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="currentColor"/>
    </svg>
  ),
  vision: Eye,
  basic_life: Shield,
  supplemental_life: Shield,
  voluntary_accident: Activity,
  critical_illness: AlertCircle,
  universal_life: Shield,
};

const metalTierColors = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-400',
  platinum: 'bg-purple-400',
};

export default function PlanFiltering() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  
  const [selectedPlans, setSelectedPlans] = useState<number[]>([]);
  const [filterCarrier, setFilterCarrier] = useState<string>('');
  const [filterPlanType, setFilterPlanType] = useState<string>('');
  const [filterMetalTier, setFilterMetalTier] = useState<string>('');
  const [filterNetwork, setFilterNetwork] = useState<string>('');
  const [maxPremium, setMaxPremium] = useState<number[]>([1000]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [contributions, setContributions] = useState<Record<string, ContributionModel>>({});
  const [showContributionModal, setShowContributionModal] = useState<string | null>(null);

  const { data: quote } = useQuery({
    queryKey: ['/api/quotes', quoteId],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID required');
      const response = await apiRequest('GET', `/api/quotes/${quoteId}`);
      return response.json();
    },
    enabled: !!quoteId,
  });

  const { data: availablePlans } = useQuery({
    queryKey: ['/api/plans/filtered', quote?.selectedCarriers],
    queryFn: async () => {
      if (!quote?.selectedCarriers) return [];
      const response = await apiRequest('POST', '/api/plans/filter', {
        carriers: quote.selectedCarriers,
        state: 'CA', // Would come from company data
        effectiveDate: new Date(),
      });
      return response.json();
    },
    enabled: !!quote?.selectedCarriers,
  });

  const savePlanSelectionMutation = useMutation({
    mutationFn: async (data: { plans: number[]; contributions: Record<string, ContributionModel> }) => {
      const response = await apiRequest('PUT', `/api/quotes/${quoteId}`, {
        selectedPlans: data.plans,
        contributionModels: data.contributions,
        status: 'plans_selected',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
      toast({
        title: 'Plans Selected',
        description: 'Your plan selections and contribution models have been saved.',
      });
      // Navigate to proposal generation
      window.location.href = `/quoting/proposal-generation?quoteId=${quoteId}`;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save plan selection',
        variant: 'destructive',
      });
    },
  });

  const filteredPlans = (availablePlans || []).filter((plan: Plan) => {
    const matchesSearch = plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCarrier = !filterCarrier || plan.carrier === filterCarrier;
    const matchesPlanType = !filterPlanType || plan.planType === filterPlanType;
    const matchesMetalTier = !filterMetalTier || plan.metalTier === filterMetalTier;
    const matchesNetwork = !filterNetwork || plan.network === filterNetwork;
    const matchesPremium = plan.monthlyPremium <= maxPremium[0];
    
    return matchesSearch && matchesCarrier && matchesPlanType && matchesMetalTier && matchesNetwork && matchesPremium;
  });

  const plansByType = filteredPlans.reduce((acc: Record<string, Plan[]>, plan: Plan) => {
    if (!acc[plan.planType]) {
      acc[plan.planType] = [];
    }
    acc[plan.planType].push(plan);
    return acc;
  }, {});

  const togglePlan = (planId: number) => {
    setSelectedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  const updateContribution = (planType: string, contribution: ContributionModel) => {
    setContributions(prev => ({
      ...prev,
      [planType]: contribution,
    }));
  };

  const calculateEmployerCost = (plan: Plan, contribution: ContributionModel) => {
    const employeeCost = plan.monthlyPremium * (contribution.employeeContribution / 100);
    const spouseCost = plan.monthlyPremium * 1.5 * (contribution.spouseContribution / 100); // Assume spouse multiplier
    const childrenCost = plan.monthlyPremium * 0.8 * (contribution.childrenContribution / 100); // Assume children multiplier
    const familyCost = plan.monthlyPremium * 2.5 * (contribution.familyContribution / 100); // Assume family multiplier
    
    return {
      employee: plan.monthlyPremium - employeeCost,
      spouse: (plan.monthlyPremium * 1.5) - spouseCost,
      children: (plan.monthlyPremium * 0.8) - childrenCost,
      family: (plan.monthlyPremium * 2.5) - familyCost,
    };
  };

  const handleContinue = () => {
    if (selectedPlans.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one plan to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Check that we have contribution models for all selected plan types
    const selectedPlanTypes = [...new Set(filteredPlans.filter((p: Plan) => selectedPlans.includes(p.id)).map((p: Plan) => p.planType))];
    const missingContributions = selectedPlanTypes.filter(type => !contributions[type]);
    
    if (missingContributions.length > 0) {
      toast({
        title: 'Contribution Models Required',
        description: `Please set contribution models for: ${missingContributions.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    savePlanSelectionMutation.mutate({ plans: selectedPlans, contributions });
  };

  const ContributionModelDialog = ({ planType }: { planType: string }) => {
    const [localContribution, setLocalContribution] = useState<ContributionModel>(
      contributions[planType] || {
        planType,
        employeeContribution: 80,
        spouseContribution: 50,
        childrenContribution: 50,
        familyContribution: 50,
        contributionType: 'percentage',
      }
    );

    const handleSave = () => {
      updateContribution(planType, localContribution);
      setShowContributionModal(null);
      toast({
        title: 'Contribution Model Saved',
        description: `Contribution model for ${planType} has been updated.`,
      });
    };

    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Set Contribution Model - {planType.replace('_', ' ').toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Configure employer contribution percentages for different enrollment tiers
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contribution Type</label>
              <Select 
                value={localContribution.contributionType} 
                onValueChange={(value: 'percentage' | 'fixed_amount') => 
                  setLocalContribution(prev => ({ ...prev, contributionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {localContribution.contributionType === 'percentage' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Employer Contribution</label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={localContribution.maxEmployerContribution || ''}
                  onChange={(e) => setLocalContribution(prev => ({ 
                    ...prev, 
                    maxEmployerContribution: parseInt(e.target.value) || undefined 
                  }))}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'employeeContribution', label: 'Employee Only', description: 'Employer contribution for employee-only coverage' },
              { key: 'spouseContribution', label: 'Employee + Spouse', description: 'Employer contribution for employee + spouse coverage' },
              { key: 'childrenContribution', label: 'Employee + Children', description: 'Employer contribution for employee + children coverage' },
              { key: 'familyContribution', label: 'Family', description: 'Employer contribution for family coverage' },
            ].map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">{label}</label>
                    <p className="text-xs text-gray-600">{description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {localContribution[key as keyof ContributionModel]}
                      {localContribution.contributionType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
                <Slider
                  value={[localContribution[key as keyof ContributionModel] as number]}
                  onValueChange={([value]) => setLocalContribution(prev => ({ ...prev, [key]: value }))}
                  max={localContribution.contributionType === 'percentage' ? 100 : 500}
                  step={localContribution.contributionType === 'percentage' ? 5 : 25}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowContributionModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Contribution Model
            </Button>
          </div>
        </div>
      </DialogContent>
    );
  };

  const availableCarriers = [...new Set(filteredPlans.map((p: Plan) => p.carrier))];
  const availableNetworks = [...new Set(filteredPlans.map((p: Plan) => p.network))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Compare className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Plan Filtering & Selection</h1>
          <p className="text-xl text-gray-600 mb-4">
            Filter and compare insurance plans with contribution modeling
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Select plans and configure employer contribution models for each benefit type</span>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Plan Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search plans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Carrier</label>
                <Select value={filterCarrier} onValueChange={setFilterCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="All carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All carriers</SelectItem>
                    {availableCarriers.map(carrier => (
                      <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan Type</label>
                <Select value={filterPlanType} onValueChange={setFilterPlanType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="dental">Dental</SelectItem>
                    <SelectItem value="vision">Vision</SelectItem>
                    <SelectItem value="basic_life">Basic Life</SelectItem>
                    <SelectItem value="supplemental_life">Supplemental Life</SelectItem>
                    <SelectItem value="voluntary_accident">Voluntary Accident</SelectItem>
                    <SelectItem value="critical_illness">Critical Illness</SelectItem>
                    <SelectItem value="universal_life">Universal Life</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Metal Tier</label>
                <Select value={filterMetalTier} onValueChange={setFilterMetalTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All tiers</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Network</label>
                <Select value={filterNetwork} onValueChange={setFilterNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="All networks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All networks</SelectItem>
                    {availableNetworks.map(network => (
                      <SelectItem key={network} value={network}>{network}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Premium: ${maxPremium[0]}</label>
                <Slider
                  value={maxPremium}
                  onValueChange={setMaxPremium}
                  max={1000}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans by Type */}
        <Tabs defaultValue={Object.keys(plansByType)[0]} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            {Object.entries(plansByType).map(([planType, plans]) => {
              const Icon = planTypeIcons[planType as keyof typeof planTypeIcons];
              return (
                <TabsTrigger key={planType} value={planType} className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="capitalize">{planType.replace('_', ' ')}</span>
                  <Badge variant="secondary" className="text-xs">
                    {plans.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(plansByType).map(([planType, plans]) => (
            <TabsContent key={planType} value={planType}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {(() => {
                          const Icon = planTypeIcons[planType as keyof typeof planTypeIcons];
                          return Icon ? <Icon className="h-6 w-6" /> : null;
                        })()}
                        {planType.replace('_', ' ').toUpperCase()} Plans ({plans.length})
                      </CardTitle>
                      <CardDescription>
                        Compare and select plans for {planType.replace('_', ' ')} coverage
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {contributions[planType] && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Contribution Set
                        </Badge>
                      )}
                      <Dialog open={showContributionModal === planType} onOpenChange={(open) => setShowContributionModal(open ? planType : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Set Contributions
                          </Button>
                        </DialogTrigger>
                        <ContributionModelDialog planType={planType} />
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Network</TableHead>
                        {planType === 'medical' && <TableHead>Metal Tier</TableHead>}
                        <TableHead>Premium</TableHead>
                        {planType === 'medical' && (
                          <>
                            <TableHead>Deductible</TableHead>
                            <TableHead>Max OOP</TableHead>
                          </>
                        )}
                        <TableHead>Features</TableHead>
                        {contributions[planType] && <TableHead>Employer Cost</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan: Plan) => {
                        const isSelected = selectedPlans.includes(plan.id);
                        const employerCost = contributions[planType] ? calculateEmployerCost(plan, contributions[planType]) : null;
                        
                        return (
                          <TableRow 
                            key={plan.id}
                            className={cn(
                              'cursor-pointer hover:bg-gray-50',
                              isSelected && 'bg-blue-50'
                            )}
                            onClick={() => togglePlan(plan.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => togglePlan(plan.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{plan.planName}</div>
                              {plan.isPopular && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Popular
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{plan.carrier}</TableCell>
                            <TableCell>{plan.network}</TableCell>
                            {planType === 'medical' && (
                              <TableCell>
                                {plan.metalTier && (
                                  <Badge 
                                    className={cn(
                                      'text-white',
                                      metalTierColors[plan.metalTier as keyof typeof metalTierColors]
                                    )}
                                  >
                                    {plan.metalTier}
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="font-medium">${plan.monthlyPremium}/mo</div>
                            </TableCell>
                            {planType === 'medical' && (
                              <>
                                <TableCell>
                                  {plan.deductible ? `$${plan.deductible}` : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {plan.maxOutOfPocket ? `$${plan.maxOutOfPocket}` : 'N/A'}
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {plan.features.slice(0, 2).map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {plan.features.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{plan.features.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            {employerCost && (
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  <div>EE: ${employerCost.employee.toFixed(0)}</div>
                                  <div>Family: ${employerCost.family.toFixed(0)}</div>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Selection Summary */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Selection Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPlans.length} plan{selectedPlans.length !== 1 ? 's' : ''} selected • {Object.keys(contributions).length} contribution model{Object.keys(contributions).length !== 1 ? 's' : ''} configured
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Total estimated monthly premium: <span className="font-medium">
                  ${filteredPlans.filter((p: Plan) => selectedPlans.includes(p.id)).reduce((sum: number, plan: Plan) => sum + plan.monthlyPremium, 0)}
                </span>
              </div>
              
              <Button
                onClick={handleContinue}
                disabled={selectedPlans.length === 0 || savePlanSelectionMutation.isPending}
                size="lg"
                className="px-8"
              >
                {savePlanSelectionMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    Generate Proposal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}