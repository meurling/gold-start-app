import React, { useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuestionForm } from "./QuestionForm";
import { Question } from "@/lib/types";
import { useQuestionService } from "@/hooks/useQuestionService";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface QuestionListProps {
  questions: Question[];
}

interface QuestionItemProps {
  question: Question;
  allQuestions: Question[];
  onAddSubQuestion: (parentId: string, rootId?: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

function QuestionItem({ question, allQuestions, onAddSubQuestion, onDeleteQuestion }: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { canDeleteQuestion, deleteQuestion, deleteQuestionWithSubQuestions } = useQuestionService();
  const { toast } = useToast();
  
  const subQuestions = allQuestions.filter(q => q.parentQuestionId === question.id);
  const isRootQuestion = !question.parentQuestionId;
  const canDelete = canDeleteQuestion(question.id);
  const hasSubQuestions = subQuestions.length > 0;

  const handleDelete = async () => {
    try {
      if (hasSubQuestions) {
        const result = await deleteQuestionWithSubQuestions(question.id);
        toast({
          title: "Question deleted",
          description: `Deleted question and ${result.deletedCount - 1} sub-questions`,
        });
      } else {
        await deleteQuestion(question.id);
        toast({
          title: "Question deleted",
          description: "Question has been successfully deleted",
        });
      }
      onDeleteQuestion(question.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge variant="outline">{question.stakeholder}</Badge>
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {question.content}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(question.createdAt))} ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            {subQuestions.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="ml-1">{subQuestions.length} sub-questions</span>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sub-question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Sub-question</DialogTitle>
                </DialogHeader>
                <QuestionForm
                  onSubmit={(data) => onAddSubQuestion(question.id, question.rootQuestionId || question.id)}
                  parentQuestionId={question.id}
                  rootQuestionId={question.rootQuestionId || question.id}
                />
              </DialogContent>
            </Dialog>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Delete Question
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {hasSubQuestions ? (
                      <>
                        This question has {subQuestions.length} sub-question{subQuestions.length > 1 ? 's' : ''}. 
                        Deleting it will also delete all sub-questions. This action cannot be undone.
                      </>
                    ) : (
                      "Are you sure you want to delete this question? This action cannot be undone."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Question{hasSubQuestions ? ' and Sub-questions' : ''}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      {subQuestions.length > 0 && (
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="pl-4 border-l-2 border-muted">
              {subQuestions.map((subQuestion) => (
                <QuestionItem
                  key={subQuestion.id}
                  question={subQuestion}
                  allQuestions={allQuestions}
                  onAddSubQuestion={onAddSubQuestion}
                  onDeleteQuestion={onDeleteQuestion}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      )}
    </Card>
  );
}

export function QuestionList({ questions }: QuestionListProps) {
  const { createQuestion } = useQuestionService();

  const handleAddSubQuestion = async (newQuestion: Omit<Question, "id" | "createdAt" | "updatedAt">) => {
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
    } catch (error) {
      console.error("Error creating sub-question:", error);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    // This is just a callback for UI updates if needed
    // The actual deletion is handled in the QuestionItem component
    console.log(`Question ${questionId} deleted`);
  };

  // Separate root questions and sub-questions
  const rootQuestions = questions.filter(q => !q.parentQuestionId);
  const subQuestions = questions.filter(q => q.parentQuestionId);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Start by creating your first question to organize and track important inquiries for your project.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rootQuestions.map((question) => (
        <QuestionItem
          key={question.id}
          question={question}
          allQuestions={questions}
          onAddSubQuestion={handleAddSubQuestion}
          onDeleteQuestion={handleDeleteQuestion}
        />
      ))}
    </div>
  );
}
