import React from "react";
import { MessageSquare, Trash2, AlertTriangle, Brain, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Question } from "@/lib/services/question/types";
import { useQuestionService } from "@/hooks/useQuestionService";
import { useQuestionAnalyzer } from "@/hooks/useQuestionAnalyzer";
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
  const { isQuestionAnswered, getQuestionAnswers } = useQuestionAnalyzer();
  const { toast } = useToast();
  
  const isAnswered = isQuestionAnswered(question.id);
  const answers = getQuestionAnswers(question.id);

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
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge variant="outline">{question.stakeholder}</Badge>
              {isAnswered ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Answered ({answers.length})
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  Unanswered
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-relaxed">
              {question.content}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(question.createdAt))} ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Analyze Button - only show for unanswered questions */}
            {!isAnswered && onAnalyzeQuestion && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAnalyzeQuestion(question)}
                disabled={analyzing}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                    Are you sure you want to delete this question? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Question
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
    </Card>
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