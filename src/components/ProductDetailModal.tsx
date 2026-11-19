import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import type { ProductRecord } from '../types/commerce';

interface ProductDetailModalProps {
  product: ProductRecord | null;
  onClose: () => void;
  onAddToBag: (product: ProductRecord, variantLabel: string) => void;
  accentColor: string;
  isDark: boolean;
  serifTitle?: boolean;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToBag,
  accentColor,
  isDark,
  serifTitle = false,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] || 'Standard');
      setSelectedFinish(product.finishes[0] || '');
    }
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && product) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const combinedVariant = [selectedFinish, selectedVariant]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className={`relative z-10 w-full max-w-4xl rounded-xl border overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-2xl max-h-[90vh] overflow-y-auto ${
          isDark
            ? 'bg-[#161817] text-[#F3F4F3] border-white/12'
            : 'bg-white text-[#141716] border-neutral-200'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className={`absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            isDark
              ? 'bg-black/50 text-white hover:bg-black/75'
              : 'bg-white/90 text-neutral-900 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Gallery */}
        <div
          className={`aspect-[4/3] md:aspect-auto md:min-h-[460px] ${
            isDark ? 'bg-white/5' : 'bg-neutral-100'
          }`}
        >
          <ResilientImage
            src={product.imageUrl}
            alt={product.name}
            fallbackTitle={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="p-7 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <p
                className={`text-xs tracking-wide ${
                  isDark ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {product.category} · {product.inStock ? 'In Stock' : 'Sold Out'}
              </p>
              <h2
                className={`text-2xl sm:text-3xl font-semibold leading-tight ${
                  serifTitle ? 'font-serif text-3xl sm:text-4xl' : 'font-display tracking-tight'
                }`}
              >
                {product.name}
              </h2>
              <p className="font-mono text-xl font-medium tabular-nums">
                ${product.price.toFixed(2)}
              </p>
            </div>

            {product.description && (
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? 'text-neutral-300' : 'text-neutral-600'
                }`}
              >
                {product.description}
              </p>
            )}

            {product.finishes.length > 0 && (
              <div className="space-y-2">
                <span
                  className={`block text-xs font-medium ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Finish
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.finishes.map((fin) => {
                    const active = selectedFinish === fin;
                    return (
                      <button
                        key={fin}
                        type="button"
                        onClick={() => setSelectedFinish(fin)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'text-white border-transparent'
                            : isDark
                            ? 'border-white/15 text-neutral-300 hover:border-white/30'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                        style={active ? { backgroundColor: accentColor } : undefined}
                      >
                        {fin}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.variants.length > 0 && (
              <div className="space-y-2">
                <span
                  className={`block text-xs font-medium ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  Edition / Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const active = selectedVariant === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'text-white border-transparent'
                            : isDark
                            ? 'border-white/15 text-neutral-300 hover:border-white/30'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
                        }`}
                        style={active ? { backgroundColor: accentColor } : undefined}
                      >
                        {variant}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-200/70 dark:border-white/10 space-y-3">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={() => {
                onAddToBag(product, combinedVariant || 'Standard');
                onClose();
              }}
              className="w-full py-3.5 px-5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {product.inStock
                ? `Add to Bag — $${product.price.toFixed(2)}`
                : 'Currently Unavailable'}
            </button>
            <p
              className={`text-xs text-center ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Complimentary standard shipping · 30-day returns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
