// __tests__/api/slides.test.ts
import { GET, POST, PUT, DELETE } from "@/app/api/slides/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { withRateLimit, checkRateLimit } from "@/lib/rate-limit";

jest.mock("@/lib/prisma");
jest.mock("next-auth/next");
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (routeName: string, handler: Function) => handler(),
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));

describe("Slides API", () => {
  const mockSlide = {
    id: "1",
    type: "IMAGE",
    title: "Test Slide",
    mediaUrl: "/test.jpg",
    order: 0,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
  });

  describe("GET /api/slides", () => {
    test("returns slides under rate limit", async () => {
      (prisma.slide.findMany as jest.Mock).mockResolvedValue([mockSlide]);
      const response = await GET();
      expect(await response.json()).toEqual([mockSlide]);
      expect(response.status).toBe(200);
    });

    test("blocks request when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await GET();
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe("Too Many Requests");
    });
  });

  describe("POST /api/slides", () => {
    test("creates slide under rate limit", async () => {
      (prisma.slide.create as jest.Mock).mockResolvedValue(mockSlide);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/slides", {
          method: "POST",
          body: JSON.stringify(mockSlide),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks creation when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/slides", {
          method: "POST",
          body: JSON.stringify(mockSlide),
        })
      );
      expect(response.status).toBe(429);
    });

    test("requires authentication", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const response = await POST(
        new NextRequest("http://localhost:3000/api/slides", {
          method: "POST",
          body: JSON.stringify(mockSlide),
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/slides", () => {
    test("updates slide order under rate limit", async () => {
      (prisma.slide.update as jest.Mock).mockResolvedValue(mockSlide);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/slides", {
          method: "PUT",
          body: JSON.stringify({ id: "1", order: 1 }),
        })
      );
      expect(response.status).toBe(200);
    });

    test("blocks update when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await PUT(
        new NextRequest("http://localhost:3000/api/slides", {
          method: "PUT",
          body: JSON.stringify({ id: "1", order: 1 }),
        })
      );
      expect(response.status).toBe(429);
    });
  });

  describe("DELETE /api/slides", () => {
    test("deletes slide under rate limit", async () => {
      (prisma.slide.delete as jest.Mock).mockResolvedValue(mockSlide);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/slides?id=1")
      );
      expect(response.status).toBe(200);
    });

    test("blocks deletion when rate limit exceeded", async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue(false);
      const response = await DELETE(
        new NextRequest("http://localhost:3000/api/slides?id=1")
      );
      expect(response.status).toBe(429);
    });
  });

  test("verifies rate limit is checked for each method", async () => {
    await GET();
    await POST(
      new NextRequest("http://localhost:3000/api/slides", {
        method: "POST",
        body: JSON.stringify(mockSlide),
      })
    );

    expect(checkRateLimit).toHaveBeenCalledWith("default");
    expect(checkRateLimit).toHaveBeenCalledWith("admin");
    expect(checkRateLimit).toHaveBeenCalledTimes(2);
  });
});
