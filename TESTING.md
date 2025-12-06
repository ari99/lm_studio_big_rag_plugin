# Testing Guide for Big RAG Plugin

This guide provides instructions for testing the Big RAG plugin with various scenarios and dataset sizes.

## Prerequisites

1. LM Studio installed and running
2. At least one embedding model loaded (e.g., `nomic-ai/nomic-embed-text-v1.5-GGUF`)
3. At least one LLM loaded for chat
4. Node.js and npm installed

## Setup for Testing

### 0. Run Parser Smoke Tests

Before larger end-to-end runs, ensure the core parsers succeed:

```bash
npm run test
```

This builds the project and executes the HTML/Markdown/Text regression tests located in `src/tests/parseDocument.test.ts`.

### 1. Install Dependencies

```bash
cd big-rag-plugin
npm install
```

### 2. Create Test Data

Create a test directory structure:

```bash
mkdir -p ~/test-documents/subfolder1
mkdir -p ~/test-documents/subfolder2/deep
```

Add some test files:

```bash
# Create a simple text file
echo "This is a test document about artificial intelligence and machine learning." > ~/test-documents/test1.txt

# Create an HTML file
cat > ~/test-documents/test2.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Test Document</title></head>
<body>
<h1>Machine Learning Basics</h1>
<p>Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.</p>
</body>
</html>
EOF

# Create a markdown file in subfolder
echo "# Deep Learning\n\nDeep learning uses neural networks with multiple layers." > ~/test-documents/subfolder1/test3.md
```

### 3. Create Vector Store Directory

```bash
mkdir -p ~/.lmstudio/big-rag-test-db
```

## Test Scenarios

### Test 1: Basic Functionality

**Objective**: Verify the plugin can index and retrieve from a small dataset.

**Steps**:
1. Start the plugin in dev mode:
   ```bash
   npm run dev
   ```

2. Configure in LM Studio:
   - Documents Directory: `~/test-documents`
   - Vector Store Directory: `~/.lmstudio/big-rag-test-db`
   - Keep other settings at defaults

3. Send a test query:
   ```
   What is machine learning?
   ```

4. **Expected Result**: The plugin should:
   - Scan and index the 3 test files
   - Retrieve relevant passages
   - Include citations in the response

**Success Criteria**:
- ✅ Indexing completes without errors
- ✅ Retrieval finds relevant content
- ✅ Response includes citations from test files

### Test 2: Large Directory Handling

**Objective**: Test with a larger dataset (100+ files).

**Steps**:
1. Generate test files:
   ```bash
   for i in {1..100}; do
     echo "Document $i: This document discusses topic $((i % 10)) in detail." > ~/test-documents/doc_$i.txt
   done
   ```

2. Clear the vector store:
   ```bash
   rm -rf ~/.lmstudio/big-rag-test-db/*
   ```

3. Restart the plugin and send a query

4. **Expected Result**: 
   - Indexing should process all 103 files
   - Progress should be visible in LM Studio
   - Retrieval should work after indexing

**Success Criteria**:
- ✅ All files are processed
- ✅ No memory issues
- ✅ Indexing completes in reasonable time
- ✅ Retrieval returns relevant results

### Test 3: Multiple File Types

**Objective**: Verify all supported file types are processed correctly.

**Steps**:
1. Add different file types to test directory:
   - Copy a sample PDF
   - Copy a sample EPUB
   - Copy a sample image (if OCR enabled)

2. Clear vector store and reindex

3. Query for content that should be in each file type

**Success Criteria**:
- ✅ PDF files are parsed correctly
- ✅ EPUB files are parsed correctly
- ✅ HTML files are parsed correctly
- ✅ Text files are parsed correctly
- ✅ Images are processed (if OCR enabled)

### Test 4: Incremental Indexing

**Objective**: Verify that already-indexed files are skipped.

**Steps**:
1. Index the test directory (first time)
2. Note the indexing time
3. Restart the plugin
4. Send another query (triggers reindex check)
5. Note the indexing time

**Expected Result**: Second indexing should be much faster as files are already indexed.

**Success Criteria**:
- ✅ Already-indexed files are skipped
- ✅ Only new/modified files are processed
- ✅ Retrieval still works correctly

### Test 5: Concurrent Processing

**Objective**: Test different concurrency settings.

**Steps**:
1. Set `maxConcurrentFiles` to 1
2. Index 50 files and note the time
3. Clear vector store
4. Set `maxConcurrentFiles` to 5
5. Index the same 50 files and note the time

**Expected Result**: Higher concurrency should be faster (but use more memory).

**Success Criteria**:
- ✅ Both settings work correctly
- ✅ Higher concurrency is faster
- ✅ No race conditions or errors

