import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Crown,
  Users,
  Building2,
  Calculator,
  FileText,
  UserCheck,
  RefreshCw,
  Settings,
  Menu,
  ChevronDown,
  Eye,
  Upload,
  CreditCard,
  BarChart3,
  Shield,
  Database,
  Zap,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
  requiredRole?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function UnifiedNavigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [currentRole, setCurrentRole] = useState<'master-admin' | 'broker' | 'employer'>('master-admin');

  // Auto-detect role based on current location
  useEffect(() => {
    if (location.startsWith('/master-admin')) {
      setCurrentRole('master-admin');
    } else if (location.startsWith('/broker')) {
      setCurrentRole('broker');
    } else if (location.startsWith('/employer')) {
      setCurrentRole('employer');
    }
  }, [location]);

  const handleRoleSwitch = (role: 'master-admin' | 'broker' | 'employer') => {
    setCurrentRole(role);
    // Navigate to the appropriate dashboard for the selected role
    switch (role) {
      case 'master-admin':
        setLocation('/master-admin/dashboard');
        break;
      case 'broker':
        setLocation('/broker/dashboard');
        break;
      case 'employer':
        setLocation('/employer/dashboard');
        break;
    }
  };

  const navigationSections: Record<string, NavSection[]> = {
    'master-admin': [
      {
        title: 'Platform Management',
        items: [
          {
            title: 'Master Dashboard',
            href: '/master-admin/dashboard',
            icon: <Crown className="w-4 h-4" />,
            description: 'Platform overview and analytics'
          },
          {
            title: 'Broker Management',
            href: '/master-admin/brokers',
            icon: <Users className="w-4 h-4" />,
            description: 'Manage broker accounts and permissions'
          },
          {
            title: 'Billing & Subscriptions',
            href: '/master-admin/billing',
            icon: <CreditCard className="w-4 h-4" />,
            description: 'View broker billing and subscription tiers'
          },
          {
            title: 'Platform Settings',
            href: '/master-admin/settings',
            icon: <Settings className="w-4 h-4" />,
            description: 'Global platform configuration'
          }
        ]
      },
      {
        title: 'Broker Tools Access',
        items: [
          {
            title: 'Quote Builder',
            href: '/quotes/builder',
            icon: <Calculator className="w-4 h-4" />,
            description: 'Generate quotes for any broker client'
          },
          {
            title: 'Employee Enrollment',
            href: '/enrollment-management',
            icon: <UserCheck className="w-4 h-4" />,
            description: 'Manage employee benefit enrollments'
          },
          {
            title: 'Renewal Manager',
            href: '/renewals',
            icon: <RefreshCw className="w-4 h-4" />,
            description: 'Handle policy renewals and rate changes'
          },
          {
            title: 'Document Center',
            href: '/documents',
            icon: <FileText className="w-4 h-4" />,
            description: 'Access all uploaded documents'
          }
        ]
      },
      {
        title: 'Employer View Access',
        items: [
          {
            title: 'Employer Dashboard',
            href: '/employer/dashboard',
            icon: <Building2 className="w-4 h-4" />,
            description: 'View employer backend interface'
          },
          {
            title: 'Employee Portal',
            href: '/employee-portal',
            icon: <Eye className="w-4 h-4" />,
            description: 'See employee enrollment experience'
          }
        ]
      }
    ],
    'broker': [
      {
        title: 'Client Management',
        items: [
          {
            title: 'Broker Dashboard',
            href: '/broker/dashboard',
            icon: <BarChart3 className="w-4 h-4" />,
            description: 'Overview of all clients and activities'
          },
          {
            title: 'Client Companies',
            href: '/broker/companies',
            icon: <Building2 className="w-4 h-4" />,
            description: 'Manage employer clients'
          },
          {
            title: 'Submissions Tracker',
            href: '/broker/submissions',
            icon: <FileText className="w-4 h-4" />,
            description: 'Track application submissions and status'
          }
        ]
      },
      {
        title: 'Quoting & Enrollment',
        items: [
          {
            title: 'Basic Quote Builder',
            href: '/quoting/quote-builder',
            icon: <Calculator className="w-4 h-4" />,
            description: 'Simple quoting tool'
          },
          {
            title: 'Advanced Quote Engine',
            href: '/quoting/advanced-quote-engine',
            icon: <Zap className="w-4 h-4" />,
            description: 'Comprehensive quoting with premium features',
            badge: 'Premium'
          },
          {
            title: 'Company Management',
            href: '/employer/company-management',
            icon: <Building2 className="w-4 h-4" />,
            description: 'Manage client company data and locations'
          },
          {
            title: 'Employee Enrollment',
            href: '/enrollment-management/employee-enrollment',
            icon: <UserCheck className="w-4 h-4" />,
            description: 'Manage client employee enrollments',
            badge: 'Pro'
          },
          {
            title: 'Document Management',
            href: '/broker/documents',
            icon: <Upload className="w-4 h-4" />,
            description: 'Client document uploads and storage'
          }
        ]
      },
      {
        title: 'Renewals & Rates',
        items: [
          {
            title: 'Renewal Manager',
            href: '/renewals',
            icon: <RefreshCw className="w-4 h-4" />,
            description: 'Handle policy renewals',
            badge: 'Premium'
          },
          {
            title: 'Rate Management',
            href: '/broker/rates',
            icon: <Database className="w-4 h-4" />,
            description: 'View and manage contribution rates'
          },
          {
            title: 'Employee Portal',
            href: '/employee-portal',
            icon: <Eye className="w-4 h-4" />,
            description: 'Employee enrollment interface'
          }
        ]
      },
      {
        title: 'Settings',
        items: [
          {
            title: 'Broker Settings',
            href: '/broker/settings',
            icon: <Settings className="w-4 h-4" />,
            description: 'Configure broker preferences'
          }
        ]
      }
    ],
    'employer': [
      {
        title: 'My Company',
        items: [
          {
            title: 'Employer Dashboard',
            href: '/employer/dashboard',
            icon: <Building2 className="w-4 h-4" />,
            description: 'Company overview and applications'
          },
          {
            title: 'Company Management',
            href: '/employer/company-management',
            icon: <Building2 className="w-4 h-4" />,
            description: 'Manage company data and locations'
          },
          {
            title: 'Employee Management',
            href: '/employer/employees',
            icon: <Users className="w-4 h-4" />,
            description: 'Manage employee information'
          },
          {
            title: 'Documents',
            href: '/employer/documents',
            icon: <FileText className="w-4 h-4" />,
            description: 'Upload and manage company documents'
          }
        ]
      },
      {
        title: 'Benefits Administration',
        items: [
          {
            title: 'Get Quotes',
            href: '/quoting/quote-builder',
            icon: <Calculator className="w-4 h-4" />,
            description: 'Self-service quote generation'
          },
          {
            title: 'Employee Enrollment',
            href: '/enrollment-management/employee-enrollment',
            icon: <UserCheck className="w-4 h-4" />,
            description: 'Manage employee benefit selections'
          },
          {
            title: 'Employee Portal',
            href: '/employee-portal',
            icon: <Eye className="w-4 h-4" />,
            description: 'Employee enrollment experience'
          }
        ]
      },
      {
        title: 'Renewals & Reporting',
        items: [
          {
            title: 'Policy Renewals',
            href: '/renewals/renewal-manager',
            icon: <RefreshCw className="w-4 h-4" />,
            description: 'View and manage policy renewals'
          },
          {
            title: 'Contributions Setup',
            href: '/employer/contributions',
            icon: <Database className="w-4 h-4" />,
            description: 'Configure employer contribution rates'
          }
        ]
      }
    ]
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master-admin':
        return <Crown className="w-4 h-4" />;
      case 'broker':
        return <Shield className="w-4 h-4" />;
      case 'employer':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'master-admin':
        return 'Master Administrator';
      case 'broker':
        return 'Broker Portal';
      case 'employer':
        return 'Employer Portal';
      default:
        return 'Portal';
    }
  };

  const currentSections = navigationSections[currentRole] || [];

  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-4">
        {/* Logo/Brand */}
        <div className="mr-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-lg">Murillo Insurance</span>
          </Link>
        </div>

        {/* Role Switcher */}
        <div className="mr-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                {getRoleIcon(currentRole)}
                <span>{getRoleTitle(currentRole)}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => handleRoleSwitch('master-admin')}>
                <Crown className="w-4 h-4 mr-2" />
                Master Administrator
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleSwitch('broker')}>
                <Shield className="w-4 h-4 mr-2" />
                Broker Portal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleSwitch('employer')}>
                <Building2 className="w-4 h-4 mr-2" />
                Employer Portal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {currentSections.map((section) => (
              <NavigationMenuItem key={section.title}>
                <NavigationMenuTrigger className="h-9">
                  {section.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[500px] lg:w-[600px] lg:grid-cols-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group grid h-auto w-full items-center justify-start gap-1 rounded-md p-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                        onClick={() => {
                          // Close the navigation menu when a link is clicked
                          const event = new CustomEvent('closeNavigation');
                          window.dispatchEvent(event);
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <div className="text-sm font-medium leading-none">
                            {item.title}
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <div className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 flex flex-col max-h-screen">
              <div className="p-6 border-b flex-shrink-0">
                <SheetHeader>
                  <SheetTitle>{getRoleTitle(currentRole)}</SheetTitle>
                  <SheetDescription>
                    Navigate through all available modules and tools
                  </SheetDescription>
                </SheetHeader>
                
                {/* Mobile Role Switcher */}
                <div className="mt-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(currentRole)}
                          <span className="text-sm">{getRoleTitle(currentRole)}</span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => handleRoleSwitch('master-admin')}>
                        <Crown className="w-4 h-4 mr-2" />
                        Master Administrator
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleSwitch('broker')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Broker Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleSwitch('employer')}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Employer Portal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {currentSections.map((section) => (
                    <div key={section.title}>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        {section.title}
                      </h4>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center space-x-3 rounded-lg p-3 text-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/50 transition-colors touch-manipulation"
                            onClick={() => {
                              // Close the mobile menu when a link is clicked
                              setTimeout(() => {
                                const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
                                if (closeButton) closeButton.click();
                              }, 100);
                            }}
                          >
                            <div className="flex-shrink-0">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t flex-shrink-0 bg-muted/50">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Murillo Insurance</span>
                  <span>v1.0</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* User Menu */}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block">{user?.name || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Notifications</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}