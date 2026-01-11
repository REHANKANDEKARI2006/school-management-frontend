
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { initialExams } from "@/lib/mock-data-exams";
import type { Exam } from "@/components/campus-connect/exam-form";
import { paperTemplates, PaperTemplate } from "@/lib/paper-templates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FilePenLine, Info, Download, Eye } from "lucide-react";
import { QuestionInput } from "@/components/campus-connect/question-input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QuestionPaperPreview } from "@/components/campus-connect/question-paper-preview";
import { Textarea } from "@/components/ui/textarea";

export default function GeneratePaperPage() {
  const { toast } = useToast();
  const [exams] = React.useState(initialExams);
  const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null);
  const [template, setTemplate] = React.useState<PaperTemplate | null>(null);
  const [questions, setQuestions] = React.useState<any>({});
  const [passage, setPassage] = React.useState('');
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const upcomingExams = React.useMemo(() => {
    return exams.filter(e => e.status === "Upcoming" || e.status === "Scheduled");
  }, [exams]);

  const selectedExam = React.useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || null;
  }, [exams, selectedExamId]);

  React.useEffect(() => {
    if (selectedExam) {
      const foundTemplate = paperTemplates.find(t => t.subject.toLowerCase() === selectedExam.subject.toLowerCase());
      setTemplate(foundTemplate || null);
      setQuestions({}); // Reset questions when exam changes
      setPassage(foundTemplate?.sections.find(s => s.isEditable)?.description || '');
    } else {
      setTemplate(null);
    }
  }, [selectedExam]);

  const handleQuestionChange = (sectionId: string, questionId: string, value: any) => {
    setQuestions((prev: any) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [questionId]: value,
      },
    }));
  };
  
  const handleDownload = () => {
      toast({
          title: "Generating Paper",
          description: "This is a placeholder. PDF generation will be implemented next."
      })
  }
  
  const finalQuestions = React.useMemo(() => {
      const editableSection = template?.sections.find(s => s.isEditable);
      if (editableSection) {
          return {
              ...questions,
              [editableSection.id]: {
                  ...questions[editableSection.id],
                  passage,
              }
          }
      }
      return questions;

  }, [questions, passage, template]);

  return (
    <>
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <FilePenLine />
          Question Paper Generator
        </CardTitle>
        <CardDescription>
          Select an exam and fill in the questions to generate a paper.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="exam-select">Select Exam</Label>
          <Select onValueChange={setSelectedExamId}>
            <SelectTrigger id="exam-select">
              <SelectValue placeholder="Choose an upcoming exam" />
            </SelectTrigger>
            <SelectContent>
              {upcomingExams.map(exam => (
                <SelectItem key={exam.id} value={exam.id!}>
                  {exam.name} - {exam.class} ({exam.subject})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedExam && !template && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Template Not Found</AlertTitle>
            <AlertDescription>
              A question paper template for the subject "{selectedExam.subject}" has not been created yet.
            </AlertDescription>
          </Alert>
        )}

        {selectedExam && template && (
          <div className="space-y-4 pt-4 border-t">
            {template.sections.map((section, sectionIndex) => (
              <div key={section.id} className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">
                  Section {section.id}: {section.title}
                </h3>

                {section.isEditable ? (
                    <div className="space-y-2">
                        <Label htmlFor={`passage-${section.id}`}>Reading Passage</Label>
                        <Textarea 
                            id={`passage-${section.id}`}
                            placeholder={section.description}
                            value={passage}
                            onChange={(e) => setPassage(e.target.value)}
                            rows={8}
                        />
                    </div>
                ): (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
                
                {section.questions.map((q) => (
                  <QuestionInput
                    key={q.id}
                    question={q}
                    sectionId={section.id}
                    onChange={handleQuestionChange}
                  />
                ))}

                {sectionIndex < template.sections.length - 1 && <Separator className="my-6" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {selectedExam && template && (
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
            </Button>
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download
            </Button>
        </CardFooter>
      )}
    </Card>
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Question Paper Preview</DialogTitle>
                <DialogDescription>This is a preview of what the generated paper will look like. Final PDF formatting may vary.</DialogDescription>
            </DialogHeader>
            {selectedExam && template && (
                <QuestionPaperPreview 
                    exam={selectedExam}
                    template={template}
                    questions={finalQuestions}
                />
            )}
        </DialogContent>
    </Dialog>
    </>
  );
}
