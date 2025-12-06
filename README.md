# Big RAG Plugin for LM Studio

A powerful RAG (Retrieval-Augmented Generation) plugin for LM Studio that can index and search through gigabytes or even terabytes (not tested) of document data. Hosted here: [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin) on GitHub.

## Features

- **Massive Scale**: Designed to handle large document collections (GB to TB scale)
- **Deep Directory Scanning**: Recursively scans all subdirectories
- **Multiple File Formats**: Supports HTM, HTML, XHTML, PDF, EPUB, TXT, TEXT, Markdown variants (MD/MDX), BMP, JPEG, PNG
- **OCR Support**: Optional OCR for image files using Tesseract
- **Vector Search**: Uses LanceDB for efficient vector storage and retrieval
- **Incremental Indexing**: Automatically detects and skips already-indexed files
- **Concurrent Processing**: Configurable concurrency for optimal performance
- **Persistent Storage**: Vector embeddings are stored locally and persist across sessions

## Supported File Types

- **Documents**: PDF, EPUB, TXT, TEXT
- **Markdown**: MD, MDX, Markdown, MDown, MKD
- **Web Content**: HTM, HTML, XHTML
- **Images** (with OCR): BMP, JPEG, JPG, PNG
- **Archives**: RAR (planned - currently not implemented)

## Installation

