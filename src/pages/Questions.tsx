import { useState, useEffect } from "react";
import { Plus, Search, Filter, Upload, File, Trash2, AlertTriangle, Brain, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionForm } from "@/components/QuestionForm";
import { QuestionList } from "@/components/QuestionList";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { Question, QuestionCategory, Stakeholder } from "@/lib/services/question/types";
import { useActiveProject, useProjects } from "@/hooks/useStorage";
import { useQuestionService } from "@/hooks/useQuestionService";
import { useDocumentService } from "@/hooks/useDocumentService";
import { useQuestionAnalyzer } from "@/hooks/useQuestionAnalyzer";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function Questions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | "all">("all");
  const [stakeholderFilter, setStakeholderFilter] = useState<Stakeholder | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [questionStatusTab, setQuestionStatusTab] = useState("all");
  
  const { activeProject, setActive } = useActiveProject();
  const { data: projects, create: createProject } = useProjects();
  const { currentUser } = useUserContext();
  const { toast } = useToast();
  const { 
    questions, 
    createQuestion, 
    getQuestions,
    getQuestionStats,
    deleteAllQuestions,
    loading,
    error
  } = useQuestionService();
  
  const {
    analyzing,
    isInitialized,
    analyzeQuestion,
    analyzeQuestions,
    isQuestionAnswered,
    getQuestionAnswers,
    refreshAnswers
  } = useQuestionAnalyzer();
  
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentStats,
    processDocument,
    getDocumentsByProcessingStatus
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
  const allFilteredQuestions = getQuestions({
    projectId: activeProject?.id, // If no project selected, show all questions
    category: categoryFilter === "all" ? undefined : categoryFilter,
    stakeholder: stakeholderFilter === "all" ? undefined : stakeholderFilter,
    searchTerm: searchTerm || undefined,
  });

  // Filter questions by answered/unanswered status
  const filteredQuestions = allFilteredQuestions.filter(question => {
    if (questionStatusTab === "all") return true;
    // If not initialized yet, show all questions to avoid incorrect filtering
    if (!isInitialized) return true;
    if (questionStatusTab === "answered") return isQuestionAnswered(question.id);
    if (questionStatusTab === "unanswered") return !isQuestionAnswered(question.id);
    return true;
  });

  // Get counts for statistics
  const answeredQuestions = allFilteredQuestions.filter(q => isInitialized && isQuestionAnswered(q.id));
  const unansweredQuestions = allFilteredQuestions.filter(q => isInitialized && !isQuestionAnswered(q.id));
  
  // Debug logging
  console.log('Questions page filtering:', {
    isInitialized,
    totalQuestions: allFilteredQuestions.length,
    answeredCount: answeredQuestions.length,
    unansweredCount: unansweredQuestions.length,
    currentTab: questionStatusTab,
    answeredQuestionIds: answeredQuestions.map(q => q.id),
    unansweredQuestionIds: unansweredQuestions.map(q => q.id)
  });
  

  const handleCreateQuestion = async (newQuestion: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
    if (!activeProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project before creating questions.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuestion({
        content: newQuestion.content,
        category: newQuestion.category,
        stakeholder: newQuestion.stakeholder,
        userId: newQuestion.userId,
        projectId: activeProject.id, // Always use the active project ID
      });
      setIsCreateDialogOpen(false);
      toast({
        title: "Question Created",
        description: "Question has been successfully created.",
      });
    } catch (error) {
      console.error("Error creating question:", error);
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      });
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

  const handleProcessDocument = async (documentId: string) => {
    if (!currentUser?.id || !activeProject?.id) {
      toast({
        title: "No Project Selected",
        description: "Please select a project before processing documents.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await processDocument(documentId);
      
      if (result.success && result.questions) {
        // Add parsed questions to the active project
        for (const parsedQuestion of result.questions) {
          await createQuestion({
            content: parsedQuestion.content,
            category: parsedQuestion.category,
            stakeholder: parsedQuestion.stakeholder,
            userId: currentUser.id,
            projectId: activeProject.id, // Always use the active project ID
          });
        }
        
        toast({
          title: "Document Processed",
          description: `Successfully added ${result.questions.length} questions from document to ${activeProject.name}.`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: result.error || "Failed to process document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!activeProject?.id) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await deleteAllQuestions(activeProject.id);
      toast({
        title: "All questions deleted",
        description: `Successfully deleted ${result.deletedCount} questions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete all questions",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeQuestion = async (question: Question) => {
    if (!activeProject?.id) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeQuestion(question, activeProject.id);
      toast({
        title: "Analysis Complete",
        description: result.isAnswered 
          ? `Found ${result.answers.length} answer(s) for this question`
          : "No answers found for this question",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze question",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeAllUnanswered = async () => {
    if (!activeProject?.id) {
      toast({
        title: "Error",
        description: "No project selected",
        variant: "destructive",
      });
      return;
    }

    if (unansweredQuestions.length === 0) {
      toast({
        title: "No Questions to Analyze",
        description: "All questions have already been analyzed",
      });
      return;
    }

    try {
      const result = await analyzeQuestions(unansweredQuestions, activeProject.id);
      toast({
        title: "Bulk Analysis Complete",
        description: `Analyzed ${result.totalAnalyzed} questions. Found answers for ${result.answeredCount} questions.`,
      });
    } catch (error) {
      toast({
        title: "Bulk Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze questions",
        variant: "destructive",
      });
    }
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
              <div className="flex items-center gap-2">
                {/* Refresh Answers Button */}
                <Button 
                  variant="outline" 
                  onClick={refreshAnswers}
                  disabled={analyzing}
                  className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Answers
                </Button>

                {/* Analyze All Unanswered Button */}
                {activeProject && unansweredQuestions.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleAnalyzeAllUnanswered}
                    disabled={analyzing}
                    className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    Analyze All Unanswered ({unansweredQuestions.length})
                  </Button>
                )}

                {/* Delete All Questions Button */}
                {activeProject && stats.total > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-slate-500 hover:text-slate-700 hover:bg-slate-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-slate-600" />
                          Delete All Questions
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete all {stats.total} questions in this project? 
                          This action cannot be undone and will permanently remove all questions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAllQuestions}
                          className="bg-slate-600 hover:bg-slate-700"
                        >
                          Delete All Questions
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* New Question Button */}
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
            </div>

            {/* Statistics - Minimalistic */}
            {activeProject && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-4">
                <span>{stats.total} questions</span>
                <span className="text-emerald-600">{answeredQuestions.length} answered</span>
                <span className="text-slate-500">{unansweredQuestions.length} unanswered</span>
                <span>{documentStats.total} documents</span>
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
                {/* Questions Filters - Minimalistic */}
                <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-0 bg-transparent focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as QuestionCategory | "all")}>
                    <SelectTrigger className="w-full sm:w-40 border-0 bg-transparent focus:ring-0">
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
                    <SelectTrigger className="w-full sm:w-40 border-0 bg-transparent focus:ring-0">
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

                {/* Question Status Tabs */}
                <Tabs value={questionStatusTab} onValueChange={setQuestionStatusTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      All Questions ({allFilteredQuestions.length})
                    </TabsTrigger>
                    <TabsTrigger value="answered" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Answered ({answeredQuestions.length})
                    </TabsTrigger>
                    <TabsTrigger value="unanswered" className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Unanswered ({unansweredQuestions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {!activeProject && (
                      <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-200 rounded-r">
                        <p className="text-amber-800 text-sm">
                          <strong>Warning:</strong> No project selected. Showing all questions. 
                          Select a project to see project-specific questions.
                        </p>
                      </div>
                    )}
                    <QuestionList questions={filteredQuestions} onAnalyzeQuestion={handleAnalyzeQuestion} analyzing={analyzing} />
                  </TabsContent>

                  <TabsContent value="answered" className="space-y-4">
                    <QuestionList questions={filteredQuestions} onAnalyzeQuestion={handleAnalyzeQuestion} analyzing={analyzing} />
                  </TabsContent>

                  <TabsContent value="unanswered" className="space-y-4">
                    <QuestionList questions={filteredQuestions} onAnalyzeQuestion={handleAnalyzeQuestion} analyzing={analyzing} />
                  </TabsContent>
                </Tabs>
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
                  onProcess={handleProcessDocument}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
