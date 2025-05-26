import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ShieldCheck, AlertTriangle, User, Calendar, FileText } from 'lucide-react';

interface DocumentOverridePanelProps {
  companyId: number;
  companyName: string;
  missingRequirements: string[];
  onOverrideApplied: () => void;
  featureEnabled?: boolean;
}

export function DocumentOverridePanel({
  companyId,
  companyName,
  missingRequirements,
  onOverrideApplied,
  featureEnabled = true,
}: DocumentOverridePanelProps) {
  const { user } = useAuth();
  const [overrideReason, setOverrideReason] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  // Check if user can override based on role
  const canOverride = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'staff';

  const overrideMutation = useMutation({
    mutationFn: async (data: { companyId: number; reason: string }) => {
      const res = await apiRequest('POST', '/api/admin/document-override', data);
      return await res.json();
    },
    onSuccess: () => {
      setOverrideReason('');
      setShowPanel(false);
      onOverrideApplied();
    },
  });

  if (!featureEnabled || !canOverride || missingRequirements.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Document Override Panel
            <Badge variant="outline" className="text-xs">
              {user?.role?.toUpperCase()} Access
            </Badge>
          </CardTitle>
          <Switch
            checked={showPanel}
            onCheckedChange={setShowPanel}
            aria-label="Toggle override panel"
          />
        </div>
      </CardHeader>

      {showPanel && (
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Override Capability:</strong> You can bypass document requirements for this
              company. Use this feature responsibly when documents are submitted offline or special
              circumstances apply.
            </AlertDescription>
          </Alert>

          {/* Company Info */}
          <div className="bg-white p-3 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Company: {companyName}
            </h4>
            <div className="text-sm text-gray-600">
              <p className="mb-1">Missing Requirements:</p>
              <ul className="space-y-1">
                {missingRequirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Override Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="override-reason">Override Reason (Required)</Label>
              <Textarea
                id="override-reason"
                placeholder="Explain why you're overriding the document requirements (e.g., 'Documents submitted via email', 'Client will mail physical copies', 'Special circumstances approved by underwriting')"
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                Override by: {user?.name} ({user?.role})
                <Calendar className="h-3 w-3 ml-2" />
                {new Date().toLocaleDateString()}
              </div>

              <Button
                onClick={() => overrideMutation.mutate({ companyId, reason: overrideReason })}
                disabled={!overrideReason.trim() || overrideMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {overrideMutation.isPending ? 'Applying Override...' : 'Apply Override'}
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {overrideMutation.isError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                Failed to apply override. Please try again or contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}
