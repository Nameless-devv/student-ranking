import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const semesterSchema = z.object({
  name: z.string().min(2),
  year: z.number().int().min(2000).max(2100),
  term: z.enum(["Spring", "Fall", "Summer"]),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const semesters = await prisma.semester.findMany({
      orderBy: [{ year: "desc" }, { term: "asc" }],
      include: { _count: { select: { grades: true } } },
    });
    return Response.json(semesters);
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = semesterSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;

    // If new semester is active, deactivate others
    if (data.isActive) {
      await prisma.semester.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    const semester = await prisma.semester.create({
      data: {
        name: data.name,
        year: data.year,
        term: data.term,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
      },
    });

    await writeAudit({ userId: user.userId, action: "CREATE", entity: "Semester", entityId: semester.id, details: { name: semester.name } });

    return Response.json(semester, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/semesters]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
