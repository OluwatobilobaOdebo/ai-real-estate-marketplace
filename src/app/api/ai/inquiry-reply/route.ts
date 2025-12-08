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
    const {
      propertyTitle,
      city,
      price,
      bedrooms,
      bathrooms,
      agentNotes,
      buyerMessage,
    } = body as {
      propertyTitle?: string;
      city?: string | null;
      price?: number;
      bedrooms?: number | null;
      bathrooms?: number | null;
      agentNotes?: string;
      buyerMessage?: string;
    };

    if (!propertyTitle || !buyerMessage) {
      return NextResponse.json(
        {
          error:
            "propertyTitle and buyerMessage are required to generate a reply",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are a friendly, professional real estate agent.

Write a concise email reply to a prospective buyer who inquired about a property.

Property info:
- Title: ${propertyTitle}
- City: ${city ?? "N/A"}
- Price: ${price ? `$${price.toLocaleString()}` : "Not specified"}
- Bedrooms: ${bedrooms ?? "N/A"}
- Bathrooms: ${bathrooms ?? "N/A"}
- Agent notes: ${agentNotes || "None"}

Buyer message:
"${buyerMessage}"

Guidelines:
- Warm, helpful, and professional tone.
- Briefly restate key property details relevant to their question.
- Invite them to the next step (e.g., schedule a showing or ask follow-up questions),
  but do NOT include phone numbers or personal contact info.
- Do NOT make up specific dates/times; keep it general.
Return only the email body text, no greeting like "Dear [Name]" and no signature.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { error: "Model returned an empty reply" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: content });
  } catch (error) {
    console.error("[AI INQUIRY REPLY] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate inquiry reply" },
      { status: 500 }
    );
  }
}
