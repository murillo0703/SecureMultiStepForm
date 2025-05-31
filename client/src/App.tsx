import React from 'react';
import { Switch, Route } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AuthPage from '@/pages/auth-page';
import HomePage from '@/pages/home-page';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminPlanUpload from '@/pages/admin/plan-upload';
import AdminControlCenter from '@/pages/admin/control-center';
import BrokerDashboard from '@/pages/broker-dashboard';
import ApplicationInitiator from '@/pages/enrollment/application-initiator';
import CarriersPage from '@/pages/enrollment/carriers';
import CompanyInformation from '@/pages/enrollment/company-information';
import OwnershipInfo from '@/pages/enrollment/ownership-simple';

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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminControlCenter} />
      <ProtectedRoute path="/admin/control-center" component={AdminControlCenter} />

      {/* Broker Routes */}
      <ProtectedRoute path="/broker/dashboard" component={BrokerDashboard} />
      <ProtectedRoute path="/broker/settings" component={BrokerSettingsPage} />

      {/* Enrollment Routes */}
      <ProtectedRoute path="/enrollment/application-initiator" component={ApplicationInitiator} />
      <ProtectedRoute path="/enrollment/carriers" component={CarriersPage} />
      <ProtectedRoute path="/enrollment/company" component={CompanyInformation} />
      <ProtectedRoute path="/enrollment/company-info" component={CompanyInformation} />

      <ProtectedRoute path="/enrollment/ownership" component={OwnershipInfo} />
      <ProtectedRoute path="/enrollment/ownership-info" component={OwnershipInfo} />
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

function App() {
  return (
    <TooltipProvider>
      <Router />
      <RoleSwitcher />
    </TooltipProvider>
  );
}

export default App;
