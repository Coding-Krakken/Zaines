import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateContactSubmissionStatus } from "@/lib/api/issue26";
import { z } from "zod";

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !["staff", "admin"].includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

const updateStatusSchema = z.object({
  status: z.enum(["open", "resolved"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing submission ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await updateContactSubmissionStatus(id, parsed.data.status);
    return NextResponse.json(
      { submissionId: id, status: parsed.data.status },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "SUBMISSION_NOT_FOUND") {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    console.error("[API] Contact status update failed:", {
      submissionId: id,
      error: message,
    });

    return NextResponse.json(
      { error: "Failed to update submission status" },
      { status: 500 },
    );
  }
}
