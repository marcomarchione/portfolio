/**
 * MarkdownEditor Component Tests
 *
 * Tests for the markdown editor component including initial render,
 * change handling, toolbar rendering, and minimum height constraints.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor', () => {
  it('renders with initial value', () => {
    const initialValue = '# Hello World\n\nThis is markdown content.';

    render(
      <MarkdownEditor
        value={initialValue}
        onChange={() => {}}
      />
    );

    // The editor should contain a textarea with the initial value
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(initialValue);
  });

  it('fires onChange when content changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <MarkdownEditor
        value=""
        onChange={handleChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'New content');

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
    });
  });

  it('renders basic toolbar buttons', () => {
    render(
      <MarkdownEditor
        value=""
        onChange={() => {}}
      />
    );

    // Check that the toolbar container exists with buttons
    // The @uiw/react-md-editor toolbar has specific button elements
    const toolbar = document.querySelector('.w-md-editor-toolbar');
    expect(toolbar).toBeInTheDocument();

    // Check for toolbar buttons (bold, italic, etc.)
    const buttons = toolbar?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThan(0);
  });

  it('applies minimum height constraint', () => {
    const minHeight = 400;

    render(
      <MarkdownEditor
        value=""
        onChange={() => {}}
        minHeight={minHeight}
      />
    );

    // The editor container should have the min-height style applied
    const editorContainer = document.querySelector('.w-md-editor');
    expect(editorContainer).toBeInTheDocument();

    // Check that the container has proper height styling
    // The component sets min-height via inline style or container style
    const containerStyle = window.getComputedStyle(editorContainer as Element);
    const editorWrapper = document.querySelector('[data-testid="markdown-editor"]');
    expect(editorWrapper).toHaveStyle({ minHeight: `${minHeight}px` });
  });
});
