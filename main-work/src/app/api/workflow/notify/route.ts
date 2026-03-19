import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

import { auth } from "@/lib/auth";

const requestSchema = z.object({
  subject: z.string().min(1),
  text: z.string().min(1),
  toEmail: z.string().email().optional(),
});

const isMailerConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid notification payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const targetEmail = parsed.data.toEmail ?? session.user.email;

    if (!isMailerConfigured()) {
      return NextResponse.json({
        ok: true,
        mode: "simulated",
        deliveredTo: targetEmail,
        message:
          "Email node executed in simulation mode. Configure SMTP_* env vars for live delivery.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: targetEmail,
      subject: parsed.data.subject,
      text: parsed.data.text,
    });

    return NextResponse.json({
      ok: true,
      mode: "smtp",
      deliveredTo: targetEmail,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send notification." },
      { status: 500 }
    );
  }
}
