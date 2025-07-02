// __tests__/api/posts.test.ts
import { GET, POST, PUT, DELETE } from "@/app/api/posts/route";
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

describe("Posts API", () => {
  const mockPost = {
    id: "1",
    title: "Test Post",
    slug: "test-post",
    content: "Test Content",
    status: "DRAFT",
    imageUrl: "/test.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: "admin@example.com" },
    });
    (checkRateLimit as jest.Mock).mockResolvedValue(true);
  });

  test("GET returns posts list under rate limit", async () => {
    (prisma.post.findMany as jest.Mock).mockResolvedValue([mockPost]);
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data[0]).toMatchObject(mockPost);
  });

  test("GET blocked when rate limit exceeded", async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(429);
  });

  test("POST creates post under rate limit", async () => {
    (prisma.post.create as jest.Mock).mockResolvedValue(mockPost);
    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify(mockPost),
      })
    );
    expect(response.status).toBe(200);
  });

  test("POST blocked when rate limit exceeded", async () => {
    (checkRateLimit as jest.Mock).mockResolvedValue(false);
    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify(mockPost),
      })
    );
    expect(response.status).toBe(429);
  });

  test("validates required fields", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ title: "Test" }),
      })
    );
    expect(response.status).toBe(400);
  });

  test("PUT updates post under rate limit", async () => {
    (prisma.post.update as jest.Mock).mockResolvedValue(mockPost);
    const response = await PUT(
      new NextRequest("http://localhost:3000/api/posts", {
        method: "PUT",
        body: JSON.stringify(mockPost),
      })
    );
    expect(response.status).toBe(200);
  });

  test("DELETE removes post under rate limit", async () => {
    (prisma.post.delete as jest.Mock).mockResolvedValue(mockPost);
    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/posts?id=1")
    );
    expect(response.status).toBe(200);
  });

  test("verifies rate limit is checked for each method", async () => {
    await GET();
    await POST(
      new NextRequest("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify(mockPost),
      })
    );

    expect(checkRateLimit).toHaveBeenCalledWith("default");
    expect(checkRateLimit).toHaveBeenCalledWith("admin");
    expect(checkRateLimit).toHaveBeenCalledTimes(2);
  });
});
