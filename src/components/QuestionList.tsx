import React from "react";
import { MessageSquare, Trash2, AlertTriangle, Brain, CheckCircle, XCircle, Loader2, Shield, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Question } from "@/lib/services/question/types";
import { useQuestionService } from "@/hooks/useQuestionService";
import { useQuestionAnalyzer } from "@/hooks/useQuestionAnalyzer";
import { AnswerViewer } from "@/components/AnswerViewer";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface QuestionListProps {
  questions: Question[];
  onAnalyzeQuestion?: (question: Question) => void;
  analyzing?: boolean;
}

interface QuestionItemProps {
  question: Question;
  onDeleteQuestion: (questionId: string) => void;
  onAnalyzeQuestion?: (question: Question) => void;
  analyzing?: boolean;
}

function QuestionItem({ question, onDeleteQuestion, onAnalyzeQuestion, analyzing }: QuestionItemProps) {
  const { deleteQuestion } = useQuestionService();
  const { isInitialized, isQuestionAnswered, getQuestionAnswers } = useQuestionAnalyzer();
  const { toast } = useToast();
  
  const isAnswered = isInitialized && isQuestionAnswered(question.id);
  const answers = getQuestionAnswers(question.id);
  const compliantAnswers = answers.filter(a => a.compliant);
  const nonCompliantAnswers = answers.filter(a => !a.compliant);

  const handleDelete = async () => {
    try {
      await deleteQuestion(question.id);
      toast({
        title: "Question deleted",
        description: "Question has been successfully deleted",
      });
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
    <div className="border-b border-slate-100 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{question.category}</span>
            <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">{question.stakeholder}</span>
            {isAnswered ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Answered ({answers.length})
                </span>
                {compliantAnswers.length > 0 && (
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {compliantAnswers.length} Compliant
                  </span>
                )}
                {nonCompliantAnswers.length > 0 && (
                  <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {nonCompliantAnswers.length} Non-Compliant
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Unanswered
              </span>
            )}
          </div>
          <h3 className="text-base leading-relaxed text-slate-900 mb-1">
            {question.content}
          </h3>
          <p className="text-xs text-slate-400">
            Created {formatDistanceToNow(new Date(question.createdAt))} ago
          </p>
        </div>
        <div className="flex items-center gap-1 ml-4">
          {/* View Answers Button - only show for answered questions */}
          {isAnswered && answers.length > 0 && (
            <AnswerViewer
              questionId={question.id}
              questionContent={question.content}
              answers={answers}
            />
          )}
          
          {/* Analyze Button - only show for unanswered questions */}
          {!isAnswered && onAnalyzeQuestion && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onAnalyzeQuestion(question)}
              disabled={analyzing}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 p-0"
            >
              {analyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-slate-600" />
                  Delete Question
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this question? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  Delete Question
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function QuestionList({ questions, onAnalyzeQuestion, analyzing }: QuestionListProps) {
  const handleDeleteQuestion = (questionId: string) => {
    // This is just a callback for UI updates if needed
    // The actual deletion is handled in the QuestionItem component
    console.log(`Question ${questionId} deleted`);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <MessageSquare className="h-8 w-8 text-slate-300 mb-3" />
        <h3 className="text-base font-medium text-slate-600 mb-1">No questions yet</h3>
        <p className="text-slate-400 text-center max-w-md text-sm">
          Start by creating your first question to organize and track important inquiries for your project.
        </p>
      </div>
    );
  }

  return (
    <div>
      {questions.map((question) => (
        <QuestionItem
          key={question.id}
          question={question}
          onDeleteQuestion={handleDeleteQuestion}
          onAnalyzeQuestion={onAnalyzeQuestion}
          analyzing={analyzing}
        />
      ))}
    </div>
  );
}