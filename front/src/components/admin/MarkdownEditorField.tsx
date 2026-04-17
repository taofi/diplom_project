'use client';

import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface MarkdownEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false },
);

export function MarkdownEditorField({
  value,
  onChange,
}: MarkdownEditorFieldProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? '')}
        preview="edit"
        height={280}
      />
    </div>
  );
}
