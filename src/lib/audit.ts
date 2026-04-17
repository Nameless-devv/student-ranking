import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface AuditOptions {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/** Write a non-blocking audit log entry. Errors are swallowed so they never break the main flow. */
export async function writeAudit(opts: AuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details ? JSON.stringify(opts.details) : undefined,
        ipAddress: opts.ipAddress,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write:", err);
  }
}
