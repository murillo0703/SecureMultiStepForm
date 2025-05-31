import { useQuery } from '@tanstack/react-query';
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
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface DashboardStats {
  totalBrokers: number;
  activeBrokers: number;
  totalUsers: number;
  totalSubmissions: number;
  monthlyRevenue: number;
  trialBrokers: number;
}

interface Broker {
  id: string;
  agencyName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  userCount: number;
  submissionCount: number;
  lastActive: string;
  trialEndsAt?: string;
}

export default function MasterAdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not master admin
  if (user?.role !== 'master_admin') {
    setLocation('/');
    return null;
  }

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/master-admin/stats'],
  });

  // Fetch brokers list
  const { data: brokers = [], isLoading: brokersLoading } = useQuery<Broker[]>({
    queryKey: ['/api/master-admin/brokers'],
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['/api/master-admin/activity'],
  });

  if (statsLoading || brokersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Suspended</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge variant="outline">Basic</Badge>;
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Master Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your SaaS platform and broker accounts
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setLocation('/master-admin/brokers/new')}>
                Add New Broker
              </Button>
              <Button variant="outline" onClick={() => setLocation('/master-admin/settings')}>
                Platform Settings
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
                  <p className="text-sm font-medium text-gray-500">Total Brokers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalBrokers || 0}</p>
                  <p className="text-xs text-green-600">
                    {stats?.activeBrokers || 0} active
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-blue-600">Across all brokers</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${((stats?.monthlyRevenue || 0) / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalSubmissions || 0}</p>
                  <p className="text-xs text-blue-600">This month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="brokers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="brokers">Broker Management</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="billing">Billing Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="brokers">
            <Card>
              <CardHeader>
                <CardTitle>Broker Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency Name</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokers.map((broker) => (
                      <TableRow key={broker.id}>
                        <TableCell className="font-medium">
                          {broker.agencyName}
                        </TableCell>
                        <TableCell>
                          {getTierBadge(broker.subscriptionTier)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(broker.subscriptionStatus)}
                          {broker.trialEndsAt && (
                            <div className="text-xs text-amber-600 mt-1">
                              Trial ends {new Date(broker.trialEndsAt).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{broker.userCount}</TableCell>
                        <TableCell>{broker.submissionCount}</TableCell>
                        <TableCell>
                          {new Date(broker.lastActive).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/master-admin/brokers/${broker.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/master-admin/brokers/${broker.id}/edit`)}
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

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentActivity as any[]).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {activity.type === 'warning' && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        {activity.type === 'error' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {activity.type === 'info' && (
                          <Clock className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ${((stats?.monthlyRevenue || 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.trialBrokers || 0}
                    </p>
                    <p className="text-sm text-gray-500">Active Trials</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">97.5%</p>
                    <p className="text-sm text-gray-500">Payment Success Rate</p>
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