### Test 6: Retrieval Threshold Tuning

**Objective**: Test different threshold settings.

**Steps**:
1. Index test documents
2. Set `retrievalAffinityThreshold` to 0.9 (very strict)
3. Send a query
4. Set `retrievalAffinityThreshold` to 0.3 (very loose)
5. Send the same query

**Expected Result**: 
- High threshold: Fewer, more relevant results
- Low threshold: More results, some less relevant

**Success Criteria**:
- ✅ Threshold affects number of results
- ✅ Results are properly filtered
- ✅ No errors with extreme values

### Test 7: OCR Testing (Optional)

**Objective**: Verify OCR works for image files.

**Steps**:
1. Enable OCR in settings
2. Add an image with text to test directory
3. Clear vector store and reindex
4. Query for content that's in the image

**Expected Result**: Text from image should be extracted and searchable.

**Success Criteria**:
- ✅ Image is processed
- ✅ Text is extracted correctly
- ✅ Content is retrievable

### Test 8: Error Handling

**Objective**: Verify graceful handling of errors.

**Test Cases**:

1. **Invalid Directory**:
   - Set documents directory to non-existent path
   - Send a query
   - Expected: Warning message, no crash

2. **Corrupted File**:
   - Add a corrupted PDF to test directory
   - Reindex
   - Expected: File is skipped with error log, indexing continues

3. **No Write Permission**:
   - Set vector store directory to read-only location
   - Try to index
   - Expected: Clear error message

4. **Disk Full** (simulated):
   - Not easily testable, but should fail gracefully

**Success Criteria**:
- ✅ Plugin doesn't crash
- ✅ Clear error messages
- ✅ Other files continue to process

## Performance Benchmarks

### Small Dataset (10 files, ~1MB total)
- **Expected Indexing Time**: 10-30 seconds
- **Expected Query Time**: < 1 second
- **Memory Usage**: < 200MB

### Medium Dataset (100 files, ~10MB total)
- **Expected Indexing Time**: 1-3 minutes
- **Expected Query Time**: < 2 seconds
- **Memory Usage**: < 500MB

### Large Dataset (1000 files, ~100MB total)
- **Expected Indexing Time**: 10-30 minutes
- **Expected Query Time**: < 3 seconds
- **Memory Usage**: < 1GB

### Very Large Dataset (10000+ files, 1GB+ total)
- **Expected Indexing Time**: 2-6 hours
- **Expected Query Time**: < 5 seconds
- **Memory Usage**: 1-3GB

*Note: Times vary based on hardware, file types, and OCR usage.*

## Debugging

### Enable Debug Logging

The plugin uses LM Studio's logging system. To see debug output:

1. Check LM Studio's developer console
2. Look for messages prefixed with plugin name
3. Use `ctl.debug()` calls in code for detailed logging

### Common Issues

1. **"No relevant content found"**
   - Check that indexing completed
   - Lower the retrieval threshold
   - Verify query matches document content

2. **"Vector store not initialized"**
   - Check vector store directory permissions
   - Ensure directory path is valid
   - Check LM Studio logs for initialization errors

3. **Slow indexing**
   - Reduce concurrent files
   - Disable OCR if not needed
   - Check disk I/O performance

4. **High memory usage**
   - Reduce concurrent files to 1-2
   - Process documents in smaller batches
   - Check for memory leaks in parsers

## Cleanup

After testing, clean up test data:

```bash
# Remove test documents
rm -rf ~/test-documents

# Remove test vector store
rm -rf ~/.lmstudio/big-rag-test-db
```

## Automated Testing (Future)

For automated testing, consider:

1. Unit tests for parsers
2. Integration tests for indexing pipeline
3. Performance benchmarks
4. Regression tests for bug fixes

Example test structure:

```typescript
describe('DocumentParser', () => {
  it('should parse HTML correctly', async () => {
    const result = await parseHTML('test.html');
    expect(result).toContain('expected text');
  });
});
```

## Reporting Issues

When reporting issues, include:

1. Plugin version
2. LM Studio version
3. Operating system
4. Dataset size and composition
5. Configuration settings
6. Error messages and logs
7. Steps to reproduce

## Performance Tuning Checklist

- [ ] Tested with small dataset
- [ ] Tested with large dataset
- [ ] Optimized chunk size for use case
- [ ] Tuned retrieval threshold
- [ ] Adjusted concurrency for hardware
- [ ] Tested OCR performance (if needed)
- [ ] Verified incremental indexing works
- [ ] Checked memory usage under load
- [ ] Tested error handling
- [ ] Documented optimal settings

