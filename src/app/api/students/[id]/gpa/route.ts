import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { calculateGPA, gpaToLetter } from "@/utils/grading";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        grades: {
          include: {
            subject: { select: { name: true, creditHours: true } },
            semester: { select: { name: true, year: true, term: true } },
          },
        },
      },
    });

    if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

    // Overall GPA
    const overallGPA = calculateGPA(
      student.grades.map((g) => ({
        gradePoints: g.gradePoints,
        creditHours: g.subject.creditHours,
      }))
    );

    // GPA per semester
    const semesterMap: Record<string, typeof student.grades> = {};
    for (const g of student.grades) {
      const key = g.semester?.name || "No Semester";
      if (!semesterMap[key]) semesterMap[key] = [];
      semesterMap[key].push(g);
    }

    const semesterGPAs = Object.entries(semesterMap).map(([semName, grades]) => ({
      semester: semName,
      gpa: calculateGPA(
        grades.map((g) => ({ gradePoints: g.gradePoints, creditHours: g.subject.creditHours }))
      ),
      gpaLetter: gpaToLetter(
        calculateGPA(
          grades.map((g) => ({ gradePoints: g.gradePoints, creditHours: g.subject.creditHours }))
        )
      ),
      subjectCount: grades.length,
      totalCredits: grades.reduce((s, g) => s + g.subject.creditHours, 0),
    }));

    const totalCredits = student.grades.reduce((s, g) => s + g.subject.creditHours, 0);

    return Response.json({
      studentId: id,
      studentName: student.user.name,
      overallGPA,
      gpaLetter: gpaToLetter(overallGPA),
      totalCredits,
      semesterGPAs,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/students/:id/gpa]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
