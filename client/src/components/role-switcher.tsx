import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, User, Building, Shield, Users, ChevronDown, ChevronUp } from 'lucide-react';

const roleConfigs = {
  admin: {
    name: 'System Admin',
    icon: Shield,
    color: 'bg-red-100 text-red-800',
    description: 'Full system access, manage all brokers and plans',
    features: ['Plan upload', 'All brokers view', 'System settings'],
  },
  owner: {
    name: 'Broker Owner',
    icon: Building,
    color: 'bg-blue-100 text-blue-800',
    description: 'White-label broker account with full agency control',
    features: ['Agency branding', 'User management', 'Client enrollment'],
  },
  staff: {
    name: 'Broker Staff',
    icon: Users,
    color: 'bg-green-100 text-green-800',
    description: 'Broker agency staff member',
    features: ['Client enrollment', 'Limited settings'],
  },
  employer: {
    name: 'Employer',
    icon: User,
    color: 'bg-gray-100 text-gray-800',
    description: 'Company completing insurance enrollment',
    features: ['Enrollment process', 'Document upload', 'Plan selection'],
  },
};

export function RoleSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      const res = await apiRequest('POST', '/api/dev/switch-role', { role: newRole });
      return await res.json();
    },
    onSuccess: data => {
      // Instantly update the user data in cache
      queryClient.setQueryData(['/api/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });

      toast({
        title: 'Role switched',
        description: `You are now logged in as ${roleConfigs[data.role as keyof typeof roleConfigs]?.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Role switch failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRoleSwitch = (role: string) => {
    switchRoleMutation.mutate(role);
  };

  const currentRoleConfig = user ? roleConfigs[user.role as keyof typeof roleConfigs] : null;

  if (!user || !currentRoleConfig) return null;

  // Hide developer panel - now available in header dropdown
  return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-blue-200 z-50">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm">Developer Panel</CardTitle>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
        <div className="flex items-center gap-2">
          <currentRoleConfig.icon className="h-4 w-4" />
          <Badge className={currentRoleConfig.color}>{currentRoleConfig.name}</Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <CardDescription className="text-xs">
            Switch between user roles to test different experiences in your white-label insurance
            platform.
          </CardDescription>

          <div className="space-y-2">
            {Object.entries(roleConfigs).map(([roleKey, config]) => {
              const Icon = config.icon;
              const isCurrentRole = user.role === roleKey;

              return (
                <div key={roleKey} className="space-y-1">
                  <Button
                    variant={isCurrentRole ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleSwitch(roleKey)}
                    disabled={isCurrentRole || switchRoleMutation.isPending}
                    className="w-full justify-start"
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    {config.name}
                    {isCurrentRole && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Current
                      </Badge>
                    )}
                  </Button>

                  {isCurrentRole && (
                    <div className="ml-2 space-y-1">
                      <p className="text-xs text-gray-600">{config.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {config.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs py-0">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {switchRoleMutation.isPending && (
            <div className="text-center text-xs text-gray-500">Switching roles...</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
