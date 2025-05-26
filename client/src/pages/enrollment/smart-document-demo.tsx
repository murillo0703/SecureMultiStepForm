import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SmartDocumentUpload } from '@/components/smart-document-upload';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw } from 'lucide-react';

export default function SmartDocumentDemo() {
  const [companyData, setCompanyData] = useState({
    hasPriorCoverage: false,
    selectedCarrier: '',
    employeeCount: 25,
    companyState: 'California',
    uploadedDocuments: [],
  });

  const handleDocumentUpload = (docType: string, file: File) => {
    console.log(`Uploading ${docType}:`, file.name);
    // In a real app, this would upload to the server
    setCompanyData(prev => ({
      ...prev,
      uploadedDocuments: [...prev.uploadedDocuments, docType],
    }));
  };

  const handleDocumentRemove = (docType: string) => {
    console.log(`Removing ${docType}`);
    setCompanyData(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter(doc => doc !== docType),
    }));
  };

  const resetDemo = () => {
    setCompanyData({
      hasPriorCoverage: false,
      selectedCarrier: '',
      employeeCount: 25,
      companyState: 'California',
      uploadedDocuments: [],
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Demo Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Smart Document Validation Demo</h1>
        <p className="text-gray-600">
          Watch how document requirements change based on company details and carrier selection
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Company Configuration
            <Badge variant="outline" className="ml-auto">
              Dynamic Requirements
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">Selected Carrier</Label>
              <Select
                value={companyData.selectedCarrier}
                onValueChange={value =>
                  setCompanyData(prev => ({ ...prev, selectedCarrier: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None Selected</SelectItem>
                  <SelectItem value="Anthem">Anthem</SelectItem>
                  <SelectItem value="CCSB">CCSB</SelectItem>
                  <SelectItem value="Blue Shield">Blue Shield</SelectItem>
                  <SelectItem value="Kaiser">Kaiser</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employees">Employee Count</Label>
              <Select
                value={companyData.employeeCount.toString()}
                onValueChange={value =>
                  setCompanyData(prev => ({ ...prev, employeeCount: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 employees</SelectItem>
                  <SelectItem value="25">25 employees</SelectItem>
                  <SelectItem value="55">55 employees (triggers large group)</SelectItem>
                  <SelectItem value="100">100 employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prior-coverage">Prior Coverage</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="prior-coverage"
                  checked={companyData.hasPriorCoverage}
                  onCheckedChange={checked =>
                    setCompanyData(prev => ({ ...prev, hasPriorCoverage: checked }))
                  }
                />
                <Label htmlFor="prior-coverage" className="text-sm">
                  {companyData.hasPriorCoverage ? 'Yes' : 'No'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <Button variant="outline" onClick={resetDemo} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          </div>

          {/* Current Configuration Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Current Configuration:</h4>
            <div className="flex flex-wrap gap-2">
              {companyData.selectedCarrier && (
                <Badge variant="outline">Carrier: {companyData.selectedCarrier}</Badge>
              )}
              <Badge variant="outline">Employees: {companyData.employeeCount}</Badge>
              <Badge variant={companyData.hasPriorCoverage ? 'default' : 'secondary'}>
                Prior Coverage: {companyData.hasPriorCoverage ? 'Yes' : 'No'}
              </Badge>
              {companyData.uploadedDocuments.length > 0 && (
                <Badge variant="default">
                  Uploaded: {companyData.uploadedDocuments.length} docs
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Document Upload */}
      <SmartDocumentUpload
        companyData={companyData}
        onDocumentUpload={handleDocumentUpload}
        onDocumentRemove={handleDocumentRemove}
      />

      {/* Demo Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Try These Demo Scenarios:</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Scenario 1:</strong> Select "Anthem" as carrier → Notice Officer Eligibility
              Form appears
            </p>
            <p>
              <strong>Scenario 2:</strong> Toggle "Prior Coverage" to Yes → Prior coverage documents
              are now required
            </p>
            <p>
              <strong>Scenario 3:</strong> Set employees to 55 → Large group ACA documents are added
            </p>
            <p>
              <strong>Scenario 4:</strong> Upload a "DE9C" document → CCSB offer letter requirement
              disappears
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
