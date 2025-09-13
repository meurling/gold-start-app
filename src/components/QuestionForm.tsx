import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { QuestionCategory, Stakeholder, CreateQuestionForm } from "@/lib/services/question";
import { useActiveProject } from "@/hooks/useStorage";
import { useUser } from "@/hooks/useUser";

const questionSchema = z.object({
  content: z.string().min(10, "Question must be at least 10 characters long"),
  category: z.nativeEnum(QuestionCategory),
  stakeholder: z.nativeEnum(Stakeholder),
});

interface QuestionFormProps {
  onSubmit: (data: Omit<CreateQuestionForm, "userId" | "projectId"> & { userId: string; projectId: string }) => void;
}

export function QuestionForm({ onSubmit }: QuestionFormProps) {
  const { activeProject } = useActiveProject();
  const { currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateQuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      content: "",
      category: QuestionCategory.OTHER,
      stakeholder: Stakeholder.OTHER,
    },
  });

  const handleSubmit = async (data: CreateQuestionForm) => {
    setIsSubmitting(true);
    try {
      if (!currentUser || !activeProject) {
        throw new Error("User or project not found. Please ensure you're logged in and have selected a project.");
      }

      onSubmit({
        ...data,
        userId: currentUser.id,
        projectId: activeProject.id,
      });
    } catch (error) {
      console.error("Error creating question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error if no project or user is selected
  if (!activeProject || !currentUser) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">
          {!activeProject && !currentUser 
            ? "Please log in and select a project to create questions."
            : !activeProject 
            ? "Please select a project to create questions."
            : "Please log in to create questions."
          }
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Project indicator */}
        <div className="p-3 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Creating question for project: <span className="font-medium text-foreground">{activeProject.name}</span>
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your question here..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(QuestionCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stakeholder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stakeholder</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stakeholder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Stakeholder).map((stakeholder) => (
                      <SelectItem key={stakeholder} value={stakeholder}>
                        {stakeholder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
