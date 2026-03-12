import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a nutrition assistant. The user will describe a meal in text, share a photo, or both.

Return a JSON object with exactly these fields:
- meal_name: string, a short readable name for the meal
- estimated_calories: number, total kcal
- estimated_protein: number, grams
- estimated_carbs: number, grams
- estimated_fat: number, grams
- ai_notes: string, brief note on assumptions or uncertainty

Rules:
- Be honest about uncertainty. Use round numbers. Do not fabricate precision.
- For mixed or restaurant dishes, give a reasonable range estimate and note it.
- If the description is too vague to estimate, return your best guess and flag it in ai_notes.
- Return only valid JSON. No extra text, no markdown code fences.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = (body.text ?? "").trim();
  const imageBase64: string | null = body.image_base64 ?? null;

  if (!text && !imageBase64) {
    return NextResponse.json(
      { error: "Please describe your meal or provide a photo." },
      { status: 400 }
    );
  }

  // Build message content — text, image, or both
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } };

  const content: ContentBlock[] = [];

  if (imageBase64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: imageBase64,
      },
    });
  }

  const userText = text || "Please estimate the macros for the food shown in the photo.";
  content.push({ type: "text", text: userText });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const rawText = (message.content[0] as { type: string; text: string }).text;
  // Strip markdown code fences if present
  const raw = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: {
    meal_name: string;
    estimated_calories: number;
    estimated_protein: number;
    estimated_carbs: number;
    estimated_fat: number;
    ai_notes: string;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Could not parse meal. Please enter details manually." },
      { status: 422 }
    );
  }

  return NextResponse.json(parsed);
}
