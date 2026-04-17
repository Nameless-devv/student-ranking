/**
 * Seed script — populates the database with realistic sample data.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or via:   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { deriveGrade } from "../src/utils/grading";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const subjects = [
  "Matematika",
  "Dasturlash asoslari",
  "Axborot texnologiyalari",
  "Fizika",
  "Ingliz tili",
];

const students: {
  name: string;
  email: string;
  group: string;
}[] = [
  { name: "Aziz Karimov",       email: "aziz@school.edu",      group: "DI" },
  { name: "Dilnoza Yusupova",   email: "dilnoza@school.edu",   group: "DI" },
  { name: "Sardor Toshmatov",   email: "sardor@school.edu",    group: "DI" },
  { name: "Malika Rahimova",    email: "malika@school.edu",    group: "KI" },
  { name: "Jasur Xolmatov",     email: "jasur@school.edu",     group: "KI" },
  { name: "Nilufar Hasanova",   email: "nilufar@school.edu",   group: "AT" },
  { name: "Bobur Mirzayev",     email: "bobur@school.edu",     group: "AT" },
  { name: "Zulfiya Qodirova",   email: "zulfiya@school.edu",   group: "AX" },
  { name: "Ulugbek Normatov",   email: "ulugbek@school.edu",   group: "AX" },
  { name: "Shahnoza Ergasheva", email: "shahnoza@school.edu",  group: "AX" },
];

// Predefined scores per student (index-aligned) for reproducibility
const scores = [
  { attendance: 95, homework: 90, midterm: 88, final: 92 }, // Alice  — A
  { attendance: 80, homework: 75, midterm: 70, final: 78 }, // Bob    — C
  { attendance: 55, homework: 48, midterm: 50, final: 52 }, // Carol  — F (at risk)
  { attendance: 100, homework: 95, midterm: 98, final: 97 }, // David  — A
  { attendance: 72, homework: 68, midterm: 75, final: 80 }, // Emma   — C
  { attendance: 60, homework: 62, midterm: 58, final: 65 }, // Frank  — D
  { attendance: 88, homework: 85, midterm: 87, final: 90 }, // Grace  — A
  { attendance: 78, homework: 80, midterm: 72, final: 75 }, // Henry  — C
  { attendance: 92, homework: 88, midterm: 90, final: 95 }, // Isa    — A
  { attendance: 40, homework: 35, midterm: 42, final: 38 }, // Jack   — F (at risk)
];

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin user ────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@school.edu" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@school.edu",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  // ── Teacher user ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "teacher@school.edu" },
    update: {},
    create: {
      name: "Prof. Smith",
      email: "teacher@school.edu",
      password: await bcrypt.hash("teacher123", 12),
      role: "TEACHER",
    },
  });

  // ── Subjects ──────────────────────────────────────────────────────────────
  const subjectRecords = await Promise.all(
    subjects.map((name) =>
      prisma.subject.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log(`✅ ${subjectRecords.length} subjects created`);

  // ── Students + Grades ─────────────────────────────────────────────────────
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const score = scores[i];

    // Create user + student
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        password: await bcrypt.hash("student123", 12),
        role: "STUDENT",
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { group: s.group },
      create: { userId: user.id, group: s.group },
    });

    // Assign grades for each subject with slight variation
    for (let j = 0; j < subjectRecords.length; j++) {
      const variation = j * 3 - 5; // slight per-subject variation
      const inputs = {
        attendance: Math.max(0, Math.min(100, score.attendance + variation)),
        homework: Math.max(0, Math.min(100, score.homework - variation)),
        midterm: Math.max(0, Math.min(100, score.midterm + Math.floor(variation / 2))),
        final: Math.max(0, Math.min(100, score.final - Math.floor(variation / 3))),
      };
      const { totalScore, gradeLetter, gradePoints } = deriveGrade(inputs);

      // semesterId is null — use findFirst+create/update instead of upsert
      const existing = await prisma.grade.findFirst({
        where: { studentId: student.id, subjectId: subjectRecords[j].id, semesterId: null },
      });
      if (existing) {
        await prisma.grade.update({
          where: { id: existing.id },
          data: { ...inputs, totalScore, gradeLetter, gradePoints },
        });
      } else {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: subjectRecords[j].id,
            ...inputs,
            totalScore,
            gradeLetter,
            gradePoints,
          },
        });
      }
    }

    console.log(`  ✅ ${s.name} (${s.group})`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Admin:   admin@school.edu   / admin123");
  console.log("   Teacher: teacher@school.edu / teacher123");
  console.log("   Student: aziz@school.edu    / student123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
