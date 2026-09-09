import { NextResponse } from "next/server";

import { getRequestUser, ResponseError } from "@/lib/auth/current-user";
import { getMeSummary } from "@/lib/queries/me";
import { MeSummaryResponseSchema } from "@/lib/schemas/user";

export async function GET() {
  try {
    const user = await getRequestUser();
    const summary = await getMeSummary(user);
    return NextResponse.json(MeSummaryResponseSchema.parse(summary));
  } catch (err) {
    if (err instanceof ResponseError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
