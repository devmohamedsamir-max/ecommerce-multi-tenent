import { useMemo, useState } from 'react';
import { ArrowRight, Moon, ShoppingBag, Sun } from 'lucide-react';
import { SURFACE_PRESETS } from '../lib/templates';
import { ResilientImage } from '../components/ResilientImage';
import { ProductDetailModal } from '../components/ProductDetailModal';
import type { ProductRecord, StoreRecord } from '../types/commerce';

interface EditorialTemplateProps {
  store: StoreRecord;
  products: ProductRecord[];
  bagCount: number;
  onOpenBag: () => void;
  onAddToBag: (product: ProductRecord, variantLabel: string) => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function EditorialTemplate({
  store,
  products,
  bagCount,
  onOpenBag,
  onAddToBag,
  themeMode,
  onToggleTheme,
}: EditorialTemplateProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [inspectProduct, setInspectProduct] = useState<ProductRecord | null>(null);

  const isDark = themeMode === 'dark';
  const preset = SURFACE_PRESETS[store.theme.surfacePreset] || SURFACE_PRESETS.paper;
  const palette = isDark ? preset.dark : preset.light;

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
      }}
    >
      {/* 3-Zone Top Bar Contract */}
      <header
        className="sticky top-0 z-40 h-16 border-b backdrop-blur-md"
        style={{
          backgroundColor: isDark ? 'rgba(20, 19, 18, 0.85)' : 'rgba(248, 246, 242, 0.88)',
          borderColor: palette.border,
        }}
      >
        <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          <a
            href="#editorial-hero"
            className="font-serif text-2xl font-semibold tracking-tight whitespace-nowrap shrink-0"
          >
            {store.name}
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a
              href="#editorial-collection"
              className="hover:opacity-100 opacity-75 transition-opacity whitespace-nowrap shrink-0"
            >
              Collection
            </a>
            <a
              href="#editorial-story"
              className="hover:opacity-100 opacity-75 transition-opacity whitespace-nowrap shrink-0"
            >
              Atelier
            </a>
            <a
              href="#editorial-footer"
              className="hover:opacity-100 opacity-75 transition-opacity whitespace-nowrap shrink-0"
            >
              Shipping
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
              style={{ borderColor: palette.border }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onOpenBag}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-full text-white whitespace-nowrap shrink-0 cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: store.theme.accentColor }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="font-mono tabular-nums">({bagCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Split Editorial Campaign Hero */}
        <section id="editorial-hero" className="max-w-[1280px] mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
              <p className="text-xs tracking-wide" style={{ color: palette.muted }}>
                {store.name} · Seasonal Edition
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.6rem] font-semibold leading-[1.04] tracking-tight [text-wrap:balance]">
                {store.hero.headline}
              </h1>
              <p
                className="text-base leading-relaxed max-w-[42ch]"
                style={{ color: palette.muted }}
              >
                {store.hero.subheadline}
              </p>
              <div className="pt-2">
                <a
                  href="#editorial-collection"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: store.theme.accentColor }}
                >
                  <span>{store.hero.ctaLabel || 'Explore Collection'}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div
                className="w-full h-full min-h-[340px] lg:min-h-[480px] rounded-xl overflow-hidden border"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                <ResilientImage
                  src={store.hero.imageUrl}
                  alt={store.hero.headline}
                  fallbackTitle={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured 3-Column Uniform Product Catalog */}
        <section
          id="editorial-collection"
          className="max-w-[1280px] mx-auto px-6 py-14 lg:py-20 border-t"
          style={{ borderColor: palette.border }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
                Curated Collection
              </h2>
              <p className="text-sm mt-2" style={{ color: palette.muted }}>
                {products.length} {products.length === 1 ? 'object' : 'objects'} crafted in small runs.
              </p>
            </div>

            {categories.length > 1 && (
              <div
                className="inline-flex items-center gap-1 p-1 rounded-lg border self-start"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                {categories.map((cat) => {
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer"
                      style={{
                        backgroundColor: active ? palette.bg : 'transparent',
                        color: active ? palette.text : palette.muted,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div
              className="rounded-xl border p-12 text-center"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <p className="font-serif text-xl">No objects in this category yet.</p>
              <p className="text-sm mt-1" style={{ color: palette.muted }}>
                Add products from the Merchant Studio to populate this storefront.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setInspectProduct(product)}
                      className="block w-full aspect-[4/3] rounded-xl overflow-hidden border text-left cursor-pointer"
                      style={{
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      }}
                    >
                      <ResilientImage
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackTitle={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </button>
                    <div className="pt-4 space-y-1.5">
                      <p className="text-xs" style={{ color: palette.muted }}>
                        {product.category} · {product.inStock ? 'In Stock' : 'Sold Out'}
                      </p>
                      <div className="flex items-baseline justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setInspectProduct(product)}
                          className="font-serif text-xl font-semibold text-left hover:underline cursor-pointer"
                        >
                          {product.name}
                        </button>
                        <span className="font-mono text-sm font-medium tabular-nums shrink-0">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed line-clamp-2"
                        style={{ color: palette.muted }}
                      >
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: palette.border }}>
                    <button
                      type="button"
                      onClick={() => setInspectProduct(product)}
                      className="text-xs font-medium underline underline-offset-4 opacity-80 hover:opacity-100 cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      disabled={!product.inStock}
                      onClick={() =>
                        onAddToBag(
                          product,
                          [product.finishes[0], product.variants[0]]
                            .filter(Boolean)
                            .join(' · ') || 'Standard'
                        )
                      }
                      className="px-4 py-2 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                      style={{ backgroundColor: store.theme.accentColor }}
                    >
                      {product.inStock ? 'Quick Add' : 'Sold Out'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Craftsmanship Story Band */}
        <section
          id="editorial-story"
          className="border-t"
          style={{
            backgroundColor: palette.surface,
            borderColor: palette.border,
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs tracking-wide" style={{ color: palette.muted }}>
                Material Philosophy
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">
                {store.story.title || 'Crafted in numbered seasonal editions.'}
              </h2>
              <p
                className="text-base leading-relaxed max-w-[58ch]"
                style={{ color: palette.muted }}
              >
                {store.story.body}
              </p>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-6 pt-6 lg:pt-0 lg:pl-8 lg:border-l" style={{ borderColor: palette.border }}>
              <div>
                <p className="font-mono text-3xl font-semibold tabular-nums">
                  {store.story.metricOneValue || '100%'}
                </p>
                <p className="text-xs mt-1.5" style={{ color: palette.muted }}>
                  {store.story.metricOneLabel || 'Traceable materials'}
                </p>
              </div>
              <div>
                <p className="font-mono text-3xl font-semibold tabular-nums">
                  {store.story.metricTwoValue || '240'}
                </p>
                <p className="text-xs mt-1.5" style={{ color: palette.muted }}>
                  {store.story.metricTwoLabel || 'Pieces per release'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="editorial-footer"
        className="border-t"
        style={{ borderColor: palette.border }}
      >
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: palette.muted }}>
          <span className="font-serif text-base font-semibold" style={{ color: palette.text }}>
            {store.name}
          </span>
          <span>{store.tagline}</span>
          <span>© 2026 {store.name}</span>
        </div>
      </footer>

      <ProductDetailModal
        product={inspectProduct}
        onClose={() => setInspectProduct(null)}
        onAddToBag={onAddToBag}
        accentColor={store.theme.accentColor}
        isDark={isDark}
        serifTitle
      />
    </div>
  );
}
