/**
 * ChapterCheck — File upload utilities
 * Supports .txt (File API) and .docx (mammoth).
 * All extraction happens in the browser — nothing is uploaded to a server.
 */
import mammoth from "mammoth";

export const MAX_CHARS = 10_000;

export type UploadResult =
  | { ok: true; text: string; filename: string; truncated: false }
  | { ok: false; error: string };

export async function readFile(file: File): Promise<UploadResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !["txt", "docx"].includes(ext)) {
    return { ok: false, error: `Unsupported file type ".${ext ?? "unknown"}". Please upload a .txt or .docx file.` };
  }

  if (file.size === 0) {
    return { ok: false, error: "The selected file is empty. Please choose a file with content." };
  }

  try {
    let text = "";

    if (ext === "txt") {
      text = await file.text();
    } else {
      // DOCX via mammoth
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      text = result.value;
    }

    text = text.trim();

    if (text.length === 0) {
      return { ok: false, error: "The file appears to be empty or could not be read." };
    }

    if (text.length > MAX_CHARS) {
      return {
        ok: false,
        error: `This document contains ${text.length.toLocaleString()} characters, which exceeds the ${MAX_CHARS.toLocaleString()}-character limit. Please shorten the text or select a smaller section.`,
      };
    }

    return { ok: true, text, filename: file.name, truncated: false };
  } catch (err) {
    return {
      ok: false,
      error: `Could not read "${file.name}". The file may be corrupted or in an unsupported format.`,
    };
  }
}
