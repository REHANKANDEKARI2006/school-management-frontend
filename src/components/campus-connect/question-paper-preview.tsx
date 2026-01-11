
"use client";

import * as React from "react";
import { type Exam } from "./exam-form";
import { type PaperTemplate } from "@/lib/paper-templates";
import { useIdCardSettings } from "./id-card-settings-provider";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";

interface QuestionPaperPreviewProps {
  exam: Exam;
  template: PaperTemplate;
  questions: any;
}

export function QuestionPaperPreview({ exam, template, questions }: QuestionPaperPreviewProps) {
  const { settings } = useIdCardSettings();

  return (
    <ScrollArea className="h-[70vh]">
        <div className="bg-white text-black p-8 font-serif">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    {settings.logoUrl && <Image src={settings.logoUrl} alt="School Logo" width={40} height={40} className="rounded-full" />}
                    <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
                </div>
                <h2 className="text-lg font-semibold">{exam.name}</h2>
                <div className="flex justify-between text-sm mt-2">
                    <span>Subject: {exam.subject}</span>
                    <span>Std: {exam.class}</span>
                </div>
            </div>

            {/* Meta Info */}
            <div className="flex justify-between items-center text-sm font-bold my-4">
                <span>Time: {exam.duration} mins</span>
                <span>Total Marks: {exam.totalScore}</span>
            </div>

            {/* Instructions */}
            <div className="mb-6">
                <h3 className="font-bold underline">General Instructions:</h3>
                <ul className="list-decimal list-inside text-sm space-y-1 mt-2">
                    {template.generalInstructions.map((inst, i) => <li key={i}>{inst}</li>)}
                </ul>
            </div>

            <div className="border-b-2 border-dotted border-black my-4"></div>

            {/* Questions */}
            <div className="space-y-6">
                {template.sections.map(section => {
                    const sectionQuestions = questions[section.id] || {};
                    const passage = section.isEditable ? sectionQuestions.passage : section.description;

                    return (
                        <div key={section.id}>
                            <div className="flex justify-between items-baseline">
                                <h3 className="text-lg font-bold">Section {section.id}: {section.title}</h3>
                            </div>
                            
                            {section.isEditable ? (
                                <div className="text-sm italic text-gray-800 my-2 p-3 border rounded-md bg-gray-50 whitespace-pre-wrap">{passage || "(Passage not filled in)"}</div>
                            ) : (
                                <p className="text-sm italic text-gray-600 mb-4">{passage}</p>
                            )}
                            
                            {section.questions.map(qTemplate => (
                                <div key={qTemplate.id} className="mb-4">
                                    <div className="flex justify-between items-baseline font-bold">
                                        <p>{qTemplate.title}</p>
                                        <p>[{qTemplate.totalMarks}]</p>
                                    </div>
                                    {qTemplate.description && <p className="text-xs italic text-gray-500 mb-2">{qTemplate.description}</p>}
                                    <div className="pl-4 mt-2 space-y-3 text-sm">
                                        {(sectionQuestions[qTemplate.id] || []).map((q: any, i: number) => (
                                            <div key={i}>
                                                <div className="flex gap-2">
                                                    <span className="font-bold">{i + 1}.</span>
                                                    <p className="whitespace-pre-wrap font-sans">{q.text || `(Question ${i+1} not filled)`}</p>
                                                </div>
                                                {qTemplate.type === 'MCQ' && q.options && (
                                                    <div className="grid grid-cols-2 gap-x-4 pl-6 text-xs mt-1">
                                                        {q.options.map((opt: string, j: number) => (
                                                            <p key={j}>{`(${String.fromCharCode(97 + j)})`} {opt}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

             {/* Footer */}
            <div className="text-center font-bold mt-8">
                <p>// BEST OF LUCK //</p>
            </div>
        </div>
    </ScrollArea>
  );
}
