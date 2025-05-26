import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Filter,
  Calendar,
  Building,
} from 'lucide-react';
import { Plan } from '@shared/schema';
import { format } from 'date-fns';

export default function AdminPlanUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Fetch existing plans
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['/api/admin/plans'],
    enabled: !!user && user.role === 'admin',
  });

  // Get unique carriers from existing plans
  const carriers = [...new Set(plans.map(plan => plan.carrier))].sort();

  // Excel upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('planFile', file);

      const res = await fetch('/api/admin/plans/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return await res.json();
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/plans'] });
      toast({
        title: 'Plans uploaded successfully',
        description: `${data.count} plans have been added to the system.`,
      });
      setUploadFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an Excel file (.xlsx or .xls).',
          variant: 'destructive',
        });
        return;
      }

      setUploadFile(file);
    }
  };

  // Upload file
  const handleUpload = () => {
    if (uploadFile) {
      uploadMutation.mutate(uploadFile);
    }
  };

  // Filter plans based on carrier and date
  const filteredPlans = plans.filter(plan => {
    if (selectedCarrier && plan.carrier !== selectedCarrier) return false;
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      const startDate = new Date(plan.effectiveStart);
      const endDate = new Date(plan.effectiveEnd);
      if (filterDate < startDate || filterDate > endDate) return false;
    }
    return true;
  });

  // Check if user has admin access
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>Only administrators can access plan upload.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Plan Management</h1>
          <p className="mt-1 text-gray-600">
            Upload Excel files with plan data and manage carrier-specific plans
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Excel Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Excel Upload
              </CardTitle>
              <CardDescription>
                Upload an Excel file (.xlsx) with plan data including:
                <br />• Carrier
                <br />• Plan Name
                <br />• Plan Type (PPO, HMO, EPO)
                <br />• Metal Tier (Bronze, Silver, Gold, Platinum)
                <br />• Contract Code
                <br />• Effective Start Date
                <br />• Effective End Date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="plan-upload" className="sr-only">
                    Choose Excel file
                  </Label>
                  <Input
                    id="plan-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>

                {uploadFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{uploadFile.name}</span>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploadMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Plans'}
                </Button>
              </div>

              {/* Upload Status */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  Duplicate plans (same carrier + name + period) will be skipped
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4" />
                  All new plans will be validated before saving
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Plan Preview
              </CardTitle>
              <CardDescription>
                Filter and preview available plans by carrier and effective date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="carrier-filter">Carrier</Label>
                  <select
                    id="carrier-filter"
                    value={selectedCarrier}
                    onChange={e => setSelectedCarrier(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">All Carriers</option>
                    {carriers.map(carrier => (
                      <option key={carrier} value={carrier}>
                        {carrier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="date-filter">Coverage Date</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Plan List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoadingPlans ? (
                  <div className="text-sm text-gray-500">Loading plans...</div>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map(plan => (
                    <div key={plan.id} className="p-3 border rounded-lg bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{plan.planName}</div>
                        <div className="text-xs text-gray-500">{plan.metalTier}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building className="h-3 w-3" />
                        {plan.carrier} • {plan.planType}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(plan.effectiveStart), 'MMM d, yyyy')} -{' '}
                        {format(new Date(plan.effectiveEnd), 'MMM d, yyyy')}
                      </div>
                      {plan.contractCode && (
                        <div className="text-xs text-gray-500">Contract: {plan.contractCode}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No plans found matching the selected filters.
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="pt-3 border-t text-sm text-gray-600">
                Showing {filteredPlans.length} of {plans.length} total plans
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
