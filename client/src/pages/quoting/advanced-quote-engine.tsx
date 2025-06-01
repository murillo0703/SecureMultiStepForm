import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  Filter,
  Download,
  Lock,
  ShoppingCart,
  Plus,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmployerLocation {
  id: number;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  ratingArea: string;
  phone?: string;
  taxId?: string;
  industry?: string;
  employeeCount: number;
}

interface QuoteProject {
  id: number;
  projectName: string;
  locationId: number;
  effectiveDate: string;
  status: 'draft' | 'active' | 'locked' | 'purchased';
  tier: 'basic' | 'premium';
  totalEmployees: number;
  totalDependents: number;
  selectedCarrier?: string;
}

interface QuoteEmployee {
  id?: number;
  employeeType: 'employee' | 'spouse' | 'child';
  age: number;
  zipCode: string;
  tier: 'employee' | 'employee_spouse' | 'employee_child' | 'family';
  tobaccoUse: boolean;
}

interface BenefitSelection {
  benefitType: 'medical' | 'dental' | 'vision' | 'life' | 'disability';
  isSelected: boolean;
  metalTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  network?: string;
  deductible?: number;
}

interface ContributionModel {
  id?: number;
  modelName: string;
  benefitType: string;
  employeeContribution: number;
  spouseContribution: number;
  childContribution: number;
  familyContribution: number;
  contributionType: 'percentage' | 'fixed';
}

