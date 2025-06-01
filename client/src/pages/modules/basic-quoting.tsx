import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  Building, 
  Users, 
  DollarSign,
  FileText,
  Lock,
  Crown
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface QuoteData {
  companyName: string;
  employeeCount: number;
  location: string;
  industry: string;
  coverageType: string;
  effectiveDate: string;
}

interface QuoteResult {
  id: string;
  companyName: string;
  employeeCount: number;
  estimatedMonthlyCost: number;
  coverageType: string;
  quotedPlans: {
    carrier: string;
    planName: string;
    monthlyCost: number;
    metalTier: string;
  }[];
  createdAt: string;
}

interface ModuleAccessResponse {
  moduleName: string;
  accessLevel: string;
  hasAccess: boolean;
}

export default function BasicQuoting() {
  const [quoteData, setQuoteData] = useState<QuoteData>({
    companyName: '',
    employeeCount: 1,
    location: '',
    industry: '',
    coverageType: 'medical',
    effectiveDate: '',
  });
  const { toast } = useToast();

  // Check module access
  const { data: moduleAccess } = useQuery<ModuleAccessResponse>({
    queryKey: ['/api/subscription/modules/basic_quoting/access'],
  });

  // Get saved quotes
  const { data: savedQuotes } = useQuery<QuoteResult[]>({
    queryKey: ['/api/quotes'],
    enabled: moduleAccess?.hasAccess,
  });

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteData) => {
      // Track usage
      await apiRequest('POST', '/api/subscription/usage', {
        moduleName: 'basic_quoting',
        action: 'quote_created',
        resourceId: `quote_${Date.now()}`,
      });

      const res = await apiRequest('POST', '/api/quotes', data);
      return await res.json();
    },
    onSuccess: (result: QuoteResult) => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      toast({
        title: 'Quote Generated',
        description: `Quote created for ${result.companyName} with estimated cost of ${formatCurrency(result.estimatedMonthlyCost / 100)}/month`,
      });
      // Reset form
      setQuoteData({
        companyName: '',
        employeeCount: 1,
        location: '',
        industry: '',
        coverageType: 'medical',
        effectiveDate: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Quote Generation Failed',
        description: error.message || 'Failed to generate quote.',
        variant: 'destructive',
      });
    },
  });

  // No access component
  if (!moduleAccess?.hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Basic Quoting Module</CardTitle>
              <CardDescription>
                This module is not included in your current subscription plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade your subscription to access basic quoting features including:
              </p>
              <ul className="text-sm text-left max-w-sm mx-auto space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  Quick insurance quotes
                </li>
                <li className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Company information management
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Quote history and tracking
                </li>
              </ul>
              <Button>Upgrade Subscription</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Read-only access
  if (moduleAccess.accessLevel === 'read') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Basic Quoting</h1>
            <p className="text-muted-foreground">View and manage insurance quotes</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Read Only
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Previous Quotes</CardTitle>
            <CardDescription>
              View your quote history. Upgrade to create new quotes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedQuotes && savedQuotes.length > 0 ? (
              <div className="space-y-4">
                {savedQuotes.map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{quote.companyName}</h3>
                      <Badge variant="outline">
                        {formatCurrency(quote.estimatedMonthlyCost / 100)}/month
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <span>Employees: {quote.employeeCount}</span>
                      <span>Coverage: {quote.coverageType}</span>
                      <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                      <span>Plans: {quote.quotedPlans.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No quotes found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full access (write/admin)
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Basic Quoting</h1>
          <p className="text-muted-foreground">Generate insurance quotes for your clients</p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          {moduleAccess.accessLevel === 'admin' ? <Crown className="h-3 w-3" /> : null}
          {moduleAccess.accessLevel === 'admin' ? 'Admin Access' : 'Full Access'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Create New Quote
            </CardTitle>
            <CardDescription>
              Enter company details to generate an insurance quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={quoteData.companyName}
                onChange={(e) => setQuoteData({ ...quoteData, companyName: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeCount">Number of Employees</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="1"
                  value={quoteData.employeeCount}
                  onChange={(e) => setQuoteData({ ...quoteData, employeeCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={quoteData.location}
                  onChange={(e) => setQuoteData({ ...quoteData, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={quoteData.industry} onValueChange={(value) => setQuoteData({ ...quoteData, industry: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="professional-services">Professional Services</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coverageType">Coverage Type</Label>
              <Select value={quoteData.coverageType} onValueChange={(value) => setQuoteData({ ...quoteData, coverageType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Only</SelectItem>
                  <SelectItem value="medical-dental">Medical + Dental</SelectItem>
                  <SelectItem value="full-benefits">Full Benefits Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={quoteData.effectiveDate}
                onChange={(e) => setQuoteData({ ...quoteData, effectiveDate: e.target.value })}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => createQuoteMutation.mutate(quoteData)}
              disabled={createQuoteMutation.isPending || !quoteData.companyName || !quoteData.location}
            >
              {createQuoteMutation.isPending ? 'Generating Quote...' : 'Generate Quote'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Quotes
            </CardTitle>
            <CardDescription>
              Your recently generated quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedQuotes && savedQuotes.length > 0 ? (
              <div className="space-y-4">
                {savedQuotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{quote.companyName}</h3>
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          {formatCurrency(quote.estimatedMonthlyCost / 100)}/mo
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {quote.employeeCount} employees
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {quote.coverageType}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {quote.quotedPlans.length} plan options • {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotes yet. Create your first quote using the form.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}