/**
 * Integration Tests for Markdown Processing with Typography Plugin
 *
 * These tests verify the complete integration between:
 * - Shiki syntax highlighting
 * - @tailwindcss/typography prose classes
 * - Dark/light theme support
 */

import { describe, test, expect } from 'bun:test';
import { parseMarkdown } from './index';
import * as fs from 'fs';
import * as path from 'path';

// Base path for src directory (from lib/markdown/ go up 2 levels to reach src/)
const srcPath = path.join(__dirname, '../..');

// Base path for web package root (from lib/markdown/ go up 3 levels via src, then up one more)
// __dirname = packages/web/src/lib/markdown
// ../../.. = packages/web
const webRootPath = path.join(__dirname, '../../..');

describe('Integration Tests', () => {
  describe('Test 1: Complete markdown document renders correctly', () => {
    test('markdown with headings, lists, code blocks, and links renders all elements', async () => {
      const markdown = `# Main Heading

This is a paragraph with **bold text** and *italic text*.

## Secondary Heading

Here's a list:

- First item
- Second item
- Third item

### Code Example

\`\`\`javascript
const example = {
  name: "test",
  value: 42
};
console.log(example);
\`\`\`

Check out [this link](https://example.com) for more info.

> This is a blockquote with important information.

#### Final Heading

1. Numbered item one
2. Numbered item two
`;

      const html = await parseMarkdown(markdown);

      // Verify all elements are present
      expect(html).toContain('<h1');
      expect(html).toContain('Main Heading');
      expect(html).toContain('<h2');
      expect(html).toContain('Secondary Heading');
      expect(html).toContain('<h3');
      expect(html).toContain('<h4');
      expect(html).toContain('<p');
      expect(html).toContain('<strong');
      expect(html).toContain('bold text');
      expect(html).toContain('<em');
      expect(html).toContain('italic text');
      expect(html).toContain('<ul');
      expect(html).toContain('<ol');
      expect(html).toContain('<li');
      expect(html).toContain('<pre');
      expect(html).toContain('<code');
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('<blockquote');
    });
  });

  describe('Test 2: Multiple programming languages highlight correctly', () => {
    test('JavaScript highlights correctly', async () => {
      const markdown = `\`\`\`javascript
const fn = () => console.log("Hello");
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('const');
    });

    test('Python highlights correctly', async () => {
      const markdown = `\`\`\`python
def hello():
    print("Hello, World!")
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('def');
    });

    test('Bash highlights correctly', async () => {
      const markdown = `\`\`\`bash
#!/bin/bash
for i in {1..5}; do
    echo "Number: $i"
done
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('echo');
    });

    test('TypeScript highlights correctly', async () => {
      const markdown = `\`\`\`typescript
interface User {
  id: number;
  name: string;
}

const getUser = (id: number): User => {
  return { id, name: "Test" };
};
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('interface');
    });

    test('JSON highlights correctly', async () => {
      const markdown = `\`\`\`json
{
  "name": "project",
  "version": "1.0.0",
  "dependencies": {}
}
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('name');
    });

    test('SQL highlights correctly', async () => {
      const markdown = `\`\`\`sql
SELECT * FROM users
WHERE id = 1
ORDER BY created_at DESC;
\`\`\``;

      const html = await parseMarkdown(markdown);
      expect(html).toContain('<pre');
      expect(html).toContain('background-color');
      expect(html).toContain('SELECT');
    });
  });

  describe('Test 3: Theme compatibility', () => {
    test('code blocks use GitHub Dark theme colors', async () => {
      const markdown = `\`\`\`javascript
const x = 1;
\`\`\``;

      const html = await parseMarkdown(markdown);
      // GitHub Dark theme has a specific dark background
      expect(html).toContain('background-color:#24292e');
    });

    test('prose container classes support both themes', () => {
      const slugPath = path.join(srcPath, 'pages/[lang]/projects/[slug].astro');
      const slugContent = fs.readFileSync(slugPath, 'utf-8');

      // Dark mode classes
      expect(slugContent).toContain('prose-invert');
      expect(slugContent).toContain('prose-p:text-neutral-300');
      expect(slugContent).toContain('prose-strong:text-white');

      // Light mode overrides
      expect(slugContent).toContain('[.light_&]:prose-neutral');
      expect(slugContent).toContain('[.light_&]:prose-p:text-neutral-600');
      expect(slugContent).toContain('[.light_&]:prose-strong:text-neutral-900');
    });
  });

  describe('Test 4: Other content pages benefit from typography plugin', () => {
    test('news page uses prose classes', () => {
      const newsPath = path.join(srcPath, 'pages/[lang]/news/[slug].astro');
      const newsContent = fs.readFileSync(newsPath, 'utf-8');

      expect(newsContent).toContain('prose');
      expect(newsContent).toContain('prose-invert');
    });

    test('materials page uses prose classes', () => {
      const materialsPath = path.join(
        srcPath,
        'pages/[lang]/materials/[slug].astro'
      );
      const materialsContent = fs.readFileSync(materialsPath, 'utf-8');

      expect(materialsContent).toContain('prose');
      expect(materialsContent).toContain('prose-invert');
    });
  });

  describe('Test 5: Shiki and typography plugin integration', () => {
    test('Shiki output is compatible with prose styling', async () => {
      const markdown = `Here's inline \`code\` and a block:

\`\`\`javascript
const x = 1;
\`\`\``;

      const html = await parseMarkdown(markdown);

      // Inline code renders as <code>
      expect(html).toContain('<code>code</code>');

      // Block code has Shiki styling
      expect(html).toContain('<pre');
      expect(html).toContain('style=');
      expect(html).toContain('background-color');
    });

    test('typography plugin is configured in global.css', () => {
      const globalCssPath = path.join(srcPath, 'styles/global.css');
      const globalCss = fs.readFileSync(globalCssPath, 'utf-8');

      expect(globalCss).toContain('@plugin "@tailwindcss/typography"');
    });

    test('Shiki is configured in astro.config.mjs', () => {
      const configPath = path.join(webRootPath, 'astro.config.mjs');
      const config = fs.readFileSync(configPath, 'utf-8');

      expect(config).toContain('markdown');
      expect(config).toContain('shikiConfig');
      expect(config).toContain('github-dark');
    });
  });
});
