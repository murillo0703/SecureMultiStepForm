import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { TwoPanelLayout } from '@/components/layouts/two-panel-layout';
import { 
  FileText, 
  Plus, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Users,
  Activity,
  Calendar,
  DollarSign,
  Shield,
  BarChart3,
  Settings,
  UserPlus,
  UserCheck,
  Crown,
  Contact
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmployerStats {
  totalApplications: number;
  completedApplications: number;
  inProgressApplications: number;
  pendingReview: number;
  currentCompany?: {
    name: string;
    employees: number;
    industry: string;
  };
}

interface Application {
  id: number;
  companyName: string;
  status: string;
  progress: number;
  currentStep: string;
  createdAt: string;
  submittedAt?: string;
  carrier?: string;
  planType?: string;
}

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('overview');
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    taxId: '',
    industry: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    employeeCount: ''
  });

  // Redirect if not employer
  if (user?.role !== 'employer') {
    setLocation('/');
    return null;
  }

  // Fetch employer statistics
  const { data: stats, isLoading: statsLoading } = useQuery<EmployerStats>({
    queryKey: ['/api/employer/stats'],
  });

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/employer/applications'],
  });

  const startNewApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/employer/applications/new');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'New application started successfully.',
      });
      setLocation(`/enrollment/application-initiator?applicationId=${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start new application.',
        variant: 'destructive',
      });
    },
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async (companyData: typeof companyFormData) => {
      const response = await apiRequest('POST', '/api/employer/company', companyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Company information saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save company information.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Review</Badge>;
      case 'submitted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStepName = (step: string) => {
    const stepNames: { [key: string]: string } = {
      'application-initiator': 'Application Initiator',
      'company-information': 'Company Information',
      'ownership-info': 'Ownership Information',
      'authorized-contact': 'Authorized Contact',
      'employee-info': 'Employee Information',
      'document-upload': 'Document Upload',
      'plan-selection': 'Plan Selection',
      'contribution-setup': 'Contribution Setup',
      'review-submit': 'Review & Submit'
    };
    return stepNames[step] || step;
  };

  // Table of Contents for left panel
  const tableOfContents = [
    {
      title: 'Dashboard',
      items: [
        {
          id: 'overview',
          title: 'Overview',
          icon: <BarChart3 className="h-4 w-4" />,
          isActive: activeSection === 'overview',
          onClick: () => setActiveSection('overview'),
        },
        {
          id: 'applications',
          title: 'Applications',
          icon: <FileText className="h-4 w-4" />,
          badge: `${applications.length}`,
          isActive: activeSection === 'applications',
          onClick: () => setActiveSection('applications'),
        },
        {
          id: 'company-info',
          title: 'Company Information',
          icon: <Building className="h-4 w-4" />,
          isActive: activeSection === 'company-info',
          onClick: () => setActiveSection('company-info'),
        },
        {
          id: 'owners',
          title: 'Company Owners',
          icon: <Crown className="h-4 w-4" />,
          isActive: activeSection === 'owners',
          onClick: () => setActiveSection('owners'),
        },
        {
          id: 'contacts',
          title: 'Authorized Contacts',
          icon: <Contact className="h-4 w-4" />,
          isActive: activeSection === 'contacts',
          onClick: () => setActiveSection('contacts'),
        }
      ]
    },
    {
      title: 'Quick Actions',
      items: [
        {
          id: 'benefits',
          title: 'Benefits Summary',
          icon: <Shield className="h-4 w-4" />,
          isActive: activeSection === 'benefits',
          onClick: () => setActiveSection('benefits'),
        },
        {
          id: 'employees',
          title: 'Employee Overview',
          icon: <Users className="h-4 w-4" />,
          badge: stats?.currentCompany?.employees?.toString() || '0',
          isActive: activeSection === 'employees',
          onClick: () => setLocation('/employer/employee-management'),
        },
        {
          id: 'costs',
          title: 'Cost Analysis',
          icon: <DollarSign className="h-4 w-4" />,
          isActive: activeSection === 'costs',
          onClick: () => setActiveSection('costs'),
        }
      ]
    },
    {
      title: 'Management',
      items: [
        {
          id: 'tasks',
          title: 'Pending Tasks',
          icon: <Calendar className="h-4 w-4" />,
          badge: stats?.pendingReview?.toString() || '0',
          isActive: activeSection === 'tasks',
          onClick: () => setActiveSection('tasks'),
        },
        {
          id: 'activity',
          title: 'Recent Activity',
          icon: <Activity className="h-4 w-4" />,
          isActive: activeSection === 'activity',
          onClick: () => setActiveSection('activity'),
        },
        {
          id: 'settings',
          title: 'Settings',
          icon: <Settings className="h-4 w-4" />,
          isActive: activeSection === 'settings',
          onClick: () => setActiveSection('settings'),
        }
      ]
    }
  ];

  const renderContent = () => {
    if (statsLoading || applicationsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedApplications || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.inProgressApplications || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingReview || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Current Company Info */}
            {stats?.currentCompany && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Current Company</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Company Name</div>
                      <div className="font-medium">{stats.currentCompany.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Employees</div>
                      <div className="font-medium flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{stats.currentCompany.employees}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Industry</div>
                      <div className="font-medium">{stats.currentCompany.industry}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'company-info':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your company details, address, and business information.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="Enter company name" />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / EIN</Label>
                    <Input id="taxId" placeholder="XX-XXXXXXX" />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="(555) 123-4567" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" placeholder="123 Main Street" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="City" />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="CA" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="12345" />
                  </div>
                  <div>
                    <Label htmlFor="employeeCount">Number of Employees</Label>
                    <Input id="employeeCount" type="number" placeholder="50" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Company Information</Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'owners':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Company Owners</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Owner
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage company ownership information and ownership percentages.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Owners Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add company owners with their ownership percentages and contact information.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Owner
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'contacts':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Authorized Contacts</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage authorized contacts who can act on behalf of the company.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Authorized Contacts</h3>
                <p className="text-muted-foreground mb-4">
                  Add authorized contacts who can make decisions and sign documents for your company.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'employees':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Employee Management</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add and manage your employees and their dependents.
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Employees Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first employee or upload a CSV file with multiple employees.
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Employee List
                    </Button>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'applications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your benefits applications and track their progress.
              </p>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.companyName}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(application.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={application.progress} className="w-20" />
                            <span className="text-sm text-muted-foreground">
                              {application.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getStepName(application.currentStep)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(application.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {application.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your first benefits application to get coverage for your employees.
                  </p>
                  <Button 
                    onClick={() => startNewApplicationMutation.mutate()}
                    disabled={startNewApplicationMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Your First Application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h3>
              <p>This section will display {activeSection} information and functionality.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <TwoPanelLayout
      title="Employer Dashboard"
      description="Manage applications, employees, and benefits"
      tableOfContents={tableOfContents}
      rightPanelTitle={`${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}`}
      rightPanelActions={
        <Button 
          onClick={() => startNewApplicationMutation.mutate()}
          disabled={startNewApplicationMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Start New Application
        </Button>
      }
    >
      {renderContent()}
    </TwoPanelLayout>
  );
}