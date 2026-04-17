'use client';

import { useRef, useState } from 'react';

const initialMarkdown = `## Новый блок описания

Опишите услугу в формате Markdown.

- Уточните основные пункты
- Добавьте сроки и формат сдачи
`;

type ToolbarAction = {
  label: string;
  wrap: [string, string];
};

const toolbarActions: ToolbarAction[] = [
  { label: 'B', wrap: ['**', '**'] },
  { label: 'I', wrap: ['*', '*'] },
  { label: 'H2', wrap: ['## ', ''] },
  { label: 'UL', wrap: ['- ', ''] },
  { label: 'Link', wrap: ['[', '](https://example.com)'] },
];

export function MarkdownEditor() {
  const [value, setValue] = useState(initialMarkdown);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const nextValue =
      value.slice(0, start) +
      prefix +
      selectedText +
      suffix +
      value.slice(end);

    setValue(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPosition = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 pb-12">
      <div className="rounded-2xl border border-secondary/30 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-text mb-3">MD редактор описания</h2>
        <p className="text-text/70 mb-4">
          Используйте форматирование и подготовьте текст, который потом можно сохранить
          в БД на сервере.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {toolbarActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => applyFormat(action.wrap[0], action.wrap[1])}
              className="px-3 py-1.5 rounded-md border border-secondary/40 text-sm font-medium text-text hover:bg-secondary/10 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full min-h-56 rounded-xl border border-secondary/40 p-4 font-mono text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </section>
  );
}
