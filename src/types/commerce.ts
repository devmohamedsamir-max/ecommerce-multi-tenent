import type { Timestamp } from 'firebase/firestore';

export type TemplateId = 'flagship' | 'editorial' | 'minimal';
export type ThemeMode = 'light' | 'dark';
export type SurfacePreset = 'mineral' | 'paper' | 'chalk' | 'obsidian';
export type FontPairing = 'modern' | 'editorial' | 'technical';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface StoreTheme {
  mode: ThemeMode;
  accentColor: string;
  surfacePreset: SurfacePreset;
  fontPairing: FontPairing;
}

export interface StoreHero {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  imageUrl: string;
}

export interface StoreStory {
  title: string;
  body: string;
  metricOneValue: string;
  metricOneLabel: string;
  metricTwoValue: string;
  metricTwoLabel: string;
}

export interface StoreRecord {
  slug: string;
  ownerId: string;
  name: string;
  tagline: string;
  templateId: TemplateId;
  published: boolean;
  theme: StoreTheme;
  hero: StoreHero;
  story: StoreStory;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ProductRecord {
  id: string;
  storeId: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  variants: string[];
  finishes: string[];
  inStock: boolean;
  featured: boolean;
  storePublished: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  qty: number;
  unitPrice: number;
}

export interface OrderRecord {
  id: string;
  storeId: string;
  storeOwnerId: string;
  customerUid: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface BagLineItem {
  productId: string;
  name: string;
  variant: string;
  unitPrice: number;
  qty: number;
  imageUrl: string;
  finishKey?: string;
}

/**
 * Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules
 */
export const SCHEMA_PATTERNS = {
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#[0-9a-fA-F]{6}$/,
  id: /^[a-zA-Z0-9_-]+$/,
} as const;

export const SCHEMA_LIMITS = {
  slugMin: 3,
  slugMax: 48,
  storeNameMax: 80,
  taglineMax: 140,
  headlineMax: 120,
  subheadlineMax: 320,
  ctaLabelMax: 40,
  imageUrlMax: 500,
  storyTitleMax: 120,
  storyBodyMax: 500,
  metricValueMax: 24,
  metricLabelMax: 40,
  productNameMax: 100,
  categoryMax: 48,
  descriptionMax: 600,
  priceMax: 100000,
  variantsMax: 8,
  variantItemMax: 40,
  finishesMax: 6,
  customerNameMax: 100,
  customerEmailMax: 160,
  shippingAddressMin: 5,
  shippingAddressMax: 300,
  orderItemsMax: 20,
} as const;

export function slugifyStoreName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SCHEMA_LIMITS.slugMax);
}
