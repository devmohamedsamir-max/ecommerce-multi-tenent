import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDemoStoreBundle, TEMPLATE_BLUEPRINTS } from '../lib/templates';
import { getStoreBySlug, subscribeStoreProducts } from '../lib/storeService';
import { FlagshipTemplate } from '../templates/FlagshipTemplate';
import { EditorialTemplate } from '../templates/EditorialTemplate';
import { MinimalTemplate } from '../templates/MinimalTemplate';
import { StorefrontBagDrawer } from '../components/StorefrontBagDrawer';
import type {
  BagLineItem,
  ProductRecord,
  StoreRecord,
  TemplateId,
} from '../types/commerce';

interface StorefrontPageProps {
  mode: 'live' | 'preview';
  slugOrTemplate: string;
  onNavigate: (path: string) => void;
  onUseTemplate: (templateId: TemplateId) => void;
}

export function StorefrontPage({
  mode,
  slugOrTemplate,
  onNavigate,
  onUseTemplate,
}: StorefrontPageProps) {
  const { user, authReady } = useAuth();
  const [store, setStore] = useState<StoreRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<BagLineItem[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const isPreview = mode === 'preview';

  // Load either preview blueprint or cloud Firestore store
  useEffect(() => {
    setNotFound(false);
    if (isPreview) {
      const tplId = (
        slugOrTemplate in TEMPLATE_BLUEPRINTS ? slugOrTemplate : 'flagship'
      ) as TemplateId;
      const bundle = getDemoStoreBundle(tplId);
      setStore(bundle.store);
      setProducts(bundle.products);
      setThemeMode(bundle.store.theme.mode);
      setLoading(false);
      return;
    }

    if (!authReady) return;
    let cancelled = false;
    let unsubProducts: (() => void) | null = null;
    setLoading(true);

    (async () => {
      try {
        const fetched = await getStoreBySlug(slugOrTemplate);
        if (cancelled) return;
        if (!fetched) {
          setStore(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        setStore(fetched);
        setThemeMode(fetched.theme.mode);
        setLoading(false);

        const isOwner = Boolean(user && user.uid === fetched.ownerId);
        unsubProducts = subscribeStoreProducts(
          fetched.slug,
          isOwner ? { ownerId: fetched.ownerId } : { publishedOnly: true },
          (items) => {
            if (!cancelled) setProducts(items);
          }
        );
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsubProducts) unsubProducts();
    };
  }, [isPreview, slugOrTemplate, authReady, user]);

  // Load tenant-scoped bag from localStorage
  useEffect(() => {
    if (!store) return;
    try {
      const saved = window.localStorage.getItem(`marque_bag_${store.slug}`);
      if (saved) {
        const parsed = JSON.parse(saved) as BagLineItem[];
        if (Array.isArray(parsed)) setBag(parsed);
      } else {
        setBag([]);
      }
    } catch {
      setBag([]);
    }
  }, [store?.slug]);

  useEffect(() => {
    if (!store) return;
    try {
      window.localStorage.setItem(`marque_bag_${store.slug}`, JSON.stringify(bag));
    } catch {
      // Ignore storage quota errors
    }
  }, [bag, store]);

  const handleAddToBag = (
    product: ProductRecord,
    variantLabel: string,
    customPrice?: number
  ) => {
    const unitPrice = customPrice ?? product.price;
    setBag((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === product.id && item.variant === variantLabel
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          variant: variantLabel,
          unitPrice,
          qty: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
    setBagOpen(true);
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setBag((prev) => {
      const next = [...prev];
      const qty = next[idx].qty + delta;
      if (qty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], qty };
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] text-neutral-900 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl space-y-6 animate-pulse">
          <div className="h-12 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-80 w-full bg-neutral-200 rounded-xl" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-56 bg-neutral-200 rounded-xl" />
            <div className="h-56 bg-neutral-200 rounded-xl" />
            <div className="h-56 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] text-[#111614] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 text-center space-y-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Storefront not found
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The store at <span className="font-mono">/s/{slugOrTemplate}</span> does not exist or is currently set to private draft mode.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] cursor-pointer"
            >
              Explore Templates
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/studio')}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-neutral-300 text-neutral-800 hover:bg-neutral-50 cursor-pointer"
            >
              Merchant Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bagCount = bag.reduce((sum, item) => sum + item.qty, 0);
  const isOwner = Boolean(!isPreview && user && user.uid === store.ownerId);
  const showContextBar = isPreview || isOwner;

  const copyLiveUrl = () => {
    const url = `${window.location.origin}/s/${store.slug}`;
    void navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Slim contextual bar only for Template Preview or Signed-In Store Owner (<=40px) */}
      {showContextBar && (
        <div className="h-10 bg-[#111614] text-[#EFF3F1] px-4 flex items-center justify-between gap-4 text-xs z-[60] border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate(isOwner ? `/studio?store=${store.slug}` : '/')}
              className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isOwner ? 'Merchant Studio' : 'All Templates'}</span>
            </button>
            <span className="text-neutral-600 hidden sm:inline">·</span>
            <span className="truncate text-neutral-300 hidden sm:inline">
              {isPreview
                ? `Live preview of ${TEMPLATE_BLUEPRINTS[store.templateId].name}`
                : `${store.published ? 'Live storefront' : 'Private draft'} at /s/${store.slug}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              <>
                <button
                  type="button"
                  onClick={copyLiveUrl}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/15 hover:bg-white/10 text-xs whitespace-nowrap cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied URL</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/studio?store=${store.slug}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-[#111614] font-medium hover:bg-neutral-200 whitespace-nowrap cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Customize</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onUseTemplate(store.templateId)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-[#111614] font-medium hover:bg-neutral-200 whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Use This Template</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1">
        {store.templateId === 'flagship' && (
          <FlagshipTemplate
            store={store}
            products={products}
            bagCount={bagCount}
            onOpenBag={() => setBagOpen(true)}
            onAddToBag={handleAddToBag}
            themeMode={themeMode}
            onToggleTheme={() =>
              setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
          />
        )}

        {store.templateId === 'editorial' && (
          <EditorialTemplate
            store={store}
            products={products}
            bagCount={bagCount}
            onOpenBag={() => setBagOpen(true)}
            onAddToBag={handleAddToBag}
            themeMode={themeMode}
            onToggleTheme={() =>
              setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
          />
        )}

        {store.templateId === 'minimal' && (
          <MinimalTemplate
            store={store}
            products={products}
            bagCount={bagCount}
            onOpenBag={() => setBagOpen(true)}
            onAddToBag={handleAddToBag}
            themeMode={themeMode}
            onToggleTheme={() =>
              setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
          />
        )}
      </div>

      <StorefrontBagDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        store={store}
        items={bag}
        onUpdateQty={handleUpdateQty}
        onClearBag={() => setBag([])}
        isPreview={isPreview}
        onUseTemplate={() => onUseTemplate(store.templateId)}
        accentColor={store.theme.accentColor}
        isDark={themeMode === 'dark'}
      />
    </div>
  );
}
