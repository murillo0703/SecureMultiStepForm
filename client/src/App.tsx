import { Switch, Route, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth-page';
import HomePage from '@/pages/home-page';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminPlanUpload from '@/pages/admin/plan-upload';
import AdminControlCenter from '@/pages/admin/control-center';
import MasterAdminDashboard from '@/pages/master-admin/dashboard';
import BrokerDashboard from '@/pages/broker/dashboard';
import EmployerDashboard from '@/pages/employer/dashboard';
import QuoteBuilder from '@/pages/quoting/quote-builder';
import EmployeeEnrollment from '@/pages/enrollment-management/employee-enrollment';
import RenewalManager from '@/pages/renewals/renewal-manager';
import EmployeePortal from '@/pages/employee-portal';
import BrokerManagement from '@/pages/master-admin/brokers';
import ApplicationInitiator from '@/pages/enrollment/application-initiator';
import CarriersPage from '@/pages/enrollment/carriers';
import CompanyInformation from '@/pages/enrollment/company-information';


import OwnershipInfo from '@/pages/enrollment/ownership-simple';
import AuthorizedContact from '@/pages/enrollment/authorized-contact';
import EmployeeInfo from '@/pages/enrollment/employee-info';
import DocumentUpload from '@/pages/enrollment/document-upload';
import PlanSelection from '@/pages/enrollment/plan-selection';
import ContributionSetup from '@/pages/enrollment/contribution-setup';
import ReviewSubmit from '@/pages/enrollment/review-submit';
import Signature from '@/pages/enrollment/signature';
import ComingSoonPage from '@/pages/enrollment/coming-soon';
import BrokerSettingsPage from '@/pages/broker-settings';
import { ProtectedRoute } from '@/lib/protected-route';
import { getBrandConfig } from '@/lib/brand-config';
import { RoleSwitcher } from '@/components/role-switcher';
import { UnifiedNavigation } from '@/components/unified-navigation';
import { useAuth } from '@/hooks/use-auth';

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />

      {/* Master Admin Routes */}
      <ProtectedRoute path="/master-admin/dashboard" component={MasterAdminDashboard} />
      <ProtectedRoute path="/master-admin/brokers" component={BrokerManagement} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminControlCenter} />
      <ProtectedRoute path="/admin/control-center" component={AdminControlCenter} />

      {/* Broker Routes */}
      <ProtectedRoute path="/broker/dashboard" component={BrokerDashboard} />
      <ProtectedRoute path="/broker/settings" component={BrokerSettingsPage} />
      
      {/* Employer Routes */}
      <ProtectedRoute path="/employer/dashboard" component={EmployerDashboard} />

      {/* Employee Portal */}
      <ProtectedRoute path="/employee-portal" component={EmployeePortal} />

      {/* Quote Builder Routes */}
      <ProtectedRoute path="/quotes/builder" component={QuoteBuilder} />
      <ProtectedRoute path="/quotes" component={QuoteBuilder} />

      {/* Employee Enrollment Management Routes */}
      <ProtectedRoute path="/enrollment-management" component={EmployeeEnrollment} />
      <ProtectedRoute path="/employee-enrollment" component={EmployeeEnrollment} />

      {/* Renewal Management Routes */}
      <ProtectedRoute path="/renewals" component={RenewalManager} />
      <ProtectedRoute path="/renewal-manager" component={RenewalManager} />

      {/* Enrollment Routes */}
      <ProtectedRoute path="/enrollment/application-initiator" component={ApplicationInitiator} />
      <ProtectedRoute path="/enrollment/carriers" component={CarriersPage} />
      <ProtectedRoute path="/enrollment/company" component={CompanyInformation} />
      <ProtectedRoute path="/enrollment/company-info" component={CompanyInformation} />

      <ProtectedRoute path="/enrollment/ownership" component={OwnershipInfo} />
      <ProtectedRoute path="/enrollment/ownership-info" component={OwnershipInfo} />
      <ProtectedRoute path="/enrollment/authorized-contact" component={AuthorizedContact} />
      <ProtectedRoute path="/enrollment/employees" component={EmployeeInfo} />
      <ProtectedRoute path="/enrollment/employee-info" component={EmployeeInfo} />
      <ProtectedRoute path="/enrollment/documents" component={DocumentUpload} />
      <ProtectedRoute path="/enrollment/document-upload" component={DocumentUpload} />
      <ProtectedRoute
        path="/enrollment/smart-documents"
        component={() => {
          const SmartDocumentDemo = require('@/pages/enrollment/smart-document-demo').default;
          return <SmartDocumentDemo />;
        }}
      />
      <ProtectedRoute path="/enrollment/plans" component={PlanSelection} />
      <ProtectedRoute path="/enrollment/plan-selection" component={PlanSelection} />
      <ProtectedRoute path="/enrollment/contributions" component={ContributionSetup} />
      <ProtectedRoute path="/enrollment/contribution-setup" component={ContributionSetup} />
      <ProtectedRoute path="/enrollment/review" component={ReviewSubmit} />
      <ProtectedRoute path="/enrollment/review-submit" component={ReviewSubmit} />

      {/* Company-specific Routes */}
      <ProtectedRoute path="/enrollment/:companyId/signature" component={Signature} />

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Don't show navigation on auth page
  const showNavigation = user && location !== '/auth';
  
  return (
    <>
      {showNavigation && <UnifiedNavigation />}
      <Router />
      <RoleSwitcher />
    </>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  );
}

export default App;
