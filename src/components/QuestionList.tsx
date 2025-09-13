import React, { useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuestionForm } from "./QuestionForm";
import { Question } from "@/lib/types";
import { useQuestionService } from "@/hooks/useQuestionService";
import { formatDistanceToNow } from "date-fns";

interface QuestionListProps {
  questions: Question[];
}

interface QuestionItemProps {
  question: Question;
  allQuestions: Question[];
  onAddSubQuestion: (parentId: string, rootId?: string) => void;
}

function QuestionItem({ question, allQuestions, onAddSubQuestion }: QuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const subQuestions = allQuestions.filter(q => q.parentQuestionId === question.id);
  const isRootQuestion = !question.parentQuestionId;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge variant="outline">{question.stakeholder}</Badge>
              {isRootQuestion && (
                <Badge variant="default">Root Question</Badge>
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
        />
      ))}
    </div>
  );
}
