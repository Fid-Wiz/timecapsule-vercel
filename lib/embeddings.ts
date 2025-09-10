import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

/**
 * Uses a free sentence-transformer model (384-dim vectors).
 * Returns a JSON string like "[0.12, -0.03, ...]" acceptable by TiDB VECTOR type.
 */
export async function embedText(text: string): Promise<string> {
  if (!process.env.HF_API_KEY) {
    throw new Error("HF_API_KEY is missing. Add it to .env.local and restart.");
  }

  const out = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text || "",
  });

  const vec = Array.isArray(out[0]) ? (out as number[][])[0] : (out as number[]);
  if (!Array.isArray(vec)) {
    throw new Error("Unexpected embeddings response from Hugging Face");
  }
  return JSON.stringify(vec); // TiDB accepts vectors as a JSON-like string
}
