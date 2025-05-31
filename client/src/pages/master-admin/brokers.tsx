import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Settings,
  Eye,
  Edit,
  Shield,
  Building2,
  CreditCard,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BrokerAccount {
  id: string;
  agencyName: string;
  contactName: string;
  email: string;
  phone: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  clientCount: number;
  monthlyRevenue: number;
  joinDate: string;
  lastActivity: string;
  modules: {
    quoting: boolean;
    enrollment: boolean;
    renewals: boolean;
    documents: boolean;
    rates: boolean;
    employeePortal: boolean;
  };
  billing: {
    nextBillingDate: string;
    paymentStatus: 'current' | 'overdue' | 'failed';
    monthlyFee: number;
  };
}

export default function BrokerManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedBroker, setSelectedBroker] = useState<BrokerAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');

  // Fetch broker accounts
  const { data: brokers = [], isLoading } = useQuery<BrokerAccount[]>({
    queryKey: ['/api/master-admin/brokers', filterStatus, searchTerm],
  });

  const updateBrokerMutation = useMutation({
    mutationFn: async ({ brokerId, updates }: { brokerId: string; updates: Partial<BrokerAccount> }) => {
      const response = await apiRequest('PUT', `/api/master-admin/brokers/${brokerId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Broker Updated',
        description: 'Broker account has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/master-admin/brokers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update broker account.',
        variant: 'destructive',
      });
    },
  });

  const createBrokerMutation = useMutation({
    mutationFn: async (brokerData: Partial<BrokerAccount>) => {
      const response = await apiRequest('POST', '/api/master-admin/brokers', brokerData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Broker Created',
        description: 'New broker account has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/master-admin/brokers'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create broker account.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'starter':
        return <Badge variant="outline">Starter</Badge>;
      case 'professional':
        return <Badge className="bg-blue-100 text-blue-800">Professional</Badge>;
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-100 text-green-800">Current</Badge>;
      case 'overdue':
        return <Badge className="bg-yellow-100 text-yellow-800">Overdue</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toggleBrokerModule = (brokerId: string, module: keyof BrokerAccount['modules'], enabled: boolean) => {
    const broker = brokers.find(b => b.id === brokerId);
    if (broker) {
      const updatedModules = { ...broker.modules, [module]: enabled };
      updateBrokerMutation.mutate({
        brokerId,
        updates: { modules: updatedModules }
      });
    }
  };

  const filteredBrokers = brokers
    .filter(broker => filterStatus === 'all' || broker.status === filterStatus)
    .filter(broker => 
      broker.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.status === 'active').length;
  const trialBrokers = brokers.filter(b => b.status === 'trial').length;
  const totalRevenue = brokers.reduce((sum, b) => sum + b.monthlyRevenue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broker Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage broker accounts, subscriptions, and module access
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Broker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Broker Account</DialogTitle>
                  <DialogDescription>
                    Set up a new broker account with initial configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agencyName">Agency Name</Label>
                    <Input id="agencyName" placeholder="Insurance Agency Inc." />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" placeholder="John Smith" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@agency.com" />
                  </div>
                  <div>
                    <Label htmlFor="tier">Subscription Tier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => createBrokerMutation.mutate({})}>
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <p className="text-sm font-medium text-gray-500">Total Brokers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBrokers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Brokers</p>
                  <p className="text-2xl font-bold text-green-600">{activeBrokers}</p>
                  <p className="text-xs text-gray-500">
                    {totalBrokers > 0 ? Math.round((activeBrokers / totalBrokers) * 100) : 0}% of total
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Trial Accounts</p>
                  <p className="text-2xl font-bold text-blue-600">{trialBrokers}</p>
                  <p className="text-xs text-gray-500">Conversion opportunities</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">${totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Recurring revenue</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search brokers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Broker Table */}
        <Card>
          <CardHeader>
            <CardTitle>Broker Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{broker.agencyName}</div>
                        <div className="text-sm text-gray-500">
                          Member since {new Date(broker.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{broker.contactName}</div>
                        <div className="text-sm text-gray-500">{broker.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(broker.subscriptionTier)}</TableCell>
                    <TableCell>{getStatusBadge(broker.status)}</TableCell>
                    <TableCell>{broker.clientCount}</TableCell>
                    <TableCell>${broker.monthlyRevenue.toLocaleString()}</TableCell>
                    <TableCell>{getPaymentStatusBadge(broker.billing.paymentStatus)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBroker(broker)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Broker Details Panel */}
        {selectedBroker && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedBroker.agencyName} - Module Access</span>
                <Button variant="outline" onClick={() => setSelectedBroker(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(selectedBroker.modules).map(([module, enabled]) => (
                  <div key={module} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{module.replace(/([A-Z])/g, ' $1')}</h4>
                      <p className="text-sm text-gray-500">
                        {module === 'quoting' && 'Generate insurance quotes'}
                        {module === 'enrollment' && 'Manage employee enrollments'}
                        {module === 'renewals' && 'Handle policy renewals'}
                        {module === 'documents' && 'Document management'}
                        {module === 'rates' && 'Rate and contribution setup'}
                        {module === 'employeePortal' && 'Employee self-service portal'}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        toggleBrokerModule(selectedBroker.id, module as keyof BrokerAccount['modules'], checked)
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4">Billing Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Monthly Fee</Label>
                    <p className="font-medium">${selectedBroker.billing.monthlyFee}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Next Billing Date</Label>
                    <p className="font-medium">
                      {new Date(selectedBroker.billing.nextBillingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Payment Status</Label>
                    <div className="mt-1">
                      {getPaymentStatusBadge(selectedBroker.billing.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}