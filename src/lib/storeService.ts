import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { TEMPLATE_BLUEPRINTS } from './templates';
import {
  SCHEMA_LIMITS,
  SCHEMA_PATTERNS,
  slugifyStoreName,
  type OrderItem,
  type OrderRecord,
  type OrderStatus,
  type ProductRecord,
  type StoreHero,
  type StoreRecord,
  type StoreStory,
  type StoreTheme,
  type TemplateId,
} from '../types/commerce';

function clampString(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function sanitizeHexColor(value: string, fallback = '#3D5740'): string {
  const clean = value.trim();
  return SCHEMA_PATTERNS.hexColor.test(clean) ? clean : fallback;
}

function sanitizeImageUrl(value: string): string {
  const clean = value.trim().slice(0, SCHEMA_LIMITS.imageUrlMax);
  if (!clean) return '';
  if (
    clean.startsWith('/') ||
    clean.startsWith('https://') ||
    clean.startsWith('http://') ||
    clean.startsWith('data:image/')
  ) {
    return clean;
  }
  return '';
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function checkSlugAvailable(rawSlug: string): Promise<{
  slug: string;
  valid: boolean;
  available: boolean;
  reason?: string;
}> {
  const slug = slugifyStoreName(rawSlug);
  if (slug.length < SCHEMA_LIMITS.slugMin || !SCHEMA_PATTERNS.slug.test(slug)) {
    return {
      slug,
      valid: false,
      available: false,
      reason: 'Use 3–48 lowercase letters, numbers, and hyphens.',
    };
  }
  const path = `stores/${slug}`;
  try {
    const snap = await getDoc(doc(db, 'stores', slug));
    return {
      slug,
      valid: true,
      available: !snap.exists(),
      reason: snap.exists() ? 'That store URL is already taken.' : undefined,
    };
  } catch (error) {
    // If a draft store owned by someone else exists, getDoc returns permission-denied, meaning slug is taken!
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      return {
        slug,
        valid: true,
        available: false,
        reason: 'That store URL is already reserved.',
      };
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface CreateStoreInput {
  name: string;
  slug: string;
  tagline: string;
  templateId: TemplateId;
  accentColor: string;
  mode: 'light' | 'dark';
}

export async function createStoreWithStarterProducts(
  ownerId: string,
  input: CreateStoreInput
): Promise<StoreRecord> {
  const slug = slugifyStoreName(input.slug);
  if (slug.length < SCHEMA_LIMITS.slugMin || !SCHEMA_PATTERNS.slug.test(slug)) {
    throw new Error('Store slug must be 3–48 lowercase letters, numbers, or hyphens.');
  }

  const bp = TEMPLATE_BLUEPRINTS[input.templateId];
  const storeName = clampString(input.name, SCHEMA_LIMITS.storeNameMax) || bp.defaultStore.name;
  const tagline = clampString(input.tagline, SCHEMA_LIMITS.taglineMax) || bp.defaultStore.tagline;

  const storePayload = {
    slug,
    ownerId,
    name: storeName,
    tagline,
    templateId: input.templateId,
    published: true,
    theme: {
      mode: input.mode,
      accentColor: sanitizeHexColor(input.accentColor, bp.defaultStore.theme.accentColor),
      surfacePreset: bp.defaultStore.theme.surfacePreset,
      fontPairing: bp.defaultStore.theme.fontPairing,
    },
    hero: {
      headline: clampString(bp.defaultStore.hero.headline, SCHEMA_LIMITS.headlineMax),
      subheadline: clampString(bp.defaultStore.hero.subheadline, SCHEMA_LIMITS.subheadlineMax),
      ctaLabel: clampString(bp.defaultStore.hero.ctaLabel, SCHEMA_LIMITS.ctaLabelMax),
      imageUrl: sanitizeImageUrl(bp.defaultStore.hero.imageUrl),
    },
    story: {
      title: clampString(bp.defaultStore.story.title, SCHEMA_LIMITS.storyTitleMax),
      body: clampString(bp.defaultStore.story.body, SCHEMA_LIMITS.storyBodyMax),
      metricOneValue: clampString(bp.defaultStore.story.metricOneValue, SCHEMA_LIMITS.metricValueMax),
      metricOneLabel: clampString(bp.defaultStore.story.metricOneLabel, SCHEMA_LIMITS.metricLabelMax),
      metricTwoValue: clampString(bp.defaultStore.story.metricTwoValue, SCHEMA_LIMITS.metricValueMax),
      metricTwoLabel: clampString(bp.defaultStore.story.metricTwoLabel, SCHEMA_LIMITS.metricLabelMax),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const storePath = `stores/${slug}`;
  try {
    await setDoc(doc(db, 'stores', slug), storePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, storePath);
  }

  // Create starter products in a batch AFTER parent store exists (satisfies Master Gate)
  const batch = writeBatch(db);
  for (const item of bp.starterProducts) {
    const productId = generateId('prod');
    const prodRef = doc(db, 'stores', slug, 'products', productId);
    batch.set(prodRef, {
      storeId: slug,
      ownerId,
      name: clampString(item.name, SCHEMA_LIMITS.productNameMax),
      category: clampString(item.category, SCHEMA_LIMITS.categoryMax),
      description: clampString(item.description, SCHEMA_LIMITS.descriptionMax),
      price: Math.max(0, Math.min(SCHEMA_LIMITS.priceMax, Number(item.price) || 0)),
      imageUrl: sanitizeImageUrl(item.imageUrl),
      variants: item.variants
        .map((v) => clampString(v, SCHEMA_LIMITS.variantItemMax))
        .filter(Boolean)
        .slice(0, SCHEMA_LIMITS.variantsMax),
      finishes: item.finishes
        .map((f) => clampString(f, SCHEMA_LIMITS.variantItemMax))
        .filter(Boolean)
        .slice(0, SCHEMA_LIMITS.finishesMax),
      inStock: item.inStock,
      featured: item.featured,
      storePublished: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `stores/${slug}/products`);
  }

  return {
    slug,
    ownerId,
    name: storePayload.name,
    tagline: storePayload.tagline,
    templateId: storePayload.templateId,
    published: true,
    theme: storePayload.theme,
    hero: storePayload.hero,
    story: storePayload.story,
  };
}

export async function updateStoreBrandAndTheme(
  storeId: string,
  updates: {
    name: string;
    tagline: string;
    templateId: TemplateId;
    theme: StoreTheme;
  }
): Promise<void> {
  const path = `stores/${storeId}`;
  try {
    await updateDoc(doc(db, 'stores', storeId), {
      name: clampString(updates.name, SCHEMA_LIMITS.storeNameMax) || 'Untitled Store',
      tagline: clampString(updates.tagline, SCHEMA_LIMITS.taglineMax),
      templateId: updates.templateId,
      theme: {
        mode: updates.theme.mode,
        accentColor: sanitizeHexColor(updates.theme.accentColor),
        surfacePreset: updates.theme.surfacePreset,
        fontPairing: updates.theme.fontPairing,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateStoreHeroAndStory(
  storeId: string,
  hero: StoreHero,
  story: StoreStory
): Promise<void> {
  const path = `stores/${storeId}`;
  try {
    await updateDoc(doc(db, 'stores', storeId), {
      hero: {
        headline: clampString(hero.headline, SCHEMA_LIMITS.headlineMax) || 'Welcome',
        subheadline: clampString(hero.subheadline, SCHEMA_LIMITS.subheadlineMax),
        ctaLabel: clampString(hero.ctaLabel, SCHEMA_LIMITS.ctaLabelMax) || 'Shop Now',
        imageUrl: sanitizeImageUrl(hero.imageUrl),
      },
      story: {
        title: clampString(story.title, SCHEMA_LIMITS.storyTitleMax),
        body: clampString(story.body, SCHEMA_LIMITS.storyBodyMax),
        metricOneValue: clampString(story.metricOneValue, SCHEMA_LIMITS.metricValueMax),
        metricOneLabel: clampString(story.metricOneLabel, SCHEMA_LIMITS.metricLabelMax),
        metricTwoValue: clampString(story.metricTwoValue, SCHEMA_LIMITS.metricValueMax),
        metricTwoLabel: clampString(story.metricTwoLabel, SCHEMA_LIMITS.metricLabelMax),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleStorePublished(
  storeId: string,
  published: boolean,
  ownerId: string
): Promise<void> {
  const storePath = `stores/${storeId}`;
  try {
    await updateDoc(doc(db, 'stores', storeId), {
      published,
      updatedAt: serverTimestamp(),
    });

    // Mirror visibility onto products for secure zero-get() list queries
    const prodQuery = query(
      collection(db, 'stores', storeId, 'products'),
      where('ownerId', '==', ownerId)
    );
    const snap = await getDocs(prodQuery);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((prodDoc) => {
        batch.update(prodDoc.ref, {
          storePublished: published,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, storePath);
  }
}

export async function deleteStoreWithProducts(
  storeId: string,
  ownerId: string
): Promise<void> {
  const storePath = `stores/${storeId}`;
  try {
    const prodQuery = query(
      collection(db, 'stores', storeId, 'products'),
      where('ownerId', '==', ownerId)
    );
    const snap = await getDocs(prodQuery);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'stores', storeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, storePath);
  }
}

export interface ProductInput {
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  variants: string[];
  finishes: string[];
  inStock: boolean;
  featured: boolean;
}

export async function createProduct(
  storeId: string,
  ownerId: string,
  storePublished: boolean,
  input: ProductInput
): Promise<string> {
  const productId = generateId('prod');
  const path = `stores/${storeId}/products/${productId}`;
  const cleanVariants = input.variants
    .map((v) => clampString(v, SCHEMA_LIMITS.variantItemMax))
    .filter(Boolean)
    .slice(0, SCHEMA_LIMITS.variantsMax);
  const cleanFinishes = input.finishes
    .map((f) => clampString(f, SCHEMA_LIMITS.variantItemMax))
    .filter(Boolean)
    .slice(0, SCHEMA_LIMITS.finishesMax);

  try {
    await setDoc(doc(db, 'stores', storeId, 'products', productId), {
      storeId,
      ownerId,
      name: clampString(input.name, SCHEMA_LIMITS.productNameMax) || 'New Product',
      category: clampString(input.category, SCHEMA_LIMITS.categoryMax) || 'General',
      description: clampString(input.description, SCHEMA_LIMITS.descriptionMax),
      price: Math.max(0, Math.min(SCHEMA_LIMITS.priceMax, Number(input.price) || 0)),
      imageUrl: sanitizeImageUrl(input.imageUrl),
      variants: cleanVariants.length > 0 ? cleanVariants : ['Standard'],
      finishes: cleanFinishes,
      inStock: Boolean(input.inStock),
      featured: Boolean(input.featured),
      storePublished: Boolean(storePublished),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return productId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProduct(
  storeId: string,
  productId: string,
  input: ProductInput
): Promise<void> {
  const path = `stores/${storeId}/products/${productId}`;
  const cleanVariants = input.variants
    .map((v) => clampString(v, SCHEMA_LIMITS.variantItemMax))
    .filter(Boolean)
    .slice(0, SCHEMA_LIMITS.variantsMax);
  const cleanFinishes = input.finishes
    .map((f) => clampString(f, SCHEMA_LIMITS.variantItemMax))
    .filter(Boolean)
    .slice(0, SCHEMA_LIMITS.finishesMax);

  try {
    await updateDoc(doc(db, 'stores', storeId, 'products', productId), {
      name: clampString(input.name, SCHEMA_LIMITS.productNameMax) || 'Product',
      category: clampString(input.category, SCHEMA_LIMITS.categoryMax) || 'General',
      description: clampString(input.description, SCHEMA_LIMITS.descriptionMax),
      price: Math.max(0, Math.min(SCHEMA_LIMITS.priceMax, Number(input.price) || 0)),
      imageUrl: sanitizeImageUrl(input.imageUrl),
      variants: cleanVariants.length > 0 ? cleanVariants : ['Standard'],
      finishes: cleanFinishes,
      inStock: Boolean(input.inStock),
      featured: Boolean(input.featured),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(storeId: string, productId: string): Promise<void> {
  const path = `stores/${storeId}/products/${productId}`;
  try {
    await deleteDoc(doc(db, 'stores', storeId, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
}

export async function createOrder(
  storeId: string,
  storeOwnerId: string,
  customerUid: string,
  input: CreateOrderInput
): Promise<string> {
  const orderId = generateId('ord');
  const path = `stores/${storeId}/orders/${orderId}`;

  const cleanItems: OrderItem[] = input.items
    .slice(0, SCHEMA_LIMITS.orderItemsMax)
    .map((item) => ({
      productId: item.productId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'item',
      name: clampString(item.name, SCHEMA_LIMITS.productNameMax) || 'Product',
      variant: clampString(item.variant, 60) || 'Standard',
      qty: Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1))),
      unitPrice: Math.max(0, Math.min(SCHEMA_LIMITS.priceMax, Number(item.unitPrice) || 0)),
    }));

  const totalAmount = Number(
    cleanItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0).toFixed(2)
  );

  if (cleanItems.length === 0 || totalAmount <= 0) {
    throw new Error('Your order must contain at least one item with a valid total.');
  }

  try {
    await setDoc(doc(db, 'stores', storeId, 'orders', orderId), {
      storeId,
      storeOwnerId,
      customerUid,
      customerName: clampString(input.customerName, SCHEMA_LIMITS.customerNameMax),
      customerEmail: clampString(input.customerEmail, SCHEMA_LIMITS.customerEmailMax),
      shippingAddress: clampString(input.shippingAddress, SCHEMA_LIMITS.shippingAddressMax),
      items: cleanItems,
      totalAmount,
      status: 'pending' as OrderStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  nextStatus: OrderStatus
): Promise<void> {
  const path = `stores/${storeId}/orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'stores', storeId, 'orders', orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getStoreBySlug(slug: string): Promise<StoreRecord | null> {
  const cleanSlug = slugifyStoreName(slug);
  if (!cleanSlug || cleanSlug.length < SCHEMA_LIMITS.slugMin) return null;
  const path = `stores/${cleanSlug}`;
  try {
    const snap = await getDoc(doc(db, 'stores', cleanSlug));
    if (!snap.exists()) return null;
    return snap.data() as StoreRecord;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribePublishedStores(
  onData: (stores: StoreRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'stores'), where('published', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const stores = snapshot.docs
        .map((d) => d.data() as StoreRecord)
        .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
      onData(stores);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'stores');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeMerchantStores(
  ownerId: string,
  onData: (stores: StoreRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'stores'), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const stores = snapshot.docs
        .map((d) => d.data() as StoreRecord)
        .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
      onData(stores);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'stores');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeStoreProducts(
  storeId: string,
  opts: { ownerId?: string; publishedOnly?: boolean },
  onData: (products: ProductRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `stores/${storeId}/products`;
  const colRef = collection(db, 'stores', storeId, 'products');
  const q = opts.ownerId
    ? query(colRef, where('ownerId', '==', opts.ownerId))
    : query(colRef, where('storePublished', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<ProductRecord, 'id'>), id: d.id }))
        .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      onData(products);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeStoreOrders(
  storeId: string,
  ownerId: string,
  onData: (orders: OrderRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `stores/${storeId}/orders`;
  const q = query(
    collection(db, 'stores', storeId, 'orders'),
    where('storeOwnerId', '==', ownerId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs
        .map((d) => ({ ...(d.data() as Omit<OrderRecord, 'id'>), id: d.id }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(orders);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}
