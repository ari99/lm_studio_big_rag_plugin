# Usage Examples

This document provides practical examples of using the Big RAG Plugin with different types of document collections.

## Example 1: Technical Documentation Library

### Scenario
You have a large collection of technical documentation, API references, and tutorials that you want to query using natural language.

### Setup

```bash
# Directory structure
~/Documents/tech-library/
├── python/
│   ├── official-docs/
│   ├── tutorials/
│   └── api-reference/
├── javascript/
│   ├── mdn-docs/
│   └── frameworks/
└── databases/
    ├── postgresql/
    └── mongodb/
```

### Configuration

- **Documents Directory**: `~/Documents/tech-library`
- **Vector Store Directory**: `~/.lmstudio/tech-library-db`
- **Chunk Size**: 1024 (larger chunks for technical content)
- **Chunk Overlap**: 200
- **Retrieval Limit**: 7
- **Affinity Threshold**: 0.6
- **Max Concurrent Files**: 5
- **OCR**: Disabled

### Example Queries

**Query 1**: "How do I connect to PostgreSQL using Python?"

**Expected Behavior**:
- Retrieves relevant passages from both Python and PostgreSQL documentation
- Combines information from multiple sources
- Provides code examples if available in the docs

**Query 2**: "What are the differences between var, let, and const in JavaScript?"

**Expected Behavior**:
- Finds relevant sections from JavaScript documentation
- Returns explanations with examples
- May include best practices if documented

**Query 3**: "Show me MongoDB aggregation pipeline examples"

**Expected Behavior**:
- Retrieves MongoDB-specific documentation
- Includes practical examples
- May reference multiple documents showing different use cases

## Example 2: Research Paper Collection

### Scenario
You're a researcher with hundreds of PDF papers that you want to search and reference.

### Setup

```bash
# Directory structure
~/Research/papers/
├── machine-learning/
│   ├── deep-learning/
│   ├── reinforcement-learning/
│   └── nlp/
├── computer-vision/
└── robotics/
```

### Configuration

- **Documents Directory**: `~/Research/papers`
- **Vector Store Directory**: `~/.lmstudio/research-db`
- **Chunk Size**: 768 (balanced for academic writing)
- **Chunk Overlap**: 150
- **Retrieval Limit**: 10 (more results for research)
- **Affinity Threshold**: 0.55
- **Max Concurrent Files**: 3 (PDFs are slower to parse)
- **OCR**: Disabled (assuming text-based PDFs)

### Example Queries

**Query 1**: "What are the latest approaches to attention mechanisms in transformers?"

**Expected Behavior**:
- Searches across all NLP papers
- Retrieves relevant sections discussing attention
- May include citations from multiple papers

**Query 2**: "Compare different reinforcement learning algorithms for robotics"

**Expected Behavior**:
- Finds content from both RL and robotics papers
- Retrieves comparative information
- Provides context from multiple sources

**Query 3**: "What datasets are commonly used for object detection?"

**Expected Behavior**:
- Searches computer vision papers
- Lists datasets mentioned in papers
- May include performance benchmarks

## Example 3: Legal Document Archive

### Scenario
A law firm with thousands of legal documents, contracts, and case files.

### Setup

```bash
# Directory structure
~/Legal/documents/
├── contracts/
│   ├── 2020/
│   ├── 2021/
│   ├── 2022/
│   ├── 2023/
│   └── 2024/
├── case-files/
└── regulations/
```

### Configuration

- **Documents Directory**: `~/Legal/documents`
- **Vector Store Directory**: `~/.lmstudio/legal-db`
- **Chunk Size**: 512 (standard for legal text)
- **Chunk Overlap**: 100
- **Retrieval Limit**: 5
- **Affinity Threshold**: 0.7 (higher precision for legal)
- **Max Concurrent Files**: 2 (careful processing)
- **OCR**: Enabled (for scanned documents)

### Example Queries

**Query 1**: "Find all contracts with non-compete clauses"

**Expected Behavior**:
- Searches across all contract documents
- Retrieves sections containing non-compete language
- Provides file references for review

**Query 2**: "What are the standard terms for intellectual property rights?"

**Expected Behavior**:
- Finds IP-related clauses across documents
- Shows variations in language
- Helps identify standard vs. custom terms

**Query 3**: "Show precedents for breach of contract cases"

**Expected Behavior**:
- Searches case files
- Retrieves relevant case information
- Provides context for similar situations

## Example 4: Personal Knowledge Base

### Scenario
Personal collection of notes, articles, ebooks, and saved web pages.

### Setup

```bash
# Directory structure
~/Knowledge/
├── books/
│   ├── fiction/
│   └── non-fiction/
├── articles/
│   ├── saved-webpages/
│   └── pdfs/
├── notes/
│   ├── work/
│   └── personal/
└── recipes/
```

### Configuration

