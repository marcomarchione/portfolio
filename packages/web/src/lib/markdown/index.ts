/**
 * Server-side Markdown Processing with Shiki Syntax Highlighting
 *
 * This module provides markdown parsing with code syntax highlighting
 * using Shiki with the GitHub Dark theme.
 */

import { Marked, type MarkedExtension, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';

// Supported languages for syntax highlighting
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'json',
  'html',
  'css',
  'sql',
  'yaml',
  'sh',
  'shell',
  'js',
  'ts',
  'py',
  'jsx',
  'tsx',
  'plaintext',
  'text',
] as const;

// Language aliases mapping
const LANGUAGE_ALIASES: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  jsx: 'javascript',
  tsx: 'typescript',
  text: 'plaintext',
};

// Singleton highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create the Shiki highlighter singleton
 */
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript',
        'typescript',
        'python',
        'bash',
        'json',
        'html',
        'css',
        'sql',
        'yaml',
        'plaintext',
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Normalize language identifier
 */
function normalizeLanguage(lang: string | undefined): string {
  if (!lang) return 'plaintext';
  const normalized = lang.toLowerCase().trim();
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * Check if a language is supported
 */
function isLanguageSupported(lang: string): boolean {
  const normalized = normalizeLanguage(lang);
  return [
    'javascript',
    'typescript',
    'python',
    'bash',
    'json',
    'html',
    'css',
    'sql',
    'yaml',
    'plaintext',
  ].includes(normalized);
}

/**
 * Create a marked extension for Shiki syntax highlighting
 */
function createShikiExtension(highlighter: Highlighter): MarkedExtension {
  return {
    renderer: {
      code(token: Tokens.Code): string {
        const lang = normalizeLanguage(token.lang);
        const code = token.text;

        try {
          // Use supported language or fallback to plaintext
          const effectiveLang = isLanguageSupported(lang) ? lang : 'plaintext';

          const highlighted = highlighter.codeToHtml(code, {
            lang: effectiveLang,
            theme: 'github-dark',
          });

          return highlighted;
        } catch {
          // Fallback to basic code block if highlighting fails
          const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
        }
      },
    },
  };
}

/**
 * Parse markdown content with Shiki syntax highlighting
 *
 * @param content - Raw markdown string
 * @returns Promise resolving to HTML string with highlighted code blocks
 */
export async function parseMarkdown(content: string): Promise<string> {
  const highlighter = await getHighlighter();
  const shikiExtension = createShikiExtension(highlighter);

  // Configure marked with Shiki extension
  const markedInstance = new Marked(shikiExtension);

  // Parse markdown to HTML
  const html = await markedInstance.parse(content);

  return html;
}

/**
 * Parse markdown synchronously (requires pre-initialized highlighter)
 * Use parseMarkdown() for async initialization on first call.
 */
export function parseMarkdownSync(
  content: string,
  highlighter: Highlighter
): string {
  const shikiExtension = createShikiExtension(highlighter);
  const markedInstance = new Marked(shikiExtension);
  return markedInstance.parse(content) as string;
}

// Export highlighter getter for advanced use cases
export { getHighlighter };
