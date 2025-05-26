import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { EnrollmentChecklist } from '@/components/enrollment/checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function OwnershipSimple() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <EnrollmentChecklist 
              companyId={1}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  Ownership Information
                </CardTitle>
                <p className="text-gray-600">
                  Provide information about company owners and authorized contacts
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ownership Information Page
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This page is working! Navigation from company information is now successful.
                  </p>
                  <p className="text-sm text-gray-500">
                    The detailed ownership form will be implemented next.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/enrollment/company-information')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Company Information
                  </Button>
                  <Button
                    onClick={() => setLocation('/enrollment/authorized-contact')}
                    className="flex items-center gap-2"
                  >
                    Continue to Authorized Contact
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}