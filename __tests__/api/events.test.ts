import { GET, POST, PUT, DELETE } from "@/app/api/events/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { checkRateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("next-auth/next");

const mockCheckRateLimit = jest.requireMock("@/lib/rate-limit").checkRateLimit;

describe("Events API", () => {
  const mockEvent = {
    id: "1",
    title: "Test Event",
    description: "Test Description",
    location: "Test Location",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    status: "UPCOMING",
    imageUrl: "/test.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
    });
    mockCheckRateLimit.mockResolvedValue(true);
  });

  describe("GET /api/events", () => {
    test("returns events list under rate limit", async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      const response = await GET();
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockEvent);
    });

    test("blocks request when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue(false);
      const response = await GET();
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe("Too Many Requests");
    });
  });

  describe("POST /api/events", () => {
    test("creates event under rate limit", async () => {
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          body: JSON.stringify(mockEvent),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks creation when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue(false);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          body: JSON.stringify(mockEvent),
        })
      );
      expect(response.status).toBe(429);
    });

    test("validates required fields", async () => {
      const invalidEvent = {
        title: "Test Event",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };
      const response = await POST(
        new NextRequest("http://localhost:3000/api/events", {
          method: "POST",
          body: JSON.stringify(invalidEvent),
        })
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Hiányzó kötelező mezők");
    });
  });

  describe("PUT /api/events", () => {
    test("updates event under rate limit", async () => {
      (prisma.event.update as jest.Mock).mockResolvedValue(mockEvent);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PUT",
          body: JSON.stringify(mockEvent),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks update when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue(false);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PUT",
          body: JSON.stringify(mockEvent),
        })
      );
      expect(response.status).toBe(429);
    });

    test("requires event id", async () => {
      const invalidUpdate = { ...mockEvent };
      delete invalidUpdate.id;
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PUT",
          body: JSON.stringify(invalidUpdate),
        })
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Hiányzó esemény azonosító");
    });

    test("handles non-existent event", async () => {
      (prisma.event.update as jest.Mock).mockRejectedValue(
        new Error("Not found")
      );
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PUT",
          body: JSON.stringify({ ...mockEvent, id: "non-existent" }),
        })
      );
      expect(response.status).toBe(500);
    });
  });

  describe("DELETE /api/events", () => {
    test("removes event under rate limit", async () => {
      (prisma.event.delete as jest.Mock).mockResolvedValue(mockEvent);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/events?id=1")
      );
      expect(response.status).toBe(200);
    });

    test("blocks deletion when rate limit exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue(false);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/events?id=1")
      );
      expect(response.status).toBe(429);
    });

    test("handles non-existent event", async () => {
      (prisma.event.delete as jest.Mock).mockRejectedValue(
        new Error("Not found")
      );
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/events?id=non-existent")
      );
      expect(response.status).toBe(500);
    });
  });

  test("unauthorized requests are rejected", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const response = await POST(
      new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        body: JSON.stringify(mockEvent),
      })
    );
    expect(response.status).toBe(401);
  });

  test("verifies rate limit is checked for each method", async () => {
    mockCheckRateLimit.mockImplementation((routeName) => Promise.resolve(true));

    await GET();
    await POST(
      new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        body: JSON.stringify(mockEvent),
      })
    );

    expect(mockCheckRateLimit).toHaveBeenCalledWith("default");
    expect(mockCheckRateLimit).toHaveBeenCalledWith("admin");
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(2);
  });
});
