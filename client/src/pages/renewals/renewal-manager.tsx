import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calendar, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Send
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface RenewalGroup {
  id: string;
  companyName: string;
  currentPlan: string;
  carrier: string;
  renewalDate: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'declined';
  employeeCount: number;
  currentPremium: number;
  renewalOptions: RenewalOption[];
  lastActivity: string;
}

interface RenewalOption {
  id: string;
  planName: string;
  carrier: string;
  monthlyPremium: number;
  rateIncrease: number;
  planChanges: string[];
  recommended: boolean;
}

interface RenewalTask {
  id: string;
  companyId: string;
  companyName: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export default function RenewalManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalGroup | null>(null);
  const [renewalFilter, setRenewalFilter] = useState<'all' | 'upcoming' | 'in_progress'>('upcoming');

  // Fetch renewal groups
  const { data: renewals = [], isLoading } = useQuery<RenewalGroup[]>({
    queryKey: ['/api/renewals', renewalFilter],
  });

  // Fetch renewal tasks
  const { data: tasks = [] } = useQuery<RenewalTask[]>({
    queryKey: ['/api/renewal-tasks'],
  });

  const generateRenewalQuoteMutation = useMutation({
    mutationFn: async (renewalId: string) => {
      const response = await apiRequest('POST', `/api/renewals/${renewalId}/generate-quote`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Renewal Quote Generated',
        description: `Generated ${data.optionCount} renewal options for review.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Quote Generation Failed',
        description: error.message || 'Unable to generate renewal quote.',
        variant: 'destructive',
      });
    },
  });

  const sendRenewalProposalMutation = useMutation({
    mutationFn: async ({ renewalId, optionId }: { renewalId: string; optionId: string }) => {
      const response = await apiRequest('POST', `/api/renewals/${renewalId}/send-proposal`, { optionId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Sent',
        description: 'Renewal proposal has been sent to the client for review.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/renewals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Send Failed',
        description: error.message || 'Failed to send renewal proposal.',
        variant: 'destructive',
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/renewal-tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Task Updated',
        description: 'Task status has been updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/renewal-tasks'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingRenewals = renewals.filter(r => r.status === 'upcoming').length;
  const inProgressRenewals = renewals.filter(r => r.status === 'in_progress').length;
  const completedRenewals = renewals.filter(r => r.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Renewal Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage policy renewals, quotes, and client communications
              </p>
            </div>
            <div className="flex space-x-3">
              <Select value={renewalFilter} onValueChange={(value: any) => setRenewalFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Renewals</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/renewals'] })}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
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
                  <p className="text-sm font-medium text-gray-500">Upcoming Renewals</p>
                  <p className="text-2xl font-bold text-blue-600">{upcomingRenewals}</p>
                  <p className="text-xs text-gray-500">Next 90 days</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressRenewals}</p>
                  <p className="text-xs text-gray-500">Active negotiations</p>
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
                  <p className="text-2xl font-bold text-green-600">{completedRenewals}</p>
                  <p className="text-xs text-gray-500">This quarter</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                  <p className="text-2xl font-bold text-red-600">{pendingTasks}</p>
                  <p className="text-xs text-gray-500">Require attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Renewals List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Renewal Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Current Plan</TableHead>
                      <TableHead>Renewal Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renewals.map((renewal) => {
                      const daysUntil = getDaysUntilRenewal(renewal.renewalDate);
                      
                      return (
                        <TableRow key={renewal.id} className={daysUntil <= 30 ? 'bg-yellow-50' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{renewal.companyName}</div>
                              <div className="text-sm text-gray-500">{renewal.carrier}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{renewal.currentPlan}</div>
                              <div className="text-sm text-gray-500">
                                ${renewal.currentPremium.toLocaleString()}/month
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(renewal.renewalDate).toLocaleDateString()}
                              </div>
                              <div className={`text-sm ${daysUntil <= 30 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {daysUntil > 0 ? `${daysUntil} days` : 'Overdue'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(renewal.status)}</TableCell>
                          <TableCell>{renewal.employeeCount}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRenewal(renewal)}
                              >
                                View
                              </Button>
                              {renewal.status === 'upcoming' && (
                                <Button
                                  size="sm"
                                  onClick={() => generateRenewalQuoteMutation.mutate(renewal.id)}
                                  disabled={generateRenewalQuoteMutation.isPending}
                                >
                                  Quote
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Renewal Details / Tasks */}
          <div>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                {selectedRenewal ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedRenewal.companyName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Current Plan</Label>
                        <p className="text-sm">{selectedRenewal.currentPlan}</p>
                        <p className="text-xs text-gray-500">
                          ${selectedRenewal.currentPremium.toLocaleString()}/month
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Renewal Date</Label>
                        <p className="text-sm">
                          {new Date(selectedRenewal.renewalDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Employee Count</Label>
                        <p className="text-sm">{selectedRenewal.employeeCount} employees</p>
                      </div>

                      {selectedRenewal.renewalOptions.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Renewal Options</Label>
                          <div className="space-y-3 mt-2">
                            {selectedRenewal.renewalOptions.map((option) => (
                              <div key={option.id} className="border rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-medium">{option.planName}</h4>
                                    <p className="text-sm text-gray-500">{option.carrier}</p>
                                  </div>
                                  {option.recommended && (
                                    <Badge className="bg-green-100 text-green-800">Recommended</Badge>
                                  )}
                                </div>
                                
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Monthly Premium:</span>
                                    <span className="font-medium">${option.monthlyPremium.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Rate Change:</span>
                                    <span className={option.rateIncrease >= 0 ? 'text-red-600' : 'text-green-600'}>
                                      {option.rateIncrease >= 0 ? '+' : ''}{option.rateIncrease}%
                                    </span>
                                  </div>
                                </div>

                                {option.planChanges.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-600">Plan Changes:</p>
                                    <ul className="text-xs text-gray-500 mt-1">
                                      {option.planChanges.map((change, index) => (
                                        <li key={index}>• {change}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <Button
                                  size="sm"
                                  className="w-full mt-3"
                                  onClick={() => sendRenewalProposalMutation.mutate({
                                    renewalId: selectedRenewal.id,
                                    optionId: option.id
                                  })}
                                  disabled={sendRenewalProposalMutation.isPending}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Send Proposal
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Select a renewal to view details</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Renewal Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.filter(task => task.status !== 'completed').map((task) => (
                        <div key={task.id} className="border rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{task.task}</h4>
                              <p className="text-xs text-gray-500">{task.companyName}</p>
                            </div>
                            {getPriorityBadge(task.priority)}
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            <span>Assigned: {task.assignedTo}</span>
                          </div>

                          <div className="flex space-x-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => updateTaskMutation.mutate({
                                taskId: task.id,
                                status: 'in_progress'
                              })}
                              disabled={task.status === 'in_progress'}
                            >
                              {task.status === 'in_progress' ? 'In Progress' : 'Start'}
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => updateTaskMutation.mutate({
                                taskId: task.id,
                                status: 'completed'
                              })}
                            >
                              Complete
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {tasks.filter(task => task.status !== 'completed').length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No pending tasks</p>
                        </div>
                      )}
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