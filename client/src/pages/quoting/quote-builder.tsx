import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  Users, 
  MapPin, 
  Calendar,
  DollarSign,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  zipCode: string;
  dependents: Dependent[];
}

interface Dependent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
}

interface QuoteRequest {
  employeeCount: number;
  zipCode: string;
  effectiveDate: string;
  employees: Employee[];
  planTypes: string[];
}

interface QuoteResult {
  id: string;
  carrierName: string;
  planName: string;
  planType: string;
  monthlyPremium: number;
  deductible: number;
  outOfPocketMax: number;
  network: string;
  metalTier: string;
}

export default function QuoteBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest>({
    employeeCount: 1,
    zipCode: '',
    effectiveDate: '',
    employees: [],
    planTypes: ['medical']
  });

  const [quoteResults, setQuoteResults] = useState<QuoteResult[]>([]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  // Fetch available carriers and plans
  const { data: carriers = [] } = useQuery({
    queryKey: ['/api/carriers'],
  });

  const { data: ratingAreas = [] } = useQuery({
    queryKey: ['/api/rating-areas'],
  });

  const generateQuoteMutation = useMutation({
    mutationFn: async (request: QuoteRequest) => {
      const response = await apiRequest('POST', '/api/quotes/generate', request);
      return response.json();
    },
    onSuccess: (data) => {
      setQuoteResults(data.quotes);
      toast({
        title: 'Quote Generated',
        description: `Found ${data.quotes.length} plan options for your group.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Quote Generation Failed',
        description: error.message || 'Unable to generate quote at this time.',
        variant: 'destructive',
      });
    },
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const response = await apiRequest('POST', '/api/quotes/save', quoteData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Quote Saved',
        description: 'Quote has been saved to your account for future reference.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
    },
  });

  const addEmployee = () => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      zipCode: quoteRequest.zipCode,
      dependents: []
    };
    
    setQuoteRequest(prev => ({
      ...prev,
      employees: [...prev.employees, newEmployee]
    }));
  };

  const removeEmployee = (employeeId: string) => {
    setQuoteRequest(prev => ({
      ...prev,
      employees: prev.employees.filter(emp => emp.id !== employeeId)
    }));
  };

  const updateEmployee = (employeeId: string, field: keyof Employee, value: any) => {
    setQuoteRequest(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === employeeId ? { ...emp, [field]: value } : emp
      )
    }));
  };

  const addDependent = (employeeId: string) => {
    const newDependent: Dependent = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      relationship: 'spouse'
    };

    setQuoteRequest(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === employeeId ? {
          ...emp,
          dependents: [...emp.dependents, newDependent]
        } : emp
      )
    }));
  };

  const removeDependent = (employeeId: string, dependentId: string) => {
    setQuoteRequest(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === employeeId ? {
          ...emp,
          dependents: emp.dependents.filter(dep => dep.id !== dependentId)
        } : emp
      )
    }));
  };

  const updateDependent = (employeeId: string, dependentId: string, field: keyof Dependent, value: string) => {
    setQuoteRequest(prev => ({
      ...prev,
      employees: prev.employees.map(emp => 
        emp.id === employeeId ? {
          ...emp,
          dependents: emp.dependents.map(dep =>
            dep.id === dependentId ? { ...dep, [field]: value } : dep
          )
        } : emp
      )
    }));
  };

  const generateQuote = () => {
    if (!quoteRequest.zipCode || !quoteRequest.effectiveDate) {
      toast({
        title: 'Missing Information',
        description: 'Please provide zip code and effective date.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingQuote(true);
    generateQuoteMutation.mutate(quoteRequest);
    setTimeout(() => setIsGeneratingQuote(false), 2000);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quote Builder</h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate accurate health insurance quotes for your group
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setQuoteResults([])}>
                Clear Results
              </Button>
              <Button onClick={generateQuote} disabled={isGeneratingQuote}>
                <Calculator className="w-4 h-4 mr-2" />
                {isGeneratingQuote ? 'Generating...' : 'Generate Quote'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Parameters */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Group Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="zipCode">Primary Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={quoteRequest.zipCode}
                      onChange={(e) => setQuoteRequest(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="93710"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={quoteRequest.effectiveDate}
                      onChange={(e) => setQuoteRequest(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      value={quoteRequest.employeeCount}
                      onChange={(e) => setQuoteRequest(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Plan Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['medical', 'dental', 'vision'].map((type) => (
                      <Badge
                        key={type}
                        variant={quoteRequest.planTypes.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setQuoteRequest(prev => ({
                            ...prev,
                            planTypes: prev.planTypes.includes(type)
                              ? prev.planTypes.filter(t => t !== type)
                              : [...prev.planTypes, type]
                          }));
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Census */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Employee Census
                  </span>
                  <Button size="sm" onClick={addEmployee}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Employee
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quoteRequest.employees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No employees added yet. Click "Add Employee" to start building your census.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quoteRequest.employees.map((employee, index) => (
                      <div key={employee.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Employee {index + 1}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeEmployee(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label>First Name</Label>
                            <Input
                              value={employee.firstName}
                              onChange={(e) => updateEmployee(employee.id, 'firstName', e.target.value)}
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={employee.lastName}
                              onChange={(e) => updateEmployee(employee.id, 'lastName', e.target.value)}
                              placeholder="Doe"
                            />
                          </div>
                          <div>
                            <Label>Date of Birth</Label>
                            <Input
                              type="date"
                              value={employee.dateOfBirth}
                              onChange={(e) => updateEmployee(employee.id, 'dateOfBirth', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Age</Label>
                            <Input
                              value={employee.dateOfBirth ? calculateAge(employee.dateOfBirth) : ''}
                              disabled
                              placeholder="Calculated"
                            />
                          </div>
                        </div>

                        {/* Dependents */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-sm font-medium">Dependents</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addDependent(employee.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Dependent
                            </Button>
                          </div>

                          {employee.dependents.map((dependent) => (
                            <div key={dependent.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
                              <Input
                                value={dependent.firstName}
                                onChange={(e) => updateDependent(employee.id, dependent.id, 'firstName', e.target.value)}
                                placeholder="First Name"
                              />
                              <Input
                                value={dependent.lastName}
                                onChange={(e) => updateDependent(employee.id, dependent.id, 'lastName', e.target.value)}
                                placeholder="Last Name"
                              />
                              <Input
                                type="date"
                                value={dependent.dateOfBirth}
                                onChange={(e) => updateDependent(employee.id, dependent.id, 'dateOfBirth', e.target.value)}
                              />
                              <Select
                                value={dependent.relationship}
                                onValueChange={(value) => updateDependent(employee.id, dependent.id, 'relationship', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDependent(employee.id, dependent.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quote Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Quote Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quoteResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Generate a quote to see available plans and pricing.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quoteResults.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{quote.planName}</h4>
                            <p className="text-sm text-gray-500">{quote.carrierName}</p>
                          </div>
                          <Badge variant="outline">{quote.metalTier}</Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Monthly Premium:</span>
                            <span className="font-medium">${quote.monthlyPremium}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Deductible:</span>
                            <span>${quote.deductible.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Out-of-Pocket Max:</span>
                            <span>${quote.outOfPocketMax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Network:</span>
                            <span>{quote.network}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => saveQuoteMutation.mutate({ ...quote, quoteRequest })}
                          >
                            Save Quote
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}