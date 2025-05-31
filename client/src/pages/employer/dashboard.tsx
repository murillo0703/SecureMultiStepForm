import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Plus, 
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Users
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

  const resumeApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await apiRequest('POST', `/api/employer/applications/${applicationId}/resume`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Resuming your application.',
      });
      setLocation(`/enrollment/${data.nextStep}?applicationId=${data.applicationId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume application.',
        variant: 'destructive',
      });
    },
  });

  if (statsLoading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your insurance enrollments and submissions
              </p>
              {stats?.currentCompany && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-1" />
                  {stats.currentCompany.name} • {stats.currentCompany.employees} employees • {stats.currentCompany.industry}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => startNewApplicationMutation.mutate()}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Application
              </Button>
              <Button variant="outline" onClick={() => setLocation('/employer/profile')}>
                Manage Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                  <p className="text-xs text-blue-600">All time</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.inProgressApplications || 0}</p>
                  <p className="text-xs text-yellow-600">Needs attention</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedApplications || 0}</p>
                  <p className="text-xs text-green-600">Successfully submitted</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingReview || 0}</p>
                  <p className="text-xs text-purple-600">Under review</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Application History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Submitted</TableHead>
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
                        <span className="text-sm text-gray-500">{application.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getStepName(application.currentStep)}</span>
                    </TableCell>
                    <TableCell>
                      {new Date(application.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {application.submittedAt 
                        ? new Date(application.submittedAt).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {application.status === 'in_progress' ? (
                          <Button
                            size="sm"
                            onClick={() => resumeApplicationMutation.mutate(application.id)}
                            disabled={resumeApplicationMutation.isPending}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/employer/applications/${application.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                        {application.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/employer/applications/${application.id}/download`)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}