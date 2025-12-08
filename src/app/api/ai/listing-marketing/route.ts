import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { title, city, propertyType, price, bedrooms, bathrooms, notes } =
      body as {
        title?: string;
        city?: string;
        propertyType?: string;
        price?: number;
        bedrooms?: number | null;
        bathrooms?: number | null;
        notes?: string;
      };

    if (!title || !city || !propertyType) {
      return NextResponse.json(
        {
          error:
            "title, city, and propertyType are required to generate marketing copy",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are a real estate marketing copywriter.

Generate:
1) 3–6 short bullet-point highlights for this property
2) A single social media caption

Property details:
- Title: ${title}
- City: ${city}
- Type: ${propertyType}
- Price: ${price ? `$${price.toLocaleString()}` : "Not specified"}
- Bedrooms: ${bedrooms ?? "N/A"}
- Bathrooms: ${bathrooms ?? "N/A"}
- Extra notes from agent: ${notes || "None"}

Requirements:
- Highlights: punchy, benefit-focused, no more than 80 characters each.
- Caption: 1–3 sentences, emoji allowed but not required, include a subtle CTA.
- Do NOT include phone numbers, emails, or URLs.

Return ONLY valid JSON in this shape:
{
  "highlights": ["bullet 1", "bullet 2", ...],
  "caption": "social caption text"
}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content ?? "{}";
    let parsed: { highlights?: string[]; caption?: string } = {};

    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback: if somehow not JSON, just wrap the raw string
      parsed = { highlights: [content], caption: content };
    }

    return NextResponse.json({
      highlights: parsed.highlights ?? [],
      caption: parsed.caption ?? "",
    });
  } catch (error) {
    console.error("[AI LISTING MARKETING] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing copy" },
      { status: 500 }
    );
  }
}
