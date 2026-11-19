import { useMemo, useState } from 'react';
import { ArrowDownRight, Moon, Search, ShoppingBag, Sun } from 'lucide-react';
import { SURFACE_PRESETS } from '../lib/templates';
import { ResilientImage } from '../components/ResilientImage';
import { ProductDetailModal } from '../components/ProductDetailModal';
import type { ProductRecord, StoreRecord } from '../types/commerce';

interface MinimalTemplateProps {
  store: StoreRecord;
  products: ProductRecord[];
  bagCount: number;
  onOpenBag: () => void;
  onAddToBag: (product: ProductRecord, variantLabel: string) => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function MinimalTemplate({
  store,
  products,
  bagCount,
  onOpenBag,
  onAddToBag,
  themeMode,
  onToggleTheme,
}: MinimalTemplateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [inspectProduct, setInspectProduct] = useState<ProductRecord | null>(null);

  const isDark = themeMode === 'dark';
  const preset = SURFACE_PRESETS[store.theme.surfacePreset] || SURFACE_PRESETS.chalk;
  const palette = isDark ? preset.dark : preset.light;

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((prod) => {
      const catMatch = activeCategory === 'All' || prod.category === activeCategory;
      const queryMatch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q) ||
        prod.description.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [products, activeCategory, searchQuery]);

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
          backgroundColor: isDark ? 'rgba(15, 17, 21, 0.86)' : 'rgba(250, 250, 250, 0.9)',
          borderColor: palette.border,
        }}
      >
        <div className="max-w-[1320px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          <a
            href="#minimal-hero"
            className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            {store.name}
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a
              href="#minimal-catalog"
              className="opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap shrink-0"
            >
              Catalog
            </a>
            <a
              href="#minimal-engineering"
              className="opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap shrink-0"
            >
              Engineering
            </a>
            <a
              href="#minimal-footer"
              className="opacity-75 hover:opacity-100 transition-opacity whitespace-nowrap shrink-0"
            >
              Support
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer"
              style={{ borderColor: palette.border }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onOpenBag}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: store.theme.accentColor }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="font-mono tabular-nums">{bagCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Structured Typographic Hero */}
        <section id="minimal-hero" className="max-w-[1320px] mx-auto px-6 pt-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
            <div className="lg:col-span-8">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.02] [text-wrap:balance]">
                {store.hero.headline}
              </h1>
            </div>
            <div className="lg:col-span-4 space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
                {store.hero.subheadline}
              </p>
              <a
                href="#minimal-catalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white whitespace-nowrap transition-opacity hover:opacity-90"
                style={{ backgroundColor: store.theme.accentColor }}
              >
                <span>{store.hero.ctaLabel || 'Browse Catalog'}</span>
                <ArrowDownRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div
            className="w-full aspect-[16/9] max-h-[540px] rounded-xl overflow-hidden border"
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
        </section>

        {/* Search + Segmented Category Filter + Hairline 3-Column Grid */}
        <section
          id="minimal-catalog"
          className="max-w-[1320px] mx-auto px-6 py-14 border-t"
          style={{ borderColor: palette.border }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer"
                    style={{
                      backgroundColor: active ? store.theme.accentColor : palette.surface,
                      color: active ? '#FFFFFF' : palette.text,
                      borderColor: active ? 'transparent' : palette.border,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: palette.muted }}
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hardware & models..."
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  color: palette.text,
                }}
              />
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div
              className="rounded-xl border p-12 text-center"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <p className="font-display text-lg font-semibold">No matching items</p>
              <p className="text-sm mt-1" style={{ color: palette.muted }}>
                Try clearing your search or switching category filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-xl border overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  }}
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setInspectProduct(product)}
                      className="block w-full aspect-[4/3] overflow-hidden border-b cursor-pointer"
                      style={{ borderColor: palette.border }}
                    >
                      <ResilientImage
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackTitle={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                      />
                    </button>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono" style={{ color: palette.muted }}>
                        <span>{product.category}</span>
                        <span>{product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectProduct(product)}
                        className="font-display text-lg font-semibold text-left hover:underline cursor-pointer block"
                      >
                        {product.name}
                      </button>
                      <p
                        className="text-xs leading-relaxed line-clamp-2"
                        style={{ color: palette.muted }}
                      >
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className="px-5 py-4 border-t flex items-center justify-between gap-3"
                    style={{ borderColor: palette.border }}
                  >
                    <div>
                      <span className="font-mono text-base font-semibold tabular-nums block">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[11px]" style={{ color: palette.muted }}>
                        {product.variants.join(' / ')}
                      </span>
                    </div>
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
                      className="px-4 py-2 rounded-lg text-xs font-medium text-white cursor-pointer disabled:opacity-45 whitespace-nowrap"
                      style={{ backgroundColor: store.theme.accentColor }}
                    >
                      Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Engineering Specifications Band */}
        <section
          id="minimal-engineering"
          className="border-t"
          style={{ borderColor: palette.border }}
        >
          <div className="max-w-[1320px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-3">
              <p className="font-mono text-xs" style={{ color: palette.muted }}>
                ENGINEERING STANDARD
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight [text-wrap:balance]">
                {store.story.title || 'Serviceable by design.'}
              </h2>
              <p className="text-sm leading-relaxed max-w-[56ch]" style={{ color: palette.muted }}>
                {store.story.body}
              </p>
            </div>
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div
                className="p-6 rounded-xl border"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                <p className="font-mono text-3xl font-bold tabular-nums">
                  {store.story.metricOneValue || '0.02 mm'}
                </p>
                <p className="text-xs mt-2" style={{ color: palette.muted }}>
                  {store.story.metricOneLabel || 'Machining tolerance'}
                </p>
              </div>
              <div
                className="p-6 rounded-xl border"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                }}
              >
                <p className="font-mono text-3xl font-bold tabular-nums">
                  {store.story.metricTwoValue || '10 yr'}
                </p>
                <p className="text-xs mt-2" style={{ color: palette.muted }}>
                  {store.story.metricTwoLabel || 'Hardware guarantee'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="minimal-footer"
        className="border-t"
        style={{ borderColor: palette.border }}
      >
        <div className="max-w-[1320px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: palette.muted }}>
          <span className="font-display font-bold text-sm" style={{ color: palette.text }}>
            {store.name}
          </span>
          <span>{store.tagline}</span>
          <span className="font-mono">© 2026 {store.name}</span>
        </div>
      </footer>

      <ProductDetailModal
        product={inspectProduct}
        onClose={() => setInspectProduct(null)}
        onAddToBag={onAddToBag}
        accentColor={store.theme.accentColor}
        isDark={isDark}
      />
    </div>
  );
}
