import { useState } from 'react';
import { Package } from 'lucide-react';

interface ResilientImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  aspectClass?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  aspectClass = '',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-neutral-200/80 via-neutral-100 to-neutral-200/60 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 text-neutral-500 dark:text-neutral-400 select-none ${aspectClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium px-4 text-center truncate max-w-full">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
