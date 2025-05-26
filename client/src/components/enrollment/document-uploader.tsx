import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Document } from '@shared/schema';
import { FileUpload, RequiredDocumentsList } from '@/components/ui/file-upload';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploaderProps {
  companyId: number;
}

export function DocumentUploader({ companyId }: DocumentUploaderProps) {
  const [documentType, setDocumentType] = useState('DE-9C');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/companies/${companyId}/documents`],
    enabled: !!companyId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);
      formData.append('name', file.name);

      console.log(`Uploading document of type: ${documentType}`);

      const response = await fetch(`/api/companies/${companyId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/application`] });
      toast({
        title: 'Document uploaded',
        description: 'Your document has been successfully uploaded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/documents`] });
      toast({
        title: 'Document deleted',
        description: 'Your document has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Required document types
  const requiredDocuments = [
    'DE-9C',
    'Articles of Incorporation',
    'Business License',
    'Wage and Tax Statement',
    'Current Carrier Bill',
  ];

  // Filter out documents that have already been uploaded
  const uploadedDocumentTypes = documents.map(doc => doc.type);
  const missingDocuments = requiredDocuments.filter(
    docType => !uploadedDocumentTypes.includes(docType)
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Required Documents</CardTitle>
        <CardDescription>Upload supporting documentation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
            Document Type
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={e => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {requiredDocuments.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Always show the upload area regardless of selected file */}
        <div className="mb-4">
          <FileUpload
            onFileUpload={file => {
              setSelectedFile(file);
              // Create a fresh mutation each time to ensure we're using the current document type
              uploadMutation.mutate(file);

              // Clear the selected file after upload to allow uploading another document
              setTimeout(() => {
                setSelectedFile(null); // Reset the selected file
                // This forces the FileUpload component to reset after upload completes
                queryClient.invalidateQueries({
                  queryKey: [`/api/companies/${companyId}/documents`],
                });
              }, 1000);
            }}
            fileType="document"
            className="mb-4"
            documentType={documentType}
            // Force reset the component when selectedFile is null
            key={selectedFile ? 'uploading' : 'ready'}
          />
        </div>

        <RequiredDocumentsList
          documents={documents}
          missingDocuments={missingDocuments}
          onDelete={documentId => deleteMutation.mutate(documentId)}
        />
      </CardContent>
    </Card>
  );
}
