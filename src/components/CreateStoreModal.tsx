import { useEffect, useState, type FormEvent } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  checkSlugAvailable,
  createStoreWithStarterProducts,
} from '../lib/storeService';
import {
  ACCENT_SWATCHES,
  TEMPLATE_BLUEPRINTS,
  TEMPLATE_LIST,
} from '../lib/templates';
import {
  SCHEMA_LIMITS,
  slugifyStoreName,
  type TemplateId,
} from '../types/commerce';

interface CreateStoreModalProps {
  open: boolean;
  initialTemplate: TemplateId;
  onClose: () => void;
  onCreated: (slug: string) => void;
}

export function CreateStoreModal({
  open,
  initialTemplate,
  onClose,
  onCreated,
}: CreateStoreModalProps) {
  const { user, signInWithGoogle, signingIn } = useAuth();
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplate);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState('');
  const [accentColor, setAccentColor] = useState(
    TEMPLATE_BLUEPRINTS[initialTemplate].defaultStore.theme.accentColor
  );
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [slugCheck, setSlugCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    reason?: string;
  }>({ checking: false, available: null });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTemplateId(initialTemplate);
      setAccentColor(
        TEMPLATE_BLUEPRINTS[initialTemplate].defaultStore.theme.accentColor
      );
      setErrorMsg(null);
    }
  }, [open, initialTemplate]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugifyStoreName(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (!open) return;
    const clean = slugifyStoreName(slug);
    if (!clean) {
      setSlugCheck({ checking: false, available: null });
      return;
    }
    if (clean.length < SCHEMA_LIMITS.slugMin) {
      setSlugCheck({
        checking: false,
        available: false,
        reason: 'At least 3 lowercase characters required.',
      });
      return;
    }
    let cancelled = false;
    setSlugCheck({ checking: true, available: null });
    const timer = window.setTimeout(async () => {
      try {
        const res = await checkSlugAvailable(clean);
        if (!cancelled) {
          setSlugCheck({
            checking: false,
            available: res.valid && res.available,
            reason: res.reason,
          });
        }
      } catch {
        if (!cancelled) {
          setSlugCheck({ checking: false, available: null });
        }
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) {
        setErrorMsg('Please sign in with Google to launch your cloud storefront.');
        return;
      }
    }

    const cleanSlug = slugifyStoreName(slug);
    if (cleanSlug.length < SCHEMA_LIMITS.slugMin) {
      setErrorMsg('Please choose a valid store URL slug (at least 3 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const check = await checkSlugAvailable(cleanSlug);
      if (!check.valid || !check.available) {
        setErrorMsg(check.reason || 'That store URL is unavailable.');
        setSubmitting(false);
        return;
      }

      const created = await createStoreWithStarterProducts(activeUser.uid, {
        name: name.trim(),
        slug: cleanSlug,
        tagline: tagline.trim(),
        templateId,
        accentColor,
        mode,
      });

      setName('');
      setSlug('');
      setSlugTouched(false);
      setTagline('');
      onCreated(created.slug);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to create store right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Launch a new storefront"
        className="relative z-10 w-full max-w-xl bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-neutral-900"
      >
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Launch a new storefront
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Choose a template and claim your live URL. You can customize everything later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {!user && (
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Google account required
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Sign in to own and manage your cloud-hosted stores.
                </p>
              </div>
              <button
                type="button"
                disabled={signingIn}
                onClick={() => void signInWithGoogle()}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {signingIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          )}

          {/* Template Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-700">
              Storefront template
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {TEMPLATE_LIST.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplateId(tpl.id);
                      setAccentColor(tpl.defaultStore.theme.accentColor);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#1F3A2E] bg-[#1F3A2E]/5'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-neutral-900">
                      {tpl.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      {tpl.category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Store name
              </label>
              <input
                type="text"
                required
                maxLength={SCHEMA_LIMITS.storeNameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nordic Vessel Co."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Store URL slug
              </label>
              <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 focus-within:bg-white focus-within:border-neutral-400 overflow-hidden">
                <span className="pl-3 pr-1 text-xs font-mono text-neutral-400 select-none">
                  /s/
                </span>
                <input
                  type="text"
                  required
                  maxLength={SCHEMA_LIMITS.slugMax}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="nordic-vessel"
                  className="w-full py-2.5 pr-3 text-sm font-mono bg-transparent focus:outline-none"
                />
              </div>
              {slugCheck.checking && (
                <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                </p>
              )}
              {!slugCheck.checking && slugCheck.available === true && (
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Available at /s/{slugifyStoreName(slug)}
                </p>
              )}
              {!slugCheck.checking && slugCheck.available === false && (
                <p className="text-[11px] text-red-600 mt-1">
                  {slugCheck.reason || 'Unavailable slug.'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Short tagline
            </label>
            <input
              type="text"
              maxLength={SCHEMA_LIMITS.taglineMax}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Small-batch studio objects built to endure."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-400"
            />
          </div>

          {/* Initial Accent & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="block text-xs font-medium text-neutral-700 mb-2">
                Primary accent color
              </span>
              <div className="flex items-center gap-2">
                {ACCENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    aria-label={sw.name}
                    onClick={() => setAccentColor(sw.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      accentColor.toLowerCase() === sw.hex.toLowerCase()
                        ? 'border-neutral-900 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-neutral-700 mb-2">
                Default posture
              </span>
              <div className="inline-flex p-1 rounded-lg bg-neutral-100 border border-neutral-200">
                {(['light', 'dark'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-3.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer transition-colors ${
                      mode === m
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || slugCheck.available === false}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#1F3A2E] text-white hover:bg-[#172C22] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {submitting ? 'Creating Storefront...' : 'Create & Open Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
