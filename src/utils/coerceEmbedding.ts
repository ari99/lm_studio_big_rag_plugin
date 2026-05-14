/**
 * Normalize embedding API output to a finite number[].
 */
export function coerceEmbeddingVector(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map(assertFiniteNumber);
  }

  if (typeof raw === "number") {
    return [assertFiniteNumber(raw)];
  }

  if (raw && typeof raw === "object") {
    if (ArrayBuffer.isView(raw)) {
      return Array.from(raw as unknown as ArrayLike<number>).map(assertFiniteNumber);
    }

    const candidate =
      (raw as any).embedding ??
      (raw as any).vector ??
      (raw as any).data ??
      (typeof (raw as any).toArray === "function" ? (raw as any).toArray() : undefined) ??
      (typeof (raw as any).toJSON === "function" ? (raw as any).toJSON() : undefined);

    if (candidate !== undefined) {
      return coerceEmbeddingVector(candidate);
    }
  }

  throw new Error("Embedding provider returned a non-numeric vector");
}

function assertFiniteNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Embedding vector contains a non-finite value");
  }
  return num;
}
