// lib/embeddings.ts
import { HfInference } from "@huggingface/inference";

const DIM = 384; // all-MiniLM-L6-v2
const ZERO = JSON.stringify(Array(DIM).fill(0));

let hf: HfInference | null = null;
if (process.env.HF_API_KEY) {
  hf = new HfInference(process.env.HF_API_KEY);
}

/**
 * Try to get a 384-dim embedding. If HF is misconfigured or down,
 * return a zero vector so the app keeps working.
 */
export async function embedText(text: string): Promise<string> {
  try {
    if (!hf) throw new Error("HF_API_KEY not set");
    const out = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text || "",
    });

    const vec = Array.isArray(out[0]) ? (out as number[][])[0] : (out as number[]);
    if (!Array.isArray(vec) || vec.length !== DIM) throw new Error("Bad embedding shape");
    return JSON.stringify(vec);
  } catch (_e) {
    // Fallback so /api/items never crashes
    return ZERO;
  }
}
