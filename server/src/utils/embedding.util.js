// server/src/utils/embedding.util.js
const fs = require("fs");

const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 64);

// Simple deterministic text embedding based on char codes.
// This is NOT a real ML model, but it's enough to:
// - Have numeric vectors
// - Support cosine similarity
// - Demonstrate content-based recommendations & search
function computeTextEmbedding(text) {
  if (!text) text = "";
  const vector = new Array(EMBEDDING_DIM).fill(0);

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const idx = i % EMBEDDING_DIM;
    vector[idx] += code / 255; // normalized char score
  }

  return normalize(vector);
}

// Pseudo image embedding: read image bytes and aggregate across EMBEDDING_DIM bins.
// Again: NOT real vision model, but deterministic and works end-to-end.
// Later you can replace this with CLIP / ResNet outputs.
function computePseudoImageEmbedding(filePath) {
  const buffer = fs.readFileSync(filePath);
  const vector = new Array(EMBEDDING_DIM).fill(0);

  for (let i = 0; i < buffer.length; i++) {
    const val = buffer[i] / 255; // 0..1
    const idx = i % EMBEDDING_DIM;
    vector[idx] += val;
  }

  return normalize(vector);
}

// Normalize vector to unit length
function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

// Cosine similarity between two vectors (assumed same length)
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length === 0 || vecB.length === 0) return 0;

  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}

module.exports = {
  EMBEDDING_DIM,
  computeTextEmbedding,
  computePseudoImageEmbedding,
  cosineSimilarity,
};
