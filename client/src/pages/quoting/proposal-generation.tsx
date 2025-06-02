import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Download, 
  Send,
  Eye,
  CheckCircle,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Printer,
  Mail,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProposalSections {
  coverPage: boolean;
  executiveSummary: boolean;
  companyCensus: boolean;
  sideByeSideComparison: boolean;
  masterPlanList: boolean;
  benefitSummary: boolean;
  contributionSummary: boolean;
  implementationTimeline: boolean;
  carrierContacts: boolean;
  customSections: string[];
}

interface ProposalData {
  company: any;
  employees: any[];
  selectedPlans: any[];
  contributionModels: any;
  totalPremium: number;
  employerCosts: number;
  employeeCosts: number;
}

export default function ProposalGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  
  const [proposalSections, setProposalSections] = useState<ProposalSections>({
    coverPage: true,
    executiveSummary: true,
    companyCensus: true,
    sideByeSideComparison: true,
    masterPlanList: true,
    benefitSummary: true,
    contributionSummary: true,
    implementationTimeline: true,
    carrierContacts: true,
    customSections: [],
  });
  
  const [customSection, setCustomSection] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: quote } = useQuery({
    queryKey: ['/api/quotes', quoteId],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID required');
      const response = await apiRequest('GET', `/api/quotes/${quoteId}`);
      return response.json();
    },
    enabled: !!quoteId,
  });

  const { data: proposalData } = useQuery({
    queryKey: ['/api/quotes', quoteId, 'proposal-data'],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID required');
      const response = await apiRequest('GET', `/api/quotes/${quoteId}/proposal-data`);
      return response.json();
    },
    enabled: !!quoteId,
  });

  const generateProposalMutation = useMutation({
    mutationFn: async (sections: ProposalSections) => {
      setIsGenerating(true);
      const response = await apiRequest('POST', `/api/quotes/${quoteId}/generate-proposal`, {
        sections,
        notes: proposalNotes,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/quotes', quoteId] });
      toast({
        title: 'Proposal Generated',
        description: 'Your insurance proposal has been generated successfully.',
      });
      
      // Download the PDF
      if (data.pdfUrl) {
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `Insurance_Proposal_${quote?.company?.name || 'Quote'}.pdf`;
        link.click();
      }
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate proposal',
        variant: 'destructive',
      });
    },
  });

  const sendProposalMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', `/api/quotes/${quoteId}/send-proposal`, {
        email,
        sections: proposalSections,
        notes: proposalNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Sent',
        description: 'The proposal has been sent via email successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send proposal',
        variant: 'destructive',
      });
    },
  });

  const toggleSection = (section: keyof Omit<ProposalSections, 'customSections'>) => {
    setProposalSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addCustomSection = () => {
    if (customSection.trim()) {
      setProposalSections(prev => ({
        ...prev,
        customSections: [...prev.customSections, customSection.trim()],
      }));
      setCustomSection('');
    }
  };

  const removeCustomSection = (index: number) => {
    setProposalSections(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index),
    }));
  };

  const handleGenerateProposal = () => {
    generateProposalMutation.mutate(proposalSections);
  };

  const sectionOptions = [
    { key: 'coverPage', label: 'Cover Page', description: 'Company logo, proposal title, and date' },
    { key: 'executiveSummary', label: 'Executive Summary', description: 'Overview of recommended benefits and costs' },
    { key: 'companyCensus', label: 'Company Census', description: 'Employee demographics and enrollment data' },
    { key: 'sideByeSideComparison', label: 'Side-by-Side Comparison', description: 'Plan feature and cost comparisons' },
    { key: 'masterPlanList', label: 'Master Plan List', description: 'Detailed list of all available plans' },
    { key: 'benefitSummary', label: 'Benefit Summary', description: 'Summary of coverage details by plan type' },
    { key: 'contributionSummary', label: 'Contribution Summary', description: 'Employer vs employee cost breakdown' },
    { key: 'implementationTimeline', label: 'Implementation Timeline', description: 'Steps and timeline for enrollment' },
    { key: 'carrierContacts', label: 'Carrier Contacts', description: 'Contact information for selected carriers' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Proposal Generation</h1>
          <p className="text-xl text-gray-600 mb-4">
            Create a comprehensive insurance proposal with customizable sections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposal Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  Proposal Sections
                </CardTitle>
                <CardDescription>
                  Select which sections to include in your proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectionOptions.map(({ key, label, description }) => (
                    <div key={key} className="flex items-start space-x-3">
                      <Checkbox
                        checked={proposalSections[key]}
                        onCheckedChange={() => toggleSection(key)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label className="text-sm font-medium cursor-pointer">
                          {label}
                        </label>
                        <p className="text-xs text-gray-600">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Custom Sections</h4>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add custom section title..."
                      value={customSection}
                      onChange={(e) => setCustomSection(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSection()}
                    />
                    <Button onClick={addCustomSection} disabled={!customSection.trim()}>
                      Add
                    </Button>
                  </div>
                  
                  {proposalSections.customSections.length > 0 && (
                    <div className="space-y-2">
                      {proposalSections.customSections.map((section, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{section}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCustomSection(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proposal Notes</CardTitle>
                <CardDescription>
                  Add custom notes or recommendations to include in the proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any additional notes, recommendations, or custom messaging..."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Proposal Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Proposal Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposalData && (
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-lg bg-gray-50">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-semibold">{proposalData.company?.name}</h3>
                      <p className="text-sm text-gray-600">Insurance Benefits Proposal</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 border rounded">
                        <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <div className="font-medium">{proposalData.employees?.length || 0}</div>
                        <div className="text-gray-600">Employees</div>
                      </div>
                      <div className="text-center p-3 border rounded">
                        <FileText className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <div className="font-medium">{proposalData.selectedPlans?.length || 0}</div>
                        <div className="text-gray-600">Plans</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Monthly Premium:</span>
                        <span className="font-medium">${proposalData.totalPremium?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employer Costs:</span>
                        <span className="font-medium text-blue-600">${proposalData.employerCosts?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employee Costs:</span>
                        <span className="font-medium text-green-600">${proposalData.employeeCosts?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate Proposal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateProposal}
                  disabled={isGenerating || !quoteId}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Printer className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF Proposal
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm text-gray-600">
                  or
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const email = prompt('Enter email address to send proposal:');
                    if (email) {
                      sendProposalMutation.mutate(email);
                    }
                  }}
                  disabled={sendProposalMutation.isPending || !quoteId}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Proposal
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Share Link
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule Review
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Selected Sections Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Included Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {sectionOptions
                    .filter(({ key }) => proposalSections[key])
                    .map(({ label }) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {label}
                      </div>
                    ))}
                  
                  {proposalSections.customSections.map((section) => (
                    <div key={section} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      {section}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}