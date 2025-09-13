import { useState, useEffect } from "react";
import { Plus, Search, Filter, Upload, File } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionForm } from "@/components/QuestionForm";
import { QuestionList } from "@/components/QuestionList";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { Question, QuestionCategory, Stakeholder } from "@/lib/services/question";
import { useActiveProject } from "@/hooks/useStorage";
import { useQuestionService } from "@/hooks/useQuestionService";
import { useDocumentService } from "@/hooks/useDocumentService";
import { useUserContext } from "@/contexts/UserContext";

export default function Questions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | "all">("all");
  const [stakeholderFilter, setStakeholderFilter] = useState<Stakeholder | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  
  const { activeProject } = useActiveProject();
  const { currentUser } = useUserContext();
  const { 
    questions, 
    createQuestion, 
    getQuestions,
    getQuestionStats 
  } = useQuestionService();
  
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentStats
  } = useDocumentService();
  
  // Load documents when project changes
  useEffect(() => {
    if (activeProject?.id) {
      loadDocuments(activeProject.id);
    }
  }, [activeProject?.id, loadDocuments]);

  // Get statistics for the current project
  const stats = getQuestionStats(activeProject?.id);
  const documentStats = getDocumentStats();

  // Use the service to filter questions
  const filteredQuestions = getQuestions({
    projectId: activeProject?.id,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    stakeholder: stakeholderFilter === "all" ? undefined : stakeholderFilter,
    searchTerm: searchTerm || undefined,
  });

  const handleCreateQuestion = async (newQuestion: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
    try {
      await createQuestion({
        content: newQuestion.content,
        category: newQuestion.category,
        stakeholder: newQuestion.stakeholder,
        parentQuestionId: newQuestion.parentQuestionId,
        rootQuestionId: newQuestion.rootQuestionId,
        userId: newQuestion.userId,
        projectId: newQuestion.projectId,
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  const handleUploadDocuments = async (files: File[]) => {
    if (!currentUser?.id || !activeProject?.id) {
      console.error("No user or project selected");
      return;
    }

    for (const file of files) {
      await uploadDocument(file, currentUser.id, activeProject.id);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument(documentId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <main className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h1 font-bold text-foreground">Questions</h1>
                <p className="text-body text-muted-foreground mt-2">
                  {activeProject 
                    ? `Manage and organize questions for ${activeProject.name}`
                    : "Manage and organize questions for your project"
                  }
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button disabled={!activeProject}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Question
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    {!activeProject && (
                      <TooltipContent>
                        <p>Please select a project first</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Question</DialogTitle>
                  </DialogHeader>
                  <QuestionForm onSubmit={handleCreateQuestion} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Statistics */}
            {activeProject && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                  </CardContent>
                </Card>
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats.rootQuestions}</div>
                    <p className="text-sm text-muted-foreground">Root Questions</p>
                  </CardContent>
                </Card>
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats.subQuestions}</div>
                    <p className="text-sm text-muted-foreground">Sub-Questions</p>
                  </CardContent>
                </Card>
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {Object.keys(stats.byCategory).filter(cat => stats.byCategory[cat as QuestionCategory] > 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Categories Used</p>
                  </CardContent>
                </Card>
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{documentStats.total}</div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                  </CardContent>
                </Card>
                <Card className="shadow-subtle">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {Math.round(documentStats.totalSize / 1024 / 1024 * 100) / 100}
                    </div>
                    <p className="text-sm text-muted-foreground">MB Uploaded</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questions" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Questions
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-6">
                {/* Questions Filters */}
                <Card className="shadow-subtle">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as QuestionCategory | "all")}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {Object.values(QuestionCategory).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={stakeholderFilter} onValueChange={(value) => setStakeholderFilter(value as Stakeholder | "all")}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Stakeholder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stakeholders</SelectItem>
                          {Object.values(Stakeholder).map((stakeholder) => (
                            <SelectItem key={stakeholder} value={stakeholder}>
                              {stakeholder}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions List */}
                <QuestionList questions={filteredQuestions} />
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                {/* Document Upload */}
                <DocumentUpload
                  onUpload={handleUploadDocuments}
                  loading={documentsLoading}
                  error={documentsError}
                />

                {/* Document List */}
                <DocumentList
                  documents={documents}
                  loading={documentsLoading}
                  error={documentsError}
                  onDelete={handleDeleteDocument}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
