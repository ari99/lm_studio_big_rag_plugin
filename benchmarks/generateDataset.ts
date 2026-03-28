/**
 * Benchmark Dataset Generator
 * 
 * Generates fake document collections for benchmarking the BigRAG plugin.
 * Creates realistic test datasets with 1000, 5000, or 10000 files.
 * 
 * Usage:
 *   node dist/benchmarks/generateDataset.js [count]
 *   node dist/benchmarks/generateDataset.js 1000
 *   node dist/benchmarks/generateDataset.js 5000
 *   node dist/benchmarks/generateDataset.js 10000
 */

import * as fs from 'fs';
import * as path from 'path';

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

// Word lists for generating realistic text
const TECHNICAL_WORDS = [
  'algorithm', 'architecture', 'API', 'async', 'authentication', 'bandwidth',
  'buffer', 'cache', 'callback', 'class', 'client', 'cloud', 'cluster',
  'compiler', 'component', 'compression', 'concurrency', 'configuration',
  'connection', 'container', 'context', 'controller', 'database', 'debug',
  'deployment', 'design', 'development', 'distributed', 'document', 'domain',
  'encryption', 'endpoint', 'engine', 'error', 'event', 'exception', 'execution',
  'framework', 'function', 'gateway', 'handler', 'hardware', 'hash', 'header',
  'implementation', 'index', 'infrastructure', 'instance', 'integration', 'interface',
  'internet', 'iteration', 'latency', 'library', 'load', 'logic', 'memory',
  'message', 'method', 'microservice', 'middleware', 'module', 'network',
  'object', 'operation', 'optimization', 'package', 'parallel', 'parameter',
  'parser', 'pattern', 'performance', 'pipeline', 'platform', 'port', 'process',
  'protocol', 'proxy', 'query', 'queue', 'request', 'response', 'runtime',
  'scalability', 'schema', 'security', 'server', 'service', 'session', 'socket',
  'software', 'storage', 'stream', 'structure', 'system', 'task', 'template',
  'thread', 'throughput', 'timeout', 'token', 'transaction', 'type', 'user',
  'validation', 'variable', 'version', 'virtual', 'web', 'workflow'
];

const PROSE_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and',
  'cat', 'sat', 'on', 'mat', 'with', 'mouse', 'that', 'ran', 'away', 'from',
  'house', 'in', 'forest', 'near', 'river', 'where', 'birds', 'sing', 'sweetly',
  'during', 'spring', 'summer', 'autumn', 'winter', 'seasons', 'change', 'slowly',
  'people', 'walk', 'through', 'park', 'enjoying', 'beautiful', 'weather', 'while',
  'children', 'play', 'games', 'together', 'happily', 'under', 'warm', 'sun',
  'trees', 'provide', 'shade', 'gentle', 'breeze', 'blows', 'softly', 'carrying',
  'scent', 'flowers', 'blooming', 'garden', 'colorful', 'petals', 'dance', 'wind'
];

const CODE_SNIPPETS = [
  'function processData(input) { return input.map(x => x * 2); }',
  'const result = await fetch(apiEndpoint).then(res => res.json());',
  'if (user.isAuthenticated && user.hasPermission("read")) { grantAccess(); }',
  'class DataProcessor { constructor(config) { this.config = config; } }',
  'for (let i = 0; i < items.length; i++) { processItem(items[i]); }',
  'const filtered = data.filter(item => item.status === "active");',
  'try { await database.connect(); } catch (error) { handleError(error); }',
  'export const CONFIG = { timeout: 5000, retries: 3, debug: true };',
  'interface User { id: string; name: string; email: string; role: Role; }',
  'const handler = (req, res) => { res.json({ success: true }); };'
];

const MARKDOWN_TEMPLATES = [
  `# {title}

## Overview

{content}

## Details

{more_content}

### Key Points

- Point one about {topic}
- Point two regarding {topic}
- Point three related to {topic}

## Conclusion

{closing}
`,
  `# {title}

> {quote}

## Introduction

{content}

## Main Content

{more_content}

## Summary

{closing}
`,
  `# {title}

## Background

{content}

## Analysis

{more_content}

## Findings

1. First finding about {topic}
2. Second finding regarding {topic}
3. Third finding related to {topic}

## Recommendations

{closing}
`
];

const HTML_TEMPLATES = [
  `<!DOCTYPE html>
<html>
<head><title>{title}</title></head>
<body>
<h1>{title}</h1>
<p>{content}</p>
<div class="section">
<h2>Details</h2>
<p>{more_content}</p>
</div>
<footer>{closing}</footer>
</body>
</html>`,
  `<!DOCTYPE html>
<html>
<head><title>{title}</title></head>
<body>
<article>
<header><h1>{title}</h1></header>
<section>{content}</section>
<section>{more_content}</section>
<footer>{closing}</footer>
</article>
</body>
</html>`
];

