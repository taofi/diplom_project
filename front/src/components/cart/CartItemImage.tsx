'use client';

import { ServerImage } from '@/components/Image';

interface CartItemImageProps {
  src: string | null | undefined;
  alt: string;
}

export function CartItemImage({ src, alt }: CartItemImageProps) {
  return (
    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
      <ServerImage
        src={src}
        alt={alt}
        width={80}
        height={80}
        className="w-full h-full"
      />
    </div>
  );
}
