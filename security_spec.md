# Marque Firestore Security Specification

## 1. Data Invariants
1. **Slug & Tenant Isolation**: Every store document lives at `/stores/{storeId}` where `storeId` equals `data.slug` and matches `^[a-z0-9]+(?:-[a-z0-9]+)*$` (3–48 chars). Only verified authenticated users may create a store, and `ownerId` must equal `request.auth.uid` and remain immutable forever.
2. **Master Gate on Catalog Products**: A product at `/stores/{storeId}/products/{productId}` cannot be created, updated, or deleted unless the parent `/stores/{storeId}` document exists and its `ownerId == request.auth.uid`.
3. **Strict PII Isolation on Orders**: Orders at `/stores/{storeId}/orders/{orderId}` contain customer name, email, and shipping address. Only the store owner (`existing().storeOwnerId == request.auth.uid`) or the ordering customer (`existing().customerUid == request.auth.uid`) may read or list an order.
4. **Verified Order Integrity**: Orders may only be created against an existing, published store, with `storeOwnerId` verified against the parent store's `ownerId`, initial `status == 'pending'`, and `customerUid == request.auth.uid`.
5. **Terminal State Locking**: Once an order reaches `delivered` or `cancelled`, no further updates are permitted. Orders cannot be deleted.
6. **Temporal Integrity & Strict Schema**: All `createdAt` and `updatedAt` timestamps must equal `request.time`. All documents enforce strict `hasAll` + `hasOnly` key allowlists, string length bounds, and bounded list checks.

## 2. The "Dirty Dozen" Attack Payloads (All Expected: PERMISSION_DENIED)
1. **Identity Spoofing on Store Create**: Creating `/stores/acme-goods` with `ownerId: "victim-uid"`.
2. **Ghost / Shadow Field Injection**: Updating `/stores/acme-goods` with an extra field `isVerifiedMerchant: true`.
3. **Unverified Email Write**: Creating a store or product with `email_verified: false`.
4. **ID Poisoning**: Creating a document with a 200-char or symbol-injected `storeId` / `productId`.
5. **Immutable Field Hijack**: Updating `ownerId`, `slug`, or `createdAt` on an existing store.
6. **Timestamp Forgery**: Creating or updating a store/product/order with a client-supplied past timestamp instead of `request.time`.
7. **Orphaned Product Write**: Creating a product under `/stores/nonexistent-store/products/p1`.
8. **Cross-Tenant Product Tampering**: User B trying to update or delete a product inside User A's store.
9. **Cross-Tenant PII Snooping**: User C attempting `get` or `list` on `/stores/acme-goods/orders` (not owner, not customer).
10. **Order Status Shortcutting on Create**: Customer creating an order with `status: "delivered"` or falsifying `storeOwnerId`.
11. **Terminal State Violation**: Merchant attempting to mutate an order whose `status` is already `"delivered"` or `"cancelled"`.
12. **Array / Payload Exhaustion**: Submitting 25 order line items or a 5,000-character product name / hex color injection.
