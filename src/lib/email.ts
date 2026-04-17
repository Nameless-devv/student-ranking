/**
 * Email service using Nodemailer.
 * Configure SMTP credentials in .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * For development, set SMTP_ENABLED=false to just log emails to the console.
 */

import nodemailer from "nodemailer";

const SMTP_ENABLED = process.env.SMTP_ENABLED !== "false";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!SMTP_ENABLED) {
    // Dev mode: log to console
    console.log("\n📧 [EMAIL - Dev Mode]");
    console.log(`  To: ${opts.to}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body: ${opts.html.replace(/<[^>]+>/g, " ").slice(0, 200)}…\n`);
    return true;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Student Ranking System <noreply@school.edu>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

// ── Email Templates ────────────────────────────────────────────────────────────

export function atRiskEmailHtml(opts: {
  studentName: string;
  averageScore: number;
  subjects: { name: string; score: number }[];
}): string {
  const subjectRows = opts.subjects
    .map(
      (s) =>
        `<tr style="border-bottom:1px solid #eee">
           <td style="padding:8px 12px">${s.name}</td>
           <td style="padding:8px 12px;color:${s.score < 60 ? "#ef4444" : "#374151"};font-weight:bold">${s.score}%</td>
         </tr>`
    )
    .join("");

  return `
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#ef4444;color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">⚠️ At-Risk Student Alert</h2>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <p>Dear teacher,</p>
      <p><strong>${opts.studentName}</strong> is currently at risk with an average score of
        <strong style="color:#ef4444">${opts.averageScore}%</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left">Subject</th>
            <th style="padding:8px 12px;text-align:left">Score</th>
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>
      <p>Please reach out to this student as soon as possible.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/students"
         style="background:#3b82f6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px">
        View Student Profile
      </a>
    </div>
  </div>`;
}

export function gradeUpdateEmailHtml(opts: {
  studentName: string;
  subjectName: string;
  totalScore: number;
  gradeLetter: string;
  semesterName?: string;
}): string {
  const color =
    opts.totalScore >= 80 ? "#22c55e" : opts.totalScore >= 60 ? "#f59e0b" : "#ef4444";
  return `
  <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#3b82f6;color:white;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">📊 New Grade Posted</h2>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      <p>Hello <strong>${opts.studentName}</strong>,</p>
      <p>Your grade for <strong>${opts.subjectName}</strong>${opts.semesterName ? ` (${opts.semesterName})` : ""} has been posted:</p>
      <div style="text-align:center;padding:24px">
        <span style="font-size:48px;font-weight:bold;color:${color}">${opts.gradeLetter}</span>
        <p style="color:#6b7280;margin:4px 0">${opts.totalScore}% total score</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="background:#3b82f6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
        View My Grades
      </a>
    </div>
  </div>`;
}
