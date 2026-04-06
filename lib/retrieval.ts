import fs from "fs";
import path from "path";
import mammoth from "mammoth";

const pdf = require("pdf-parse");

type DocChunk = {
  source: string;
  text: string;
  citation: string;
};

async function extractTextFromFile(filePath: string, fileName: string): Promise<string> {
  const data = fs.readFileSync(filePath);

  if (fileName.endsWith(".pdf")) {
    const parsed = await pdf(data);
    return parsed.text || "";
  }

  if (fileName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: data });
    return result.value || "";
  }

  return "";
}

function splitIntoChunks(text: string, size = 1200): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
function inferCitation(fileName: string, text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("vandenbroeck") && lower.includes("2014")) {
    return "Vandenbroeck et al., 2014";
  }

  if (lower.includes("price") && lower.includes("2016")) {
    return "Price, 2016";
  }

  if (lower.includes("checkland") && lower.includes("1999")) {
    return "Checkland, 1999";
  }

  return fileName;
}
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
}

function scoreChunk(chunk: string, query: string): number {
  const q = query.toLowerCase().split(/\s+/).filter(Boolean);
  const c = chunk.toLowerCase();

  let score = 0;
  for (const term of q) {
    if (c.includes(term)) score += 1;
  }
  return score;
}

export async function retrieveRelevantChunks(query: string): Promise<DocChunk[]> {
  const dir = path.join(process.cwd(), "data/pdfs");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".pdf") || f.endsWith(".docx"));

  const allChunks: DocChunk[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const text = await extractTextFromFile(filePath, file);
    const chunks = splitIntoChunks(text);

    for (const chunk of chunks) {
allChunks.push({
  source: file,
  text: chunk,
  citation: inferCitation(file, chunk),
});
    }
  }

  const ranked = allChunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk.text, query),
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
.map(({ source, text, citation }) => ({ source, text, citation }));

  return ranked;
}
