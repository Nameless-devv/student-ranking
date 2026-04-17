import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { deriveGrade } from "@/utils/grading";
import { writeAudit } from "@/lib/audit";
import { sendEmail, gradeUpdateEmailHtml } from "@/lib/email";
import { z } from "zod";

const gradeSchema = z.object({
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  semesterId: z.string().optional(),
  attendance: z.number().min(0).max(100),
  homework: z.number().min(0).max(100),
  midterm: z.number().min(0).max(100),
  final: z.number().min(0).max(100),
});

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const semesterId = searchParams.get("semesterId");

    const grades = await prisma.grade.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(semesterId ? { semesterId } : {}),
      },
      include: {
        subject: true,
        semester: { select: { name: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: [{ student: { user: { name: "asc" } } }, { subject: { name: "asc" } }],
    });

    return Response.json(grades);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/grades]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const caller = requireAuth(req);
    if (!["ADMIN", "TEACHER"].includes(caller.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { studentId, subjectId, semesterId, attendance, homework, midterm, final } = parsed.data;
    const { totalScore, gradeLetter, gradePoints } = deriveGrade({ attendance, homework, midterm, final });

    // Build the grade record — handle null semesterId separately to avoid Prisma upsert issue
    let grade;
    const gradeData = { attendance, homework, midterm, final, totalScore, gradeLetter, gradePoints };
    const include = {
      subject: true,
      semester: { select: { name: true } },
      student: { include: { user: { select: { name: true, email: true, notifyGradeUpdate: true } } } },
    };

    if (semesterId) {
      grade = await prisma.grade.upsert({
        where: { studentId_subjectId_semesterId: { studentId, subjectId, semesterId } },
        create: { studentId, subjectId, semesterId, ...gradeData },
        update: gradeData,
        include,
      });
    } else {
      const existing = await prisma.grade.findFirst({ where: { studentId, subjectId, semesterId: null } });
      if (existing) {
        grade = await prisma.grade.update({ where: { id: existing.id }, data: gradeData, include });
      } else {
        grade = await prisma.grade.create({ data: { studentId, subjectId, semesterId: null, ...gradeData }, include });
      }
    }

    // Audit log
    await writeAudit({
      userId: caller.userId,
      action: "UPDATE",
      entity: "Grade",
      entityId: grade.id,
      details: { studentId, subjectId, totalScore, gradeLetter },
    });

    // Send email notification if student has it enabled
    if (grade.student.user.notifyGradeUpdate) {
      sendEmail({
        to: grade.student.user.email,
        subject: `New grade posted: ${grade.subject.name}`,
        html: gradeUpdateEmailHtml({
          studentName: grade.student.user.name,
          subjectName: grade.subject.name,
          totalScore: grade.totalScore,
          gradeLetter: grade.gradeLetter,
          semesterName: grade.semester?.name,
        }),
      }).catch(() => {}); // fire-and-forget
    }

    // Auto at-risk check: if totalScore < 60, flag it
    const allGrades = await prisma.grade.findMany({
      where: { studentId },
      select: { totalScore: true },
    });
    const avg = allGrades.reduce((s, g) => s + g.totalScore, 0) / allGrades.length;
    const isAtRisk = avg < 60;

    return Response.json({ ...grade, isAtRisk }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/grades]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
