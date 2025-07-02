// __tests__/api/contact.test.ts
import { POST, GET } from "@/app/api/contact/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactNotification } from "@/lib/email";
import { withRateLimit, checkRateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendContactNotification: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

jest.mock("next/server", () => ({
  NextRequest: function (url, init) {
    return {
      url,
      ...init,
      json: () => Promise.resolve(JSON.parse(init.body)),
    };
  },
  NextResponse: {
    json: (data, init) => ({
      ...data,
      status: init?.status || 200,
      ok: !init?.status || init.status < 400,
      json: () => Promise.resolve(data),
    }),
  },
}));

describe("Contact API", () => {
  const validBody = {
    name: "Test User",
    email: "test@example.com",
    subject: "Test Subject",
    message: "Test message content that is long enough",
    preferredContact: "email",
    newsletter: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates contact with valid data", async () => {
    (prisma.contact.create as jest.Mock).mockResolvedValue({
      id: "123",
      createdAt: new Date(),
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
  });

  test("validates name length", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({ ...validBody, name: "A" }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.errors).toContain("Érvénytelen név");
  });

  test("validates email format", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({ ...validBody, email: "invalid-email" }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.errors).toContain("Érvénytelen email cím");
  });

  test("validates phone format", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify({ ...validBody, phone: "invalid!!phone" }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.errors).toContain("Érvénytelen telefonszám formátum");
  });

  test("handles email sending failure", async () => {
    (prisma.contact.create as jest.Mock).mockResolvedValue({
      id: "123",
      createdAt: new Date(),
    });
    (sendContactNotification as jest.Mock).mockRejectedValue(
      new Error("Email error")
    );

    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(validBody),
      })
    );

    expect(response.status).toBe(200);
  });

  test("GET request returns 405", async () => {
    const response = await GET();
    expect(response.status).toBe(405);
  });
});
