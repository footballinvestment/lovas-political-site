// __tests__/api/messages.test.ts
import { GET, PUT, DELETE } from "@/app/api/messages/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

jest.mock("@/lib/prisma");
jest.mock("next-auth/next");

describe("Messages API", () => {
  const mockMessage = {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    subject: "Test Subject",
    message: "Test Message",
    status: "NEW",
  };

  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com" },
    });
  });

  test("GET returns messages", async () => {
    (prisma.contact.findMany as jest.Mock).mockResolvedValue([mockMessage]);
    const response = await GET();
    expect(await response.json()).toEqual([mockMessage]);
  });

  test("PUT updates message status", async () => {
    (prisma.contact.update as jest.Mock).mockResolvedValue(mockMessage);
    const response = await PUT(
      new NextRequest("http://localhost:3000/api/messages", {
        method: "PUT",
        body: JSON.stringify({ id: "1", status: "IN_PROGRESS" }),
      })
    );
    expect(response.status).toBe(200);
  });
});
