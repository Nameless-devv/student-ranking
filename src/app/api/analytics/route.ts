import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/analytics — aggregate stats for the dashboard
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    // Fetch all students with their grades in one query
    const students = await prisma.student.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        grades: {
          include: { subject: { select: { id: true, name: true } } },
        },
      },
    });

    const totalStudents = students.length;

    // Per-student average scores
    const studentAverages = students.map((s) => {
      const scores = s.grades.map((g) => g.totalScore);
      const avg =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : 0;
      return { ...s, averageScore: avg };
    });

    // Global average score
    const allAverages = studentAverages.map((s) => s.averageScore);
    const averageScore =
      allAverages.length > 0
        ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 100) / 100
        : 0;

    // Top 5 students
    const topStudents = [...studentAverages]
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    // Grade distribution across all grades
    const allGrades = await prisma.grade.findMany({
      select: { gradeLetter: true },
    });
    const gradeDistribution: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0 };
    for (const g of allGrades) {
      gradeDistribution[g.gradeLetter] = (gradeDistribution[g.gradeLetter] || 0) + 1;
    }

    // Subject-level performance
    const subjectMap: Record<string, { name: string; scores: number[] }> = {};
    for (const student of students) {
      for (const grade of student.grades) {
        const sid = grade.subject.id;
        if (!subjectMap[sid]) {
          subjectMap[sid] = { name: grade.subject.name, scores: [] };
        }
        subjectMap[sid].scores.push(grade.totalScore);
      }
    }
    const subjectPerformance = Object.values(subjectMap)
      .map(({ name, scores }) => ({
        subjectName: name,
        averageScore:
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0,
        studentCount: scores.length,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    // At-risk students (avg < 60, has at least 1 grade)
    const atRiskStudents = studentAverages
      .filter((s) => s.grades.length > 0 && s.averageScore < 56)
      .map((s) => ({ ...s, isAtRisk: true }));

    return Response.json({
      totalStudents,
      averageScore,
      topStudents,
      gradeDistribution,
      subjectPerformance,
      atRiskStudents,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/analytics]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
