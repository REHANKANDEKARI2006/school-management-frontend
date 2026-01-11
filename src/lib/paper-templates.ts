
export interface Question {
    id: string;
    type: 'MCQ' | 'VSA' | 'SA1' | 'SA2' | 'LA' | 'FillInTheBlanks' | 'MatchPairs' | 'ColumnarOperation';
    title: string;
    description?: string;
    count: number;
    marksPerQuestion: number;
    totalMarks: number;
}

export interface Section {
    id: 'A' | 'B' | 'C' | 'D' | 'E';
    title: string;
    description: string;
    isEditable?: boolean;
    questions: Question[];
}

export interface PaperTemplate {
    subject: string;
    totalMarks: number;
    duration: number; // in minutes
    generalInstructions: string[];
    sections: Section[];
}

export const paperTemplates: PaperTemplate[] = [
    {
        subject: "Biology",
        totalMarks: 70,
        duration: 180,
        generalInstructions: [
            "Section A: Q. No. 1 contains Ten multiple choice type of questions carrying one mark each. Q. No. 2 contains Eight very short answer type of questions carrying one mark each.",
            "Section B: Q. No. 3 to Q. No. 14 are short answer type of questions carrying two marks each.",
            "Section C: Q. No. 15 to Q. No. 26 are short answer type of questions carrying Three marks each.",
            "Section D: Q. No. 27 to Q. No. 31 are long answer type of questions carrying Four marks each.",
            "Figures to the right indicate full marks.",
            "For each MCQ, correct answer must be written along with its alphabet. e.g., (a).... / (b) ..... / (c)...... / (d)....... Only first attempt will be considered for evaluation."
        ],
        sections: [
            {
                id: 'A',
                title: "Section A",
                description: "This section contains Multiple Choice Questions and Very Short Answer questions.",
                questions: [
                    { id: 'q1', type: 'MCQ', title: "Select and Write the correct answer", count: 10, marksPerQuestion: 1, totalMarks: 10 },
                    { id: 'q2', type: 'VSA', title: "Answer the following", count: 8, marksPerQuestion: 1, totalMarks: 8 }
                ]
            },
            {
                id: 'B',
                title: "Section B",
                description: "Attempt any Eight.",
                questions: [
                    { id: 'q3', type: 'SA1', title: "Short Answer Questions - I", count: 8, marksPerQuestion: 2, totalMarks: 16 }
                ]
            },
            {
                id: 'C',
                title: "Section C",
                description: "Attempt any Eight.",
                questions: [
                    { id: 'q4', type: 'SA2', title: "Short Answer Questions - II", count: 8, marksPerQuestion: 3, totalMarks: 24 }
                ]
            },
            {
                id: 'D',
                title: "Section D",
                description: "Attempt any Three.",
                questions: [
                    { id: 'q5', type: 'LA', title: "Long Answer Questions", count: 3, marksPerQuestion: 4, totalMarks: 12 }
                ]
            }
        ]
    },
    {
        subject: "Mathematics",
        totalMarks: 50,
        duration: 90,
        generalInstructions: [
            "All questions are compulsory.",
            "The marks for each question are indicated on the right.",
            "Show all your work for full credit."
        ],
        sections: [
            {
                id: 'A',
                title: "Section A: Multiple Choice",
                description: "Choose the one correct answer for each question.",
                questions: [
                    { id: 'math-q1', type: 'MCQ', title: "Multiple Choice Questions", count: 5, marksPerQuestion: 1, totalMarks: 5 }
                ]
            },
            {
                id: 'B',
                title: "Section B: Basic Arithmetic",
                description: "Solve the following problems.",
                questions: [
                    { id: 'math-q2', type: 'ColumnarOperation', title: "Addition & Subtraction", description: "Solve the following sums in columns.", count: 4, marksPerQuestion: 2, totalMarks: 8 }
                ]
            },
            {
                id: 'C',
                title: "Section C: Short Answer",
                description: "Answer the following questions briefly.",
                questions: [
                    { id: 'math-q3', type: 'SA1', title: "Word Problems", count: 5, marksPerQuestion: 3, totalMarks: 15 }
                ]
            },
            {
                id: 'D',
                title: "Section D: Long Answer",
                description: "Solve in detail.",
                questions: [
                     { id: 'math-q4', type: 'LA', title: "Detailed Problems", count: 3, marksPerQuestion: 4, totalMarks: 12 }
                ]
            }
        ]
    },
    {
        subject: "English",
        totalMarks: 30,
        duration: 60,
        generalInstructions: [
            "Read all questions carefully before answering.",
            "Answer all questions in the space provided."
        ],
        sections: [
            {
                id: 'A',
                title: "Section A: Reading Comprehension",
                description: "Enter the passage for students to read here.",
                isEditable: true,
                questions: [
                    { id: 'eng-q1', type: 'VSA', title: "Comprehension Questions", description: "Answer based on the passage above.", count: 4, marksPerQuestion: 2, totalMarks: 8 }
                ]
            },
            {
                id: 'B',
                title: "Section B: Grammar",
                description: "Complete the following exercises.",
                questions: [
                    { id: 'eng-q2', type: 'FillInTheBlanks', title: "Fill in the Blanks", description: "Use the correct form of the verb given in brackets.", count: 5, marksPerQuestion: 1, totalMarks: 5 }
                ]
            },
            {
                id: 'C',
                title: "Section C: Writing",
                description: "Write a short composition.",
                questions: [
                    { id: 'eng-q3', type: 'LA', title: "Paragraph Writing", description: "Write a short paragraph on 'My Favorite Animal'.", count: 1, marksPerQuestion: 5, totalMarks: 5 }
                ]
            }
        ]
    }
];
