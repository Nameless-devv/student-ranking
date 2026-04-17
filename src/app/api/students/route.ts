import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  group: z.string().min(1),
});

// GET /api/students — list all students with their average score
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const group = searchParams.get("group") || "";

    const students = await prisma.student.findMany({
      where: {
        ...(group ? { group } : {}),
        user: {
          name: { contains: search, mode: "insensitive" },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        grades: {
          include: { subject: { select: { id: true, name: true } } },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    // Compute average score per student
    const result = students.map((s) => {
      const scores = s.grades.map((g) => g.totalScore);
      const averageScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : 0;
      return { ...s, averageScore, isAtRisk: averageScore < 60 && scores.length > 0 };
    });

    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/students]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/students — admin/teacher creates a student account
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!["ADMIN", "TEACHER"].includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createStudentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, group } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newStudent = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashedPassword, role: "STUDENT" },
      });
      return tx.student.create({
        data: { userId: newUser.id, group },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
    });

    return Response.json(newStudent, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/students]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
