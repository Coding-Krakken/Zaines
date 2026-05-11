import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const ASSOCIATION_AUDIT_PREFIX = "[ASSOCIATION_AUDIT]";

export type ReassociationAuditEventInput = {
  actorUserId: string;
  actorName: string;
  entityType: "photo" | "message";
  entityId: string;
  targetUserId: string;
  previousBookingId: string | null;
  nextBookingId: string | null;
  reason?: string;
};

export function buildReassociationAuditContent(input: ReassociationAuditEventInput): string {
  const payload = {
    eventType: "REASSOCIATION_UPDATED",
    entityType: input.entityType,
    entityId: input.entityId,
    targetUserId: input.targetUserId,
    previousBookingId: input.previousBookingId,
    nextBookingId: input.nextBookingId,
    reason: input.reason ?? "manual_admin_reassociation",
    timestamp: new Date().toISOString(),
  };

  return `${ASSOCIATION_AUDIT_PREFIX}${JSON.stringify(payload)}`;
}

export async function appendReassociationAuditEvent(
  input: ReassociationAuditEventInput,
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  await prisma.message.create({
    data: {
      bookingId: null,
      userId: input.actorUserId,
      senderType: "staff",
      senderName: input.actorName,
      content: buildReassociationAuditContent(input),
      isRead: true,
      sentAt: new Date(),
    },
  });
}
