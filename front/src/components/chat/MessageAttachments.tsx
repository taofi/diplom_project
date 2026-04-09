'use client';

import { useMemo, useState } from 'react';
import { ServerImage } from '@/components/Image';
import { ImageModal } from './ImageModal';
import type { ChatAttachment } from '@/types/chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface MessageAttachmentsProps {
  attachments: ChatAttachment[];
}

function normalizeFileUrl(url: string): string {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleaned = url.replace(/^\/+/, '');
  return `${API_URL}/public/${cleaned}`;
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
  const isText = mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml');

  if (isPdf) {
    return <span className="text-xs font-semibold text-red-600">PDF</span>;
  }
  if (isArchive) {
    return <span className="text-xs font-semibold text-amber-600">ZIP</span>;
  }
  if (isText) {
    return <span className="text-xs font-semibold text-blue-600">TXT</span>;
  }

  return (
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3a1 1 0 011-1h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V8a1 1 0 011-1h2z" />
    </svg>
  );
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { imageAttachments, fileAttachments } = useMemo(() => {
    const images = attachments.filter((item) => item.kind === 'image');
    const files = attachments.filter((item) => item.kind === 'file');
    return { imageAttachments: images, fileAttachments: files };
  }, [attachments]);

  return (
    <div className="space-y-2">
      {imageAttachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {imageAttachments.map((attachment) => (
            <button
              key={`${attachment.url}-${attachment.original_name}`}
              type="button"
              className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(attachment.url)}
            >
              <ServerImage
                src={attachment.url}
                alt={attachment.original_name}
                width={220}
                height={160}
                className="w-full h-36 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="space-y-2">
          {fileAttachments.map((attachment) => (
            <a
              key={`${attachment.url}-${attachment.original_name}`}
              href={normalizeFileUrl(attachment.url)}
              download={attachment.original_name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 text-black"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <FileTypeIcon mimeType={attachment.mime_type} />
                </div>
                <span className="text-sm truncate text-black" title={attachment.original_name}>
                  {attachment.original_name}
                </span>
              </div>
              <span className="text-xs text-gray-500 shrink-0">{formatFileSize(attachment.size)}</span>
            </a>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageModal
          isOpen={Boolean(selectedImage)}
          onClose={() => setSelectedImage(null)}
          src={selectedImage}
          alt="Attachment image"
        />
      )}
    </div>
  );
}
