import { NextResponse, type NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import {
  CategoriesResponseSchema,
  CategoryResponseSchema,
  CreateCategoryInputSchema,
} from "@/lib/schemas/category";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const user = await getRequestUser();
    const rows = await db.query.categories.findMany({
      where: eq(categories.userId, user.id),
      orderBy: [asc(categories.sortOrder), asc(categories.name)],
    });
    const body = CategoriesResponseSchema.parse({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        emoji: r.emoji,
        color: r.color,
      })),
    });
    return NextResponse.json(body);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser();
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = CreateCategoryInputSchema.parse(json);

    // Place new category at the end of the user's list.
    const existing = await db.query.categories.findMany({
      where: eq(categories.userId, user.id),
      columns: { sortOrder: true },
      orderBy: [asc(categories.sortOrder)],
    });
    const nextOrder = existing.length
      ? Math.max(...existing.map((c) => c.sortOrder)) + 1
      : 0;

    const [row] = await db
      .insert(categories)
      .values({
        userId: user.id,
        name: input.name,
        emoji: input.emoji,
        color: input.color.toUpperCase(),
        sortOrder: nextOrder,
      })
      .returning();

    return NextResponse.json(
      CategoryResponseSchema.parse({
        category: {
          id: row.id,
          name: row.name,
          emoji: row.emoji,
          color: row.color,
        },
      }),
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof ResponseError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: err.flatten() },
      { status: 400 }
    );
  }
  throw err;
}
