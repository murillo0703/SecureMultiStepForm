import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TwoPanelLayout } from '@/components/layouts/two-panel-layout';
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Building,
  DollarSign,
  Shield,
  Eye,
  UserPlus,
  Clock,
  MapPin,
  Heart,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Employee {
  id: number;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  dob: string;
  ssn: string;
  gender?: string;
  maritalStatus?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  currentCompanyId?: number;
  currentJobTitle?: string;
  currentDepartment?: string;
  currentSalary?: number;
  currentHireDate?: string;
  currentEmploymentStatus: string;
  currentTerminationDate?: string;
  currentTerminationReason?: string;
  isEligibleForBenefits: boolean;
  benefitsEligibilityDate?: string;
  hoursPerWeek: number;
  employeeClass?: string;
  payrollFrequency?: string;
  medicalEnrollmentStatus: string;
  dentalEnrollmentStatus: string;
  visionEnrollmentStatus: string;
  lifeEnrollmentStatus: string;
  disabilityEnrollmentStatus: string;
  totalMonthlyCost: number;
  employeeMonthlyCost: number;
  employerMonthlyCost: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeDependent {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  relationship: string;
  dob?: string;
  ssn?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  isEligibleForCoverage: boolean;
  coverageStartDate?: string;
  coverageEndDate?: string;
  medicalEnrollmentStatus: string;
  dentalEnrollmentStatus: string;
  visionEnrollmentStatus: string;
  lifeEnrollmentStatus: string;
  totalMonthlyCost: number;
  isActive: boolean;
}

export default function EmployeeManagement() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isDependentDialogOpen, setIsDependentDialogOpen] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    currentJobTitle: '',
    currentDepartment: '',
    currentSalary: 0,
    currentHireDate: new Date().toISOString().split('T')[0],
    hoursPerWeek: 40,
    employeeClass: 'full_time',
    payrollFrequency: 'bi-weekly',
  });

  // Fetch employees for current user's companies
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Fetch dependents for selected employee
  const { data: dependents = [] } = useQuery<EmployeeDependent[]>({
    queryKey: ['/api/employees', selectedEmployee?.id, 'dependents'],
    enabled: !!selectedEmployee,
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof employeeFormData) => {
      const res = await apiRequest('POST', '/api/employees', data);
      return await res.json();
    },
    onSuccess: (newEmployee) => {
      toast({
        title: 'Employee Added',
        description: 'Employee has been added successfully.',
      });
      setIsEmployeeDialogOpen(false);
      setSelectedEmployee(newEmployee);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      resetEmployeeForm();
    },
  });

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dob: '',
      ssn: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      currentJobTitle: '',
      currentDepartment: '',
      currentSalary: 0,
      currentHireDate: new Date().toISOString().split('T')[0],
      hoursPerWeek: 40,
      employeeClass: 'full_time',
      payrollFrequency: 'bi-weekly',
    });
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate(employeeFormData);
  };

  // Table of Contents for left panel
  const tableOfContents = [
    {
      title: 'Employees',
      items: employees.map(employee => ({
        id: employee.id.toString(),
        title: `${employee.firstName} ${employee.lastName}`,
        icon: <Users className="h-4 w-4" />,
        badge: employee.currentEmploymentStatus === 'active' ? 'Active' : 'Inactive',
        isActive: selectedEmployee?.id === employee.id,
        onClick: () => setSelectedEmployee(employee),
      }))
    }
  ];

  // Employee detail sections
  const employeeSections = selectedEmployee ? [
    {
      title: 'Employee Profile',
      items: [
        {
          id: 'overview',
          title: 'Overview',
          icon: <Users className="h-4 w-4" />,
          isActive: activeSection === 'overview',
          onClick: () => setActiveSection('overview'),
        },
        {
          id: 'contact',
          title: 'Contact Information',
          icon: <Phone className="h-4 w-4" />,
          isActive: activeSection === 'contact',
          onClick: () => setActiveSection('contact'),
        },
        {
          id: 'employment',
          title: 'Employment Details',
          icon: <Building className="h-4 w-4" />,
          isActive: activeSection === 'employment',
          onClick: () => setActiveSection('employment'),
        },
        {
          id: 'emergency',
          title: 'Emergency Contact',
          icon: <Phone className="h-4 w-4" />,
          isActive: activeSection === 'emergency',
          onClick: () => setActiveSection('emergency'),
        }
      ]
    },
    {
      title: 'Benefits & Coverage',
      items: [
        {
          id: 'benefits',
          title: 'Benefit Enrollments',
          icon: <Shield className="h-4 w-4" />,
          badge: getBenefitsBadge(selectedEmployee),
          isActive: activeSection === 'benefits',
          onClick: () => setActiveSection('benefits'),
        },
        {
          id: 'costs',
          title: 'Cost Breakdown',
          icon: <DollarSign className="h-4 w-4" />,
          badge: `$${(selectedEmployee.totalMonthlyCost / 100).toFixed(0)}/mo`,
          isActive: activeSection === 'costs',
          onClick: () => setActiveSection('costs'),
        },
        {
          id: 'dependents',
          title: 'Dependents',
          icon: <Heart className="h-4 w-4" />,
          badge: `${dependents.length}`,
          isActive: activeSection === 'dependents',
          onClick: () => setActiveSection('dependents'),
        }
      ]
    },
    {
      title: 'History & Documents',
      items: [
        {
          id: 'history',
          title: 'Employment History',
          icon: <Clock className="h-4 w-4" />,
          isActive: activeSection === 'history',
          onClick: () => setActiveSection('history'),
        },
        {
          id: 'documents',
          title: 'Documents',
          icon: <FileText className="h-4 w-4" />,
          isActive: activeSection === 'documents',
          onClick: () => setActiveSection('documents'),
        }
      ]
    }
  ] : [];

  const allTableOfContents = [...tableOfContents, ...employeeSections];

  function getBenefitsBadge(employee: Employee): string {
    const enrolledCount = [
      employee.medicalEnrollmentStatus,
      employee.dentalEnrollmentStatus,
      employee.visionEnrollmentStatus,
      employee.lifeEnrollmentStatus,
      employee.disabilityEnrollmentStatus
    ].filter(status => status === 'enrolled').length;
    
    return `${enrolledCount}/5`;
  }

  // Top panel actions for employee management
  const topPanel = selectedEmployee && (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-lg font-semibold">
            {selectedEmployee.firstName} {selectedEmployee.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedEmployee.currentJobTitle || 'No title'} • 
            {selectedEmployee.currentDepartment || 'No department'} • 
            Employee #{selectedEmployee.employeeNumber || selectedEmployee.id}
          </p>
        </div>
        <Badge variant={selectedEmployee.currentEmploymentStatus === 'active' ? 'default' : 'secondary'}>
          {selectedEmployee.currentEmploymentStatus === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Employee
        </Button>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Benefits
        </Button>
        <Button size="sm" onClick={() => setIsDependentDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Dependent
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedEmployee) {
      return (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">Select an Employee</h3>
          <p className="text-muted-foreground mb-6">
            Choose an employee from the left panel to view their detailed information and manage their benefits.
          </p>
          <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetEmployeeForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Add a new employee to your company with their personal and employment information.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={employeeFormData.firstName}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={employeeFormData.lastName}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, lastName: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeFormData.email}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={employeeFormData.phone}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={employeeFormData.dob}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, dob: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ssn">SSN *</Label>
                    <Input
                      id="ssn"
                      value={employeeFormData.ssn}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, ssn: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={employeeFormData.address}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, address: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={employeeFormData.city}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, city: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={employeeFormData.state}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, state: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      value={employeeFormData.zip}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, zip: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentJobTitle">Job Title</Label>
                    <Input
                      id="currentJobTitle"
                      value={employeeFormData.currentJobTitle}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, currentJobTitle: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentDepartment">Department</Label>
                    <Input
                      id="currentDepartment"
                      value={employeeFormData.currentDepartment}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, currentDepartment: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentHireDate">Hire Date</Label>
                    <Input
                      id="currentHireDate"
                      type="date"
                      value={employeeFormData.currentHireDate}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, currentHireDate: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEmployeeMutation.isPending}>
                    Add Employee
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p>{selectedEmployee.firstName} {selectedEmployee.middleName} {selectedEmployee.lastName}</p>
                  </div>
                  {selectedEmployee.preferredName && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Preferred Name</Label>
                      <p>{selectedEmployee.preferredName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                    <p>{selectedEmployee.dob}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                    <p>{selectedEmployee.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Marital Status</Label>
                    <p>{selectedEmployee.maritalStatus || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                    <p>{selectedEmployee.currentJobTitle || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p>{selectedEmployee.currentDepartment || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                    <p>{selectedEmployee.currentHireDate ? new Date(selectedEmployee.currentHireDate).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employment Status</Label>
                    <Badge variant={selectedEmployee.currentEmploymentStatus === 'active' ? 'default' : 'secondary'}>
                      {selectedEmployee.currentEmploymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Benefits Eligible</Label>
                    <Badge variant={selectedEmployee.isEligibleForBenefits ? 'default' : 'secondary'}>
                      {selectedEmployee.isEligibleForBenefits ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Medical</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedEmployee.medicalEnrollmentStatus === 'enrolled' ? 'default' : 'outline'}>
                    {selectedEmployee.medicalEnrollmentStatus || 'Not enrolled'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Dental</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedEmployee.dentalEnrollmentStatus === 'enrolled' ? 'default' : 'outline'}>
                    {selectedEmployee.dentalEnrollmentStatus || 'Not enrolled'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>Vision</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedEmployee.visionEnrollmentStatus === 'enrolled' ? 'default' : 'outline'}>
                    {selectedEmployee.visionEnrollmentStatus || 'Not enrolled'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Life Insurance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedEmployee.lifeEnrollmentStatus === 'enrolled' ? 'default' : 'outline'}>
                    {selectedEmployee.lifeEnrollmentStatus || 'Not enrolled'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Disability</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={selectedEmployee.disabilityEnrollmentStatus === 'enrolled' ? 'default' : 'outline'}>
                    {selectedEmployee.disabilityEnrollmentStatus || 'Not enrolled'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Monthly Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${(selectedEmployee.totalMonthlyCost / 100).toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${(selectedEmployee.employeeMonthlyCost / 100).toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employer Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${(selectedEmployee.employerMonthlyCost / 100).toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'dependents':
        return (
          <div className="space-y-6">
            {dependents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {dependents.map((dependent) => (
                  <Card key={dependent.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{dependent.firstName} {dependent.lastName}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{dependent.relationship}</p>
                          {dependent.dob && (
                            <p className="text-sm text-muted-foreground">DOB: {dependent.dob}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(dependent.totalMonthlyCost / 100).toFixed(2)}/mo</p>
                          <div className="flex space-x-1 mt-1">
                            {dependent.medicalEnrollmentStatus === 'enrolled' && <Badge variant="outline" className="text-xs">Medical</Badge>}
                            {dependent.dentalEnrollmentStatus === 'enrolled' && <Badge variant="outline" className="text-xs">Dental</Badge>}
                            {dependent.visionEnrollmentStatus === 'enrolled' && <Badge variant="outline" className="text-xs">Vision</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No Dependents</h3>
                <p className="text-muted-foreground mb-4">This employee has no dependents on file.</p>
                <Button onClick={() => setIsDependentDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Dependent
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
              <p>This section will display {activeSection} information for {selectedEmployee.firstName} {selectedEmployee.lastName}.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <TwoPanelLayout
      title="Employee Management"
      description="Comprehensive employee database with lifecycle tracking"
      tableOfContents={allTableOfContents}
      topPanel={topPanel}
      rightPanelTitle={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} - ${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}` : 'Employee Database'}
      rightPanelActions={!selectedEmployee ? (
        <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetEmployeeForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
        </Dialog>
      ) : undefined}
    >
      {renderContent()}
    </TwoPanelLayout>
  );
}