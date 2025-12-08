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
    const { city, propertyType, bedrooms, bathrooms, price, notes } = body as {
      city?: string;
      propertyType?: string;
      bedrooms?: number | null;
      bathrooms?: number | null;
      price?: number;
      notes?: string;
    };

    if (!city || !propertyType || !price) {
      return NextResponse.json(
        {
          error:
            "city, propertyType, and price are required to generate a description",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert real estate copywriter.

Write a polished, compelling property listing description based on this info:

- City: ${city}
- Property type: ${propertyType}
- Bedrooms: ${bedrooms ?? "N/A"}
- Bathrooms: ${bathrooms ?? "N/A"}
- Price: $${price.toLocaleString()}
- Extra notes from the agent: ${notes || "None"}

Guidelines:
- 2–3 short paragraphs.
- Make it warm and exciting but not cheesy.
- Highlight neighborhood/location plus key interior features.
- Avoid making up specific addresses or HOA details.
- Do NOT include contact info or calls to action like "Call today".
Return only the description text, no headings or markdown.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { error: "Model returned an empty description" },
        { status: 500 }
      );
    }

    return NextResponse.json({ description: content });
  } catch (error) {
    console.error("[AI LISTING DESCRIPTION] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate listing description" },
      { status: 500 }
    );
  }
}