const TITLES = [
  'Introduction to {topic}',
  'Advanced {topic} Techniques',
  'Understanding {topic} Architecture',
  '{topic} Best Practices',
  'Getting Started with {topic}',
  '{topic} Performance Optimization',
  'Building Scalable {topic} Systems',
  '{topic} Security Considerations',
  'Modern {topic} Development',
  '{topic} Design Patterns'
];

const TOPICS = [
  'Machine Learning', 'Distributed Systems', 'Cloud Computing', 'Database Design',
  'API Development', 'Microservices', 'Data Engineering', 'Software Architecture',
  'DevOps Practices', 'System Design', 'Network Security', 'Web Development',
  'Mobile Applications', 'Container Orchestration', 'Event-Driven Architecture',
  'Real-time Processing', 'Data Pipelines', 'Infrastructure as Code',
  'Continuous Integration', 'Monitoring and Observability'
];

function generateTitle(rng: SeededRandom): string {
  const template = rng.pick(TITLES);
  const topic = rng.pick(TOPICS);
  return template.replace('{topic}', topic);
}

function generateParagraph(rng: SeededRandom, wordCount: number, type: 'prose' | 'technical' | 'code'): string {
  const words: string[] = [];
  
  for (let i = 0; i < wordCount; i++) {
    if (type === 'code' && rng.next() < 0.1) {
      words.push(rng.pick(CODE_SNIPPETS));
    } else if (type === 'technical') {
      words.push(rng.pick(TECHNICAL_WORDS));
    } else {
      words.push(rng.pick(PROSE_WORDS));
    }
  }
  
  const text = words.join(' ');
  
  // Add some punctuation and capitalization
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

function generateContent(rng: SeededRandom, wordCount: number, type: 'prose' | 'technical' | 'code'): string {
  const paragraphs: string[] = [];
  const wordsPerParagraph = rng.nextInt(50, 150);
  const numParagraphs = Math.ceil(wordCount / wordsPerParagraph);
  
  for (let i = 0; i < numParagraphs; i++) {
    paragraphs.push(generateParagraph(rng, wordsPerParagraph, type));
  }
  
  return paragraphs.join('\n\n');
}

function generateMarkdown(rng: SeededRandom, wordCount: number): string {
  const template = rng.pick(MARKDOWN_TEMPLATES);
  const title = generateTitle(rng);
  const topic = rng.pick(TOPICS);
  const type: 'prose' | 'technical' = rng.next() < 0.5 ? 'technical' : 'prose';
  
  const content = generateContent(rng, Math.floor(wordCount * 0.3), type);
  const moreContent = generateContent(rng, Math.floor(wordCount * 0.4), type);
  const closing = generateContent(rng, Math.floor(wordCount * 0.2), type);
  const quote = generateParagraph(rng, 20, 'prose');
  
  return template
    .replace('{title}', title)
    .replace('{topic}', topic)
    .replace('{content}', content)
    .replace('{more_content}', moreContent)
    .replace('{closing}', closing)
    .replace('{quote}', quote);
}

function generateHTML(rng: SeededRandom, wordCount: number): string {
  const template = rng.pick(HTML_TEMPLATES);
  const title = generateTitle(rng);
  const type: 'prose' | 'technical' = rng.next() < 0.5 ? 'technical' : 'prose';
  
  const content = generateContent(rng, Math.floor(wordCount * 0.3), type);
  const moreContent = generateContent(rng, Math.floor(wordCount * 0.4), type);
  const closing = generateContent(rng, Math.floor(wordCount * 0.2), type);
  
  return template
    .replace('{title}', title)
    .replace('{content}', content)
    .replace('{more_content}', moreContent)
    .replace('{closing}', closing);
}

function generatePlainText(rng: SeededRandom, wordCount: number): string {
  const type: 'prose' | 'technical' | 'code' = 
    rng.next() < 0.33 ? 'prose' : 
    rng.next() < 0.66 ? 'technical' : 'code';
  
  return generateContent(rng, wordCount, type);
}

interface FileSpec {
  extension: string;
  wordCount: number;
  generator: (rng: SeededRandom, wordCount: number) => string;
}

function getFileSpecs(rng: SeededRandom): FileSpec[] {
  const specs: FileSpec[] = [];
  
  // Distribution: 60% TXT, 20% MD, 10% HTML, 10% PDF (we'll generate as TXT for now)
  for (let i = 0; i < 60; i++) {
    specs.push({ extension: 'txt', wordCount: 0, generator: generatePlainText });
  }
  for (let i = 0; i < 20; i++) {
    specs.push({ extension: 'md', wordCount: 0, generator: generateMarkdown });
  }
  for (let i = 0; i < 10; i++) {
    specs.push({ extension: 'html', wordCount: 0, generator: generateHTML });
  }
  for (let i = 0; i < 10; i++) {
    specs.push({ extension: 'txt', wordCount: 0, generator: generatePlainText }); // PDF proxy
  }
  
  return specs;
}

function getWordCountDistribution(rng: SeededRandom): number {
  // Distribution: 30% short (500-1000), 40% medium (1000-5000), 30% long (5000-10000)
  const rand = rng.next();
  if (rand < 0.3) {
    return rng.nextInt(500, 1000);
  } else if (rand < 0.7) {
    return rng.nextInt(1000, 5000);
  } else {
    return rng.nextInt(5000, 10000);
  }
}

async function generateDataset(count: number, outputDir: string): Promise<void> {
  console.log(`Generating dataset with ${count} files...`);
  console.log(`Output directory: ${outputDir}`);
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create subdirectories for organization
  const subdirs = ['docs', 'articles', 'notes', 'reference', 'tutorials'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(outputDir, subdir);
    if (!fs.existsSync(subdirPath)) {
      fs.mkdirSync(subdirPath, { recursive: true });
    }
  }
  
  // Initialize seeded random with fixed seed for reproducibility
  const rng = new SeededRandom(42);
  const fileSpecs = getFileSpecs(rng);
  
  // Statistics
  const stats = {
    totalWords: 0,
    totalFiles: 0,
    byExtension: new Map<string, number>(),
    byWordCount: { short: 0, medium: 0, long: 0 },
  };
  
  // Generate files
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const spec = rng.pick(fileSpecs);
    const wordCount = getWordCountDistribution(rng);
    const content = spec.generator(rng, wordCount);
    
    // Choose subdirectory
    const subdir = rng.pick(subdirs);
    
    // Generate filename
    const filename = `doc_${i.toString().padStart(5, '0')}.${spec.extension}`;
    const filepath = path.join(outputDir, subdir, filename);
    
    // Write file
    fs.writeFileSync(filepath, content, 'utf-8');
    
    // Update statistics
    stats.totalWords += wordCount;
    stats.totalFiles++;
    stats.byExtension.set(spec.extension, (stats.byExtension.get(spec.extension) || 0) + 1);
    
    if (wordCount < 1000) stats.byWordCount.short++;
    else if (wordCount < 5000) stats.byWordCount.medium++;
    else stats.byWordCount.long++;
    
    // Progress indicator
    if ((i + 1) % 100 === 0 || i === count - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Generated ${i + 1}/${count} files (${elapsed}s)`);
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Print statistics
  console.log('\n=== Dataset Generation Complete ===');
  console.log(`Total files: ${stats.totalFiles}`);
  console.log(`Total words: ${stats.totalWords.toLocaleString()}`);
  console.log(`Time elapsed: ${elapsed}s`);
  console.log(`Files per second: ${(stats.totalFiles / (elapsed / 1000)).toFixed(1)}`);
  console.log('\nBy extension:');
  for (const [ext, count] of stats.byExtension.entries()) {
    console.log(`  .${ext}: ${count} (${((count / stats.totalFiles) * 100).toFixed(1)}%)`);
  }
  console.log('\nBy word count:');
  console.log(`  Short (500-1000): ${stats.byWordCount.short} (${((stats.byWordCount.short / stats.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`  Medium (1000-5000): ${stats.byWordCount.medium} (${((stats.byWordCount.medium / stats.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`  Long (5000-10000): ${stats.byWordCount.long} (${((stats.byWordCount.long / stats.totalFiles) * 100).toFixed(1)}%)`);
  console.log(`\nOutput: ${outputDir}`);
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node generateDataset.js [count]');
    console.log('  count: Number of files to generate (1000, 5000, 10000)');
    console.log('\nExamples:');
    console.log('  node generateDataset.js 1000');
    console.log('  node generateDataset.js 5000');
    console.log('  node generateDataset.js 10000');
    process.exit(1);
  }
  
  const count = parseInt(args[0], 10);
  
  if (isNaN(count) || count <= 0) {
    console.error('Error: count must be a positive integer');
    process.exit(1);
  }
  
  const outputDir = path.join(process.cwd(), 'benchmark-data', `${count}-files`);
  
  try {
    await generateDataset(count, outputDir);
  } catch (error) {
    console.error('Error generating dataset:', error);
    process.exit(1);
  }
}

main().catch(console.error);
