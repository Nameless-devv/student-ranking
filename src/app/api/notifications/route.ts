import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sendEmail, atRiskEmailHtml, gradeUpdateEmailHtml } from "@/lib/email";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["at-risk-alert", "grade-update", "bulk-at-risk"]),
  studentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const caller = requireRole(req, "ADMIN", "TEACHER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Validation failed" }, { status: 400 });

    const { type, studentId } = parsed.data;
    let sent = 0;

    if (type === "bulk-at-risk") {
      // Send alert to ALL teachers about ALL at-risk students
      const students = await prisma.student.findMany({
        include: {
          user: true,
          grades: { include: { subject: { select: { name: true } } } },
        },
      });

      const atRisk = students.filter((s) => {
        const scores = s.grades.map((g) => g.totalScore);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return avg < 60 && scores.length > 0;
      });

      const teachers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "TEACHER"] }, notifyAtRisk: true },
        select: { email: true, name: true },
      });

      for (const teacher of teachers) {
        for (const student of atRisk) {
          const scores = student.grades.map((g) => g.totalScore);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const ok = await sendEmail({
            to: teacher.email,
            subject: `⚠️ At-Risk Alert: ${student.user.name}`,
            html: atRiskEmailHtml({
              studentName: student.user.name,
              averageScore: Math.round(avg * 100) / 100,
              subjects: student.grades.map((g) => ({ name: g.subject.name, score: g.totalScore })),
            }),
          });
          if (ok) sent++;
        }
      }
    } else if (type === "at-risk-alert" && studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true, grades: { include: { subject: { select: { name: true } } } } },
      });
      if (!student) return Response.json({ error: "Student not found" }, { status: 404 });

      const scores = student.grades.map((g) => g.totalScore);
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const teachers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "TEACHER"] }, notifyAtRisk: true },
        select: { email: true },
      });

      for (const t of teachers) {
        const ok = await sendEmail({
          to: t.email,
          subject: `⚠️ At-Risk Alert: ${student.user.name}`,
          html: atRiskEmailHtml({
            studentName: student.user.name,
            averageScore: Math.round(avg * 100) / 100,
            subjects: student.grades.map((g) => ({ name: g.subject.name, score: g.totalScore })),
          }),
        });
        if (ok) sent++;
      }
    }

    await writeAudit({
      userId: caller.userId,
      action: "CREATE",
      entity: "Notification",
      details: { type, sent },
    });

    return Response.json({ message: `${sent} notification(s) sent`, sent });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/notifications]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
