/**
 * Test script for LanceDB: exercises every operation the VectorStore needs.
 * Run: npm run build && node dist/tests/lanceTest.js
 */
import * as lancedb from "@lancedb/lancedb";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const TABLE_NAME = "chunks";
const VECTOR_DIM = 4;

async function main() {
  const dbDir = path.join(os.tmpdir(), `lancedb-test-${Date.now()}`);
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("[1] Connect to LanceDB at", dbDir);

  const db = await lancedb.connect(dbDir);

  // --- Create table with schema matching VectorStore chunks ---
  const initialData = [
    {
      id: "chunk-1",
      vector: [0.1, 0.2, 0.3, 0.4],
      text: "First chunk text",
      filePath: "/docs/a.txt",
      fileName: "a.txt",
      fileHash: "hash-a",
      chunkIndex: 0,
    },
    {
      id: "chunk-2",
      vector: [0.5, 0.6, 0.7, 0.8],
      text: "Second chunk text",
      filePath: "/docs/a.txt",
      fileName: "a.txt",
      fileHash: "hash-a",
      chunkIndex: 1,
    },
    {
      id: "chunk-3",
      vector: [0.9, 0.1, 0.2, 0.3],
      text: "Third chunk from file b",
      filePath: "/docs/b.txt",
      fileName: "b.txt",
      fileHash: "hash-b",
      chunkIndex: 0,
    },
  ];

  console.log("[2] Create table with initial data (simulating addChunks)");
  let table = await db.createTable(TABLE_NAME, initialData, {
    mode: "overwrite",
  });

  // --- Add more data (append) ---
  const appendData = [
    {
      id: "chunk-4",
      vector: [0.2, 0.3, 0.4, 0.5],
      text: "Fourth chunk",
      filePath: "/docs/b.txt",
      fileName: "b.txt",
      fileHash: "hash-b",
      chunkIndex: 1,
    },
  ];
  await table.add(appendData, { mode: "append" });
  console.log("[3] Appended 1 more chunk");

  // --- Vector search (simulating search()) ---
  const queryVector = [0.15, 0.25, 0.35, 0.45];
  const searchResults = await table
    .vectorSearch(queryVector)
    .distanceType("cosine")
    .limit(3)
    .toArray();
  console.log("[4] Vector search (cosine, limit 3):", searchResults.length, "results");
  searchResults.forEach((r: Record<string, unknown>, i: number) => {
    console.log(`    ${i + 1}. id=${r.id} text=${(r.text as string).slice(0, 20)}... _distance=${(r as Record<string, number>)._distance?.toFixed(4)}`);
  });

  // --- getFileHashInventory: map filePath -> Set<fileHash> ---
  const allRows = await table.query().select(["filePath", "fileHash"]).toArray();
  const inventory = new Map<string, Set<string>>();
  for (const row of allRows) {
    const fp = row.filePath as string;
    const fh = row.fileHash as string;
    if (!inventory.has(fp)) inventory.set(fp, new Set());
    inventory.get(fp)!.add(fh);
  }
  console.log("[5] File hash inventory (getFileHashInventory):");
  inventory.forEach((hashes, filePath) => {
    console.log(`    ${filePath} -> [${[...hashes].join(", ")}]`);
  });

  // --- getStats: totalChunks, uniqueFiles ---
  const totalChunks = await table.countRows();
  const uniqueHashes = new Set(allRows.map((r: Record<string, string>) => r.fileHash));
  console.log("[6] Stats (getStats): totalChunks =", totalChunks, ", uniqueFiles =", uniqueHashes.size);

  // --- deleteByFileHash ---
  const deleteHash = "hash-b";
  await table.delete(`fileHash = '${deleteHash}'`);
  console.log("[7] deleteByFileHash('" + deleteHash + "')");

  // Re-open table to see updated data (LanceDB table handle may cache)
  table = await db.openTable(TABLE_NAME);
  const afterDeleteCount = await table.countRows();
  const afterDeleteRows = await table.query().select(["id", "fileHash"]).toArray();
  console.log("[8] After delete: count =", afterDeleteCount, ", rows:", afterDeleteRows.map((r: Record<string, string>) => r.id));

  db.close();
  fs.rmSync(dbDir, { recursive: true, force: true });
  console.log("[9] Closed and cleaned up. LanceDB test passed.");
}

main().catch((err) => {
  console.error("LanceDB test failed:", err);
  process.exit(1);
});
