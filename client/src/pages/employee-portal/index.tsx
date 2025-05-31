import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Eye,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmployeeBenefits {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  hireDate: string;
  eligibilityDate: string;
  enrollmentStatus: 'pending' | 'enrolled' | 'waived' | 'incomplete';
  selectedPlans: {
    medical?: SelectedPlan;
    dental?: SelectedPlan;
    vision?: SelectedPlan;
  };
  dependents: EmployeeDependent[];
  enrollmentDeadline: string;
}

interface SelectedPlan {
  planId: string;
  planName: string;
  carrier: string;
  monthlyCost: number;
  employeeCost: number;
  coverageLevel: 'employee' | 'employee+spouse' | 'employee+children' | 'family';
}

interface EmployeeDependent {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: 'spouse' | 'child' | 'domestic_partner';
  coverage: {
    medical: boolean;
    dental: boolean;
    vision: boolean;
  };
}

interface AvailablePlan {
  id: string;
  name: string;
  type: 'medical' | 'dental' | 'vision';
  carrier: string;
  metalTier?: string;
  network: string;
  deductible?: number;
  outOfPocketMax?: number;
  rates: {
    employee: number;
    employeeSpouse: number;
    employeeChildren: number;
    family: number;
  };
  benefits: string[];
}

export default function EmployeePortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedCoverageLevel, setSelectedCoverageLevel] = useState<string>('employee');
  const [enrollmentStep, setEnrollmentStep] = useState<'plans' | 'dependents' | 'review'>('plans');

  // Fetch employee benefits data
  const { data: employeeBenefits, isLoading } = useQuery<EmployeeBenefits>({
    queryKey: ['/api/employee/benefits'],
  });

  // Fetch available plans
  const { data: availablePlans = [] } = useQuery<AvailablePlan[]>({
    queryKey: ['/api/employee/available-plans'],
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: any) => {
      const response = await apiRequest('POST', '/api/employee/enroll', enrollmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Enrollment Submitted',
        description: 'Your benefit selections have been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/benefits'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to submit enrollment.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'waived':
        return <Badge className="bg-gray-100 text-gray-800">Waived</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800">Incomplete</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'dental':
        return <Heart className="w-5 h-5 text-blue-500" />;
      case 'vision':
        return <Eye className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const calculateDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your benefits information...</p>
        </div>
      </div>
    );
  }

  if (!employeeBenefits) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Benefits Available</h3>
            <p className="text-gray-600">
              You don't have any benefit enrollment opportunities at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilDeadline = calculateDaysUntilDeadline(employeeBenefits.enrollmentDeadline);
  const isDeadlineApproaching = daysUntilDeadline <= 7;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {employeeBenefits.firstName}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Select your benefits for the upcoming plan year
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  {getStatusBadge(employeeBenefits.enrollmentStatus)}
                </div>
                <div className={`text-sm ${isDeadlineApproaching ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  Deadline: {new Date(employeeBenefits.enrollmentDeadline).toLocaleDateString()}
                  <br />
                  <span className={isDeadlineApproaching ? 'text-red-600' : 'text-gray-500'}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : 'Deadline passed'}
                  </span>
                </div>
              </div>
            </div>

            {isDeadlineApproaching && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">
                    Enrollment deadline is approaching! Please complete your selections soon.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Employee Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-sm">{employeeBenefits.firstName} {employeeBenefits.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{employeeBenefits.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Department</Label>
                  <p className="text-sm">{employeeBenefits.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Hire Date</Label>
                  <p className="text-sm">{new Date(employeeBenefits.hireDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Benefits Eligible</Label>
                  <p className="text-sm">{new Date(employeeBenefits.eligibilityDate).toLocaleDateString()}</p>
                </div>

                {employeeBenefits.dependents.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2 block">Dependents</Label>
                    <div className="space-y-2">
                      {employeeBenefits.dependents.map((dependent) => (
                        <div key={dependent.id} className="text-sm border rounded p-2">
                          <p className="font-medium">{dependent.firstName} {dependent.lastName}</p>
                          <p className="text-gray-500 capitalize">{dependent.relationship}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={enrollmentStep} onValueChange={(value: any) => setEnrollmentStep(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plans">Select Plans</TabsTrigger>
                <TabsTrigger value="dependents">Dependents</TabsTrigger>
                <TabsTrigger value="review">Review & Submit</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="space-y-6">
                {/* Coverage Level Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Coverage Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { value: 'employee', label: 'Employee Only', icon: <Heart className="w-5 h-5" /> },
                        { value: 'employee+spouse', label: 'Employee + Spouse', icon: <Users className="w-5 h-5" /> },
                        { value: 'employee+children', label: 'Employee + Children', icon: <Users className="w-5 h-5" /> },
                        { value: 'family', label: 'Family Coverage', icon: <Users className="w-5 h-5" /> }
                      ].map((level) => (
                        <div
                          key={level.value}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedCoverageLevel === level.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCoverageLevel(level.value)}
                        >
                          <div className="flex items-center space-x-2">
                            {level.icon}
                            <span className="font-medium">{level.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Available Plans */}
                {['medical', 'dental', 'vision'].map((planType) => {
                  const typePlans = availablePlans.filter(plan => plan.type === planType);
                  
                  return (
                    <Card key={planType}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          {getPlanIcon(planType)}
                          <span className="capitalize">{planType} Plans</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {typePlans.map((plan) => (
                            <div key={plan.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium">{plan.name}</h4>
                                  <p className="text-sm text-gray-500">{plan.carrier}</p>
                                  {plan.metalTier && (
                                    <Badge variant="outline" className="mt-1">
                                      {plan.metalTier}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    ${plan.rates[selectedCoverageLevel as keyof typeof plan.rates]}/month
                                  </p>
                                  <p className="text-xs text-gray-500">Your cost</p>
                                </div>
                              </div>

                              {plan.deductible && (
                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-gray-500">Deductible:</span>
                                    <span className="ml-1">${plan.deductible.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Out-of-Pocket Max:</span>
                                    <span className="ml-1">${plan.outOfPocketMax?.toLocaleString()}</span>
                                  </div>
                                </div>
                              )}

                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">Key Benefits:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {plan.benefits.slice(0, 3).map((benefit, index) => (
                                    <li key={index}>• {benefit}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="flex justify-between items-center">
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                                <Button size="sm">
                                  Select Plan
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="border border-dashed rounded-lg p-4 text-center">
                            <p className="text-gray-500 mb-2">Don't need {planType} coverage?</p>
                            <Button variant="ghost" size="sm">
                              Waive {planType.charAt(0).toUpperCase() + planType.slice(1)} Coverage
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="dependents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dependent Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employeeBenefits.dependents.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No dependents on file</p>
                        <Button variant="outline" className="mt-4">
                          Add Dependent
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {employeeBenefits.dependents.map((dependent) => (
                          <div key={dependent.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">
                                  {dependent.firstName} {dependent.lastName}
                                </h4>
                                <p className="text-sm text-gray-500 capitalize">
                                  {dependent.relationship} • Born {new Date(dependent.dateOfBirth).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-medium">Coverage Options:</Label>
                              <div className="flex space-x-6">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`medical-${dependent.id}`}
                                    checked={dependent.coverage.medical}
                                  />
                                  <Label htmlFor={`medical-${dependent.id}`} className="text-sm">
                                    Medical
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`dental-${dependent.id}`}
                                    checked={dependent.coverage.dental}
                                  />
                                  <Label htmlFor={`dental-${dependent.id}`} className="text-sm">
                                    Dental
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`vision-${dependent.id}`}
                                    checked={dependent.coverage.vision}
                                  />
                                  <Label htmlFor={`vision-${dependent.id}`} className="text-sm">
                                    Vision
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Selections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Plan Summary */}
                      <div>
                        <h4 className="font-medium mb-3">Selected Plans</h4>
                        <div className="space-y-3">
                          {Object.entries(employeeBenefits.selectedPlans).map(([type, plan]) => 
                            plan ? (
                              <div key={type} className="flex justify-between items-center p-3 border rounded">
                                <div className="flex items-center space-x-3">
                                  {getPlanIcon(type)}
                                  <div>
                                    <p className="font-medium">{plan.planName}</p>
                                    <p className="text-sm text-gray-500">{plan.carrier}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${plan.employeeCost}/month</p>
                                  <p className="text-xs text-gray-500">{plan.coverageLevel}</p>
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>

                      {/* Total Cost */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium">Total Monthly Cost:</span>
                          <span className="text-xl font-bold">
                            ${Object.values(employeeBenefits.selectedPlans)
                              .filter(plan => plan)
                              .reduce((total, plan) => total + plan!.employeeCost, 0)}/month
                          </span>
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex space-x-4">
                        <Button 
                          onClick={() => enrollmentMutation.mutate(employeeBenefits)}
                          disabled={enrollmentMutation.isPending}
                          className="flex-1"
                        >
                          {enrollmentMutation.isPending ? 'Submitting...' : 'Submit Enrollment'}
                        </Button>
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download Summary
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}