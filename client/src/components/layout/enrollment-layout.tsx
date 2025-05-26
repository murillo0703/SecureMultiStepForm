import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { ProgressSidebar } from '@/components/enrollment/progress-sidebar';
import { BrokerAdminMenu } from '@/components/broker-admin-menu';
import { useAuth } from '@/hooks/use-auth';

interface EnrollmentLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: ReactNode;
}

export function EnrollmentLayout({ children, title, subtitle, icon }: EnrollmentLayoutProps) {
  const { user } = useAuth();

  // Determine which sidebar to show based on user role
  const showBrokerAdminMenu =
    user?.role === 'admin' ||
    user?.role === 'broker' ||
    user?.role === 'owner' ||
    user?.role === 'staff';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Left Panel - Dynamic based on user role */}
            <div className="w-80 flex-shrink-0">
              {showBrokerAdminMenu ? <BrokerAdminMenu /> : <ProgressSidebar />}
            </div>

            {/* Right Panel - Dynamic Content */}
            <div className="flex-1">
              {/* Page Header */}
              <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                  {icon && (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {icon}
                    </div>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600">{subtitle}</p>
              </div>

              {/* Dynamic Content */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
