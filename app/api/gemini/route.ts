import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

// Server-controlled defaults. Callers cannot influence model selection or
// tool wiring; this avoids cost/behavior surprises and tool injection.
const MODEL = "gemini-2.5-pro";
const TOOLS = [{ googleSearch: {} }];

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").toString();
  if (!prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        tools: TOOLS,
        toolConfig: { includeServerSideToolInvocations: true },
      },
    });

    return NextResponse.json({ text: response.text ?? "" });
  } catch (err) {
    // Log the real error server-side; never surface provider internals to the
    // browser (could leak prompt fragments, account IDs, quota details, etc).
    console.error("Gemini route error:", err);
    return NextResponse.json(
      { error: "Failed to generate content." },
      { status: 500 }
    );
  }
}
