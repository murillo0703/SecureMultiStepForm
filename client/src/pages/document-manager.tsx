import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Calendar,
  Users,
} from 'lucide-react';

interface Document {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: string;
  uploadedBy: number;
  uploadedAt: string;
  companyId?: number;
}

interface Employee {
  fullName: string;
  dateOfBirth: string;
  email: string;
  address?: string;
  ssn?: string;
}

export default function DocumentManager() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('census');
  const [uploadingCensus, setUploadingCensus] = useState(false);

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFile(null);
      toast({
        title: 'Document uploaded successfully',
        description: 'Your document has been processed and saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Census upload mutation
  const censusMutation = useMutation({
    mutationFn: async (employees: Employee[]) => {
      const response = await apiRequest('POST', '/api/employees/census-upload', { employees });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Census uploaded successfully',
        description: `${data.imported} employees imported successfully.`,
      });
      setUploadingCensus(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Census upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadingCensus(false);
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      });
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', documentType);

    uploadMutation.mutate(formData);
  };

  const parseCensusFile = async (file: File): Promise<Employee[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const employees: Employee[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const employee: Employee = {
              fullName: '',
              dateOfBirth: '',
              email: '',
            };
            
            headers.forEach((header, index) => {
              const value = values[index] || '';
              switch (header) {
                case 'full name':
                case 'fullname':
                case 'name':
                  employee.fullName = value;
                  break;
                case 'date of birth':
                case 'dob':
                case 'dateofbirth':
                  employee.dateOfBirth = value;
                  break;
                case 'email':
                case 'email address':
                  employee.email = value;
                  break;
                case 'address':
                  employee.address = value;
                  break;
                case 'ssn':
                case 'social security number':
                  employee.ssn = value;
                  break;
              }
            });
            
            if (employee.fullName && employee.dateOfBirth && employee.email) {
              employees.push(employee);
            }
          }
          
          resolve(employees);
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.readAsText(file);
    });
  };

  const handleCensusUpload = async () => {
    if (!selectedFile) return;
    
    setUploadingCensus(true);
    
    try {
      const employees = await parseCensusFile(selectedFile);
      if (employees.length === 0) {
        throw new Error('No valid employee records found in the file');
      }
      censusMutation.mutate(employees);
    } catch (error: any) {
      toast({
        title: 'Census upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploadingCensus(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Manager</h1>
          <p className="text-muted-foreground">Upload and manage documents and employee census data</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="census">Employee Census</TabsTrigger>
          <TabsTrigger value="manage">Manage Documents</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="census">Employee Census</SelectItem>
                    <SelectItem value="application">Application Form</SelectItem>
                    <SelectItem value="tax_document">Tax Document</SelectItem>
                    <SelectItem value="insurance_form">Insurance Form</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.csv,.xlsx,.jpg,.jpeg,.png"
                />
              </div>

              <Button 
                onClick={handleFileUpload} 
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Census Upload Tab */}
        <TabsContent value="census">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Census Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your CSV file should include the following columns:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Full Name</strong> (required)</li>
                  <li>• <strong>Date of Birth</strong> (required, format: MM/DD/YYYY)</li>
                  <li>• <strong>Email</strong> (required)</li>
                  <li>• Address (optional - for enrollment)</li>
                  <li>• SSN (optional - for enrollment)</li>
                </ul>
              </div>

              <div>
                <Label htmlFor="censusFile">Select Census File (CSV)</Label>
                <Input
                  id="censusFile"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".csv"
                />
              </div>

              <Button 
                onClick={handleCensusUpload} 
                disabled={!selectedFile || uploadingCensus}
              >
                {uploadingCensus ? 'Processing...' : 'Upload Census'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Documents Tab */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.originalName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(doc.size)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteMutation.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No documents uploaded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}