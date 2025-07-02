// src/app/api/hirek/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Status } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oldal = parseInt(searchParams.get("oldal") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (oldal - 1) * limit;

  try {
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: Status.PUBLISHED,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.post.count({
        where: {
          status: Status.PUBLISHED,
        },
      }),
    ]);

    const hirek = posts.map((post) => ({
      id: post.id,
      cim: post.title,
      tartalom: post.content,
      publikalasDatuma: post.createdAt.toISOString().split("T")[0],
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: hirek,
      pagination: {
        totalPages,
        currentPage: oldal,
        totalItems: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
