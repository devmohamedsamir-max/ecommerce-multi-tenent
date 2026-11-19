import { useEffect, useState } from 'react';
import { ArrowUpRight, ExternalLink, Layers, Palette, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribePublishedStores } from '../lib/storeService';
import { TEMPLATE_BLUEPRINTS, TEMPLATE_LIST } from '../lib/templates';
import { ResilientImage } from '../components/ResilientImage';
import type { StoreRecord, TemplateId } from '../types/commerce';

interface PlatformHubPageProps {
  onNavigate: (path: string) => void;
  onStartWithTemplate: (templateId: TemplateId) => void;
}

export function PlatformHubPage({
  onNavigate,
  onStartWithTemplate,
}: PlatformHubPageProps) {
  const { user } = useAuth();
  const [activeHeroTpl, setActiveHeroTpl] = useState<TemplateId>('flagship');
  const [publishedStores, setPublishedStores] = useState<StoreRecord[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);

  useEffect(() => {
    const unsub = subscribePublishedStores(
      (stores) => {
        setPublishedStores(stores);
        setLoadingDirectory(false);
      },
      () => {
        setLoadingDirectory(false);
      }
    );
    return unsub;
  }, []);

  const heroBlueprint = TEMPLATE_BLUEPRINTS[activeHeroTpl];

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#111614]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 bg-[#F7F8F7]/90 backdrop-blur-md border-b border-neutral-200/90">
        <div className="max-w-[1320px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#111614] whitespace-nowrap shrink-0"
          >
            Marque
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a
              href="#templates"
              className="hover:text-[#111614] transition-colors whitespace-nowrap shrink-0"
            >
              Templates
            </a>
            <a
              href="#directory"
              className="hover:text-[#111614] transition-colors whitespace-nowrap shrink-0"
            >
              Live Stores
            </a>
            <a
              href="#architecture"
              className="hover:text-[#111614] transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <button
              type="button"
              onClick={() => onNavigate('/studio')}
              className="hover:text-[#111614] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Merchant Studio
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                user ? onNavigate('/studio') : onStartWithTemplate('flagship')
              }
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#1F3A2E] text-white hover:bg-[#172C22] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user ? 'Open Studio' : 'Launch Store'}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Split Architectural Hero */}
        <section className="max-w-[1320px] mx-auto px-6 pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium text-neutral-500">
                Multi-Tenant Commerce · Three Storefront Engines
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.03] text-[#111614] [text-wrap:balance]">
                Launch a distinctive storefront in minutes.
              </h1>
              <p className="text-base text-neutral-600 leading-relaxed max-w-[44ch]">
                Pick a studio-crafted storefront template, tailor your brand theme, hero story, and product catalog in the Merchant Studio, and publish directly to your own live URL.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onStartWithTemplate(activeHeroTpl)}
                  className="px-6 py-3 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Create Your Store
                </button>
                <a
                  href="#templates"
                  className="px-5 py-3 rounded-lg text-sm font-medium border border-neutral-300 text-neutral-800 hover:bg-white transition-colors whitespace-nowrap"
                >
                  Browse Templates
                </a>
              </div>
            </div>

            {/* Interactive Template Stage */}
            <div className="lg:col-span-7 flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between gap-4 bg-neutral-50/70">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-200/70">
                  {TEMPLATE_LIST.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setActiveHeroTpl(tpl.id)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        activeHeroTpl === tpl.id
                          ? 'bg-white text-neutral-900 shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(`/preview/${heroBlueprint.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1F3A2E] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open Preview</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative flex-1 min-h-[320px] lg:min-h-[390px] overflow-hidden bg-neutral-100">
                <ResilientImage
                  src={heroBlueprint.previewImage}
                  alt={heroBlueprint.name}
                  fallbackTitle={heroBlueprint.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <p className="text-xs text-white/80">
                    {heroBlueprint.category} · /preview/{heroBlueprint.id}
                  </p>
                  <p className="font-display text-2xl font-semibold mt-1">
                    {heroBlueprint.defaultStore.name} — {heroBlueprint.defaultStore.hero.headline}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Template Gallery */}
        <section
          id="templates"
          className="border-t border-neutral-200 bg-white"
        >
          <div className="max-w-[1320px] mx-auto px-6 py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight [text-wrap:balance]">
                  Storefront Templates
                </h2>
                <p className="text-sm text-neutral-600 mt-2 max-w-[54ch]">
                  Three distinct architectural layouts engineered for different product stories. Switch templates anytime without losing your catalog or orders.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-500 tabular-nums">
                03 Templates Ready
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {TEMPLATE_LIST.map((tpl) => (
                <article
                  key={tpl.id}
                  className="rounded-xl border border-neutral-200 bg-[#F7F8F7]/60 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="aspect-[16/10] overflow-hidden border-b border-neutral-200 bg-neutral-100">
                      <ResilientImage
                        src={tpl.previewImage}
                        alt={tpl.name}
                        fallbackTitle={tpl.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <p className="text-xs text-neutral-500">
                        {tpl.category} · {tpl.starterProducts.length} starter items
                      </p>
                      <h3 className="font-display text-xl font-bold tracking-tight">
                        {tpl.name}
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {tpl.summary}
                      </p>
                      <p className="text-xs text-neutral-500 pt-1">
                        {tpl.highlights.join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-neutral-200 bg-white flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/preview/${tpl.id}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 cursor-pointer whitespace-nowrap"
                    >
                      <span>Live Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartWithTemplate(tpl.id)}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Use Template
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Live Cloud Storefronts Directory */}
        <section
          id="directory"
          className="border-t border-neutral-200 bg-[#F7F8F7]"
        >
          <div className="max-w-[1320px] mx-auto px-6 py-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Live Storefronts
                </h2>
                <p className="text-sm text-neutral-600 mt-1.5">
                  Published merchant stores hosted on Marque alongside interactive reference storefronts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStartWithTemplate('editorial')}
                className="text-sm font-medium text-[#1F3A2E] hover:underline self-start sm:self-auto cursor-pointer whitespace-nowrap"
              >
                + Launch yours
              </button>
            </div>

            {loadingDirectory ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                <div className="h-36 rounded-xl bg-neutral-200/80" />
                <div className="h-36 rounded-xl bg-neutral-200/80" />
                <div className="h-36 rounded-xl bg-neutral-200/80" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedStores.map((store) => (
                  <button
                    key={store.slug}
                    type="button"
                    onClick={() => onNavigate(`/s/${store.slug}`)}
                    className="text-left p-6 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 transition-colors flex flex-col justify-between gap-5 cursor-pointer group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-500">
                          {TEMPLATE_BLUEPRINTS[store.templateId].name} · Cloud Store
                        </span>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: store.theme.accentColor }}
                        />
                      </div>
                      <h3 className="font-display text-lg font-semibold group-hover:underline">
                        {store.name}
                      </h3>
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {store.tagline || store.hero.headline}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span>/s/{store.slug}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                    </div>
                  </button>
                ))}

                {/* Always include reference previews when directory is small */}
                {publishedStores.length < 3 &&
                  TEMPLATE_LIST.map((tpl) => (
                    <button
                      key={`ref-${tpl.id}`}
                      type="button"
                      onClick={() => onNavigate(`/preview/${tpl.id}`)}
                      className="text-left p-6 rounded-xl bg-white border border-neutral-200 hover:border-neutral-400 transition-colors flex flex-col justify-between gap-5 cursor-pointer group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-neutral-500">
                            {tpl.name} · Demo Showcase
                          </span>
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: tpl.defaultStore.theme.accentColor,
                            }}
                          />
                        </div>
                        <h3 className="font-display text-lg font-semibold group-hover:underline">
                          {tpl.defaultStore.name}
                        </h3>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {tpl.defaultStore.tagline}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-500">
                        <span>/preview/{tpl.id}</span>
                        <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Platform Capabilities Strip */}
        <section
          id="architecture"
          className="border-t border-neutral-200 bg-white"
        >
          <div className="max-w-[1320px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-3">
              <Layers className="w-5 h-5 text-[#1F3A2E]" strokeWidth={1.75} />
              <h3 className="font-display text-lg font-semibold">
                True Multi-Tenant Isolation
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Every merchant claims a unique URL slug backed by isolated cloud catalogs and private order queues—manage multiple brands from one account.
              </p>
            </div>
            <div className="space-y-3">
              <Palette className="w-5 h-5 text-[#1F3A2E]" strokeWidth={1.75} />
              <h3 className="font-display text-lg font-semibold">
                Live Brand & Template Switching
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Customize accents, surface palettes, hero storytelling, and switch between Alpine Flagship, Atelier Editorial, and Kinetik Minimal anytime.
              </p>
            </div>
            <div className="space-y-3">
              <Store className="w-5 h-5 text-[#1F3A2E]" strokeWidth={1.75} />
              <h3 className="font-display text-lg font-semibold">
                End-to-End Catalog & Orders
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Add products with variants and finishes, toggle availability in real time, and track verified customer orders from pending through delivery.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-[#F7F8F7]">
        <div className="max-w-[1320px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <span className="font-display text-sm font-bold text-neutral-900">
            Marque
          </span>
          <span>Multi-tenant commerce built on distinct storefront craft.</span>
          <span>© 2026 Marque</span>
        </div>
      </footer>
    </div>
  );
}
