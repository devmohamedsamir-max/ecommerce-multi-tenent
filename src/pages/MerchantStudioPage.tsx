import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createProduct,
  deleteProduct,
  deleteStoreWithProducts,
  subscribeMerchantStores,
  subscribeStoreOrders,
  subscribeStoreProducts,
  toggleStorePublished,
  updateOrderStatus,
  updateProduct,
  updateStoreBrandAndTheme,
  updateStoreHeroAndStory,
  type ProductInput,
} from '../lib/storeService';
import {
  ACCENT_SWATCHES,
  STUDIO_PHOTO_LIBRARY,
  SURFACE_PRESETS,
  TEMPLATE_BLUEPRINTS,
  TEMPLATE_LIST,
} from '../lib/templates';
import { ResilientImage } from '../components/ResilientImage';
import {
  SCHEMA_LIMITS,
  type FontPairing,
  type OrderRecord,
  type OrderStatus,
  type ProductRecord,
  type StoreHero,
  type StoreRecord,
  type StoreStory,
  type StoreTheme,
  type SurfacePreset,
  type TemplateId,
} from '../types/commerce';

type StudioTab = 'overview' | 'brand' | 'hero' | 'products' | 'orders';

interface MerchantStudioPageProps {
  initialStoreSlug?: string | null;
  onNavigate: (path: string) => void;
  onOpenCreateModal: (templateId?: TemplateId) => void;
}

const EMPTY_PRODUCT_FORM: ProductInput = {
  name: '',
  category: 'Signature',
  description: '',
  price: 48,
  imageUrl: STUDIO_PHOTO_LIBRARY[0].url,
  variants: ['Standard'],
  finishes: [],
  inStock: true,
  featured: false,
};

