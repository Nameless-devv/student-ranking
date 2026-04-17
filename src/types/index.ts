import type { Role } from "@prisma/client";

export type { Role };
export type GradeLetter = "5" | "4" | "3" | "2";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface StudentDTO {
  id: string;
  userId: string;
  group: string;
  user: {
    name: string;
    email: string;
  };
  averageScore?: number;
  grades?: GradeDTO[];
  isAtRisk?: boolean;
}

export interface SubjectDTO {
  id: string;
  name: string;
}

export interface GradeDTO {
  id: string;
  studentId: string;
  subjectId: string;
  subject: SubjectDTO;
  attendance: number;
  homework: number;
  midterm: number;
  final: number;
  totalScore: number;
  gradeLetter: GradeLetter;
}

export interface LeaderboardEntry extends StudentDTO {
  rank: number;
  averageScore: number;
}

export interface AnalyticsData {
  totalStudents: number;
  averageScore: number;
  topStudents: LeaderboardEntry[];
  gradeDistribution: Record<string, number>;
  subjectPerformance: {
    subjectName: string;
    averageScore: number;
    studentCount: number;
  }[];
  atRiskStudents: StudentDTO[];
}