export default function AdvancedQuoteEngine() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('employer');
  const [currentQuote, setCurrentQuote] = useState<QuoteProject | null>(null);
  const [employees, setEmployees] = useState<QuoteEmployee[]>([]);
  const [benefits, setBenefits] = useState<BenefitSelection[]>([
    { benefitType: 'medical', isSelected: true },
    { benefitType: 'dental', isSelected: false },
    { benefitType: 'vision', isSelected: false },
    { benefitType: 'life', isSelected: false },
    { benefitType: 'disability', isSelected: false },
  ]);
  const [contributions, setContributions] = useState<ContributionModel[]>([]);

  // Fetch employer locations
  const { data: locations } = useQuery<EmployerLocation[]>({
    queryKey: ['/api/employer-locations'],
  });

  // Fetch existing quote projects
  const { data: quoteProjects } = useQuery<QuoteProject[]>({
    queryKey: ['/api/quote-projects'],
  });

  // Create new quote project
  const createQuoteMutation = useMutation({
    mutationFn: async (data: Partial<QuoteProject>) => {
      const res = await apiRequest('POST', '/api/quote-projects', data);
      return await res.json();
    },
    onSuccess: (newQuote) => {
      setCurrentQuote(newQuote);
      toast({
        title: 'Quote Project Created',
        description: 'Your new quote project has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quote-projects'] });
    },
  });

  // Add employee to quote
  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: QuoteEmployee) => {
      const res = await apiRequest('POST', `/api/quote-projects/${currentQuote?.id}/employees`, employee);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Employee Added',
        description: 'Employee information has been added to the quote.',
      });
    },
  });

  const addEmployee = () => {
    const newEmployee: QuoteEmployee = {
      employeeType: 'employee',
      age: 35,
      zipCode: currentQuote ? locations?.find(l => l.id === currentQuote.locationId)?.zipCode || '' : '',
      tier: 'employee',
      tobaccoUse: false,
    };
    setEmployees([...employees, newEmployee]);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const updateEmployee = (index: number, field: keyof QuoteEmployee, value: any) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const addContributionModel = () => {
    const newModel: ContributionModel = {
      modelName: `Model ${contributions.length + 1}`,
      benefitType: 'medical',
      employeeContribution: 100,
      spouseContribution: 50,
      childContribution: 50,
      familyContribution: 50,
      contributionType: 'percentage',
    };
    setContributions([...contributions, newModel]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Quote Engine</h1>
          <p className="text-muted-foreground">
            Comprehensive quoting system with advanced features for brokers
          </p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          Premium Tier
        </Badge>
      </div>

      {/* Quote Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quote Project</span>
          </CardTitle>
          <CardDescription>
            Select an existing quote or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select
              value={currentQuote?.id.toString()}
              onValueChange={(value) => {
                const quote = quoteProjects?.find(q => q.id === parseInt(value));
                setCurrentQuote(quote || null);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select quote project" />
              </SelectTrigger>
              <SelectContent>
                {quoteProjects?.map((quote) => (
                  <SelectItem key={quote.id} value={quote.id.toString()}>
                    {quote.projectName} - {quote.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                // Open dialog to create new quote
                const projectName = prompt('Enter project name:');
                if (projectName && locations?.[0]) {
                  createQuoteMutation.mutate({
                    projectName,
                    locationId: locations[0].id,
                    effectiveDate: new Date().toISOString(),
                    tier: 'premium',
                  });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentQuote && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="employer">Employer</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="carriers">Carriers</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Employer Information Tab */}
          <TabsContent value="employer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Employer Information</span>
                </CardTitle>
                <CardDescription>
                  Company details and effective dates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {locations && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={locations.find(l => l.id === currentQuote.locationId)?.companyName || ''}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={locations.find(l => l.id === currentQuote.locationId)?.address || ''}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City, State ZIP</Label>
                      <Input
                        value={`${locations.find(l => l.id === currentQuote.locationId)?.city}, ${locations.find(l => l.id === currentQuote.locationId)?.state} ${locations.find(l => l.id === currentQuote.locationId)?.zipCode}`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>County</Label>
                      <Input
                        value={locations.find(l => l.id === currentQuote.locationId)?.county || ''}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rating Area</Label>
                      <Badge variant="outline">
                        {locations.find(l => l.id === currentQuote.locationId)?.ratingArea || 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label>Employee Count</Label>
                      <Input
                        type="number"
                        value={currentQuote.totalEmployees}
                        onChange={(e) => {
                          setCurrentQuote({
                            ...currentQuote,
                            totalEmployees: parseInt(e.target.value) || 1,
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={currentQuote.effectiveDate.split('T')[0]}
                      onChange={(e) => {
                        setCurrentQuote({
                          ...currentQuote,
                          effectiveDate: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quote Status</Label>
                    <Badge 
                      variant={currentQuote.status === 'draft' ? 'secondary' : 
                               currentQuote.status === 'locked' ? 'destructive' : 'default'}
                    >
                      {currentQuote.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employee and Dependent Information Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Employee & Dependent Information</span>
                </CardTitle>
                <CardDescription>
                  Add employee and dependent details for accurate pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Total: {employees.length} entries
                  </div>
                  <Button onClick={addEmployee}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {employees.map((employee, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={employee.employeeType}
                            onValueChange={(value) => updateEmployee(index, 'employeeType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Age</Label>
                          <Input
                            type="number"
                            value={employee.age}
                            onChange={(e) => updateEmployee(index, 'age', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Coverage Tier</Label>
                          <Select
                            value={employee.tier}
                            onValueChange={(value) => updateEmployee(index, 'tier', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee Only</SelectItem>
                              <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                              <SelectItem value="employee_child">Employee + Child</SelectItem>
                              <SelectItem value="family">Family</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`tobacco-${index}`}
                            checked={employee.tobaccoUse}
                            onCheckedChange={(checked) => updateEmployee(index, 'tobaccoUse', checked)}
                          />
                          <Label htmlFor={`tobacco-${index}`}>Tobacco Use</Label>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeEmployee(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benefit Type Selection Tab */}
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle>Benefit Type Selection</CardTitle>
                <CardDescription>
                  Choose which benefit types to include in the quote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={benefit.benefitType} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={benefit.isSelected}
                        onCheckedChange={(checked) => {
                          const updated = [...benefits];
                          updated[index].isSelected = checked as boolean;
                          setBenefits(updated);
                        }}
                      />
                      <div>
                        <div className="font-medium capitalize">{benefit.benefitType}</div>
                        <div className="text-sm text-muted-foreground">
                          {benefit.benefitType === 'medical' && 'Health insurance coverage'}
                          {benefit.benefitType === 'dental' && 'Dental care coverage'}
                          {benefit.benefitType === 'vision' && 'Vision care coverage'}
                          {benefit.benefitType === 'life' && 'Life insurance coverage'}
                          {benefit.benefitType === 'disability' && 'Disability insurance coverage'}
                        </div>
                      </div>
                    </div>
                    
                    {benefit.isSelected && benefit.benefitType === 'medical' && (
                      <div className="flex items-center space-x-4">
                        <Select
                          value={benefit.metalTier}
                          onValueChange={(value) => {
                            const updated = [...benefits];
                            updated[index].metalTier = value as any;
                            setBenefits(updated);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Metal Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Carrier Selection Tab */}
          <TabsContent value="carriers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Carrier Selection & Plan Filtering</span>
                </CardTitle>
                <CardDescription>
                  Filter and select plans from available carriers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Carrier selection and plan filtering will be populated based on the selected benefits and rating area.
                  <br />
                  <Button className="mt-4">Load Available Plans</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contribution Setup Tab */}
          <TabsContent value="contributions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Contribution Models</span>
                </CardTitle>
                <CardDescription>
                  Set up different contribution models for benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {contributions.length} contribution models
                  </div>
                  <Button onClick={addContributionModel}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>
                </div>

                {contributions.map((model, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Model Name</Label>
                          <Input
                            value={model.modelName}
                            onChange={(e) => {
                              const updated = [...contributions];
                              updated[index].modelName = e.target.value;
                              setContributions(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Benefit Type</Label>
                          <Select
                            value={model.benefitType}
                            onValueChange={(value) => {
                              const updated = [...contributions];
                              updated[index].benefitType = value;
                              setContributions(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medical">Medical</SelectItem>
                              <SelectItem value="dental">Dental</SelectItem>
                              <SelectItem value="vision">Vision</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Contribution Type</Label>
                          <Select
                            value={model.contributionType}
                            onValueChange={(value) => {
                              const updated = [...contributions];
                              updated[index].contributionType = value as 'percentage' | 'fixed';
                              setContributions(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Employee {model.contributionType === 'percentage' ? '%' : '$'}</Label>
                          <Input
                            type="number"
                            value={model.employeeContribution}
                            onChange={(e) => {
                              const updated = [...contributions];
                              updated[index].employeeContribution = parseInt(e.target.value) || 0;
                              setContributions(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spouse {model.contributionType === 'percentage' ? '%' : '$'}</Label>
                          <Input
                            type="number"
                            value={model.spouseContribution}
                            onChange={(e) => {
                              const updated = [...contributions];
                              updated[index].spouseContribution = parseInt(e.target.value) || 0;
                              setContributions(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Child {model.contributionType === 'percentage' ? '%' : '$'}</Label>
                          <Input
                            type="number"
                            value={model.childContribution}
                            onChange={(e) => {
                              const updated = [...contributions];
                              updated[index].childContribution = parseInt(e.target.value) || 0;
                              setContributions(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Family {model.contributionType === 'percentage' ? '%' : '$'}</Label>
                          <Input
                            type="number"
                            value={model.familyContribution}
                            onChange={(e) => {
                              const updated = [...contributions];
                              updated[index].familyContribution = parseInt(e.target.value) || 0;
                              setContributions(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Review and Sorting Tab */}
          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Plan Review & Comparison</CardTitle>
                <CardDescription>
                  Review and compare selected plans with cost breakdowns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Plan comparison and cost analysis will appear here once plans are selected.
                  <br />
                  <Button className="mt-4">
                    <Eye className="h-4 w-4 mr-2" />
                    Generate Comparison
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents and Proposals Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents & Proposals</span>
                </CardTitle>
                <CardDescription>
                  Generate proposals, summaries, and carrier applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Proposal Document</h4>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive proposal for the employer
                      </p>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Proposal
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Cost Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        Detailed cost breakdown and analysis
                      </p>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Summary
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Carrier Application</h4>
                      <p className="text-sm text-muted-foreground">
                        Pre-filled carrier application forms
                      </p>
                      <Button size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Application
                      </Button>
                    </div>
                  </Card>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-green-800">Ready to Purchase?</h4>
                    <p className="text-sm text-green-600">
                      Lock in rates and proceed with carrier submission
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Rates
                    </Button>
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}