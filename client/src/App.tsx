import { Switch, Route, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth-page';
import HomePage from '@/pages/home-page';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminPlanUpload from '@/pages/admin/plan-upload';
import AdminControlCenter from '@/pages/admin/control-center';
import MasterAdminDashboard from '@/pages/master-admin/dashboard';
import EmployerDashboard from '@/pages/employer/dashboard';
import EmployerOnboarding from '@/pages/employer/onboarding';
import QuoteBuilder from '@/pages/quoting/quote-builder';
import AdvancedQuoteEngine from '@/pages/quoting/advanced-quote-engine';
import CompanySetup from '@/pages/quoting/company-setup';
import BenefitSelection from '@/pages/quoting/benefit-selection';
import EmployeeManagementQuoting from '@/pages/quoting/employee-management';
import CarrierSelection from '@/pages/quoting/carrier-selection';
import PlanFiltering from '@/pages/quoting/plan-filtering';
import ProposalGeneration from '@/pages/quoting/proposal-generation';
import EmployeeEnrollment from '@/pages/enrollment-management/employee-enrollment';
import RenewalManager from '@/pages/renewals/renewal-manager';
import EmployeePortal from '@/pages/employee-portal';
import BrokerManagement from '@/pages/master-admin/brokers';
import LocationManagement from '@/pages/employer/location-management';
import CompanyManagement from '@/pages/employer/company-management';
import EmployeeManagement from '@/pages/employer/employee-management';
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
import DocumentManager from '@/pages/document-manager';
import BrokerDashboard from '@/pages/broker/dashboard';
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
      <ProtectedRoute path="/employer/onboarding" component={EmployerOnboarding} />

      {/* Employee Portal */}
      <ProtectedRoute path="/employee-portal" component={EmployeePortal} />

      {/* Quote Builder Routes */}
      <ProtectedRoute path="/quoting/quote-builder" component={QuoteBuilder} />
      <ProtectedRoute path="/quoting/advanced-quote-engine" component={AdvancedQuoteEngine} />
      <ProtectedRoute path="/quotes/builder" component={QuoteBuilder} />
      <ProtectedRoute path="/quotes" component={QuoteBuilder} />
      
      {/* Comprehensive Quoting Engine Workflow */}
      <ProtectedRoute path="/quoting/company-setup" component={CompanySetup} />
      <ProtectedRoute path="/quoting/benefit-selection" component={BenefitSelection} />
      <ProtectedRoute path="/quoting/employee-management" component={EmployeeManagementQuoting} />
      <ProtectedRoute path="/quoting/carrier-selection" component={CarrierSelection} />
      <ProtectedRoute path="/quoting/plan-filtering" component={PlanFiltering} />
      <ProtectedRoute path="/quoting/proposal-generation" component={ProposalGeneration} />

      {/* Document Manager */}
      <ProtectedRoute path="/document-manager" component={DocumentManager} />
      <ProtectedRoute path="/documents" component={DocumentManager} />

      {/* Employer Location Management */}
      <ProtectedRoute path="/employer/location-management" component={LocationManagement} />
      <ProtectedRoute path="/employer/employee-management" component={EmployeeManagement} />

      {/* Broker Dashboard and Management */}
      <ProtectedRoute path="/broker/dashboard" component={BrokerDashboard} />
      <ProtectedRoute path="/broker/company-management" component={CompanyManagement} />

      {/* Employee Enrollment Management Routes */}
      <ProtectedRoute path="/enrollment-management/employee-enrollment" component={EmployeeEnrollment} />
      <ProtectedRoute path="/enrollment-management" component={EmployeeEnrollment} />
      <ProtectedRoute path="/employee-enrollment" component={EmployeeEnrollment} />

      {/* Renewal Management Routes */}
      <ProtectedRoute path="/renewals/renewal-manager" component={RenewalManager} />
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
