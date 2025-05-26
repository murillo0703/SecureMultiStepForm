import { useState, useRef, useEffect } from "react";
import { UploadCloud, File, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  fileType?: string;
  accept?: string;
  maxSize?: number; // In MB
  className?: string;
  documentType?: string;
}

export function FileUpload({
  onFileUpload,
  fileType = "document",
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 10, // Default 10MB
  className = "",
  documentType,
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => 
      ext.startsWith('.') ? ext.substring(1) : ext
    );

    if (!acceptedExtensions.includes(fileExtension || '')) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file of type: ${accept}`,
        variant: "destructive",
      });
      return;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      toast({
        title: "File too large",
        description: `File size should be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Display document type in console for debugging
    if (documentType) {
      console.log(`Uploading ${fileType} with document type: ${documentType}`);
    }
    
    onFileUpload(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Reset file selection from outside component
  useEffect(() => {
    if (!selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [selectedFile]);

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileInput}
      />
      
      {!selectedFile ? (
        <div
          className={`drag-drop-zone rounded-lg p-6 text-center cursor-pointer ${
            isDragActive ? "active" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseFiles}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Drag and drop your {fileType} here or
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 text-primary hover:text-primary-light hover:bg-primary-light/10"
          >
            Browse files
          </Button>
          <p className="mt-1 text-xs text-gray-400">
            Supported formats: {accept.replace(/\./g, "")} (Max {maxSize}MB)
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RequiredDocumentsList({
  documents,
  missingDocuments,
  onDelete,
}: {
  documents: { id: number; name: string; type: string; uploadedAt: Date }[];
  missingDocuments: string[];
  onDelete?: (documentId: number) => void;
}) {
  return (
    <div>
      {documents.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Documents ({documents.length})
          </h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
            {documents.map((doc) => (
              <li key={doc.id} className="py-3 px-4 flex justify-between items-center">
                <div className="flex items-center">
                  <File className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingDocuments.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Missing required documents:</span>
          </div>
          <ul className="ml-5 list-disc text-sm text-gray-600 space-y-1">
            {missingDocuments.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
