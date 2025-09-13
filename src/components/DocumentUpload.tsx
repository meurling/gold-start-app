import { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface DocumentUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  maxFiles?: number;
  acceptedTypes?: string[];
}

interface FileWithProgress extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function DocumentUpload({ 
  onUpload, 
  loading = false, 
  error = null, 
  maxFiles = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;


    const newFiles: FileWithProgress[] = Array.from(files).map(file => {
      const fileWithProgress: FileWithProgress = {
        // Explicitly copy File properties
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        webkitRelativePath: file.webkitRelativePath,
        // Add our custom properties
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: 'pending' as const,
        // Copy File methods
        arrayBuffer: file.arrayBuffer.bind(file),
        slice: file.slice.bind(file),
        stream: file.stream.bind(file),
        text: file.text.bind(file),
      };
      
      
      return fileWithProgress;
    });

    // Filter by accepted types
    const validFiles = newFiles.filter(file => {
      console.log('Processing file:', {
        name: file.name,
        nameType: typeof file.name,
        hasName: !!file.name,
        nameLength: file.name?.length,
        nameValue: file.name
      });
      
      if (!file.name || typeof file.name !== 'string') {
        console.log('File rejected: no name or invalid name type', {
          name: file.name,
          nameType: typeof file.name,
          hasName: !!file.name
        });
        return false;
      }
      
      const parts = file.name.split('.');
      if (parts.length < 2) {
        console.log('File rejected: no extension', file.name);
        return false; // No extension
      }
      
      const extension = '.' + parts.pop()?.toLowerCase();
      console.log('Checking extension:', extension, 'against accepted types:', acceptedTypes);
      
      // Also check MIME type as fallback
      const mimeType = file.type;
      console.log('File MIME type:', mimeType);
      
      const isValid = acceptedTypes.includes(extension) || 
                     (extension === '.docx' && mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
                     (extension === '.doc' && mimeType === 'application/msword') ||
                     (extension === '.pdf' && mimeType === 'application/pdf') ||
                     (extension === '.txt' && mimeType === 'text/plain');
      
      console.log('File', file.name, 'is valid:', isValid);
      return isValid;
    });

    // Show warning if some files were rejected
    const rejectedCount = newFiles.length - validFiles.length;
    if (rejectedCount > 0) {
      console.warn(`${rejectedCount} file(s) were rejected due to unsupported format`);
    }

    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles - selectedFiles.length);
    
    if (filesToAdd.length < validFiles.length) {
      console.warn(`Only ${filesToAdd.length} files added due to maximum limit of ${maxFiles}`);
    }
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset the input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const files = selectedFiles.map(({ id, progress, status, error, ...file }) => file);
    await onUpload(files);
    
    // Clear selected files after successful upload
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName || typeof fileName !== 'string') {
      return <File className="h-4 w-4" />;
    }
    
    const parts = fileName.split('.');
    const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
    
    // Return different colored icons based on file type
    switch (extension) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'txt':
        return <File className="h-4 w-4 text-green-500" />;
      case 'rtf':
        return <File className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : selectedFiles.length > 0
              ? 'border-green-500 bg-green-50/50'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${selectedFiles.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
          <p className="text-lg font-medium mb-2">
            {selectedFiles.length > 0 ? 'Add more files or upload selected files' : 'Drop files here or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supported formats: {acceptedTypes.join(', ')}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} files
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-600">
                Selected Files ({selectedFiles.length})
              </h4>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Ready to Upload
              </Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-green-50/50">
              {selectedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm"
                >
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="mt-1 h-1" />
                    )}
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <Badge variant="secondary" className="text-xs">
                        Ready
                      </Badge>
                    )}
                    {file.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleUpload}
              disabled={loading || selectedFiles.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Files will be processed and stored for question generation
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
