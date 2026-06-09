import { revalidatePath } from "next/cache";

import { refreshAllPlayerHandicaps } from "@/lib/ghin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return refresh(request);
}

export async function POST(request: Request) {
  return refresh(request);
}

async function refresh(request: Request) {
  const secret = process.env.GHIN_REFRESH_SECRET || process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret) {
    return Response.json({ error: "GHIN_REFRESH_SECRET or CRON_SECRET is required" }, { status: 500 });
  }

  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await refreshAllPlayerHandicaps();
  ["/", "/bracket", "/players", "/rules", "/admin"].forEach((path) => revalidatePath(path));

  return Response.json({
    ok: true,
    total: results.length,
    updated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  });
}
