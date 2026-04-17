import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/students/:id — detailed student profile with all grades
export async function GET(req: NextRequest, { params }: Params) {
  try {
    requireAuth(req);
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        grades: {
          include: { subject: true },
          orderBy: { subject: { name: "asc" } },
        },
      },
    });

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    const scores = student.grades.map((g) => g.totalScore);
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;

    return Response.json({ ...student, averageScore, isAtRisk: averageScore < 60 && scores.length > 0 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/students/:id]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/students/:id — update student group (admin/teacher)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    if (!["ADMIN", "TEACHER"].includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { group } = body as { group?: string };

    const updated = await prisma.student.update({
      where: { id },
      data: { ...(group ? { group } : {}) },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return Response.json(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[PUT /api/students/:id]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/students/:id — admin only
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.student.delete({ where: { id } });

    return Response.json({ message: "Student deleted" });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[DELETE /api/students/:id]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
