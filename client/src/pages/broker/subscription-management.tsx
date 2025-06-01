import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Crown, 
  Package, 
  FileText, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Building,
  Calculator
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  modules: Record<string, string>;
  maxUsers: number;
  maxCompanies: number;
  maxQuotes: number;
  maxSubmissions: number;
}

interface CurrentSubscription {
  subscription: {
    id: number;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  plan: SubscriptionPlan;
}

interface ModuleAccess {
  moduleName: string;
  accessLevel: string;
  isEnabled: boolean;
}

const MODULE_DISPLAY_NAMES = {
  basic_quoting: 'Basic Quoting',
  enhanced_quoting: 'Enhanced Quoting',
  crm: 'CRM Integration',
  client_management: 'Client Management',
  agency_management: 'Agency Management',
  renewal_management: 'Renewal Management',
  employee_benefits: 'Employee Benefits',
};

const ACCESS_LEVEL_BADGES = {
  none: { label: 'No Access', variant: 'secondary' as const, icon: XCircle },
  read: { label: 'Read Only', variant: 'outline' as const, icon: AlertCircle },
  write: { label: 'Full Access', variant: 'default' as const, icon: CheckCircle },
  admin: { label: 'Admin Access', variant: 'default' as const, icon: Crown },
};

export default function SubscriptionManagement() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch current subscription
  const { data: currentSubscription, isLoading: loadingCurrent } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscription/current'],
    retry: false,
  });

  // Fetch available plans
  const { data: availablePlans, isLoading: loadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  // Fetch module access
  const { data: moduleAccess } = useQuery<ModuleAccess[]>({
    queryKey: ['/api/subscription/modules'],
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/subscription/change-plan', { planId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/modules'] });
      toast({
        title: 'Plan Updated',
        description: 'Your subscription plan has been successfully changed.',
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Plan Change Failed',
        description: error.message || 'Failed to change subscription plan.',
        variant: 'destructive',
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (cancelAtPeriodEnd: boolean) => {
      const res = await apiRequest('POST', '/api/subscription/cancel', { cancelAtPeriodEnd });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      toast({
        title: 'Subscription Updated',
        description: 'Your subscription settings have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update subscription.',
        variant: 'destructive',
      });
    },
  });

  if (loadingCurrent || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your subscription plan and billing</p>
        </div>
        {currentSubscription && (
          <Badge variant={currentSubscription.subscription.status === 'active' ? 'default' : 'secondary'}>
            {currentSubscription.subscription.status.toUpperCase()}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Change Plan</TabsTrigger>
          <TabsTrigger value="modules">Module Access</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {currentSubscription ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Plan: {currentSubscription.plan.name}
                </CardTitle>
                <CardDescription>
                  {currentSubscription.plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Max Users: {currentSubscription.plan.maxUsers === -1 ? 'Unlimited' : currentSubscription.plan.maxUsers}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Max Companies: {currentSubscription.plan.maxCompanies === -1 ? 'Unlimited' : currentSubscription.plan.maxCompanies}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Max Quotes: {currentSubscription.plan.maxQuotes === -1 ? 'Unlimited' : currentSubscription.plan.maxQuotes}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Max Submissions: {currentSubscription.plan.maxSubmissions === -1 ? 'Unlimited' : currentSubscription.plan.maxSubmissions}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(currentSubscription.plan.price / 100)}/month
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Next billing: {new Date(currentSubscription.subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      {currentSubscription.subscription.cancelAtPeriodEnd ? (
                        <Button
                          variant="outline"
                          onClick={() => cancelSubscriptionMutation.mutate(false)}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={() => cancelSubscriptionMutation.mutate(true)}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          Cancel at Period End
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  Choose a subscription plan to unlock advanced features and modules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Choose a Plan</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans?.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {currentSubscription?.plan.id === plan.id && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-2xl font-bold">
                    {formatCurrency(plan.price / 100)}<span className="text-sm font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Limits:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Users: {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}</span>
                      <span>Companies: {plan.maxCompanies === -1 ? 'Unlimited' : plan.maxCompanies}</span>
                      <span>Quotes: {plan.maxQuotes === -1 ? 'Unlimited' : plan.maxQuotes}</span>
                      <span>Submissions: {plan.maxSubmissions === -1 ? 'Unlimited' : plan.maxSubmissions}</span>
                    </div>
                  </div>

                  {currentSubscription?.plan.id !== plan.id && (
                    <Button
                      className="w-full"
                      variant={selectedPlan === plan.id ? 'default' : 'outline'}
                      onClick={() => {
                        if (selectedPlan === plan.id) {
                          changePlanMutation.mutate(plan.id);
                        } else {
                          setSelectedPlan(plan.id);
                        }
                      }}
                      disabled={changePlanMutation.isPending}
                    >
                      {selectedPlan === plan.id ? 'Confirm Change' : 'Select Plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Access</CardTitle>
              <CardDescription>
                Your current subscription grants access to the following modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleAccess?.map((module) => {
                  const displayName = MODULE_DISPLAY_NAMES[module.moduleName as keyof typeof MODULE_DISPLAY_NAMES] || module.moduleName;
                  const accessInfo = ACCESS_LEVEL_BADGES[module.accessLevel as keyof typeof ACCESS_LEVEL_BADGES];
                  const IconComponent = accessInfo.icon;

                  return (
                    <div key={module.moduleName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5" />
                        <span className="font-medium">{displayName}</span>
                      </div>
                      <Badge variant={accessInfo.variant}>
                        {accessInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
              <CardDescription>
                Manage your payment methods and view billing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Billing features will be available once Stripe integration is configured.</p>
                <p className="text-sm mt-2">Contact support to set up payment processing.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}