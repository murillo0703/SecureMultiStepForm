import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Settings, 
  Download,
  Eye,
  Plus,
  Trash2,
  Calendar,
  User
} from "lucide-react";

interface PdfTemplate {
  id: number;
  carrierName: string;
  formName: string;
  version: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  isActive: boolean;
}

interface FieldMapping {
  id: number;
  fieldName: string;
  dataSource: string;
  dataField: string;
  fieldType: string;
  pageNumber: number;
}

export default function PdfTemplatesPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateForm, setTemplateForm] = useState({
    carrierName: "",
    formName: "",
    version: "1.0"
  });
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [showMappingEditor, setShowMappingEditor] = useState(false);

  // Fetch PDF templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/admin/pdf-templates"],
  });

  // Upload PDF template mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/admin/pdf-templates/upload", {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF template uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdf-templates"] });
      setSelectedFile(null);
      setTemplateForm({ carrierName: "", formName: "", version: "1.0" });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generateMutation = useMutation({
    mutationFn: async ({ templateId, companyId }: { templateId: number; companyId: number }) => {
      const res = await apiRequest("POST", "/api/admin/pdf-templates/generate", {
        templateId,
        companyId
      });
      return await res.blob();
    },
    onSuccess: (blob, variables) => {
      // Download the generated PDF
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated_${variables.templateId}_${variables.companyId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Carrier application form generated successfully!",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !templateForm.carrierName || !templateForm.formName) {
      toast({
        title: "Missing information",
        description: "Please fill all fields and select a PDF file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);
    formData.append("carrierName", templateForm.carrierName);
    formData.append("formName", templateForm.formName);
    formData.append("version", templateForm.version);

    uploadMutation.mutate(formData);
  };

  const carriers = ["Anthem", "CCSB", "Blue Shield", "Kaiser", "Aetna", "Cigna"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PDF Template Management</h1>
          <p className="text-gray-600">
            Upload carrier application forms and manage field mappings for auto-generation
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Admin Only
        </Badge>
      </div>

      {/* Upload New Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New PDF Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Select 
                value={templateForm.carrierName} 
                onValueChange={(value) => setTemplateForm(prev => ({ ...prev, carrierName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="formName">Form Name</Label>
              <Input
                id="formName"
                placeholder="e.g., Group Application Form"
                value={templateForm.formName}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, formName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="1.0"
                value={templateForm.version}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, version: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pdf-upload">PDF Template File</Label>
            <div className="mt-2">
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !selectedFile}
            className="w-full md:w-auto"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Template"}
          </Button>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PDF templates uploaded yet
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template: PdfTemplate) => (
                <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{template.formName}</h3>
                          <p className="text-sm text-gray-600">
                            {template.carrierName} • Version {template.version}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {template.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(template.uploadedAt).toLocaleDateString()}
                        </span>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowMappingEditor(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Map Fields
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMutation.mutate({ 
                          templateId: template.id, 
                          companyId: 1 // Demo company ID
                        })}
                        disabled={generateMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Test Generate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Demo Info */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>PDF Generation Process:</strong> Upload carrier PDF templates → Map form fields to data sources → 
          Auto-generate completed forms with company data and digital signatures during enrollment submission.
        </AlertDescription>
      </Alert>
    </div>
  );
}