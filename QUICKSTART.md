# Quick Start Guide

Get up and running with the Big RAG Plugin in 5 minutes.

## Prerequisites

- LM Studio installed
- Node.js 18+ and npm
- An embedding model downloaded in LM Studio (e.g., `nomic-ai/nomic-embed-text-v1.5-GGUF`)
- An LLM model for chat

## Installation

### Step 1: Install Dependencies

```bash
cd big-rag-plugin
npm install
```

### Step 2: Build the Plugin

```bash
npm run build
```

### Step 3: Run in Development Mode

```bash
npm run dev
```

This will start the plugin and register it with LM Studio.

## Configuration

### Step 4: Configure in LM Studio

1. Open LM Studio
2. Go to Settings → Plugins
3. Find "Big RAG" plugin
4. Configure the following:

**Required Settings:**
- **Documents Directory**: Path to your documents (e.g., `/Users/yourname/Documents/MyLibrary`)
- **Vector Store Directory**: Where to store the index (e.g., `/Users/yourname/.lmstudio/big-rag-db`)

**Optional Settings (use defaults for now):**
- Manual Reindex Trigger: OFF (leave it off unless you actively want to rerun indexing on every chat; turning it ON exposes the Skip option below and causes the plugin to rebuild the index each time you send a message)
- Retrieval Limit: 5
- Affinity Threshold: 0.5
- Chunk Size: 512
- Chunk Overlap: 100
- Max Concurrent Files: 1
- Enable OCR: true
- Skip Previously Indexed Files: true (shows up only when Manual Reindex Trigger is ON; when checked the forced reindex only touches new/changed files, otherwise each chat performs a full rebuild)

### Step 5: Prepare Test Documents

Create a test directory with some documents:

```bash
mkdir -p ~/test-docs
echo "Artificial intelligence is transforming technology." > ~/test-docs/ai.txt
echo "Machine learning is a subset of AI." > ~/test-docs/ml.txt
```

Set Documents Directory to `~/test-docs` in the plugin settings.

## First Query

### Step 6: Start a Chat

1. Open a new chat in LM Studio
2. Make sure your LLM model is loaded
3. Send a message: **"What is artificial intelligence?"**

### What Happens:

1. **First Run**: The plugin will automatically:
   - Perform sanity checks
   - Initialize the vector store
   - Scan your documents directory
   - Index all files (this may take a few minutes)
   - Search for relevant content
   - Inject results into the context

2. **Subsequent Runs**: The plugin will:
   - Use the existing index
   - Only index new/modified files
   - Search and retrieve instantly

> **Need to force a rebuild?** Flip **Manual Reindex Trigger** ON in the plugin settings. Every chat will then kick off indexing again—full rebuilds if *Skip Previously Indexed Files* is OFF, or incremental updates when it’s ON. Remember to switch the toggle back OFF when you’re finished so normal incremental behavior resumes.

### Expected Output:

The LLM will respond using information from your indexed documents, with citations like:

```
Based on the provided documents:

Citation 1 mentions that "Artificial intelligence is transforming technology."
Citation 2 explains that "Machine learning is a subset of AI."

[Model's response incorporating this information...]
```

## Next Steps

### Index Your Real Documents

1. Point Documents Directory to your actual document collection
2. Clear the vector store if you want to start fresh:
   ```bash
   rm -rf ~/.lmstudio/big-rag-db/*
   ```
3. Send a query to trigger indexing

### Optimize Settings

Based on your dataset:

**Small Dataset (<100 files, <100MB):**
- Use default settings
- Expected indexing time: 5-15 minutes

**Medium Dataset (100-1000 files, 100MB-1GB):**
- Increase Max Concurrent Files to 5
- Consider increasing Chunk Size to 768
- Expected indexing time: 30-60 minutes

**Large Dataset (1000+ files, 1GB+):**
- Adjust Max Concurrent Files based on RAM (2-3 for <8GB RAM, 5+ for 16GB+ RAM)
- Increase Chunk Size to 1024
- Disable OCR unless needed
- Expected indexing time: 2+ hours

### Monitor Progress

Watch the LM Studio interface for:
- Sanity check results
- Indexing progress (X/Y files)
- Retrieval status
- Any warnings or errors

## Troubleshooting

### "No relevant content found"

**Solution**: Lower the Affinity Threshold to 0.3-0.4

### "Documents directory not configured"

**Solution**: Set the Documents Directory in plugin settings

### Indexing is slow

**Solution**: 
- Reduce Max Concurrent Files to 1-2
- Disable OCR
- Check disk speed (use SSD if possible)

### Out of memory

**Solution**:
- Set Max Concurrent Files to 1
- Close other applications
- Process documents in smaller batches

## Tips

1. **Start Small**: Test with a small subset before indexing everything
2. **Use SSD**: Store vector database on SSD for better performance
3. **Monitor Resources**: Watch CPU and memory usage during indexing
4. **Backup**: Keep backups of your vector store directory
5. **Experiment**: Try different threshold and chunk size settings

## Common Use Cases

### Personal Knowledge Base
```
Documents: ~/Documents/Notes
Vector Store: ~/.lmstudio/notes-db
Settings: Defaults work well
```

### Technical Documentation
```
Documents: ~/Code/project/docs
Vector Store: ~/.lmstudio/project-docs-db
Chunk Size: 1024 (larger for technical content)
```

### Research Papers
```
Documents: ~/Research/papers
Vector Store: ~/.lmstudio/research-db
Retrieval Limit: 10 (more results)
Affinity Threshold: 0.6 (higher precision)
```

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- See [EXAMPLES.md](EXAMPLES.md) for usage examples
- Read [TESTING.md](TESTING.md) for testing scenarios
- Join the [LM Studio Discord](https://discord.gg/6Q7Xn6MRVS)

## What's Next?

Now that you have the plugin running:

1. Index your document collection
2. Experiment with different queries
3. Tune settings for optimal results
4. Explore advanced features in the full documentation

Happy querying! 🚀

