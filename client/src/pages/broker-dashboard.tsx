import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TwoPanelLayout } from '@/components/layout/two-panel-layout';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Company, Application, User } from '@shared/schema';
import {
  Building2,
  Users,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  Mail,
  Plus,
  Eye,
  ExternalLink,
} from 'lucide-react';

// Broker Overview Component with Real Data
function BrokerOverview() {
  const { user } = useAuth();

  // Fetch broker's companies (clients)
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['/api/broker/companies'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/companies');
      return await res.json();
    },
  });

  // Fetch broker's applications
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/broker/applications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/applications');
      return await res.json();
    },
  });

  const activeClients = companies.length;
  const pendingApplications = applications.filter(app => app.status === 'in_progress' || app.status === 'pending_review').length;
  const recentActivity = applications
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  if (isLoadingCompanies || isLoadingApplications) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeClients}</p>
                <p className="text-sm text-gray-600">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{pendingApplications}</p>
                <p className="text-sm text-gray-600">Pending Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{applications.length}</p>
                <p className="text-sm text-gray-600">Total Applications</p>
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
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((app) => {
                const company = companies.find(c => c.id === app.companyId);
                return (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">
                        {company?.name || 'Unknown Company'} - {app.status.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={app.status === 'submitted' ? 'default' : 'outline'}>
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientManagement() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Client Management</CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { name: 'ABC Corporation', status: 'Active', employees: 25 },
            { name: 'XYZ Industries', status: 'Pending', employees: 12 },
            { name: 'Tech Solutions LLC', status: 'Active', employees: 8 },
          ].map((client, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{client.name}</p>
                <p className="text-sm text-gray-600">{client.employees} employees</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { company: 'ABC Corp', stage: 'Document Collection', progress: 60 },
            { company: 'XYZ Inc', stage: 'Plan Selection', progress: 80 },
            { company: 'Tech LLC', stage: 'Final Review', progress: 95 },
          ].map((app, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{app.company}</p>
                <span className="text-sm text-gray-600">{app.progress}%</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{app.stage}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${app.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BrokerSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Agency Information</h3>
            <p className="text-sm text-gray-600">
              Update your agency name, logo, and contact details
            </p>
            <Button variant="outline" className="mt-2">
              Edit Details
            </Button>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Branding & Colors</h3>
            <p className="text-sm text-gray-600">Customize the look and feel for your clients</p>
            <Button variant="outline" className="mt-2">
              Customize Branding
            </Button>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Team Management</h3>
            <p className="text-sm text-gray-600">Add staff members and manage permissions</p>
            <Button variant="outline" className="mt-2">
              Manage Team
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrokerDashboard() {
  const brokerItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <BrokerOverview />,
      roles: ['owner', 'staff'],
    },
    {
      id: 'clients',
      label: 'Client Management',
      icon: <Users className="h-4 w-4" />,
      component: <ClientManagement />,
      roles: ['owner', 'staff'],
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: <FileText className="h-4 w-4" />,
      component: <ApplicationTracking />,
      roles: ['owner', 'staff'],
      badge: '3', // Show pending count
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      component: (
        <Card>
          <CardHeader>
            <CardTitle>Calendar & Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Calendar integration coming soon...</p>
          </CardContent>
        </Card>
      ),
      roles: ['owner', 'staff'],
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: <Mail className="h-4 w-4" />,
      component: (
        <Card>
          <CardHeader>
            <CardTitle>Client Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Email templates and communication history...</p>
          </CardContent>
        </Card>
      ),
      roles: ['owner', 'staff'],
    },
    {
      id: 'settings',
      label: 'Agency Settings',
      icon: <Settings className="h-4 w-4" />,
      component: <BrokerSettings />,
      roles: ['owner'], // Only agency owners can access settings
    },
  ];

  return (
    <TwoPanelLayout title="Broker Dashboard" items={brokerItems} defaultActiveTab="overview" />
  );
}
