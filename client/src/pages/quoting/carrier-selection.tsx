import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Filter, 
  Search, 
  Star, 
  ArrowRight,
  Shield,
  Heart,
  Eye,
  Activity,
  AlertCircle,
  Users,
  Info,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Carrier {
  id: string;
  name: string;
  logo?: string;
  rating: number;
  states: string[];
  planTypes: string[];
  specialties: string[];
  isPreferred: boolean;
  description: string;
}

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
}

const carriers: Carrier[] = [
  {
    id: 'anthem',
    name: 'Anthem Blue Cross',
    rating: 4.5,
    states: ['CA', 'CO', 'CT', 'GA', 'IN', 'KY', 'ME', 'MO', 'NV', 'NH', 'NY', 'OH', 'VA', 'WI'],
    planTypes: ['medical', 'dental', 'vision', 'basic_life'],
    specialties: ['Large Groups', 'PPO Networks', 'HMO Plans'],
    isPreferred: true,
    description: 'Leading health insurance provider with extensive provider networks'
  },
  {
    id: 'kaiser',
    name: 'Kaiser Permanente',
    rating: 4.3,
    states: ['CA', 'CO', 'GA', 'HI', 'MD', 'OR', 'VA', 'WA'],
    planTypes: ['medical', 'dental', 'vision'],
    specialties: ['Integrated Care', 'HMO Model', 'Wellness Programs'],
    isPreferred: true,
    description: 'Integrated healthcare delivery system combining insurance and care'
  },
  {
    id: 'aetna',
    name: 'Aetna',
    rating: 4.2,
    states: ['CA', 'CT', 'FL', 'GA', 'IL', 'NJ', 'NY', 'PA', 'TX'],
    planTypes: ['medical', 'dental', 'vision', 'basic_life', 'supplemental_life'],
    specialties: ['National Networks', 'Telehealth', 'Wellness'],
    isPreferred: true,
    description: 'Comprehensive health benefits with focus on digital health solutions'
  },
  {
    id: 'united',
    name: 'UnitedHealthcare',
    rating: 4.1,
    states: ['CA', 'FL', 'IL', 'NY', 'TX', 'PA', 'OH', 'GA', 'NC', 'MI'],
    planTypes: ['medical', 'dental', 'vision', 'basic_life'],
    specialties: ['Employer Solutions', 'Wellness Programs', 'Data Analytics'],
    isPreferred: false,
    description: 'Largest health insurer with comprehensive employer solutions'
  },
  {
    id: 'healthnet',
    name: 'Health Net',
    rating: 3.9,
    states: ['CA', 'AZ'],
    planTypes: ['medical', 'dental', 'vision'],
    specialties: ['California Focus', 'Medicaid', 'Small Groups'],
    isPreferred: false,
    description: 'California-focused health plan with strong local presence'
  },
  {
    id: 'metlife',
    name: 'MetLife',
    rating: 4.4,
    states: ['CA', 'NY', 'FL', 'TX', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
    planTypes: ['dental', 'vision', 'basic_life', 'supplemental_life', 'voluntary_accident', 'critical_illness'],
    specialties: ['Dental Networks', 'Life Insurance', 'Voluntary Benefits'],
    isPreferred: true,
    description: 'Leading provider of dental, vision, and life insurance benefits'
  },
  {
    id: 'guardian',
    name: 'Guardian Life',
    rating: 4.3,
    states: ['CA', 'NY', 'FL', 'TX', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
    planTypes: ['dental', 'vision', 'basic_life', 'supplemental_life', 'universal_life'],
    specialties: ['Dental Excellence', 'Life Insurance', 'Disability'],
    isPreferred: false,
    description: 'Mutual company specializing in dental, vision, and life insurance'
  },
  {
    id: 'principal',
    name: 'Principal Financial',
    rating: 4.2,
    states: ['CA', 'NY', 'FL', 'TX', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
    planTypes: ['basic_life', 'supplemental_life', 'voluntary_accident', 'critical_illness', 'universal_life'],
    specialties: ['Group Life', 'Voluntary Benefits', 'Retirement'],
    isPreferred: false,
    description: 'Comprehensive voluntary benefits and life insurance solutions'
  }
];

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

export default function CarrierSelection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const quoteId = urlParams.get('quoteId');
  
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [filterState, setFilterState] = useState<string>('');
  const [filterPlanType, setFilterPlanType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPlans, setShowPlans] = useState<string | null>(null);

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
    queryKey: ['/api/plans', filterState, filterPlanType],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/plans/filter', {
        state: filterState || 'CA',
        planType: filterPlanType,
        effectiveDate: new Date(),
      });
      return response.json();
    },
  });

  const saveCarrierSelectionMutation = useMutation({
    mutationFn: async (carriers: string[]) => {
      const response = await apiRequest('PUT', `/api/quotes/${quoteId}`, {
        selectedCarriers: carriers,
        status: 'carrier_selected',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
      toast({
        title: 'Carriers Selected',
        description: 'Your carrier selections have been saved. Proceeding to plan filtering.',
      });
      // Navigate to plan filtering
      window.location.href = `/quoting/plan-filtering?quoteId=${quoteId}`;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save carrier selection',
        variant: 'destructive',
      });
    },
  });

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || carrier.states.includes(filterState);
    const matchesPlanType = !filterPlanType || carrier.planTypes.includes(filterPlanType);
    
    return matchesSearch && matchesState && matchesPlanType;
  });

  const toggleCarrier = (carrierId: string) => {
    setSelectedCarriers(prev => 
      prev.includes(carrierId)
        ? prev.filter(id => id !== carrierId)
        : [...prev, carrierId]
    );
  };

  const handleContinue = () => {
    if (selectedCarriers.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one carrier to continue.',
        variant: 'destructive',
      });
      return;
    }
    saveCarrierSelectionMutation.mutate(selectedCarriers);
  };

  const getCarrierPlans = (carrierId: string): Plan[] => {
    return availablePlans?.filter((plan: Plan) => plan.carrier.toLowerCase() === carrierId) || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Carrier Selection</h1>
          <p className="text-xl text-gray-600 mb-4">
            Choose insurance carriers for your quote comparison
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Select multiple carriers to compare plans and pricing</span>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search carriers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All states</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan Type</label>
                <Select value={filterPlanType} onValueChange={setFilterPlanType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All plan types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All plan types</SelectItem>
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
                <label className="text-sm font-medium">Quick Filters</label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCarriers.length === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCarriers([])}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant={selectedCarriers.length === filteredCarriers.filter(c => c.isPreferred).length ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCarriers(filteredCarriers.filter(c => c.isPreferred).map(c => c.id))}
                  >
                    Preferred
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCarriers.map((carrier) => {
            const isSelected = selectedCarriers.includes(carrier.id);
            const carrierPlans = getCarrierPlans(carrier.id);
            
            return (
              <Card
                key={carrier.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg relative',
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50' 
                    : 'hover:shadow-md'
                )}
                onClick={() => toggleCarrier(carrier.id)}
              >
                {carrier.isPreferred && (
                  <Badge className="absolute -top-2 -right-2 bg-amber-500">
                    <Star className="h-3 w-3 mr-1" />
                    Preferred
                  </Badge>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-3 rounded-lg',
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      )}>
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{carrier.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-3 w-3',
                                  i < Math.floor(carrier.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{carrier.rating}</span>
                        </div>
                      </div>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleCarrier(carrier.id)}
                      className="mt-1"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {carrier.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Plan Types:</h4>
                      <div className="flex flex-wrap gap-1">
                        {carrier.planTypes.map((type) => {
                          const Icon = planTypeIcons[type as keyof typeof planTypeIcons];
                          return (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {Icon && <Icon className="h-3 w-3 mr-1" />}
                              {type.replace('_', ' ')}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-1">
                        {carrier.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">States:</h4>
                      <div className="text-sm text-gray-600">
                        {carrier.states.length > 5
                          ? `${carrier.states.slice(0, 5).join(', ')} +${carrier.states.length - 5} more`
                          : carrier.states.join(', ')
                        }
                      </div>
                    </div>

                    {carrierPlans.length > 0 && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPlans(showPlans === carrier.id ? null : carrier.id);
                          }}
                          className="text-blue-600 p-0 h-auto"
                        >
                          View {carrierPlans.length} Available Plans
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* Plan Preview */}
                {showPlans === carrier.id && carrierPlans.length > 0 && (
                  <CardContent className="pt-0 border-t">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Sample Plans:</h4>
                      {carrierPlans.slice(0, 3).map((plan: Plan) => (
                        <div key={plan.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{plan.planName}</div>
                            <div className="text-gray-600">{plan.network}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${plan.monthlyPremium}/mo</div>
                            {plan.metalTier && (
                              <Badge variant="outline" className="text-xs">
                                {plan.metalTier}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {carrierPlans.length > 3 && (
                        <div className="text-center text-sm text-gray-600">
                          +{carrierPlans.length - 3} more plans available
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Selection Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Selected Carriers</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedCarriers.length} carrier{selectedCarriers.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {selectedCarriers.map(carrierId => {
                  const carrier = carriers.find(c => c.id === carrierId);
                  return (
                    <Badge key={carrierId} variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {carrier?.name}
                    </Badge>
                  );
                })}
                {selectedCarriers.length === 0 && (
                  <span className="text-gray-500 text-sm">No carriers selected</span>
                )}
              </div>
              
              <Button
                onClick={handleContinue}
                disabled={selectedCarriers.length === 0 || saveCarrierSelectionMutation.isPending}
                size="lg"
                className="px-8"
              >
                {saveCarrierSelectionMutation.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    Continue to Plan Filtering
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