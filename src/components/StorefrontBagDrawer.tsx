import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/storeService';
import { ResilientImage } from './ResilientImage';
import {
  SCHEMA_LIMITS,
  type BagLineItem,
  type StoreRecord,
} from '../types/commerce';

interface StorefrontBagDrawerProps {
  open: boolean;
  onClose: () => void;
  store: StoreRecord;
  items: BagLineItem[];
  onUpdateQty: (index: number, delta: number) => void;
  onClearBag: () => void;
  isPreview: boolean;
  onUseTemplate?: () => void;
  accentColor: string;
  isDark: boolean;
}

export function StorefrontBagDrawer({
  open,
  onClose,
  store,
  items,
  onUpdateQty,
  onClearBag,
  isPreview,
  onUseTemplate,
  accentColor,
  isDark,
}: StorefrontBagDrawerProps) {
  const { user, signInWithGoogle, signingIn } = useAuth();
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.displayName || '');
      setCustomerEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!open) {
      setErrorMsg(null);
      if (step === 'confirmed') {
        setStep('bag');
      }
    }
  }, [open, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (customerName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!customerEmail.includes('@') || customerEmail.trim().length < 5) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (shippingAddress.trim().length < SCHEMA_LIMITS.shippingAddressMin) {
      setErrorMsg('Please enter a complete shipping address.');
      return;
    }

    if (isPreview) {
      const demoId = `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
      setConfirmedOrderId(demoId);
      setConfirmedTotal(subtotal);
      onClearBag();
      setStep('confirmed');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) {
        setErrorMsg('Sign in with Google to place a verified cloud order.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderId = await createOrder(store.slug, store.ownerId, activeUser.uid, {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        shippingAddress: shippingAddress.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          variant: item.variant,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
      });
      setConfirmedOrderId(orderId.toUpperCase());
      setConfirmedTotal(subtotal);
      onClearBag();
      setStep('confirmed');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Order could not be completed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const panelBg = isDark
    ? 'bg-[#141716] text-[#F2F4F3] border-white/12'
    : 'bg-white text-[#141716] border-neutral-200';
  const mutedText = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const inputBg = isDark
    ? 'bg-[#1C201E] border-white/14 text-white placeholder:text-neutral-500'
    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400';

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${store.name} shopping bag`}
        className={`relative z-10 w-full max-w-[430px] h-full border-l flex flex-col shadow-2xl ${panelBg}`}
      >
        <div
          className={`flex items-center justify-between px-6 py-5 border-b ${
            isDark ? 'border-white/10' : 'border-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                className="p-1.5 -ml-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Back to bag"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {step === 'bag' && `Bag (${items.reduce((s, i) => s + i.qty, 0)})`}
              {step === 'checkout' && 'Checkout'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'bag' && items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag
                className={`w-9 h-9 mb-3 opacity-45 ${mutedText}`}
                strokeWidth={1.5}
              />
              <p className="text-base font-medium">Your bag is empty</p>
              <p className={`text-sm mt-1 max-w-[26ch] ${mutedText}`}>
                Add items from {store.name} to review your order here.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Continue Browsing
              </button>
            </div>
          )}

          {step === 'bag' && items.length > 0 && (
            <div className="divide-y divide-neutral-200/70 dark:divide-white/10">
              {items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variant}`}
                  className="py-4 first:pt-0 flex items-start gap-4"
                >
                  <div
                    className={`w-16 h-20 rounded-lg overflow-hidden shrink-0 ${
                      isDark ? 'bg-white/5' : 'bg-neutral-100'
                    }`}
                  >
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug truncate">
                        {item.name}
                      </p>
                      <span className="font-mono text-sm tabular-nums shrink-0">
                        ${(item.unitPrice * item.qty).toFixed(2)}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      {item.variant} · ${item.unitPrice.toFixed(2)} each
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div
                        className={`inline-flex items-center border rounded-md ${
                          isDark ? 'border-white/15' : 'border-neutral-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-xs tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(idx, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(idx, -item.qty)}
                        className={`p-1.5 rounded hover:text-red-600 transition-colors cursor-pointer ${mutedText}`}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'checkout' && (
            <form id="storefront-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              {!isPreview && !user && (
                <div
                  className={`p-4 rounded-lg border text-sm space-y-3 ${
                    isDark
                      ? 'bg-white/5 border-white/12'
                      : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <p className="font-medium">Verified checkout</p>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>
                    Sign in with Google to submit your order to {store.name} and keep your shipping details private.
                  </p>
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={() => void signInWithGoogle()}
                    className="w-full py-2 px-3 rounded-md text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    {signingIn ? 'Opening Google Sign-In...' : 'Sign in with Google'}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.customerNameMax}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Alex Morgan"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  maxLength={SCHEMA_LIMITS.customerEmailMax}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">
                  Shipping address
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={SCHEMA_LIMITS.shippingAddressMin}
                  maxLength={SCHEMA_LIMITS.shippingAddressMax}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="742 Evergreen Terrace, Apt 4B, Portland, OR 97205"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 resize-none ${inputBg}`}
                />
              </div>

              <div
                className={`pt-3 border-t text-xs space-y-1.5 ${
                  isDark ? 'border-white/10' : 'border-neutral-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={mutedText}>Shipping</span>
                  <span>Complimentary Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Payment method</span>
                  <span>Cash / Invoice on Delivery</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {errorMsg}
                </p>
              )}
            </form>
          )}

          {step === 'confirmed' && (
            <div className="py-10 text-center space-y-4">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white"
                style={{ backgroundColor: accentColor }}
              >
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold">
                  Order #{confirmedOrderId} Confirmed
                </h3>
                <p className={`text-sm ${mutedText}`}>
                  {isPreview
                    ? 'Template preview checkout complete. Launch your own cloud store to accept real orders.'
                    : `Preparing shipment from ${store.name}. Your merchant can now process this order in Studio.`}
                </p>
              </div>
              <div
                className={`text-left p-4 rounded-lg border text-sm space-y-1.5 ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={mutedText}>Store</span>
                  <span className="font-medium">{store.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedText}>Total</span>
                  <span className="font-mono font-semibold tabular-nums">
                    ${confirmedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                {isPreview && onUseTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUseTemplate();
                    }}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    Use This Template
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium border cursor-pointer ${
                    isDark
                      ? 'border-white/15 hover:bg-white/5'
                      : 'border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  Back to Storefront
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== 'confirmed' && items.length > 0 && (
          <div
            className={`px-6 py-5 border-t space-y-4 ${
              isDark ? 'border-white/10' : 'border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            {step === 'bag' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                type="submit"
                form="storefront-checkout-form"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {submitting
                  ? 'Placing Order...'
                  : isPreview
                  ? `Place Demo Order · $${subtotal.toFixed(2)}`
                  : `Place Order · $${subtotal.toFixed(2)}`}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
