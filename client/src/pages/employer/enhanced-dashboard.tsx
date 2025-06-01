import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Building,
  Users,
  Calendar,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Application {
  id: string;
  companyName: string;
  status: 'draft' | 'in-progress' | 'submitted' | 'completed' | 'expired';
  progress: number;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  expiresAt: string;
  canResume: boolean;
}

interface DashboardStats {
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

interface SavedQuote {
  id: string;
  companyName: string;
  employeeCount: number;
  estimatedCost: number;
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
  'in-progress': { label: 'In Progress', variant: 'default' as const, icon: Clock },
  submitted: { label: 'Submitted', variant: 'default' as const, icon: CheckCircle },
  completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
  expired: { label: 'Expired', variant: 'destructive' as const, icon: AlertCircle },
};

export default function EnhancedEmployerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/employer/stats'],
  });

  // Fetch applications
  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ['/api/employer/applications'],
  });

  // Fetch saved quotes
  const { data: quotes } = useQuery<SavedQuote[]>({
    queryKey: ['/api/employer/quotes'],
  });

  // Start new application
  const startNewApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/employer/applications/new');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'New Application Started',
        description: 'You can now begin the onboarding process.',
      });
      setLocation('/employer/enhanced-onboarding');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Start Application',
        description: error.message || 'Could not create new application.',
        variant: 'destructive',
      });
    },
  });

  // Resume application
  const resumeApplication = (applicationId: string) => {
    setLocation(`/employer/enhanced-onboarding?resume=${applicationId}`);
  };

  // Delete application
  const deleteApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await apiRequest('DELETE', `/api/employer/applications/${applicationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/stats'] });
      toast({
        title: 'Application Deleted',
        description: 'The application has been permanently deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Could not delete application.',
        variant: 'destructive',
      });
    },
  });

  if (user?.role !== 'employer') {
    setLocation('/');
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your insurance applications and company information
          </p>
        </div>
        <Button onClick={() => startNewApplicationMutation.mutate()} disabled={startNewApplicationMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Start New Application
        </Button>
      </div>

      {/* Stats Overview */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Company Info */}
      {stats?.currentCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Current Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{stats.currentCompany.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{stats.currentCompany.industry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="font-medium">{stats.currentCompany.employees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="applications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="quotes">Saved Quotes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {appsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading applications...</p>
            </div>
          ) : applications && applications.length > 0 ? (
            <div className="grid gap-4">
              {applications.map((app) => {
                const statusConfig = STATUS_CONFIG[app.status];
                const StatusIcon = statusConfig.icon;
                const isExpired = new Date(app.expiresAt) < new Date();
                
                return (
                  <Card key={app.id} className={isExpired ? 'border-red-200' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-lg">{app.companyName}</CardTitle>
                            <CardDescription>
                              Step {app.currentStep} of {app.totalSteps}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{app.progress}%</span>
                        </div>
                        <Progress value={app.progress} className="h-2" />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p>{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p>{new Date(app.updatedAt).toLocaleDateString()}</p>
                        </div>
                        {app.submittedAt && (
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p>{new Date(app.submittedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">
                            {isExpired ? 'Expired' : 'Expires'}
                          </p>
                          <p className={isExpired ? 'text-red-600' : ''}>
                            {new Date(app.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isExpired && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This application has expired. You can start a new application or contact support to restore this one.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {app.canResume && !isExpired && (
                          <Button 
                            size="sm" 
                            onClick={() => resumeApplication(app.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {app.status === 'draft' ? 'Continue' : 'Resume'}
                          </Button>
                        )}
                        
                        {app.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        
                        {app.status === 'completed' && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {(app.status === 'draft' || isExpired) && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteApplicationMutation.mutate(app.id)}
                            disabled={deleteApplicationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first insurance application to get coverage for your company.
                </p>
                <Button onClick={() => startNewApplicationMutation.mutate()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Application
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          {quotes && quotes.length > 0 ? (
            <div className="grid gap-4">
              {quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{quote.companyName}</CardTitle>
                        <CardDescription>
                          {quote.employeeCount} employees
                        </CardDescription>
                      </div>
                      <Badge variant={quote.status === 'active' ? 'default' : 'secondary'}>
                        {quote.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Estimated Cost</p>
                        <p className="text-lg font-semibold">${quote.estimatedCost}/month</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{new Date(quote.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm">View Details</Button>
                      <Button size="sm" variant="outline">Convert to Application</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Saved Quotes</h3>
                <p className="text-muted-foreground mb-4">
                  Get insurance quotes to compare plans and pricing.
                </p>
                <Button variant="outline">Get Quote</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Document Center</h3>
              <p className="text-muted-foreground mb-4">
                Your uploaded documents and generated forms will appear here.
              </p>
              <Button variant="outline">Upload Document</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}