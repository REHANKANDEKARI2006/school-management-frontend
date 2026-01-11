
import type { Student, ClassItem, Subject, FeeStructure } from '@/types';
import feesData from './fees.json';
import feeStructuresData from './fee-structures.json';
import type { FeeCategory } from '@/components/campus-connect/fee-category-form';


const classes: ClassItem[] = [
  { id: '1', name: 'Class 10 - Section A', subjectIds: ['101', '102', '103'] },
  { id: '2', name: 'Class 10 - Section B', subjectIds: ['101', '104', '105', '103'] },
  { id: '3', name: 'Class 11 - Section A', subjectIds: ['201', '202', '203'] },
  { id: '4', name: 'Class 9 - Section C', subjectIds: ['101', '103', '104'] }, 
  { id: '5', name: 'Class 12 - Section B', subjectIds: ['201', '101', '103'] },
];

const subjects: Subject[] = [
  { id: '101', name: 'Mathematics' },
  { id: '102', name: 'Science' },
  { id: '103', name: 'English' },
  { id: '104', name: 'History' },
  { id: '105', name: 'Geography' },
  { id: '201', name: 'Physics' },
  { id: '202', name: 'Chemistry' },
  { id: '203', name: 'Biology' },
];

// Enroll students in subjects (many-to-many relationship)
// This is a simplified representation. In a real DB, this would be a join table.
const subjectEnrollment: { [subjectId: string]: string[] } = {
  '101': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17'], // Maths for all
  '102': ['S1', 'S2', 'S3', 'S4'],          // Science for 10A
  '103': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17'], // English for most
  '104': ['S5', 'S6', 'S9', 'S10', 'S11'],                      // History for 10B & 9C
  '105': ['S5', 'S6'],                      // Geography for 10B
  '201': ['S7', 'S8', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17'], // Physics for 11A & 12B
  '202': ['S7', 'S8'],                      // Chemistry for 11A
  '203': ['S7', 'S8'],                      // Biology for 11A
};

const students: Student[] = [
  { id: 'S1', name: 'Liam Johnson', rollNumber: '10A-01', class: 'Class 10 - Section A', classId: '1', classNameShort: '10-A', avatar: 'https://picsum.photos/seed/liam/200/200', fallback: 'LJ', subjectIds: ['101', '102', '103'] },
  { id: 'S2', name: 'Ava Garcia', rollNumber: '10A-02', class: 'Class 10 - Section A', classId: '1', classNameShort: '10-A', avatar: 'https://picsum.photos/seed/ava/200/200', fallback: 'AG', subjectIds: ['101', '102', '103'] },
  { id: 'S3', name: 'Noah Miller', rollNumber: '10A-03', class: 'Class 10 - Section A', classId: '1', classNameShort: '10-A', avatar: 'https://picsum.photos/seed/noah/200/200', fallback: 'NM', subjectIds: ['101', '102', '103'] },
  { id: 'S4', name: 'Isabella Wilson', rollNumber: '10A-04', class: 'Class 10 - Section A', classId: '1', classNameShort: '10-A', avatar: 'https://picsum.photos/seed/isabella/200/200', fallback: 'IW', subjectIds: ['101', '102', '103'] },
  
  { id: 'S5', name: 'James Davis', rollNumber: '10B-01', class: 'Class 10 - Section B', classId: '2', classNameShort: '10-B', avatar: 'https://picsum.photos/seed/james/200/200', fallback: 'JD', subjectIds: ['101', '104', '105', '103'] },
  { id: 'S6', name: 'Sophia Rodriguez', rollNumber: '10B-02', class: 'Class 10 - Section B', classId: '2', classNameShort: '10-B', avatar: 'https://picsum.photos/seed/sophia/200/200', fallback: 'SR', subjectIds: ['101', '104', '105', '103'] },
  { id: 'S18', name: 'Logan Smith', rollNumber: '10B-03', class: 'Class 10 - Section B', classId: '2', classNameShort: '10-B', avatar: 'https://picsum.photos/seed/logan/200/200', fallback: 'LS', subjectIds: ['101', '104', '105', '103'] },
  
  { id: 'S7', name: 'Ethan Martinez', rollNumber: '11A-01', class: 'Class 11 - Section A', classId: '3', classNameShort: '11-A', avatar: 'https://picsum.photos/seed/ethan/200/200', fallback: 'EM', subjectIds: ['201', '202', '203', '101'] },
  { id: 'S8', name: 'Mia Anderson', rollNumber: '11A-02', class: 'Class 11 - Section A', classId: '3', classNameShort: '11-A', avatar: 'https://picsum.photos/seed/mia/200/200', fallback: 'MA', subjectIds: ['201', '202', '203', '101'] },
  { id: 'S19', name: 'Lucas Hernandez', rollNumber: '11A-03', class: 'Class 11 - Section A', classId: '3', classNameShort: '11-A', avatar: 'https://picsum.photos/seed/lucas/200/200', fallback: 'LH', subjectIds: ['201', '202', '203', '101'] },

  { id: 'S9', name: 'Oliver Taylor', rollNumber: '9C-01', class: 'Class 9 - Section C', classId: '4', classNameShort: '9-C', avatar: 'https://picsum.photos/seed/oliver/200/200', fallback: 'OT', subjectIds: ['101', '103', '104'] },
  { id: 'S10', name: 'Amelia Brown', rollNumber: '9C-02', class: 'Class 9 - Section C', classId: '4', classNameShort: '9-C', avatar: 'https://picsum.photos/seed/amelia/200/200', fallback: 'AB', subjectIds: ['101', '103', '104'] },
  { id: 'S11', name: 'Elijah Jones', rollNumber: '9C-03', class: 'Class 9 - Section C', classId: '4', classNameShort: '9-C', avatar: 'https://picsum.photos/seed/elijah/200/200', fallback: 'EJ', subjectIds: ['101', '103', '104'] },

  { id: 'S12', name: 'Charlotte Moore', rollNumber: '12B-01', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/charlotte/200/200', fallback: 'CM', subjectIds: ['201', '101', '103'] },
  { id: 'S13', name: 'Henry Garcia', rollNumber: '12B-02', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/henry/200/200', fallback: 'HG', subjectIds: ['201', '101', '103'] },
  { id: 'S14', name: 'Aria Martinez', rollNumber: '12B-03', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/aria/200/200', fallback: 'AM', subjectIds: ['201', '101', '103'] },
  { id: 'S15', name: 'William Rodriguez', rollNumber: '12B-04', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/william/200/200', fallback: 'WR', subjectIds: ['201', '101', '103'] },
  { id: 'S16', name: 'Sofia Lopez', rollNumber: '12B-05', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/sofia/200/200', fallback: 'SL', subjectIds: ['201', '101', '103'] },
  { id: 'S17', name: 'Benjamin Hernandez', rollNumber: '12B-06', class: 'Class 12 - Section B', classId: '5', classNameShort: '12-B', avatar: 'https://picsum.photos/seed/benjamin/200/200', fallback: 'BH', subjectIds: ['201', '101', '103'] },
];

export const getClasses = () => classes;
export const getClassById = (id: string) => classes.find(c => c.id === id);

export const getSubjects = () => subjects;
export const getSubjectById = (id: string) => subjects.find(s => s.id === id);

export const getSubjectsForClass = (classId: string) => {
  const classItem = classes.find(c => c.id === classId);
  if (!classItem) return [];
  return subjects.filter(s => classItem.subjectIds.includes(s.id));
};

export const getStudentsByClass = (classId: string) => {
    return students.filter(s => s.classId === classId);
}

export const getStudentsByShortClassName = (classNameShort: string) => {
    return students.filter(s => s.classNameShort === classNameShort);
}

export const getStudentsForSubjectInClass = (classId: string, subjectId: string) => {
    const studentsInClass = getStudentsByClass(classId);
    const enrolledStudentIds = subjectEnrollment[subjectId] || [];
    return studentsInClass.filter(student => enrolledStudentIds.includes(student.id));
};

export const getStudentById = (studentId: string) => {
    return students.find(s => s.id === studentId);
}

export const getFeeCategories = (): FeeCategory[] => {
    return feesData.feeCategories;
}

export const getFeeStructures = (): FeeStructure[] => {
    return feeStructuresData.feeStructures;
}

export const getFeeStructureByClassAndCategory = (classId: string, feeCategoryId: string): FeeStructure | undefined => {
    return feeStructuresData.feeStructures.find(fs => fs.classId === classId && fs.feeCategoryId === feeCategoryId);
}
