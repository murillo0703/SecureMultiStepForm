import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Home
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  component: ReactNode;
  roles?: string[]; // Which roles can see this item
  badge?: string; // Optional badge text
}

interface TwoPanelLayoutProps {
  title: string;
  items: SidebarItem[];
  defaultActiveTab?: string;
  className?: string;
}

export function TwoPanelLayout({ 
  title, 
  items, 
  defaultActiveTab, 
  className 
}: TwoPanelLayoutProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultActiveTab || items[0]?.id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/dev/switch-role", { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = '/';
    }
  });

  // Filter items based on user role
  const visibleItems = items.filter(item => 
    !item.roles || item.roles.includes(user?.role || "")
  );

  const activeItem = visibleItems.find(item => item.id === activeTab);

  // Save active tab to localStorage for persistence
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem(`activeTab-${title}`, tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className={cn("flex min-h-screen bg-gray-50", className)}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 z-50",
        sidebarCollapsed ? "w-16" : "w-64",
        "hidden lg:block", // Hide on mobile, show on large screens
        mobileMenuOpen && "fixed inset-y-0 left-0 w-64 lg:relative" // Mobile menu
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
                  "hover:bg-gray-100",
                  activeTab === item.id 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-700"
                )}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-medium">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => switchRoleMutation.mutate('employer')}
                disabled={switchRoleMutation.isPending}
              >
                <Home className="h-4 w-4 mr-2" />
                {switchRoleMutation.isPending ? 'Switching...' : 'Return to Submission Portal'}
              </Button>
              <div className="text-xs text-gray-500">
                Logged in as {user?.role}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Breadcrumb Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{title}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {activeItem?.label}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeItem?.component || (
            <div className="text-center text-gray-500 mt-8">
              Select an item from the sidebar to get started
            </div>
          )}
        </div>
      </main>
    </div>
  );
}