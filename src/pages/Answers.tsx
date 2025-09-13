import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/contexts/UserContext";
import { useActiveProject } from "@/hooks/useStorage";
import { documentService } from "@/lib/services/document";
import { AnswerService } from "@/lib/answer";

const answerService = new AnswerService();

export default function Answers() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser } = useUserContext();
  const { activeProject } = useActiveProject();

  const handleUpload = async (files: File[]) => {
    if (!currentUser || !activeProject) {
      setUploadError('User or project not found');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const uploadedFileNames: string[] = [];

    try {
      for (const file of files) {
        // Upload document using the document service
        const result = await documentService.uploadDocument(
          file,
          currentUser.id,
          activeProject.id
        );

        if (result.success && result.data) {
          // Index the document for questions using the answer service
          await answerService.uploadAnswerDocument(activeProject.id, result.data);
          uploadedFileNames.push(file.name);
        } else {
          throw new Error(result.error || 'Failed to upload document');
        }
      }

      setUploadedFiles(uploadedFileNames);
      toast({
        title: "Upload Successful",
        description: `${uploadedFileNames.length} document(s) uploaded and indexed successfully.`,
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToQuestions = () => {
    navigate('/questions');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader />

          <main className="flex-1 p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-h1 font-bold text-foreground">Upload Documents</h1>
                <p className="text-body text-muted-foreground mt-2">
                  Upload documents to generate questions and answers for your project.
                </p>
              </div>
            </div>

            {activeProject && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-h3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project: {activeProject.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-muted-foreground">
                    {activeProject.description || 'No description provided'}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="max-w-4xl">
              <DocumentUpload
                onUpload={handleUpload}
                loading={isUploading}
                error={uploadError}
                maxFiles={20}
                acceptedTypes={['.pdf', '.doc', '.docx', '.txt', '.rtf']}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <Card className="max-w-4xl">
                <CardHeader>
                  <CardTitle className="text-h3 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Successfully Uploaded
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {uploadedFiles.map((fileName, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{fileName}</span>
                        <span className="text-xs text-green-600 ml-auto">
                          Uploaded & Indexed
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleGoToQuestions}
                      className="w-full"
                      size="lg"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Go to Questions
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Your documents are now ready for question generation
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!activeProject && (
              <Card className="max-w-4xl">
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-h3 font-semibold mb-2">No Project Selected</h3>
                  <p className="text-body text-muted-foreground mb-4">
                    Please select a project from the sidebar to upload documents.
                  </p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
