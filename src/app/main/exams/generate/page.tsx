"use client";

import * as React from "react";
import axios from "@/lib/axios";
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
import { paperTemplates, PaperTemplate } from "@/lib/paper-templates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FilePenLine, Info, Download, Eye, Loader2 } from "lucide-react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { QuestionInput } from "@/components/campus-connect/question-input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QuestionPaperPreview } from "@/components/campus-connect/question-paper-preview";
import { Textarea } from "@/components/ui/textarea";

export default function GeneratePaperPage() {
  const { toast } = useToast();
  const [exams, setExams] = React.useState<any[]>([]);
  const [loadingExams, setLoadingExams] = React.useState(true);
  const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null);
  const [template, setTemplate] = React.useState<PaperTemplate | null>(null);
  const [questions, setQuestions] = React.useState<any>({});
  const [passage, setPassage] = React.useState("");
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const [saving, setSaving] = React.useState(false);

  /* ---- Load real exams from API ---- */
  React.useEffect(() => {
    const loadExams = async () => {
      try {
        const res = await axios.get("/api/exams");
        const all = res.data.data || [];
        setExams(all);
      } catch {
        toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
      } finally {
        setLoadingExams(false);
      }
    };
    loadExams();
  }, []);

  const selectedExam = React.useMemo(
    () => exams.find((e) => String(e.exam_id) === selectedExamId) || null,
    [exams, selectedExamId]
  );

  React.useEffect(() => {
    const loadPaper = async () => {
      if (!selectedExam) {
        setTemplate(null);
        return;
      }

      const found = paperTemplates.find(
        (t) => t.subject.toLowerCase() === selectedExam.subject_name?.toLowerCase()
      );
      setTemplate(found || null);
      setQuestions({});
      setPassage(found?.sections.find((s) => s.isEditable)?.description || "");

      try {
        const res = await axios.get(`/api/question-papers/exam/${selectedExam.exam_id}`);
        if (res.data.data) {
          const saved = res.data.data;
          setQuestions(saved.content || {});
          setPassage(saved.passage || "");
        }
      } catch (err) {
        console.error("Failed to load saved paper", err);
      }
    };
    loadPaper();
  }, [selectedExam]);

  const handleQuestionChange = (sectionId: string, questionId: string, value: any) => {
    setQuestions((prev: any) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [questionId]: value },
    }));
  };

  const finalQuestions = React.useMemo(() => {
    const editableSection = template?.sections.find((s) => s.isEditable);
    if (editableSection) {
      return {
        ...questions,
        [editableSection.id]: { ...questions[editableSection.id], passage },
      };
    }
    return questions;
  }, [questions, passage, template]);

  const handleSave = async () => {
    if (!selectedExamId || !template) return;
    setSaving(true);
    try {
      await axios.post("/api/question-papers", {
        exam_id: parseInt(selectedExamId),
        template_id: template.subject,
        content: questions,
        passage: passage
      });
      toast({ title: "Paper Saved", description: "Question paper has been saved successfully." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to save paper",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const examLabel = (exam: any) => {
    const cls = exam.class_name
      ? `${exam.class_name}${exam.section_name ? " - " + exam.section_name : ""}`
      : "";
    return `${exam.exam_name}${cls ? ` · ${cls}` : ""}${exam.subject_name ? ` (${exam.subject_name})` : ""}`;
  };

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FilePenLine className="h-5 w-5" />
            Question Paper Generator
          </CardTitle>
          <CardDescription>
            Select an exam and fill in the questions to generate a paper.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="exam-select">Select Exam</Label>
            {loadingExams ? (
              <PageSkeleton rows={3} />
            ) : (
              <Select onValueChange={setSelectedExamId}>
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="Choose an upcoming or scheduled exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No upcoming exams found
                    </SelectItem>
                  ) : (
                    exams.map((exam) => (
                      <SelectItem key={exam.exam_id} value={String(exam.exam_id)}>
                        {examLabel(exam)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedExam && !template && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Template Not Found</AlertTitle>
              <AlertDescription>
                A question paper template for the subject &ldquo;{selectedExam.subject_name}&rdquo; has not been created yet.
              </AlertDescription>
            </Alert>
          )}

          {selectedExam && template && (
            <div className="space-y-4 pt-4 border-t">
              {template.sections.map((section, idx) => (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-lg font-semibold tracking-tight">
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
                  ) : (
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

                  {idx < template.sections.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {selectedExam && template && (
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Save Paper
            </Button>
            <Button className="w-full sm:w-auto" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Print Paper
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Paper Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated paper. Final PDF formatting may vary.
            </DialogDescription>
          </DialogHeader>
          {selectedExam && template && (
            <QuestionPaperPreview
              exam={{
                id: String(selectedExam.exam_id),
                name: selectedExam.exam_name,
                class: selectedExam.class_name,
                subject: selectedExam.subject_name,
                date: new Date(selectedExam.date_time),
                time: "",
                duration: selectedExam.duration_mins,
                totalScore: selectedExam.total_score,
                status: "Upcoming",
              }}
              template={template}
              questions={finalQuestions}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
