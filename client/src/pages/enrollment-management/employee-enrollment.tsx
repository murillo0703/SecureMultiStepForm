import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  UserPlus, 
  Download,
  Upload,
  Check,
  X,
  Eye,
  Edit,
  Heart,
  Eye as EyeIcon,
  Dental,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmployeeEnrollment {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  hireDate: string;
  department: string;
  salary: number;
  status: 'eligible' | 'enrolled' | 'waived' | 'terminated';
  medicalPlan?: string;
  dentalPlan?: string;
  visionPlan?: string;
  dependents: EnrolledDependent[];
  enrollmentDate?: string;
  effectiveDate?: string;
}

interface EnrolledDependent {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: string;
  medicalCoverage: boolean;
  dentalCoverage: boolean;
  visionCoverage: boolean;
}

interface PlanOption {
  id: string;
  name: string;
  type: 'medical' | 'dental' | 'vision';
  carrier: string;
  monthlyCost: number;
  employeeCost: number;
  employerContribution: number;
}

export default function EmployeeEnrollment() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEnrollment | null>(null);
  const [enrollmentMode, setEnrollmentMode] = useState<'view' | 'edit' | 'enroll'>('view');

  // Fetch employee enrollment data
  const { data: enrollments = [], isLoading } = useQuery<EmployeeEnrollment[]>({
    queryKey: ['/api/employee-enrollments'],
  });

  // Fetch available plans
  const { data: availablePlans = [], isLoading: plansLoading } = useQuery<PlanOption[]>({
    queryKey: ['/api/available-plans'],
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: Partial<EmployeeEnrollment>) => {
      const response = await apiRequest('PUT', `/api/employee-enrollments/${enrollmentData.id}`, enrollmentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Enrollment Updated',
        description: 'Employee enrollment has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee-enrollments'] });
      setEnrollmentMode('view');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update enrollment.',
        variant: 'destructive',
      });
    },
  });

  const uploadCensusMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/employee-census/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Census Uploaded',
        description: `Successfully imported ${data.imported} employee records.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee-enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload census file.',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('census', file);
      uploadCensusMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Enrolled</Badge>;
      case 'eligible':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Eligible</Badge>;
      case 'waived':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Waived</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Terminated</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return <Heart className="w-4 h-4" />;
      case 'dental':
        return <Dental className="w-4 h-4" />;
      case 'vision':
        return <EyeIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const enrolledCount = enrollments.filter(e => e.status === 'enrolled').length;
  const eligibleCount = enrollments.filter(e => e.status === 'eligible').length;
  const waivedCount = enrollments.filter(e => e.status === 'waived').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Enrollment Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage employee benefit enrollments and plan selections
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => document.getElementById('census-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Census
              </Button>
              <input
                id="census-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={() => window.open('/api/employee-enrollments/export', '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Enrolled</p>
                  <p className="text-2xl font-bold text-green-600">{enrolledCount}</p>
                  <p className="text-xs text-gray-500">
                    {enrollments.length > 0 ? Math.round((enrolledCount / enrollments.length) * 100) : 0}% participation
                  </p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Eligible</p>
                  <p className="text-2xl font-bold text-blue-600">{eligibleCount}</p>
                  <p className="text-xs text-gray-500">Not yet enrolled</p>
                </div>
                <UserPlus className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Waived</p>
                  <p className="text-2xl font-bold text-yellow-600">{waivedCount}</p>
                  <p className="text-xs text-gray-500">Declined coverage</p>
                </div>
                <X className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Employee Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plans</TableHead>
                      <TableHead>Dependents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {enrollment.firstName} {enrollment.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{enrollment.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.department}</TableCell>
                        <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {enrollment.medicalPlan && (
                              <Badge variant="outline" className="text-xs">
                                <Heart className="w-3 h-3 mr-1" />
                                Medical
                              </Badge>
                            )}
                            {enrollment.dentalPlan && (
                              <Badge variant="outline" className="text-xs">
                                <Dental className="w-3 h-3 mr-1" />
                                Dental
                              </Badge>
                            )}
                            {enrollment.visionPlan && (
                              <Badge variant="outline" className="text-xs">
                                <EyeIcon className="w-3 h-3 mr-1" />
                                Vision
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.dependents.length}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEmployee(enrollment);
                                setEnrollmentMode('view');
                              }}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEmployee(enrollment);
                                setEnrollmentMode('edit');
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Employee Details */}
          <div>
            {selectedEmployee ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Employee Details</span>
                    {enrollmentMode === 'edit' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          updateEnrollmentMutation.mutate(selectedEmployee);
                        }}
                      >
                        Save Changes
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="enrollment" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
                      <TabsTrigger value="dependents">Dependents</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="enrollment" className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Employee Information</Label>
                        <div className="text-sm">
                          <p><strong>Name:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                          <p><strong>Email:</strong> {selectedEmployee.email}</p>
                          <p><strong>Department:</strong> {selectedEmployee.department}</p>
                          <p><strong>Hire Date:</strong> {new Date(selectedEmployee.hireDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Plan Selections</Label>
                        
                        {/* Medical Plan */}
                        <div>
                          <Label htmlFor="medicalPlan">Medical Plan</Label>
                          {enrollmentMode === 'edit' ? (
                            <Select
                              value={selectedEmployee.medicalPlan || ''}
                              onValueChange={(value) => 
                                setSelectedEmployee({...selectedEmployee, medicalPlan: value})
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select medical plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No Coverage</SelectItem>
                                {availablePlans
                                  .filter(plan => plan.type === 'medical')
                                  .map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - ${plan.employeeCost}/month
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{selectedEmployee.medicalPlan || 'No coverage'}</p>
                          )}
                        </div>

                        {/* Dental Plan */}
                        <div>
                          <Label htmlFor="dentalPlan">Dental Plan</Label>
                          {enrollmentMode === 'edit' ? (
                            <Select
                              value={selectedEmployee.dentalPlan || ''}
                              onValueChange={(value) => 
                                setSelectedEmployee({...selectedEmployee, dentalPlan: value})
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select dental plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No Coverage</SelectItem>
                                {availablePlans
                                  .filter(plan => plan.type === 'dental')
                                  .map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - ${plan.employeeCost}/month
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{selectedEmployee.dentalPlan || 'No coverage'}</p>
                          )}
                        </div>

                        {/* Vision Plan */}
                        <div>
                          <Label htmlFor="visionPlan">Vision Plan</Label>
                          {enrollmentMode === 'edit' ? (
                            <Select
                              value={selectedEmployee.visionPlan || ''}
                              onValueChange={(value) => 
                                setSelectedEmployee({...selectedEmployee, visionPlan: value})
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select vision plan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No Coverage</SelectItem>
                                {availablePlans
                                  .filter(plan => plan.type === 'vision')
                                  .map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} - ${plan.employeeCost}/month
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{selectedEmployee.visionPlan || 'No coverage'}</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="dependents" className="space-y-4">
                      <div className="space-y-4">
                        {selectedEmployee.dependents.length === 0 ? (
                          <p className="text-sm text-gray-500">No dependents enrolled</p>
                        ) : (
                          selectedEmployee.dependents.map((dependent) => (
                            <div key={dependent.id} className="border rounded p-3">
                              <div className="font-medium">
                                {dependent.firstName} {dependent.lastName}
                              </div>
                              <div className="text-sm text-gray-500 mb-2">
                                {dependent.relationship} • DOB: {new Date(dependent.dateOfBirth).toLocaleDateString()}
                              </div>
                              <div className="flex space-x-4 text-xs">
                                <div className="flex items-center">
                                  <Checkbox checked={dependent.medicalCoverage} disabled />
                                  <label className="ml-1">Medical</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox checked={dependent.dentalCoverage} disabled />
                                  <label className="ml-1">Dental</label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox checked={dependent.visionCoverage} disabled />
                                  <label className="ml-1">Vision</label>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select an employee to view enrollment details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}