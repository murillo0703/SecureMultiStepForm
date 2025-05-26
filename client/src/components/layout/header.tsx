import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown, 
  Menu,
  Code,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const roleSwitchMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/dev/switch-role", { role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.reload(); // Refresh to update the interface
    },
  });

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const userInitials = user.companyName 
    ? user.companyName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()
    : user.username.slice(0, 2).toUpperCase();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg 
                viewBox="0 0 24 24" 
                width="32" 
                height="32" 
                className="text-primary"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span className="ml-2 font-semibold text-primary text-lg hidden sm:inline-block">
                Submission Portal
              </span>
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center space-x-2 p-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-sm font-medium">{userInitials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.companyName || user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    {isAdmin && (
                      <Link 
                        href="/admin/dashboard"
                        className="flex items-center p-2 rounded-md hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link 
                      href="/"
                      className="flex items-center p-2 rounded-md hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Submission Portal
                    </Link>
                    <button 
                      onClick={() => logoutMutation.mutate()}
                      className="flex items-center p-2 text-red-600 rounded-md hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <Link href="/">
                <Button variant="outline" size="sm">
                  Return to Enrollment Portal
                </Button>
              </Link>
            )}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-sm font-medium">{userInitials}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mr-2 hidden md:block">
                      {user.companyName || user.username}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.username}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/admin/dashboard">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/">
                      Submission Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500">Developer Tools</DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="cursor-pointer text-blue-600"
                    onClick={() => roleSwitchMutation.mutate('admin')}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    <span>Switch to Admin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-blue-600"
                    onClick={() => roleSwitchMutation.mutate('employer')}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    <span>Switch to Employer</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminHeader() {
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  return (
    <header className="bg-primary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/dashboard">
              <a className="flex items-center">
                <svg 
                  viewBox="0 0 24 24" 
                  width="32" 
                  height="32" 
                  className="text-white"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <span className="ml-2 font-semibold text-white text-lg">
                  Admin Dashboard
                </span>
              </a>
            </Link>
          </div>
          <div className="flex items-center">
            <span className="text-white text-sm mr-4">Hello, {user.username}</span>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
