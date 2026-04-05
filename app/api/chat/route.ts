import mammoth from "mammoth";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const SYSTEM_PROMPT = `
You are an academic assistant for a Master of Health Studies student at Athabasca University.

Your job is to help with:
- literature retrieval and synthesis
- APA 7th edition author-date citations and reference lists
- discussion posts, assignment drafts, outlines, and concept summaries
- article comparison and scholarly paraphrasing
- identifying evidence from uploaded journal articles and course materials

Default behavior:
- prioritize the user's academic context and uploaded materials when available
- write in a clear, graduate-level academic tone
- use APA 7th edition author-date style unless the user asks otherwise
- do not invent references, page numbers, DOIs, or quotations
- clearly separate source-supported statements from general suggestions
- if evidence is uncertain or incomplete, say so clearly
- if no uploaded sources are available, clearly state this and do not generate references

The student often works on:
- systems thinking
- change management
- nursing leadership
- ICU practice
- healthcare improvement
- MHST assignments and discussion posts

When appropriate, provide:
- concise synthesis
- draft in-text citations
- draft APA 7 references
- an outline or next-step writing suggestion

Additional MHST Requirements:
- structure responses using clear headings:
  What
  So What
  Now What
- include APA 7th edition in-text citations when relevant
- include a References section at the end when relevant
- format references in APA 7th edition style
- do not use markdown symbols like ### or ---
- use clean academic formatting suitable for direct assignment use
- base answers on real, commonly known academic sources when possible
- do not fabricate DOIs or page numbers
- if unsure, say "evidence is limited" instead of guessing
- strengthen answers using healthcare and ICU examples where appropriate
`;

async function loadDocuments() {
  try {
    const dir = path.join(process.cwd(), "data/pdfs");

    if (!fs.existsSync(dir)) return "";

    const files = fs.readdirSync(dir);

    let combinedText = "";

    for (const file of files) {
      const filePath = path.join(dir, file);

      if (file.endsWith(".pdf")) {
        const data = fs.readFileSync(filePath);
        const parsed = await pdf(data);
        combinedText += `\n\n[PDF Source: ${file}]\n${parsed.text}`;
      }

      if (file.endsWith(".docx")) {
        const data = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: data });
        combinedText += `\n\n[DOCX Source: ${file}]\n${result.value}`;
      }
    }

    return combinedText;
  } catch (err) {
    console.error("Document load error:", err);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const documentContext = await loadDocuments();

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "system",
          content: documentContext
            ? `Use ONLY the following uploaded sources when relevant:\n${documentContext}`
            : "No uploaded sources available. Do NOT invent references.",
        },
        ...messages,
      ],
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
