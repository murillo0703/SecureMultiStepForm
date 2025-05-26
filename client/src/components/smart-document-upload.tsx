import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDocumentValidation } from "@/hooks/use-document-validation";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  X,
  Eye,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartDocumentUploadProps {
  companyData: {
    hasPriorCoverage?: boolean;
    selectedCarrier?: string;
    employeeCount?: number;
    companyState?: string;
    uploadedDocuments?: string[];
  };
  onDocumentUpload: (docType: string, file: File) => void;
  onDocumentRemove: (docType: string) => void;
  className?: string;
}

interface DocumentUploadProps {
  docType: string;
  label: string;
  description: string;
  isUploaded: boolean;
  isRequired: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

function DocumentUploadCard({ 
  docType, 
  label, 
  description, 
  isUploaded, 
  isRequired, 
  onUpload, 
  onRemove 
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className={cn(
      "border-2 border-dashed rounded-lg p-4 transition-colors",
      dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300",
      isUploaded ? "border-green-400 bg-green-50" : ""
    )}
    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
    onDragLeave={() => setDragOver(false)}
    onDrop={handleDrop}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{label}</h4>
            {isRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
            {isUploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>

      {isUploaded ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Document uploaded</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Drag & drop or click to upload
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Select File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export function SmartDocumentUpload({ 
  companyData, 
  onDocumentUpload, 
  onDocumentRemove, 
  className 
}: SmartDocumentUploadProps) {
  const {
    requiredGroups,
    validationStatus,
    isGroupSatisfied,
    getDocumentStatus,
    markDocumentUploaded
  } = useDocumentValidation(companyData);

  const handleDocumentUpload = (docType: string, file: File) => {
    onDocumentUpload(docType, file);
    markDocumentUploaded(docType);
  };

  const handleDocumentRemove = (docType: string) => {
    onDocumentRemove(docType);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Upload Progress</span>
            <Badge variant={validationStatus.isComplete ? "default" : "secondary"}>
              {validationStatus.satisfiedGroups}/{validationStatus.totalGroups} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(validationStatus.satisfiedGroups / validationStatus.totalGroups) * 100} 
            className="mb-4"
          />
          {!validationStatus.isComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please upload the required documents below to continue with your application.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Document Groups */}
      {requiredGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{group.label}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isGroupSatisfied(group) ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                )}
              </div>
            </div>
            {group.oneOf && (
              <Alert className="mt-3">
                <AlertDescription>
                  <strong>Upload any one</strong> of the following documents to satisfy this requirement.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.requirements.map((req) => {
                const docStatus = getDocumentStatus(req.type);
                
                return (
                  <DocumentUploadCard
                    key={req.type}
                    docType={req.type}
                    label={req.label}
                    description={req.description}
                    isUploaded={docStatus.isUploaded}
                    isRequired={req.required !== false}
                    onUpload={(file) => handleDocumentUpload(req.type, file)}
                    onRemove={() => handleDocumentRemove(req.type)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Validation Summary */}
      {validationStatus.missingGroups.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Missing Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {validationStatus.missingGroups.map((group) => (
                <li key={group.id} className="flex items-center gap-2 text-sm text-orange-700">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  {group.label}
                  {group.oneOf && " (upload any one option)"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {validationStatus.isComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">All documents uploaded!</h3>
                <p className="text-sm text-green-700">
                  You can now proceed to the next step of your application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}