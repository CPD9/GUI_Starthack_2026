import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  provider: z.enum(["openai", "claude"]),
  model: z.string().min(1),
  prompt: z.string().min(1),
  context: z.string().optional(),
});

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid LLM request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { provider, model, prompt, context } = parsed.data;
    const finalPrompt = [prompt, context].filter(Boolean).join("\n\n");

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not configured." },
          { status: 503 }
        );
      }

      const completion = await openaiClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a materials analytics assistant. Produce concise and practical insights from workflow data.",
          },
          { role: "user", content: finalPrompt },
        ],
        temperature: 0.2,
      });

      const text = completion.choices[0]?.message?.content ?? "";
      return NextResponse.json({ provider, model, text });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        temperature: 0.2,
        system:
          "You are a materials analytics assistant. Produce concise and practical insights from workflow data.",
        messages: [
          {
            role: "user",
            content: finalPrompt,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      return NextResponse.json(
        { error: `Claude API failed (${claudeResponse.status}): ${errorText}` },
        { status: claudeResponse.status }
      );
    }

    const payload = (await claudeResponse.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      payload.content?.find((item) => item.type === "text")?.text ??
      "Claude response was empty.";

    return NextResponse.json({ provider, model, text });
  } catch (error) {
    console.error("Workflow LLM route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute LLM step.",
      },
      { status: 500 }
    );
  }
}
