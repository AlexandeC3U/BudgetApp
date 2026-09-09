import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import {
  CategoryResponseSchema,
  UpdateCategoryInputSchema,
} from "@/lib/schemas/category";
import { getRequestUser, ResponseError } from "@/lib/auth/current-user";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    const json = await req.json().catch(() => null);
    if (json === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const input = UpdateCategoryInputSchema.parse(json);

    await requireOwnedCategory(id, user.id);

    const patch: Partial<typeof categories.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.emoji !== undefined) patch.emoji = input.emoji;
    if (input.color !== undefined) patch.color = input.color.toUpperCase();

    const [row] = await db
      .update(categories)
      .set(patch)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
      .returning();

    return NextResponse.json(
      CategoryResponseSchema.parse({
        category: {
          id: row.id,
          name: row.name,
          emoji: row.emoji,
          color: row.color,
        },
      })
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getRequestUser();
    const { id } = await params;
    await requireOwnedCategory(id, user.id);

    // Transactions referencing this category have categoryId set null via the
    // schema's onDelete rule — the history is preserved, just uncategorized.
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

async function requireOwnedCategory(id: string, userId: string) {
  const cat = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  });
  if (!cat) throw new ResponseError(404, "Category not found");
  return cat;
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
