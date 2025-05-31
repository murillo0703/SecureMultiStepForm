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
  Users, 
  FileText, 
  CreditCard, 
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BrokerStats {
  totalUsers: number;
  totalSubmissions: number;
  activeSubmissions: number;
  completedSubmissions: number;
  subscriptionTier: string;
  usagePercentage: number;
  maxUsers: number;
  maxSubmissions: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive: string;
  submissionCount: number;
  isActive: boolean;
}

interface Submission {
  id: number;
  companyName: string;
  ownerName: string;
  status: string;
  submittedAt: string;
  carrier: string;
}

export default function BrokerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not broker role
  if (!user?.brokerId || (user?.role !== 'broker_admin' && user?.role !== 'broker_staff')) {
    setLocation('/');
    return null;
  }

  // Fetch broker statistics
  const { data: stats, isLoading: statsLoading } = useQuery<BrokerStats>({
    queryKey: ['/api/broker/stats'],
  });

  // Fetch users under this broker
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/broker/users'],
  });

  // Fetch submissions under this broker
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/broker/submissions'],
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/broker/invite-user', { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User invitation sent successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/broker/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation.',
        variant: 'destructive',
      });
    },
  });

  if (statsLoading || usersLoading || submissionsLoading) {
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
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Submitted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case 'broker_admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Admin</Badge>;
      case 'broker_staff':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Staff</Badge>;
      case 'employer':
        return <Badge variant="outline">Employer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broker Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your clients, users, and subscription
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setLocation('/broker/invite')}>
                <Plus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
              <Button variant="outline" onClick={() => setLocation('/broker/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Subscription Status</span>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {stats?.subscriptionTier?.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Users ({stats?.totalUsers || 0}/{stats?.maxUsers || 0})</span>
                  <span>{Math.round(((stats?.totalUsers || 0) / ((stats?.maxUsers || 1))) * 100)}%</span>
                </div>
                <Progress value={((stats?.totalUsers || 0) / ((stats?.maxUsers || 1))) * 100} className="mb-4" />
                
                <div className="flex justify-between text-sm mb-2">
                  <span>Submissions ({stats?.totalSubmissions || 0}/{stats?.maxSubmissions || 0})</span>
                  <span>{Math.round(((stats?.totalSubmissions || 0) / ((stats?.maxSubmissions || 1))) * 100)}%</span>
                </div>
                <Progress value={((stats?.totalSubmissions || 0) / ((stats?.maxSubmissions || 1))) * 100} />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm">{stats?.subscriptionTier?.charAt(0).toUpperCase() + stats?.subscriptionTier?.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Next Billing:</span>
                  <span className="text-sm">December 1, 2024</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setLocation('/broker/billing')}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-blue-600">Active clients</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeSubmissions || 0}</p>
                  <p className="text-xs text-yellow-600">In progress</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedSubmissions || 0}</p>
                  <p className="text-xs text-green-600">This month</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.usagePercentage || 0}%</p>
                  <p className="text-xs text-purple-600">Of plan limit</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.companyName}
                        </TableCell>
                        <TableCell>{submission.ownerName}</TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell>{submission.carrier || 'Not selected'}</TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/broker/submissions/${submission.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/broker/submissions/${submission.id}/edit`)}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="font-medium">
                          {userItem.name}
                        </TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          {getUserRoleBadge(userItem.role)}
                        </TableCell>
                        <TableCell>{userItem.submissionCount}</TableCell>
                        <TableCell>
                          {new Date(userItem.lastActive).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {userItem.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/broker/users/${userItem.id}`)}
                            >
                              View
                            </Button>
                            {user?.role === 'broker_admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation(`/broker/users/${userItem.id}/edit`)}
                              >
                                Edit
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
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Submission Trends</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">This month</span>
                        <span className="text-sm font-medium">{stats?.totalSubmissions || 0} submissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion rate</span>
                        <span className="text-sm font-medium">87%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average time</span>
                        <span className="text-sm font-medium">3.2 days</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Popular Carriers</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Anthem</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Blue Shield</span>
                        <span className="text-sm font-medium">32%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Kaiser</span>
                        <span className="text-sm font-medium">23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}