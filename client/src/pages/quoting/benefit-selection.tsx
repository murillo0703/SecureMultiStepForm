import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Heart, 
  Eye, 
  Shield, 
  Activity, 
  AlertCircle, 
  Users, 
  ArrowRight,
  Check,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BenefitType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'supplemental' | 'voluntary';
  popular: boolean;
  estimatedCost: string;
  features: string[];
}

const benefitTypes: BenefitType[] = [
  {
    id: 'medical',
    name: 'Medical Insurance',
    description: 'Comprehensive health coverage for employees and dependents',
    icon: Heart,
    category: 'core',
    popular: true,
    estimatedCost: '$400-800/month',
    features: ['Preventive care', 'Emergency services', 'Prescription drugs', 'Specialist visits']
  },
  {
    id: 'dental',
    name: 'Dental Insurance',
    description: 'Oral health coverage including preventive and restorative care',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1s1-.45 1-1v-1.5c.33.08.66.5 1 .5s.67-.42 1-.5V17c0 .55.45 1 1 1s1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" fill="currentColor"/>
      </svg>
    ),
    category: 'core',
    popular: true,
    estimatedCost: '$25-60/month',
    features: ['Cleanings', 'Fillings', 'Root canals', 'Orthodontics coverage']
  },
  {
    id: 'vision',
    name: 'Vision Insurance',
    description: 'Eye care coverage for exams, glasses, and contact lenses',
    icon: Eye,
    category: 'core',
    popular: true,
    estimatedCost: '$8-20/month',
    features: ['Eye exams', 'Frames & lenses', 'Contact lenses', 'LASIK discounts']
  },
  {
    id: 'basic_life',
    name: 'Basic Life Insurance',
    description: 'Essential life insurance coverage for employees',
    icon: Shield,
    category: 'core',
    popular: true,
    estimatedCost: '$15-40/month',
    features: ['Death benefit', 'AD&D coverage', 'Portable coverage', 'No medical exam']
  },
  {
    id: 'supplemental_life',
    name: 'Supplemental Life Insurance',
    description: 'Additional life insurance coverage beyond basic policy',
    icon: Shield,
    category: 'supplemental',
    popular: false,
    estimatedCost: '$20-80/month',
    features: ['Higher coverage amounts', 'Spouse coverage', 'Child coverage', 'Guaranteed issue']
  },
  {
    id: 'voluntary_accident',
    name: 'Voluntary Accident Insurance',
    description: 'Coverage for medical expenses due to covered accidents',
    icon: Activity,
    category: 'voluntary',
    popular: false,
    estimatedCost: '$10-30/month',
    features: ['Emergency room visits', 'Ambulance services', 'Hospital stays', 'Rehabilitation']
  },
  {
    id: 'critical_illness',
    name: 'Critical Illness Insurance',
    description: 'Lump sum payment for covered critical illnesses',
    icon: AlertCircle,
    category: 'voluntary',
    popular: false,
    estimatedCost: '$15-50/month',
    features: ['Cancer coverage', 'Heart attack', 'Stroke', 'Organ transplant']
  },
  {
    id: 'universal_life',
    name: 'Universal Life Insurance',
    description: 'Permanent life insurance with investment component',
    icon: Shield,
    category: 'supplemental',
    popular: false,
    estimatedCost: '$50-200/month',
    features: ['Cash value accumulation', 'Flexible premiums', 'Tax advantages', 'Investment options']
  }
];

const categoryLabels = {
  core: 'Core Benefits',
  supplemental: 'Supplemental Benefits',
  voluntary: 'Voluntary Benefits'
};

const categoryDescriptions = {
  core: 'Essential benefits typically offered by employers',
  supplemental: 'Additional coverage to enhance core benefits',
  voluntary: 'Employee-paid optional coverage'
};

export default function BenefitSelection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const companyId = urlParams.get('companyId');
  
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(['medical']); // Medical pre-selected

  const { data: company } = useQuery({
    queryKey: ['/api/companies', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID required');
      const response = await apiRequest('GET', `/api/companies/${companyId}`);
      return response.json();
    },
    enabled: !!companyId,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (benefitTypes: string[]) => {
      const response = await apiRequest('POST', '/api/quotes', {
        companyId: parseInt(companyId!),
        selectedBenefits: benefitTypes,
        status: 'draft',
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: 'Quote Created',
        description: 'Your benefit selections have been saved. Proceeding to employee management.',
      });
      // Navigate to employee management
      window.location.href = `/quoting/employee-management?quoteId=${data.id}`;
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create quote',
        variant: 'destructive',
      });
    },
  });

  const toggleBenefit = (benefitId: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefitId)
        ? prev.filter(id => id !== benefitId)
        : [...prev, benefitId]
    );
  };

  const handleContinue = () => {
    if (selectedBenefits.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one benefit type to continue.',
        variant: 'destructive',
      });
      return;
    }
    createQuoteMutation.mutate(selectedBenefits);
  };

  const groupedBenefits = benefitTypes.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = [];
    }
    acc[benefit.category].push(benefit);
    return acc;
  }, {} as Record<string, BenefitType[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Benefit Types</h1>
          <p className="text-xl text-gray-600 mb-4">
            Choose the insurance products you'd like to quote for {company?.name || 'your company'}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>Select all benefit types you're interested in quoting</span>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedBenefits).map(([category, benefits]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h2>
                <Badge variant="outline" className="text-sm">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit) => {
                  const isSelected = selectedBenefits.includes(benefit.id);
                  const Icon = benefit.icon;
                  
                  return (
                    <Card
                      key={benefit.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-lg relative',
                        isSelected 
                          ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50' 
                          : 'hover:shadow-md'
                      )}
                      onClick={() => toggleBenefit(benefit.id)}
                    >
                      {benefit.popular && (
                        <Badge className="absolute -top-2 -right-2 bg-green-500">
                          Popular
                        </Badge>
                      )}
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                            )}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{benefit.name}</CardTitle>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {benefit.estimatedCost}
                              </Badge>
                            </div>
                          </div>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleBenefit(benefit.id)}
                            className="mt-1"
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <CardDescription className="mb-4">
                          {benefit.description}
                        </CardDescription>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">Key Features:</h4>
                          <ul className="space-y-1">
                            {benefit.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Selected Benefits</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedBenefits.length} benefit type{selectedBenefits.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {selectedBenefits.map(benefitId => {
                  const benefit = benefitTypes.find(b => b.id === benefitId);
                  return (
                    <Badge key={benefitId} variant="default">
                      {benefit?.name}
                    </Badge>
                  );
                })}
              </div>
              
              <Button
                onClick={handleContinue}
                disabled={selectedBenefits.length === 0 || createQuoteMutation.isPending}
                size="lg"
                className="px-8"
              >
                {createQuoteMutation.isPending ? (
                  'Creating Quote...'
                ) : (
                  <>
                    Continue to Employee Management
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