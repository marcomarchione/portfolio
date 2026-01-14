/**
 * Tests for Markdown Processing with Shiki Syntax Highlighting
 *
 * These tests verify that:
 * 1. Prose classes render styled headings (h1-h4)
 * 2. Code blocks receive Shiki syntax highlighting with GitHub Dark theme
 * 3. Markdown elements (lists, blockquotes, links) are styled correctly
 */

import { describe, test, expect } from 'bun:test';
import { parseMarkdown } from './index';

describe('Markdown Processing', () => {
  describe('Test 1: Headings render with proper HTML structure', () => {
    test('renders h1 through h4 headings correctly', async () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<h1');
      expect(html).toContain('Heading 1');
      expect(html).toContain('<h2');
      expect(html).toContain('Heading 2');
      expect(html).toContain('<h3');
      expect(html).toContain('Heading 3');
      expect(html).toContain('<h4');
      expect(html).toContain('Heading 4');
    });
  });

  describe('Test 2: Code blocks receive Shiki syntax highlighting', () => {
    test('JavaScript code blocks are highlighted with GitHub Dark theme', async () => {
      const markdown = `\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\``;

      const html = await parseMarkdown(markdown);

      // Shiki generates pre elements with inline styles for GitHub Dark theme
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
      // Shiki applies background color from GitHub Dark theme
      expect(html).toContain('background-color');
      // Code content should be present
      expect(html).toContain('greeting');
      expect(html).toContain('Hello, World!');
    });

    test('TypeScript code blocks are highlighted', async () => {
      const markdown = `\`\`\`typescript
interface User {
  name: string;
  age: number;
}
\`\`\``;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<pre');
      expect(html).toContain('interface');
      expect(html).toContain('User');
      expect(html).toContain('background-color');
    });

    test('Python code blocks are highlighted', async () => {
      const markdown = `\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\``;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<pre');
      expect(html).toContain('def');
      expect(html).toContain('greet');
      expect(html).toContain('background-color');
    });

    test('Bash code blocks are highlighted', async () => {
      const markdown = `\`\`\`bash
#!/bin/bash
echo "Hello, World!"
\`\`\``;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<pre');
      expect(html).toContain('echo');
      expect(html).toContain('background-color');
    });

    test('Unknown languages fall back gracefully', async () => {
      const markdown = `\`\`\`unknownlang
some code here
\`\`\``;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<pre');
      expect(html).toContain('some code here');
    });
  });

  describe('Test 3: Markdown elements render correctly', () => {
    test('unordered lists render with proper structure', async () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
      expect(html).toContain('Item 3');
    });

    test('ordered lists render with proper structure', async () => {
      const markdown = `1. First item
2. Second item
3. Third item`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<ol');
      expect(html).toContain('<li');
      expect(html).toContain('First item');
      expect(html).toContain('Second item');
    });

    test('blockquotes render with proper structure', async () => {
      const markdown = `> This is a blockquote
> with multiple lines`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<blockquote');
      expect(html).toContain('This is a blockquote');
    });

    test('links render with href attribute', async () => {
      const markdown = `Check out [this link](https://example.com)`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('this link');
    });

    test('inline code renders correctly', async () => {
      const markdown = 'Use the `console.log()` function';

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<code');
      expect(html).toContain('console.log()');
    });

    test('strong and emphasis render correctly', async () => {
      const markdown = '**bold text** and *italic text*';

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<strong');
      expect(html).toContain('bold text');
      expect(html).toContain('<em');
      expect(html).toContain('italic text');
    });

    test('paragraphs render correctly', async () => {
      const markdown = `This is paragraph one.

This is paragraph two.`;

      const html = await parseMarkdown(markdown);

      expect(html).toContain('<p');
      expect(html).toContain('paragraph one');
      expect(html).toContain('paragraph two');
    });
  });
});