export function MerchantStudioPage({
  initialStoreSlug,
  onNavigate,
  onOpenCreateModal,
}: MerchantStudioPageProps) {
  const { user, authReady, signingIn, signInWithGoogle, signOutUser, authError } =
    useAuth();
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(
    initialStoreSlug || null
  );
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Brand & Theme form state
  const [brandName, setBrandName] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [brandTemplate, setBrandTemplate] = useState<TemplateId>('flagship');
  const [brandTheme, setBrandTheme] = useState<StoreTheme>({
    mode: 'light',
    accentColor: '#3D5740',
    surfacePreset: 'mineral',
    fontPairing: 'modern',
  });
  const [savingBrand, setSavingBrand] = useState(false);
  const [confirmDeleteStore, setConfirmDeleteStore] = useState(false);

  // Hero & Story form state
  const [heroForm, setHeroForm] = useState<StoreHero>({
    headline: '',
    subheadline: '',
    ctaLabel: '',
    imageUrl: '',
  });
  const [storyForm, setStoryForm] = useState<StoreStory>({
    title: '',
    body: '',
    metricOneValue: '',
    metricOneLabel: '',
    metricTwoValue: '',
    metricTwoLabel: '',
  });
  const [savingHero, setSavingHero] = useState(false);

  // Products state
  const [productSearch, setProductSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductInput>(EMPTY_PRODUCT_FORM);
  const [variantsInput, setVariantsInput] = useState('Standard');
  const [finishesInput, setFinishesInput] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Orders filter
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  useEffect(() => {
    if (initialStoreSlug) {
      setActiveSlug(initialStoreSlug);
    }
  }, [initialStoreSlug]);

  // Subscribe to merchant's stores
  useEffect(() => {
    if (!authReady || !user) {
      setStores([]);
      setStoresLoaded(true);
      return;
    }
    setStoresLoaded(false);
    const unsub = subscribeMerchantStores(
      user.uid,
      (list) => {
        setStores(list);
        setStoresLoaded(true);
        setActiveSlug((prev) => {
          if (prev && list.some((s) => s.slug === prev)) return prev;
          if (initialStoreSlug && list.some((s) => s.slug === initialStoreSlug)) {
            return initialStoreSlug;
          }
          return list[0]?.slug ?? null;
        });
      },
      () => {
        setStoresLoaded(true);
      }
    );
    return unsub;
  }, [authReady, user, initialStoreSlug]);

  const activeStore = useMemo(
    () => stores.find((s) => s.slug === activeSlug) || null,
    [stores, activeSlug]
  );

  // Sync form state whenever activeStore updates
  useEffect(() => {
    if (!activeStore) return;
    setBrandName(activeStore.name);
    setBrandTagline(activeStore.tagline);
    setBrandTemplate(activeStore.templateId);
    setBrandTheme(activeStore.theme);
    setHeroForm(activeStore.hero);
    setStoryForm(activeStore.story);
    setConfirmDeleteStore(false);
  }, [activeStore]);

  // Subscribe to active store's products & orders
  useEffect(() => {
    if (!user || !activeStore) {
      setProducts([]);
      setOrders([]);
      return;
    }
    const unsubProducts = subscribeStoreProducts(
      activeStore.slug,
      { ownerId: user.uid },
      setProducts
    );
    const unsubOrders = subscribeStoreOrders(
      activeStore.slug,
      user.uid,
      setOrders
    );
    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [user, activeStore?.slug]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const openNewProductModal = () => {
    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      imageUrl: STUDIO_PHOTO_LIBRARY[0].url,
    });
    setVariantsInput('Standard');
    setFinishesInput('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: ProductRecord) => {
    setEditingProductId(prod.id);
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      price: prod.price,
      imageUrl: prod.imageUrl,
      variants: prod.variants,
      finishes: prod.finishes,
      inStock: prod.inStock,
      featured: prod.featured,
    });
    setVariantsInput(prod.variants.join(', '));
    setFinishesInput(prod.finishes.join(', '));
    setProductModalOpen(true);
  };

  const handleSaveBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    setSavingBrand(true);
    try {
      await updateStoreBrandAndTheme(activeStore.slug, {
        name: brandName,
        tagline: brandTagline,
        templateId: brandTemplate,
        theme: brandTheme,
      });
      notify('Brand & theme saved to live storefront.');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleSaveHero = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    setSavingHero(true);
    try {
      await updateStoreHeroAndStory(activeStore.slug, heroForm, storyForm);
      notify('Hero & story copy updated.');
    } finally {
      setSavingHero(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeStore || !user) return;
    setSavingProduct(true);
    const variants = variantsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finishes = finishesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: ProductInput = {
      ...productForm,
      variants: variants.length > 0 ? variants : ['Standard'],
      finishes,
    };
    try {
      if (editingProductId) {
        await updateProduct(activeStore.slug, editingProductId, payload);
        notify('Product updated.');
      } else {
        await createProduct(
          activeStore.slug,
          user.uid,
          activeStore.published,
          payload
        );
        notify('Product added to catalog.');
      }
      setProductModalOpen(false);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleAdvanceOrder = async (orderId: string, nextStatus: OrderStatus) => {
    if (!activeStore) return;
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(activeStore.slug, orderId, nextStatus);
      notify(`Order marked ${nextStatus}.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center p-6">
        <div className="text-sm text-neutral-500">Connecting to Marque Studio...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] text-[#111614] flex flex-col">
        <header className="h-16 border-b border-neutral-200 px-6 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="font-display text-lg font-bold tracking-tight cursor-pointer"
          >
            Marque
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Templates</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500">
                Merchant Studio
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Sign in to manage your storefronts
              </h1>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Launch multi-tenant stores, switch templates, edit brand themes and product catalogs, and fulfill incoming customer orders.
              </p>
            </div>
            {authError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {authError}
              </p>
            )}
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void signInWithGoogle()}
              className="w-full py-3 px-4 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {signingIn ? 'Opening Google Sign-In...' : 'Continue with Google'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const navItems: { id: StudioTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'brand', label: 'Brand & Theme', icon: Palette },
    { id: 'hero', label: 'Hero & Story', icon: ImageIcon },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  const liveStoreUrl = activeStore
    ? `${window.location.origin}/s/${activeStore.slug}`
    : '';

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#111614] flex flex-col lg:flex-row">
      {/* Left 256px Workspace Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-neutral-200 flex flex-col shrink-0">
        <div className="h-16 px-5 border-b border-neutral-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="font-display text-base font-bold tracking-tight cursor-pointer"
          >
            Marque Studio
          </button>
          <button
            type="button"
            onClick={() => onOpenCreateModal()}
            title="Launch new store"
            className="w-8 h-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
            aria-label="Create new store"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Store Switcher */}
        <div className="p-4 border-b border-neutral-200 space-y-2">
          <label className="block text-[11px] font-medium text-neutral-500">
            Active Storefront
          </label>
          {stores.length > 0 ? (
            <select
              value={activeStore?.slug || ''}
              onChange={(e) => setActiveSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
            >
              {stores.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} (/s/{s.slug})
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => onOpenCreateModal('flagship')}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] cursor-pointer"
            >
              + Create First Store
            </button>
          )}
        </div>

        {/* Section Nav */}
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!activeStore}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 ${
                  active
                    ? 'bg-[#1F3A2E]/10 text-[#1F3A2E]'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'products' && activeStore && (
                  <span className="ml-auto font-mono text-xs text-neutral-400 tabular-nums">
                    {products.length}
                  </span>
                )}
                {item.id === 'orders' && activeStore && (
                  <span className="ml-auto font-mono text-xs text-neutral-400 tabular-nums">
                    {orders.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Account Footer */}
        <div className="p-4 border-t border-neutral-200 hidden lg:flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {user.displayName || 'Merchant'}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOutUser()}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="text-sm text-neutral-500 flex items-center gap-2 truncate">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-neutral-900 cursor-pointer whitespace-nowrap"
            >
              Hub
            </button>
            <span>/</span>
            <span className="text-neutral-900 font-medium truncate">
              {activeStore ? activeStore.name : 'New Workspace'}
            </span>
            {activeStore && (
              <>
                <span className="hidden sm:inline">/</span>
                <span className="capitalize hidden sm:inline">{activeTab}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeStore && (
              <button
                type="button"
                onClick={() => onNavigate(`/s/${activeStore.slug}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>View Live Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {!storesLoaded ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 w-64 bg-neutral-200 rounded-lg" />
              <div className="h-44 w-full bg-neutral-200 rounded-xl" />
            </div>
          ) : !activeStore ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center max-w-lg mx-auto my-12 space-y-4">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Launch your first storefront
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Pick from Alpine Flagship, Atelier Editorial, or Kinetik Minimal. We will seed starter products so you can preview and customize right away.
              </p>
              <button
                type="button"
                onClick={() => onOpenCreateModal('flagship')}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] cursor-pointer"
              >
                Create Storefront
              </button>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500">
                        {TEMPLATE_BLUEPRINTS[activeStore.templateId].name} ·{' '}
                        {activeStore.published ? 'Published Live' : 'Private Draft'}
                      </p>
                      <h1 className="font-display text-2xl font-bold tracking-tight">
                        {activeStore.name}
                      </h1>
                      <p className="font-mono text-xs text-neutral-500 break-all">
                        {liveStoreUrl}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(liveStoreUrl);
                          setCopiedUrl(true);
                          window.setTimeout(() => setCopiedUrl(false), 1800);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-neutral-200 hover:bg-neutral-50 cursor-pointer whitespace-nowrap"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleStorePublished(
                            activeStore.slug,
                            !activeStore.published,
                            user.uid
                          );
                          notify(
                            activeStore.published
                              ? 'Storefront moved to private draft.'
                              : 'Storefront published live.'
                          );
                        }}
                        className="px-3.5 py-2 rounded-lg text-xs font-medium border border-neutral-200 hover:bg-neutral-50 cursor-pointer whitespace-nowrap"
                      >
                        {activeStore.published ? 'Unpublish' : 'Publish Live'}
                      </button>
                    </div>
                  </div>

                  {/* Clean Flat KPI Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-neutral-200 rounded-xl p-5">
                      <p className="text-xs text-neutral-500">Catalog Products</p>
                      <p className="font-mono text-3xl font-bold mt-2 tabular-nums">
                        {products.length}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {products.filter((p) => p.inStock).length} in stock
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-5">
                      <p className="text-xs text-neutral-500">Total Orders</p>
                      <p className="font-mono text-3xl font-bold mt-2 tabular-nums">
                        {orders.length}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {orders.filter((o) => o.status === 'pending').length} pending fulfillment
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-5">
                      <p className="text-xs text-neutral-500">Gross Revenue</p>
                      <p className="font-mono text-3xl font-bold mt-2 tabular-nums">
                        ${totalRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Verified storefront orders
                      </p>
                    </div>
                  </div>

                  {/* Quick Jump Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('brand')}
                      className="text-left p-5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-semibold">Customize Brand & Template</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Switch between Flagship, Editorial, and Minimal or refine palette tokens.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('hero')}
                      className="text-left p-5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-semibold">Edit Hero & Story</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Update campaign headlines, photography, and craftsmanship metrics.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('products');
                        openNewProductModal();
                      }}
                      className="text-left p-5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-400 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-semibold">Add Catalog Product</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Publish new products with sizes, finishes, pricing, and studio photos.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* BRAND & THEME TAB */}
              {activeTab === 'brand' && (
                <form onSubmit={handleSaveBrand} className="space-y-6">
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
                    <div>
                      <h2 className="font-display text-xl font-bold">
                        Brand Identity & Template
                      </h2>
                      <p className="text-xs text-neutral-500 mt-1">
                        Changes apply immediately to /s/{activeStore.slug}.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                          Brand name
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={SCHEMA_LIMITS.storeNameMax}
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                          Tagline
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.taglineMax}
                          value={brandTagline}
                          onChange={(e) => setBrandTagline(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>
                    </div>

                    {/* Template Switcher */}
                    <div className="space-y-2.5">
                      <span className="block text-xs font-medium text-neutral-700">
                        Active storefront template
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {TEMPLATE_LIST.map((tpl) => {
                          const selected = brandTemplate === tpl.id;
                          return (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => setBrandTemplate(tpl.id)}
                              className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#1F3A2E] bg-[#1F3A2E]/5'
                                  : 'border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <p className="text-sm font-semibold">{tpl.name}</p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {tpl.category}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Theme Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-neutral-100">
                      <div className="space-y-2.5">
                        <span className="block text-xs font-medium text-neutral-700">
                          Accent color
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {ACCENT_SWATCHES.map((sw) => (
                            <button
                              key={sw.hex}
                              type="button"
                              onClick={() =>
                                setBrandTheme((t) => ({ ...t, accentColor: sw.hex }))
                              }
                              title={sw.name}
                              className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                                brandTheme.accentColor.toLowerCase() ===
                                sw.hex.toLowerCase()
                                  ? 'border-neutral-900 scale-110'
                                  : 'border-transparent'
                              }`}
                              style={{ backgroundColor: sw.hex }}
                            />
                          ))}
                          <input
                            type="color"
                            value={brandTheme.accentColor}
                            onChange={(e) =>
                              setBrandTheme((t) => ({
                                ...t,
                                accentColor: e.target.value,
                              }))
                            }
                            aria-label="Custom hex color"
                            className="w-7 h-7 rounded cursor-pointer border border-neutral-200"
                          />
                        </div>
                        <p className="font-mono text-xs text-neutral-500">
                          {brandTheme.accentColor.toUpperCase()}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <span className="block text-xs font-medium text-neutral-700">
                          Surface canvas preset
                        </span>
                        <select
                          value={brandTheme.surfacePreset}
                          onChange={(e) =>
                            setBrandTheme((t) => ({
                              ...t,
                              surfacePreset: e.target.value as SurfacePreset,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50"
                        >
                          {(Object.keys(SURFACE_PRESETS) as SurfacePreset[]).map(
                            (key) => (
                              <option key={key} value={key}>
                                {SURFACE_PRESETS[key].label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <span className="block text-xs font-medium text-neutral-700">
                          Default theme & typography
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={brandTheme.mode}
                            onChange={(e) =>
                              setBrandTheme((t) => ({
                                ...t,
                                mode: e.target.value as 'light' | 'dark',
                              }))
                            }
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50"
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                          </select>
                          <select
                            value={brandTheme.fontPairing}
                            onChange={(e) =>
                              setBrandTheme((t) => ({
                                ...t,
                                fontPairing: e.target.value as FontPairing,
                              }))
                            }
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50"
                          >
                            <option value="modern">Modern</option>
                            <option value="editorial">Editorial</option>
                            <option value="technical">Technical</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={savingBrand}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] disabled:opacity-50 cursor-pointer"
                      >
                        {savingBrand ? 'Saving...' : 'Save Brand & Theme'}
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Delete storefront
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Permanently removes /s/{activeStore.slug} and all its catalog products.
                      </p>
                    </div>
                    {!confirmDeleteStore ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStore(true)}
                        className="px-4 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                      >
                        Delete Storefront
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteStore(false)}
                          className="px-3 py-2 text-xs text-neutral-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteStoreWithProducts(activeStore.slug, user.uid);
                            notify('Storefront deleted.');
                          }}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* HERO & STORY TAB */}
              {activeTab === 'hero' && (
                <form
                  onSubmit={handleSaveHero}
                  className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6"
                >
                  <div>
                    <h2 className="font-display text-xl font-bold">
                      Hero Campaign & Brand Story
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Personalize the headline, imagery, and craftsmanship metrics shown across your active template.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Hero headline
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={SCHEMA_LIMITS.headlineMax}
                        value={heroForm.headline}
                        onChange={(e) =>
                          setHeroForm((h) => ({ ...h, headline: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Hero subheadline
                      </label>
                      <textarea
                        rows={3}
                        maxLength={SCHEMA_LIMITS.subheadlineMax}
                        value={heroForm.subheadline}
                        onChange={(e) =>
                          setHeroForm((h) => ({
                            ...h,
                            subheadline: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                          Primary CTA button label
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={SCHEMA_LIMITS.ctaLabelMax}
                          value={heroForm.ctaLabel}
                          onChange={(e) =>
                            setHeroForm((h) => ({ ...h, ctaLabel: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                          Hero image URL
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.imageUrlMax}
                          value={heroForm.imageUrl}
                          onChange={(e) =>
                            setHeroForm((h) => ({ ...h, imageUrl: e.target.value }))
                          }
                          placeholder="Pick from studio library below or paste HTTPS URL"
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Studio Photo Picker */}
                    <div className="space-y-2">
                      <span className="block text-xs font-medium text-neutral-500">
                        Select from Studio Photography Library
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {STUDIO_PHOTO_LIBRARY.map((photo) => {
                          const selected = heroForm.imageUrl === photo.url;
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              title={photo.label}
                              onClick={() =>
                                setHeroForm((h) => ({ ...h, imageUrl: photo.url }))
                              }
                              className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                                selected
                                  ? 'border-[#1F3A2E]'
                                  : 'border-transparent hover:border-neutral-300'
                              }`}
                            >
                              <ResilientImage
                                src={photo.url}
                                alt={photo.label}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200 space-y-4">
                    <h3 className="font-display text-base font-semibold">
                      Craftsmanship Story & Metrics
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Story title
                      </label>
                      <input
                        type="text"
                        maxLength={SCHEMA_LIMITS.storyTitleMax}
                        value={storyForm.title}
                        onChange={(e) =>
                          setStoryForm((s) => ({ ...s, title: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Story narrative
                      </label>
                      <textarea
                        rows={3}
                        maxLength={SCHEMA_LIMITS.storyBodyMax}
                        value={storyForm.body}
                        onChange={(e) =>
                          setStoryForm((s) => ({ ...s, body: e.target.value }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">
                          Metric 1 value
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.metricValueMax}
                          value={storyForm.metricOneValue}
                          onChange={(e) =>
                            setStoryForm((s) => ({
                              ...s,
                              metricOneValue: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 bg-neutral-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">
                          Metric 1 label
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.metricLabelMax}
                          value={storyForm.metricOneLabel}
                          onChange={(e) =>
                            setStoryForm((s) => ({
                              ...s,
                              metricOneLabel: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">
                          Metric 2 value
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.metricValueMax}
                          value={storyForm.metricTwoValue}
                          onChange={(e) =>
                            setStoryForm((s) => ({
                              ...s,
                              metricTwoValue: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 bg-neutral-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-600 mb-1">
                          Metric 2 label
                        </label>
                        <input
                          type="text"
                          maxLength={SCHEMA_LIMITS.metricLabelMax}
                          value={storyForm.metricTwoLabel}
                          onChange={(e) =>
                            setStoryForm((s) => ({
                              ...s,
                              metricTwoLabel: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingHero}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] disabled:opacity-50 cursor-pointer"
                    >
                      {savingHero ? 'Saving...' : 'Save Hero & Story'}
                    </button>
                  </div>
                </form>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:border-neutral-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={openNewProductModal}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center space-y-3">
                        <p className="text-sm font-medium">No products found</p>
                        <p className="text-xs text-neutral-500">
                          Add your first item to showcase on /s/{activeStore.slug}.
                        </p>
                        <button
                          type="button"
                          onClick={openNewProductModal}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white cursor-pointer"
                        >
                          Add Product
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200 text-xs text-neutral-500 bg-neutral-50/70">
                              <th className="py-3 px-4 font-medium">Product</th>
                              <th className="py-3 px-4 font-medium">Category</th>
                              <th className="py-3 px-4 font-medium text-right">Price</th>
                              <th className="py-3 px-4 font-medium">Availability</th>
                              <th className="py-3 px-4 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {filteredProducts.map((prod) => (
                              <tr key={prod.id} className="hover:bg-neutral-50/70">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                                      <ResilientImage
                                        src={prod.imageUrl}
                                        alt={prod.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">
                                        {prod.name}
                                      </p>
                                      <p className="text-xs text-neutral-500 truncate">
                                        {prod.variants.join(' / ')}
                                        {prod.featured ? ' · Featured' : ''}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-neutral-600">
                                  {prod.category}
                                </td>
                                <td className="py-3 px-4 font-mono text-right tabular-nums">
                                  ${prod.price.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-xs">
                                  <span
                                    className={
                                      prod.inStock
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-amber-700 font-medium'
                                    }
                                  >
                                    {prod.inStock ? 'In Stock' : 'Sold Out'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => openEditProductModal(prod)}
                                    className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
                                    aria-label={`Edit ${prod.name}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await deleteProduct(activeStore.slug, prod.id);
                                      notify('Product removed.');
                                    }}
                                    className="p-1.5 rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 cursor-pointer ml-1"
                                    aria-label={`Delete ${prod.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
                    ).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderFilter(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize cursor-pointer ${
                          orderFilter === st
                            ? 'bg-[#1F3A2E] text-white border-transparent'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    {filteredOrders.length === 0 ? (
                      <div className="p-12 text-center space-y-2">
                        <p className="text-sm font-medium">No orders yet</p>
                        <p className="text-xs text-neutral-500">
                          Share your live store at /s/{activeStore.slug} to receive customer orders here in real time.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200">
                        {filteredOrders.map((order) => {
                          const isTerminal =
                            order.status === 'delivered' ||
                            order.status === 'cancelled';
                          return (
                            <div
                              key={order.id}
                              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span className="font-mono font-medium text-neutral-900">
                                    #{order.id.toUpperCase()}
                                  </span>
                                  <span>·</span>
                                  <span
                                    className={`capitalize font-medium ${
                                      order.status === 'delivered'
                                        ? 'text-emerald-700'
                                        : order.status === 'cancelled'
                                        ? 'text-red-700'
                                        : 'text-amber-700'
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono font-semibold text-neutral-900 tabular-nums">
                                    ${order.totalAmount.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium">
                                  {order.customerName} ({order.customerEmail})
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {order.shippingAddress}
                                </p>
                                <p className="text-xs text-neutral-600 pt-1">
                                  {order.items
                                    .map((i) => `${i.qty}× ${i.name} (${i.variant})`)
                                    .join(' · ')}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isTerminal && order.status === 'pending' && (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      void handleAdvanceOrder(order.id, 'confirmed')
                                    }
                                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] cursor-pointer whitespace-nowrap"
                                  >
                                    Confirm Order
                                  </button>
                                )}
                                {!isTerminal && order.status === 'confirmed' && (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      void handleAdvanceOrder(order.id, 'shipped')
                                    }
                                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] cursor-pointer whitespace-nowrap"
                                  >
                                    Mark Shipped
                                  </button>
                                )}
                                {!isTerminal && order.status === 'shipped' && (
                                  <button
                                    type="button"
                                    disabled={updatingOrderId === order.id}
                                    onClick={() =>
                                      void handleAdvanceOrder(order.id, 'delivered')
                                    }
                                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer whitespace-nowrap"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                {!isTerminal &&
                                  (order.status === 'pending' ||
                                    order.status === 'confirmed') && (
                                    <button
                                      type="button"
                                      disabled={updatingOrderId === order.id}
                                      onClick={() =>
                                        void handleAdvanceOrder(order.id, 'cancelled')
                                      }
                                      className="px-3 py-2 rounded-lg text-xs font-medium border border-neutral-200 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                {isTerminal && (
                                  <span className="text-xs text-neutral-400">
                                    Finalized
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
            onClick={() => setProductModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {editingProductId ? 'Edit Product' : 'Add Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={handleSaveProduct}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Product name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.productNameMax}
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Ceramic Pour-Over Kettle"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={SCHEMA_LIMITS.categoryMax}
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="Ceramics"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={SCHEMA_LIMITS.priceMax}
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Variants (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={variantsInput}
                    onChange={(e) => setVariantsInput(e.target.value)}
                    placeholder="Small, Medium, Large"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Finishes (optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={finishesInput}
                  onChange={(e) => setFinishesInput(e.target.value)}
                  placeholder="Matte Sage, Basalt Black"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={SCHEMA_LIMITS.descriptionMax}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-700">
                  Product image
                </label>
                <input
                  type="text"
                  maxLength={SCHEMA_LIMITS.imageUrlMax}
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {STUDIO_PHOTO_LIBRARY.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      title={photo.label}
                      onClick={() =>
                        setProductForm((f) => ({ ...f, imageUrl: photo.url }))
                      }
                      className={`aspect-square rounded-md overflow-hidden border-2 cursor-pointer ${
                        productForm.imageUrl === photo.url
                          ? 'border-[#1F3A2E]'
                          : 'border-transparent'
                      }`}
                    >
                      <ResilientImage
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, inStock: e.target.checked }))
                    }
                  />
                  <span>In Stock</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, featured: e.target.checked }))
                    }
                  />
                  <span>Featured / Flagship Product</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-blocking Confirmation Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-lg bg-[#111614] text-white text-xs font-medium shadow-xl border border-white/10"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
