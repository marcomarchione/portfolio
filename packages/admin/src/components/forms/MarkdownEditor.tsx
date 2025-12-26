/**
 * Markdown Editor Component
 *
 * A developer-focused markdown editor with syntax highlighting and
 * essential formatting toolbar. Uses @uiw/react-md-editor for core
 * functionality with custom styling to match the admin design system.
 */
import MDEditor, { commands } from '@uiw/react-md-editor';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  /** Current markdown content */
  value: string;
  /** Callback fired when content changes */
  onChange: (value: string) => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Minimum height of the editor in pixels (default: 300) */
  minHeight?: number;
}

/**
 * Custom toolbar commands for developer-focused markdown editing.
 * Includes: bold, italic, headers (h1-h3), links, lists (ul, ol), code block
 */
const toolbarCommands = [
  commands.bold,
  commands.italic,
  commands.divider,
  commands.title1,
  commands.title2,
  commands.title3,
  commands.divider,
  commands.link,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.divider,
  commands.code,
  commands.codeBlock,
];

/**
 * Markdown editor with syntax highlighting and formatting toolbar.
 * Optimized for developer use with raw markdown editing focus.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content in markdown...',
  minHeight = 300,
}: MarkdownEditorProps) {
  const handleChange = (newValue: string | undefined) => {
    onChange(newValue ?? '');
  };

  return (
    <div
      data-testid="markdown-editor"
      data-color-mode="dark"
      className="markdown-editor-wrapper"
      style={{ minHeight: `${minHeight}px` }}
    >
      <MDEditor
        value={value}
        onChange={handleChange}
        preview="edit"
        height={minHeight}
        commands={toolbarCommands}
        textareaProps={{
          placeholder,
        }}
        visibleDragbar={true}
      />
    </div>
  );
}