- **Documents Directory**: `~/Knowledge`
- **Vector Store Directory**: `~/.lmstudio/knowledge-db`
- **Chunk Size**: 512
- **Chunk Overlap**: 100
- **Retrieval Limit**: 5
- **Affinity Threshold**: 0.5
- **Max Concurrent Files**: 4
- **OCR**: Enabled (for recipe images, etc.)

### Example Queries

**Query 1**: "What did I save about productivity techniques?"

**Expected Behavior**:
- Searches across articles and notes
- Finds productivity-related content
- Combines information from multiple sources

**Query 2**: "Find that recipe for chocolate cake"

**Expected Behavior**:
- Searches recipe directory
- May use OCR if recipe is an image
- Returns recipe details

**Query 3**: "What books have I read about history?"

**Expected Behavior**:
- Searches book collection
- Identifies history-related books
- May provide summaries or key points

## Example 5: Software Development Project

### Scenario
Large codebase with documentation, README files, and code comments.

### Setup

```bash
# Directory structure
~/Projects/myapp/
├── docs/
│   ├── api/
│   ├── guides/
│   └── tutorials/
├── README.md
├── CONTRIBUTING.md
└── src/
    └── (various .md files for documentation)
```

### Configuration

- **Documents Directory**: `~/Projects/myapp`
- **Vector Store Directory**: `~/.lmstudio/myapp-docs-db`
- **Chunk Size**: 768
- **Chunk Overlap**: 150
- **Retrieval Limit**: 6
- **Affinity Threshold**: 0.55
- **Max Concurrent Files**: 5
- **OCR**: Disabled

### Example Queries

**Query 1**: "How do I set up the development environment?"

**Expected Behavior**:
- Finds setup instructions from README or guides
- Provides step-by-step information
- May reference multiple documentation files

**Query 2**: "What's the API for user authentication?"

**Expected Behavior**:
- Searches API documentation
- Retrieves authentication-related endpoints
- Shows usage examples

**Query 3**: "How do I contribute to this project?"

**Expected Behavior**:
- Finds CONTRIBUTING.md content
- Provides guidelines and workflow
- May include code style requirements

## Example 6: Medical/Healthcare Records (Anonymized)

### Scenario
Healthcare provider with anonymized patient records, research notes, and medical literature.

### Setup

```bash
# Directory structure
~/Medical/data/
├── research/
├── literature/
└── case-studies/
```

### Configuration

- **Documents Directory**: `~/Medical/data`
- **Vector Store Directory**: `~/.lmstudio/medical-db`
- **Chunk Size**: 512
- **Chunk Overlap**: 100
- **Retrieval Limit**: 8
- **Affinity Threshold**: 0.65 (higher precision for medical)
- **Max Concurrent Files**: 3
- **OCR**: Enabled (for scanned records)

### Example Queries

**Query 1**: "What are common treatments for condition X?"

**Expected Behavior**:
- Searches medical literature and case studies
- Retrieves treatment protocols
- Provides evidence-based information

**Query 2**: "Find cases with similar symptoms"

**Expected Behavior**:
- Searches case studies
- Identifies similar presentations
- Helps with differential diagnosis

## Performance Tips by Use Case

### Large Text Collections (>10GB)
- Use higher concurrency (5-8)
- Disable OCR unless needed
- Consider processing in batches
- Use SSD for vector store

### PDF-Heavy Collections
- Lower concurrency (2-3)
- Increase chunk size (1024+)
- Allow more time for initial indexing
- Monitor memory usage

### Mixed Media Collections
- Enable OCR selectively
- Use moderate concurrency (3-4)
- Adjust threshold based on quality
- Test with small subset first

### Frequently Updated Collections
- Enable auto-reindex
- Use file watching (future feature)
- Keep vector store on fast storage
- Regular maintenance

## Troubleshooting Examples

### Example: No Results for Known Content

**Problem**: Querying for content you know exists returns no results.

**Solutions**:
1. Lower affinity threshold (try 0.3-0.4)
2. Rephrase query to match document language
3. Check that file was actually indexed
4. Verify file format is supported

### Example: Too Many Irrelevant Results

**Problem**: Getting too many low-quality matches.

**Solutions**:
1. Increase affinity threshold (try 0.7-0.8)
2. Reduce retrieval limit
3. Use more specific queries
4. Adjust chunk size for content type

### Example: Slow Indexing

**Problem**: Initial indexing taking too long.

**Solutions**:
1. Reduce max concurrent files
2. Disable OCR if not needed
3. Process subdirectories separately
4. Check disk I/O performance

## Best Practices

1. **Start Small**: Test with a subset before indexing everything
2. **Tune Settings**: Adjust based on your specific content
3. **Monitor Performance**: Watch memory and disk usage
4. **Regular Maintenance**: Periodically rebuild index for optimization
5. **Backup**: Keep backups of your vector store
6. **Document**: Note what settings work best for your use case
7. **Iterate**: Refine queries and settings based on results

