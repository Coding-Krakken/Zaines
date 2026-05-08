import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const settingsStore = new Map<string, string>();
const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    settings: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        const value = settingsStore.get(where.key);
        return value ? { key: where.key, value } : null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; value: string };
          update: { value: string };
        }) => {
          const key = where.key;
          const value = update.value || create.value;
          settingsStore.set(key, value);
          return { key, value };
        },
      ),
    },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

import { POST } from "@/app/api/admin/contact-submissions/[id]/messages/route";

const adminSession = {
  user: { id: "admin-1", role: "admin", name: "Admin Test" },
};

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Admin contact conversation API", () => {
  beforeEach(() => {
    settingsStore.clear();
    authMock.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);

    const formData = new FormData();
    formData.set("content", "Hello from staff");

    const request = new NextRequest(
      "http://localhost/api/admin/contact-submissions/sub-1/messages",
      {
        method: "POST",
        body: formData,
      },
    );

    const response = await POST(request, ctx("sub-1"));
    expect(response.status).toBe(401);
  });

  it("appends a staff message to an existing submission", async () => {
    authMock.mockResolvedValue(adminSession);

    const submissionId = "sub-1";
    const recordKey = `contact:submission:${submissionId}`;
    settingsStore.set(
      recordKey,
      JSON.stringify({
        submissionId,
        fullName: "Customer One",
        email: "customer@example.com",
        phone: null,
        message: "Initial customer message",
        createdAt: new Date().toISOString(),
        status: "open",
        conversation: [
          {
            messageId: "m-1",
            senderType: "customer",
            senderName: "Customer One",
            content: "Initial customer message",
            createdAt: new Date().toISOString(),
            attachments: [],
          },
        ],
      }),
    );

    const formData = new FormData();
    formData.set("content", "Thanks for reaching out. We can help.");

    const request = new NextRequest(
      `http://localhost/api/admin/contact-submissions/${submissionId}/messages`,
      {
        method: "POST",
        body: formData,
      },
    );

    const response = await POST(request, ctx(submissionId));
    expect(response.status).toBe(201);

    const payload = (await response.json()) as {
      conversation: Array<{ senderType: string; content: string }>;
      status: string;
    };

    expect(payload.status).toBe("open");
    expect(payload.conversation.length).toBe(2);
    expect(payload.conversation[1]?.senderType).toBe("staff");
    expect(payload.conversation[1]?.content).toContain("Thanks for reaching out");

    const updated = JSON.parse(settingsStore.get(recordKey) || "{}");
    expect(updated.conversation).toHaveLength(2);
  });
});
