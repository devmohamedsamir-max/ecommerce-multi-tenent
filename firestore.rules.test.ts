/**
 * Marque Firestore Security Rules — Dirty Dozen Verification Suite
 * Covers identity spoofing, shadow fields, unverified writes, ID poisoning,
 * immutability, timestamp forgery, orphaned writes, cross-tenant tampering,
 * PII isolation, order status shortcutting, terminal state locking, and bounds.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity spoofing on store creation',
    operation: 'create',
    path: '/stores/spoof-shop',
    auth: { uid: 'attacker_1', email_verified: true },
    payload: { slug: 'spoof-shop', ownerId: 'victim_uid', name: 'Spoof' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow ghost field injection on store update',
    operation: 'update',
    path: '/stores/alpine-demo',
    auth: { uid: 'owner_1', email_verified: true },
    payload: { name: 'Alpine Demo', isVerifiedMerchant: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified email user write attempt',
    operation: 'create',
    path: '/stores/unverified-shop',
    auth: { uid: 'user_unverified', email_verified: false },
    payload: { slug: 'unverified-shop', ownerId: 'user_unverified', name: 'Test' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'ID poisoning with oversized / illegal path characters',
    operation: 'create',
    path: '/stores/' + 'a'.repeat(160),
    auth: { uid: 'owner_1', email_verified: true },
    payload: { slug: 'a'.repeat(160), ownerId: 'owner_1' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Immutable ownerId / slug mutation on store update',
    operation: 'update',
    path: '/stores/alpine-demo',
    auth: { uid: 'owner_1', email_verified: true },
    payload: { ownerId: 'owner_2', slug: 'hijacked-slug' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Client-forged timestamp on product creation',
    operation: 'create',
    path: '/stores/alpine-demo/products/prod_1',
    auth: { uid: 'owner_1', email_verified: true },
    payload: { createdAt: '1999-01-01T00:00:00Z', updatedAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned product write under non-existent store',
    operation: 'create',
    path: '/stores/ghost-store/products/prod_orphan',
    auth: { uid: 'owner_1', email_verified: true },
    payload: { storeId: 'ghost-store', ownerId: 'owner_1', name: 'Orphan' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Cross-tenant product modification by non-owner',
    operation: 'update',
    path: '/stores/alpine-demo/products/prod_1',
    auth: { uid: 'other_merchant', email_verified: true },
    payload: { price: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Cross-tenant PII snooping on store orders',
    operation: 'get',
    path: '/stores/alpine-demo/orders/ord_1',
    auth: { uid: 'bystander_uid', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Order status shortcutting to delivered on create',
    operation: 'create',
    path: '/stores/alpine-demo/orders/ord_fake',
    auth: { uid: 'buyer_1', email_verified: true },
    payload: { status: 'delivered', customerUid: 'buyer_1', storeOwnerId: 'fake_owner' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal state mutation on delivered order',
    operation: 'update',
    path: '/stores/alpine-demo/orders/ord_delivered',
    auth: { uid: 'owner_1', email_verified: true },
    payload: { status: 'pending' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Payload exhaustion via oversized name and invalid hex color',
    operation: 'create',
    path: '/stores/exhaust-shop',
    auth: { uid: 'owner_1', email_verified: true },
    payload: {
      slug: 'exhaust-shop',
      ownerId: 'owner_1',
      name: 'X'.repeat(500),
      theme: { accentColor: 'not-a-hex' },
    },
    expected: 'PERMISSION_DENIED',
  },
];
