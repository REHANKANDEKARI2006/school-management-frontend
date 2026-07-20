
"use client";

import * as React from "react";
import { type Question } from "@/lib/paper-templates";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface QuestionInputProps {
  sectionId: string;
  question: Question;
  onChange: (sectionId: string, questionId: string, value: any) => void;
}

export function QuestionInput({ sectionId, question, onChange }: QuestionInputProps) {
  const [questions, setQuestions] = React.useState<any[]>(Array(question.count).fill({ text: "" }));

  const handleTextChange = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], text };
    setQuestions(newQuestions);
    onChange(sectionId, question.id, newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[qIndex].options || Array(4).fill(""))];
    options[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options };
    setQuestions(newQuestions);
    onChange(sectionId, question.id, newQuestions);
  };

  const renderQuestionInputs = () => {
    switch (question.type) {
      case 'MCQ':
        return questions.map((q, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-md">
            <Label>Question {i + 1}</Label>
            <Textarea
              placeholder={`Enter question ${i + 1} text`}
              value={q.text || ""}
              onChange={(e) => handleTextChange(i, e.target.value)}
              className="mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              {Array(4).fill(0).map((_, j) => (
                <Input
                  key={j}
                  placeholder={`Option ${String.fromCharCode(97 + j)}`}
                  value={(q.options && q.options[j]) || ""}
                  onChange={(e) => handleOptionChange(i, j, e.target.value)}
                />
              ))}
            </div>
          </div>
        ));
      case 'FillInTheBlanks':
        return questions.map((q, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-md">
             <Label>Question {i + 1}</Label>
            <Textarea
              placeholder={`Enter sentence with ___ for blank, e.g. "The sky is ___."`}
              value={q.text || ""}
              onChange={(e) => handleTextChange(i, e.target.value)}
            />
          </div>
        ));
      case 'ColumnarOperation':
        return questions.map((q, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-md">
             <Label>Question {i + 1}</Label>
            <Textarea
              placeholder={`Use spaces to format the problem, e.g.\n  456\n+ 123\n------`}
              value={q.text || ""}
              onChange={(e) => handleTextChange(i, e.target.value)}
              className="font-code"
            />
          </div>
        ));
      default: // VSA, SA1, SA2, LA
        return questions.map((q, i) => (
          <div key={i} className="space-y-2 p-3 border rounded-md">
             <Label>Question {i + 1}</Label>
            <Textarea
              placeholder={`Enter question ${i + 1}`}
              value={q.text || ""}
              onChange={(e) => handleTextChange(i, e.target.value)}
            />
          </div>
        ));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <h4 className="font-semibold">{question.title} ({question.type})</h4>
            <span className="text-sm font-bold text-muted-foreground">{question.totalMarks} Marks</span>
        </div>
        <p className="text-xs text-muted-foreground">{question.description || `Enter ${question.count} questions.`}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderQuestionInputs()}
      </CardContent>
    </Card>
  );
}
