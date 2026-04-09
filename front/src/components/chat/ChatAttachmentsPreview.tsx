'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';

interface ChatAttachmentsPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType.includes('pdf');
  const isArchive = mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z');

  if (isPdf) {
    return <span className="text-xs font-semibold text-red-600">PDF</span>;
  }
  if (isArchive) {
    return <span className="text-xs font-semibold text-amber-600">ZIP</span>;
  }

  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
    </svg>
  );
}

export function ChatAttachmentsPreview({ files, onRemove }: ChatAttachmentsPreviewProps) {
  const previewUrls = useMemo(() => {
    return files.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {files.map((file, index) => {
          const isImage = file.type.startsWith('image/');
          const previewUrl = previewUrls[index];

          return (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="relative border border-gray-200 rounded-lg bg-gray-50 p-2"
            >
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                aria-label="Remove attachment"
              >
                ×
              </button>

              {isImage && previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={file.name}
                  width={240}
                  height={96}
                  unoptimized
                  className="w-full h-24 object-cover rounded"
                />
              ) : (
                <div className="flex items-center gap-2 h-24">
                  <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center">
                    <FileTypeIcon mimeType={file.type} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              )}

              {isImage && (
                <div className="mt-1">
                  <p className="text-xs text-gray-700 truncate" title={file.name}>{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
