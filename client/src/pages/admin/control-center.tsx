import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { TwoPanelLayout } from '@/components/layout/two-panel-layout';
import PdfTemplatesPage from './pdf-templates';
import {
  Users,
  Building2,
  FileText,
  Upload,
  Activity,
  Search,
  Download,
  Shield,
  Eye,
  Edit,
  Trash2,
  Flag,
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

// User Management Component
function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    },
  });

  const toggleUserAccess = useMutation({
    mutationFn: async ({ userId, active }: { userId: number; active: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}`, { active });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: 'User access updated successfully' });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: 'Password reset email sent' });
    },
  });

  const filteredUsers = users.filter(
    (user: any) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Broker Agency</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>{user.brokerAgency || 'N/A'}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.active !== false}
                    onCheckedChange={checked =>
                      toggleUserAccess.mutate({ userId: user.id, active: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetPassword.mutate(user.id)}
                    >
                      Reset Password
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Broker Management Component
function BrokerManagement() {
  const { toast } = useToast();

  const { data: brokers = [] } = useQuery({
    queryKey: ['/api/admin/brokers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/brokers');
      return await res.json();
    },
  });

  const toggleBrokerAccess = useMutation({
    mutationFn: async ({ brokerId, enabled }: { brokerId: string; enabled: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/brokers/${brokerId}`, { enabled });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brokers'] });
      toast({ title: 'Broker access updated successfully' });
    },
  });

  const flagForReview = useMutation({
    mutationFn: async ({ brokerId, flagged }: { brokerId: string; flagged: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/brokers/${brokerId}/flag`, { flagged });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brokers'] });
      toast({ title: 'Broker flagged for review' });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Broker Agency Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brokers.map((broker: any) => (
              <TableRow key={broker.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {broker.logoUrl && (
                      <img src={broker.logoUrl} alt="Logo" className="h-8 w-8 rounded" />
                    )}
                    <div>
                      <div className="font-medium">{broker.agencyName}</div>
                      <div className="text-sm text-gray-500">{broker.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{broker.userCount || 0}</TableCell>
                <TableCell>{new Date(broker.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {broker.flaggedForReview && <Badge variant="destructive">Flagged</Badge>}
                    <Badge variant={broker.enabled ? 'default' : 'secondary'}>
                      {broker.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={broker.enabled}
                    onCheckedChange={checked =>
                      toggleBrokerAccess.mutate({ brokerId: broker.id, enabled: checked })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        flagForReview.mutate({
                          brokerId: broker.id,
                          flagged: !broker.flaggedForReview,
                        })
                      }
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Plan Upload Dashboard Component
function PlanUploadDashboard() {
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const { toast } = useToast();

  const { data: uploadHistory = [] } = useQuery({
    queryKey: ['/api/admin/plan-uploads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/plan-uploads');
      return await res.json();
    },
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ['/api/carriers'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/carriers');
      return await res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Plan Upload Dashboard
        </CardTitle>
        <div className="flex items-center gap-4">
          <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map((carrier: string) => (
                <SelectItem key={carrier} value={carrier}>
                  {carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Plans
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Plans Added</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploadHistory
              .filter((upload: any) => !selectedCarrier || upload.carrier === selectedCarrier)
              .map((upload: any) => (
                <TableRow key={upload.id}>
                  <TableCell className="font-medium">{upload.fileName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{upload.carrier}</Badge>
                  </TableCell>
                  <TableCell>{upload.plansAdded}</TableCell>
                  <TableCell>{upload.uploadedBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Audit Logs Component
function AuditLogs() {
  const [actionFilter, setActionFilter] = useState('');

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/audit-logs');
      return await res.json();
    },
  });

  const exportLogs = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/admin/audit-logs/export');
      return await res.blob();
    },
    onSuccess: blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Audit Logs & Activity Tracking
        </CardTitle>
        <div className="flex items-center gap-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="application_submit">Application Submit</SelectItem>
              <SelectItem value="document_upload">Document Upload</SelectItem>
              <SelectItem value="plan_upload">Plan Upload</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportLogs.mutate()}
            disabled={exportLogs.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs
              .filter((log: any) => !actionFilter || log.action === actionFilter)
              .map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>{log.agency || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {log.ipAddress}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminControlCenter() {
  const adminItems = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: <Activity className="h-4 w-4" />,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">247</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-sm text-gray-600">Active Brokers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-sm text-gray-600">Insurance Plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">1,247</p>
                    <p className="text-sm text-gray-600">Audit Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Recent system activity will appear here...</p>
            </CardContent>
          </Card>
        </div>
      ),
      roles: ['admin'],
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="h-4 w-4" />,
      component: <UserManagement />,
      roles: ['admin'],
    },
    {
      id: 'brokers',
      label: 'Broker Agencies',
      icon: <Building2 className="h-4 w-4" />,
      component: <BrokerManagement />,
      roles: ['admin'],
    },
    {
      id: 'plans',
      label: 'Plan Dashboard',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      component: <PlanUploadDashboard />,
      roles: ['admin', 'owner'],
    },
    {
      id: 'templates',
      label: 'PDF Templates',
      icon: <FileText className="h-4 w-4" />,
      component: <PdfTemplatesPage />,
      roles: ['admin', 'owner'],
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: <Activity className="h-4 w-4" />,
      component: <AuditLogs />,
      roles: ['admin'],
    },
  ];

  return (
    <TwoPanelLayout title="Admin Control Center" items={adminItems} defaultActiveTab="overview" />
  );
}
