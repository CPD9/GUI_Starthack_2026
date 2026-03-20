import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "User email not found." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    email: session.user.email,
    name: session.user.name ?? null,
  });
}
