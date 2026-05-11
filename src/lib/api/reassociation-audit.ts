import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const ASSOCIATION_AUDIT_PREFIX = "[ASSOCIATION_AUDIT]";

export type ReassociationAuditPayload = {
  eventType: "REASSOCIATION_UPDATED";
  entityType: "photo" | "message";
  entityId: string;
  targetUserId: string;
  previousBookingId: string | null;
  nextBookingId: string | null;
  reason: string;
  timestamp: string;
};

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

export function parseReassociationAuditContent(
  content: string,
): ReassociationAuditPayload | null {
  if (!content.startsWith(ASSOCIATION_AUDIT_PREFIX)) {
    return null;
  }

  const jsonContent = content.slice(ASSOCIATION_AUDIT_PREFIX.length);

  try {
    const payload = JSON.parse(jsonContent) as Partial<ReassociationAuditPayload>;

    if (
      payload.eventType !== "REASSOCIATION_UPDATED" ||
      (payload.entityType !== "photo" && payload.entityType !== "message") ||
      typeof payload.entityId !== "string" ||
      typeof payload.targetUserId !== "string" ||
      typeof payload.timestamp !== "string"
    ) {
      return null;
    }

    return {
      eventType: payload.eventType,
      entityType: payload.entityType,
      entityId: payload.entityId,
      targetUserId: payload.targetUserId,
      previousBookingId:
        typeof payload.previousBookingId === "string" ? payload.previousBookingId : null,
      nextBookingId: typeof payload.nextBookingId === "string" ? payload.nextBookingId : null,
      reason:
        typeof payload.reason === "string" && payload.reason.trim().length > 0
          ? payload.reason
          : "manual_admin_reassociation",
      timestamp: payload.timestamp,
    };
  } catch {
    return null;
  }
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