1. Navigate to the plugin directory:
```bash
cd big-rag-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

## Configuration

The plugin provides the following configuration options in LM Studio:

### Required Settings

- **Documents Directory**: Root directory containing your documents (read access required)
- **Vector Store Directory**: Where the vector database will be stored (read/write access required)

### Retrieval Settings

- **Retrieval Limit** (1-20, default: 5): Maximum number of chunks to return
- **Retrieval Affinity Threshold** (0.0-1.0, default: 0.5): Minimum similarity score for relevance
- **Chunk Size** (128-2048 tokens, default: 512): Size of text chunks for embedding
- **Chunk Overlap** (0-512 tokens, default: 100): Overlap between consecutive chunks

### Performance Settings

- **Max Concurrent Files** (1-10, default: 3): Number of files to process simultaneously
- **Enable OCR** (default: false): Enable OCR for image files (slower but more comprehensive)

### Reindexing Controls

- **Manual Reindex Trigger** (toggle): Turn this ON and submit any chat message to force indexing to run on every chat session where the plugin is enabled. The plugin can’t change config values, so this toggle acts as the only “button” to rerun indexing. While it remains ON you’ll see a reminder in each chat letting you know whether a full rebuild or incremental update will occur. Flip it OFF once you’re done to stop the automatic reindex loop.
- **Skip Previously Indexed Files** (default: true): Only appears when Manual Reindex Trigger is ON. If enabled, each manual run touches just the documents that are new or have changed since the last index; if disabled, every chat rebuilds the entire index from scratch. Combine these two controls to choose between incremental updates or repeated full refreshes.
- **Chat Requests Disabled**: Direct chat prompts (e.g., “Please index my documents”) now return instructions to use the toggle; there is no longer a chat-accessible indexing tool.
- **Automatic First-Run**: If the vector store is empty, the plugin automatically indexes the configured documents the first time any chat message is processed—no manual input is required.

## Usage

1. **Configure the Plugin**:
   - Open LM Studio settings
   - Navigate to the Big RAG plugin configuration
   - Set your documents directory (e.g., `/Users/user/Documents/MyLibrary`)
   - Set your vector store directory (e.g., `/Users/user/.lmstudio/big-rag-db`)

2. **Initial Indexing**:
   - The first time you send a message, the plugin will automatically scan and index your documents
   - This process may take a while depending on the size of your document collection
   - Progress will be shown in the LM Studio interface

3. **Query Your Documents**:
   - Simply chat with your LM Studio model as usual
   - The plugin will automatically search your indexed documents for relevant content
   - Retrieved passages will be injected into the context for the model to use

## Architecture

### Components

1. **File Scanner** (`src/ingestion/fileScanner.ts`):
   - Recursively scans directories
   - Filters for supported file types
   - Collects file metadata

2. **Document Parsers** (`src/parsers/`):
   - `htmlParser.ts`: Extracts text from HTML/HTM files
   - `pdfParser.ts`: Extracts text from PDF files
   - `epubParser.ts`: Extracts text from EPUB files
   - `textParser.ts`: Reads plain text & Markdown files with optional Markdown stripping
   - `imageParser.ts`: OCR for image files
   - `documentParser.ts`: Routes to appropriate parser

3. **Vector Store** (`src/vectorstore/vectorStore.ts`):
   - Uses LanceDB for vector storage
   - Supports incremental updates
   - Efficient similarity search

4. **Index Manager** (`src/ingestion/indexManager.ts`):
   - Orchestrates the indexing pipeline
   - Manages concurrent processing
   - Handles progress reporting

5. **Prompt Preprocessor** (`src/promptPreprocessor.ts`):
   - Intercepts user queries
   - Performs vector search
   - Injects relevant context

## Performance Considerations

### Large Datasets

- **Disk Space**: The vector store requires additional disk space (typically 10-20% of original document size)
- **Initial Indexing**: Can take several hours for TB-scale collections
- **Memory Usage**: Scales with concurrent processing (reduce `maxConcurrentFiles` if needed)

### Optimization Tips

1. **Start Small**: Test with a subset of documents first
2. **Disable OCR**: Unless you have many image-based documents, keep OCR disabled
3. **Adjust Concurrency**: Lower `maxConcurrentFiles` on systems with limited resources
4. **Chunk Size**: Larger chunks (1024-2048) work better for technical documents
5. **Threshold Tuning**: Adjust `retrievalAffinityThreshold` based on result quality

## Troubleshooting

### No Results Found

- Check that documents directory is correctly configured
- Verify that indexing completed successfully
- Try lowering the retrieval affinity threshold
- Check LM Studio logs for errors

### Slow Indexing

- Reduce `maxConcurrentFiles`
- Disable OCR if not needed
- Ensure vector store directory is on a fast drive (SSD recommended)

### Out of Memory

- Reduce `maxConcurrentFiles` to 1 or 2
- Process documents in batches by organizing them into subdirectories
- Increase system swap space

### OCR Not Working

- Tesseract.js downloads language data on first use
- Ensure internet connectivity during first OCR operation
- Check that image files are valid and readable

### Failure Reason Reporting

- The CLI logs cumulative `success` / `failed` counts after each processed document.
- Set `BIG_RAG_FAILURE_REPORT_PATH=/absolute/path/report.json` when running `npm run index` (or via LM Studio env settings) to emit a JSON report containing all failure reasons and counts after indexing completes. This is useful when triaging stubborn PDFs such as blueprints or large scanned books.

## Limitations

- **RAR Archives**: Not yet implemented (files are skipped)
- **Password-Protected Files**: Not supported
- **Very Large Files**: Individual files >100MB may cause memory issues
- **Non-English OCR**: Currently only English OCR is configured

## Development

### Project Structure

```
big-rag-plugin/
├── src/
│   ├── config.ts              # Plugin configuration schema
│   ├── index.ts               # Main entry point
│   ├── promptPreprocessor.ts  # RAG integration
│   ├── ingestion/
│   │   ├── fileScanner.ts     # Directory scanning
│   │   └── indexManager.ts    # Indexing orchestration
│   ├── parsers/
│   │   ├── documentParser.ts  # Parser router
│   │   ├── htmlParser.ts      # HTML parsing
│   │   ├── pdfParser.ts       # PDF parsing
│   │   ├── epubParser.ts      # EPUB parsing
│   │   ├── textParser.ts      # Text parsing
│   │   └── imageParser.ts     # OCR parsing
│   ├── vectorstore/
│   │   └── vectorStore.ts     # LanceDB integration
│   └── utils/
│       ├── fileHash.ts        # File hashing
│       └── textChunker.ts     # Text chunking
├── manifest.json              # Plugin manifest
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

### Testing

Automated parser smoke tests cover HTML, Markdown, and plain text ingestion:

```bash
npm run test
```

For end-to-end validation:

1. Create a test directory with sample documents
2. Configure the plugin to use this directory
3. Send a test query to verify retrieval works
4. Check LM Studio logs for any errors

### Contributing

This plugin is based on the LM Studio plugin SDK. For more information:

- [lmstudio-js GitHub](https://github.com/lmstudio-ai/lmstudio-js)
- [Documentation](https://lmstudio.ai/docs)
- [Discord](https://discord.gg/6Q7Xn6MRVS)

## License

ISC

## Acknowledgments

- Built using the LM Studio SDK
- Uses LanceDB for vector storage
- OCR powered by Tesseract.js
- PDF parsing via pdf-parse
- EPUB parsing via epub2
- HTML parsing via cheerio

