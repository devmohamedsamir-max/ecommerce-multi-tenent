import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Moon, ShoppingBag, Sun } from 'lucide-react';
import { initHeroCanvas } from '../webgl/heroCanvas';
import { initSpecsCanvas } from '../webgl/specsCanvas';
import { FLAGSHIP_ASSETS, SURFACE_PRESETS } from '../lib/templates';
import { ResilientImage } from '../components/ResilientImage';
import type { ProductRecord, StoreRecord } from '../types/commerce';

gsap.registerPlugin(ScrollTrigger);

type FinishId = 'sage' | 'basalt' | 'glacier';

const FINISH_META: Record<FinishId, { name: string; dot: string }> = {
  sage: { name: 'Alpine Sage', dot: '#48634B' },
  basalt: { name: 'Basalt Black', dot: '#222624' },
  glacier: { name: 'Glacier Silver', dot: '#B4BDB8' },
};

const SHOWCASE_STAGES = [
  {
    src: FLAGSHIP_ASSETS.showcaseStudio,
    alt: 'Flagship vessel standing on honed dark basalt slate in an architectural studio',
    title: 'Signature Matte Finish',
    sub: 'Powder-coated 18/8 stainless steel built for tactile grip',
  },
  {
    src: FLAGSHIP_ASSETS.showcaseRiver,
    alt: 'Flagship vessel on a sunlit cedar table beside a clear mountain river',
    title: 'Made for the Outside',
    sub: 'Zero condensation from morning trails to sunlit riverbanks',
  },
  {
    src: FLAGSHIP_ASSETS.showcaseTrail,
    alt: 'Flagship vessel resting on a sunlit granite boulder overlooking golden meadows',
    title: 'Machined Steel Collar',
    sub: 'Leakproof dual-thread seal built to take a knock',
  },
  {
    src: FLAGSHIP_ASSETS.showcaseLake,
    alt: 'Flagship vessel on a stone lakeside dock at dusk overlooking calm alpine water',
    title: 'All-Day Carry',
    sub: 'Engineered from sunrise ridgelines to quiet evening camp',
  },
];

interface FlagshipTemplateProps {
  store: StoreRecord;
  products: ProductRecord[];
  bagCount: number;
  onOpenBag: () => void;
  onAddToBag: (product: ProductRecord, variantLabel: string, customPrice?: number) => void;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function FlagshipTemplate({
  store,
  products,
  bagCount,
  onOpenBag,
  onAddToBag,
  themeMode,
  onToggleTheme,
}: FlagshipTemplateProps) {
  const flagshipProduct: ProductRecord = products.find((p) => p.featured) ||
    products[0] || {
      id: 'flagship_primary',
      storeId: store.slug,
      ownerId: store.ownerId,
      name: `${store.name} Flagship`,
      category: 'Flagship',
      description: store.hero.subheadline,
      price: 48,
      imageUrl: FLAGSHIP_ASSETS.orderCutout,
      variants: ['750 ml', '950 ml', '1.2 L'],
      finishes: ['Alpine Sage', 'Basalt Black', 'Glacier Silver'],
      inStock: true,
      featured: true,
      storePublished: store.published,
    };

  const companionProducts = products.filter((p) => p.id !== flagshipProduct.id);
  const sizeOptions =
    flagshipProduct.variants.length > 0
      ? flagshipProduct.variants.map((label, idx) => ({
          label,
          price: Math.max(1, flagshipProduct.price + (idx - 1) * 6),
          scale: idx === 0 ? 0.94 : idx === 1 ? 1.0 : 1.06,
        }))
      : [{ label: 'Standard', price: flagshipProduct.price, scale: 1 }];

  const [finish, setFinish] = useState<FinishId>('sage');
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(
    sizeOptions.length > 1 ? 1 : 0
  );
  const [activeStage, setActiveStage] = useState<number>(0);
  const [captionBlur, setCaptionBlur] = useState<boolean>(false);
  const [splitPct, setSplitPct] = useState<number>(50);
  const [splitAnimate, setSplitAnimate] = useState<boolean>(false);

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const tiltWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const stageIdxRef = useRef<number>(0);
  const stageTimerRef = useRef<number | null>(null);

  const safeSizeIdx = Math.min(selectedSizeIdx, sizeOptions.length - 1);
  const currentSize = sizeOptions[safeSizeIdx] || sizeOptions[0];

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    if (!prefersReduced) {
      lenis = new Lenis({
        duration: 1.0,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTicker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(lenisTicker);
      gsap.ticker.lagSmoothing(0);
    }

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let velX = 0;
    let velY = 0;
    let tiltTicker: (() => void) | null = null;

    const heroStage = heroStageRef.current;
    const onHeroMove = (e: PointerEvent) => {
      if (!heroStage) return;
      const rect = heroStage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 14;
      targetRotX = -ny * 10;
    };
    const onHeroLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    if (heroStage && tiltWrapRef.current && !prefersReduced) {
      heroStage.addEventListener('pointermove', onHeroMove);
      heroStage.addEventListener('pointerleave', onHeroLeave);
      tiltTicker = () => {
        const ax = (targetRotX - curRotX) * 0.08;
        const ay = (targetRotY - curRotY) * 0.08;
        velX = (velX + ax) * 0.82;
        velY = (velY + ay) * 0.82;
        curRotX += velX;
        curRotY += velY;
        if (tiltWrapRef.current) {
          tiltWrapRef.current.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
        }
        if (shadowRef.current) {
          shadowRef.current.style.transform = `translateX(${(-curRotY * 1.4).toFixed(1)}px) scale(${1 - Math.abs(curRotX) * 0.01})`;
        }
      };
      gsap.ticker.add(tiltTicker);
    }

    const gsapCtx = gsap.context(() => {
      if (prefersReduced) return;
      const frames = frameRefs.current.filter(
        (el): el is HTMLElement => el !== null
      );
      if (showcaseRef.current && frames.length === 4) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: showcaseRef.current,
            start: 'top top',
            end: '+=240%',
            pin: true,
            scrub: 0.65,
            onUpdate: (self: { progress: number }) => {
              const t = self.progress * 3.5;
              let nextIdx = 0;
              if (t >= 3.07) nextIdx = 3;
              else if (t >= 2.02) nextIdx = 2;
              else if (t >= 0.97) nextIdx = 1;
              if (nextIdx !== stageIdxRef.current) {
                stageIdxRef.current = nextIdx;
                setCaptionBlur(true);
                if (stageTimerRef.current !== null) {
                  window.clearTimeout(stageTimerRef.current);
                }
                stageTimerRef.current = window.setTimeout(() => {
                  stageTimerRef.current = null;
                  setActiveStage(nextIdx);
                  setCaptionBlur(false);
                }, 100);
              }
            },
          },
        });
        const wipeStarts = [0.25, 1.3, 2.35];
        frames.forEach((frame, i) => {
          if (i === 0) return;
          tl.fromTo(
            frame,
            { clipPath: 'inset(0 0 0 100%)' },
            { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 0.8 },
            wipeStarts[i - 1]
          );
        });
        tl.set({}, {}, 3.5);
      }

      if (bentoGridRef.current) {
        gsap.from('.reveal-tile', {
          y: 26,
          scale: 0.97,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: bentoGridRef.current,
            start: 'top 84%',
            once: true,
          },
        });
      }
    });

    return () => {
      if (stageTimerRef.current !== null) {
        window.clearTimeout(stageTimerRef.current);
      }
      cleanupHeroGl();
      cleanupSpecsGl();
      gsapCtx.revert();
      if (tiltTicker) gsap.ticker.remove(tiltTicker);
      if (lenisTicker) gsap.ticker.remove(lenisTicker);
      lenis?.destroy();
      heroStage?.removeEventListener('pointermove', onHeroMove);
      heroStage?.removeEventListener('pointerleave', onHeroLeave);
    };
  }, [store.slug]);

  const selectStage = (idx: number) => {
    stageIdxRef.current = idx;
    setCaptionBlur(true);
    if (stageTimerRef.current !== null) {
      window.clearTimeout(stageTimerRef.current);
    }
    stageTimerRef.current = window.setTimeout(() => {
      stageTimerRef.current = null;
      setActiveStage(idx);
      setCaptionBlur(false);
    }, 110);
    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      frame.style.clipPath = i <= idx ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)';
    });
  };

  const updateSplit = (pct: number, animate: boolean) => {
    setSplitAnimate(animate);
    setSplitPct(Math.max(0, Math.min(100, pct)));
  };

  const preset = SURFACE_PRESETS[store.theme.surfacePreset] || SURFACE_PRESETS.mineral;
  const palette = themeMode === 'dark' ? preset.dark : preset.light;
  const scopeStyle = {
    '--bg': palette.bg,
    '--surface': palette.surface,
    '--surface-elevated': palette.elevated,
    '--text-primary': palette.text,
    '--text-secondary': palette.muted,
    '--border': palette.border,
    '--accent': store.theme.accentColor,
    '--accent-text': '#F6F8F7',
  } as CSSProperties;

  const heroImageSrc = store.hero.imageUrl || FLAGSHIP_ASSETS.cutout;
  const orderImageSrc = flagshipProduct.imageUrl || FLAGSHIP_ASSETS.orderCutout;

  return (
    <div className="flagship-scope" data-theme={themeMode} style={scopeStyle}>
      <div className="grain-overlay" aria-hidden="true" />

      <header className="site-header">
        <div className="container header-inner">
          <a href="#hero" className="brand-lockup">
            <svg
              className="brand-mark"
              width="24"
              height="15"
              viewBox="0 0 28 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 16L10.5 3L16 11.5L19.5 6.5L26 16H2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span>{store.name}</span>
          </a>

          <nav className="header-nav" aria-label="Storefront navigation">
            <a href="#showcase" className="nav-link">
              Showcase
            </a>
            <a href="#thermal" className="nav-link">
              Performance
            </a>
            <a href="#craft" className="nav-link">
              Specs
            </a>
            <a href="#order" className="nav-link">
              Configure
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="icon-btn"
              aria-label="Toggle storefront theme"
              onClick={onToggleTheme}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Open order bag"
              onClick={onOpenBag}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="bag-count">{bagCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* SECTION 1: Asymmetric Split Hero with WebGL Contour Canvas */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            className="hero-canvas"
            aria-hidden="true"
          />
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">{store.hero.headline}</h1>
              <p className="hero-sub">{store.hero.subheadline}</p>
              <div className="hero-actions">
                <a href="#order" className="btn btn-primary">
                  {store.hero.ctaLabel || 'Shop Now'}
                </a>
                <a href="#showcase" className="btn btn-ghost">
                  Explore
                </a>
              </div>
            </div>

            <div className="hero-stage" ref={heroStageRef}>
              <div className="flask-tilt-wrap" ref={tiltWrapRef}>
                <img
                  src={heroImageSrc}
                  alt={flagshipProduct.name}
                  referrerPolicy="no-referrer"
                  className="flask-hero-img"
                  data-finish={finish}
                />
              </div>
              <div className="flask-shadow" ref={shadowRef} aria-hidden="true" />
              <div
                className="hero-swatches"
                role="radiogroup"
                aria-label="Select finish"
              >
                {(Object.keys(FINISH_META) as FinishId[]).map((key) => {
                  const meta = FINISH_META[key];
                  const isActive = finish === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      className={`swatch-btn${isActive ? ' is-active' : ''}`}
                      aria-checked={isActive}
                      onClick={() => setFinish(key)}
                    >
                      <span
                        className="swatch-dot"
                        style={{ background: meta.dot }}
                      />
                      <span>{meta.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Pinned 4-Angle Environmental Showcase */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div className="showcase-viewport">
            <div className="showcase-frames">
              {SHOWCASE_STAGES.map((stage, i) => (
                <figure
                  key={stage.src}
                  ref={(el) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`showcase-frame${i === 0 ? ' is-active' : ''}`}
                >
                  <img
                    src={stage.src}
                    alt={stage.alt}
                    referrerPolicy="no-referrer"
                    className="showcase-img"
                  />
                </figure>
              ))}
            </div>

            <div className="showcase-hud">
              <div
                className={`showcase-caption${captionBlur ? ' is-blurring' : ''}`}
              >
                <h2 className="caption-title">
                  {SHOWCASE_STAGES[activeStage].title}
                </h2>
                <p className="caption-sub">
                  {SHOWCASE_STAGES[activeStage].sub}
                </p>
              </div>
              <div
                className="showcase-dots"
                role="tablist"
                aria-label="Showcase angles"
              >
                {SHOWCASE_STAGES.map((stage, i) => (
                  <button
                    key={stage.title}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === i}
                    className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                    aria-label={`Angle ${i + 1}`}
                    onClick={() => selectStage(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Interactive Thermal Comparison Slider */}
        <section id="thermal" className="thermal-section">
          <div className="container thermal-grid">
            <div
              className="comparison-wrap"
              onPointerDown={(e) => {
                isDraggingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
              }}
            >
              <div className="comparison-layer">
                <img
                  src={FLAGSHIP_ASSETS.thermalHot}
                  alt="Warm retention test"
                  referrerPolicy="no-referrer"
                  className="comparison-img"
                />
              </div>
              <div
                className="comparison-layer"
                style={{
                  clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                  transition: splitAnimate
                    ? 'clip-path 380ms var(--ease-out)'
                    : 'none',
                }}
              >
                <img
                  src={FLAGSHIP_ASSETS.thermalCold}
                  alt="Cold retention test"
                  referrerPolicy="no-referrer"
                  className="comparison-img"
                />
              </div>
              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                role="slider"
                tabIndex={0}
                aria-label="Compare cold and hot insulation"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(splitPct)}
                style={{
                  left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                  transition: splitAnimate
                    ? 'left 380ms var(--ease-out)'
                    : 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                  if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                }}
              >
                <div className="handle-line" />
                <div className="handle-knob">↔</div>
              </div>
            </div>

            <div className="flex flex-col items-start">
              <h2 className="section-title">
                {store.story.title || 'Icy cold or piping hot.'}
              </h2>
              <p className="section-sub">
                {store.story.body ||
                  'Thick double-wall steel keeps water icy for 24 hours and morning coffee steaming for 12.'}
              </p>

              <div className="segmented-control" role="tablist">
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  24h Cold
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  12h Hot
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value">
                    {store.story.metricOneValue || '4°C'}
                  </span>
                  <span className="metric-label">
                    {store.story.metricOneLabel || 'Cold retention'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">
                    {store.story.metricTwoValue || '85°C'}
                  </span>
                  <span className="metric-label">
                    {store.story.metricTwoLabel || 'Heat retention'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Asymmetric 3-Tile Editorial Bento */}
        <section id="craft" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <h2 className="section-title">Engineered to endure.</h2>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                <img
                  src={FLAGSHIP_ASSETS.bentoLid}
                  alt="Leakproof chug lid detail"
                  referrerPolicy="no-referrer"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Leakproof Chug Lid</h3>
                  <p className="bento-sub">
                    Dual-threaded seal with integrated carry loop
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                <img
                  src={FLAGSHIP_ASSETS.bentoSunny}
                  alt="Powder coat matte texture"
                  referrerPolicy="no-referrer"
                  className="bento-img"
                />
                <div className="bento-footer">
                  <h3 className="bento-title">Powder Coat</h3>
                  <p className="bento-sub">
                    Tactile matte grip that never slips wet
                  </p>
                </div>
              </article>

              <article className="bento-tile bento-bottom reveal-tile">
                <canvas
                  ref={specsCanvasRef}
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-footer bento-footer-specs">
                  <div>
                    <h3 className="bento-title">
                      {currentSize.label}
                    </h3>
                    <p className="bento-sub">18/8 double-wall stainless steel</p>
                  </div>
                  <span className="font-mono text-xs tracking-wide opacity-80">
                    Lifetime Guarantee
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 5: Interactive Finish & Size Configurator + Order */}
        <section id="order" className="order-section">
          <div className="container order-grid">
            <div className="order-preview">
              <div className="order-plinth" aria-hidden="true" />
              <img
                src={orderImageSrc}
                alt={flagshipProduct.name}
                referrerPolicy="no-referrer"
                className="order-flask-img"
                data-finish={finish}
                style={{ transform: `scale(${currentSize.scale})` }}
              />
            </div>

            <div className="flex flex-col">
              <h2 className="section-title">{flagshipProduct.name}</h2>
              <p className="order-price">${currentSize.price.toFixed(2)}</p>
              {flagshipProduct.description && (
                <p className="text-sm mt-3 opacity-80 leading-relaxed max-w-md">
                  {flagshipProduct.description}
                </p>
              )}

              <div className="config-group">
                <span className="config-label">Finish</span>
                <div className="option-row">
                  {(Object.keys(FINISH_META) as FinishId[]).map((key) => {
                    const meta = FINISH_META[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`pill-option${finish === key ? ' is-active' : ''}`}
                        onClick={() => setFinish(key)}
                      >
                        <span
                          className="dot"
                          style={{ background: meta.dot }}
                        />
                        {meta.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="config-group">
                <span className="config-label">Capacity / Edition</span>
                <div className="option-row">
                  {sizeOptions.map((opt, idx) => (
                    <button
                      key={opt.label}
                      type="button"
                      className={`pill-option${
                        safeSizeIdx === idx ? ' is-active' : ''
                      }`}
                      onClick={() => setSelectedSizeIdx(idx)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="spec-list">
                <div className="spec-row">
                  <span className="spec-key">Availability</span>
                  <span className="spec-val">
                    {flagshipProduct.inStock ? 'In Stock — Ships in 24h' : 'Out of Stock'}
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Material</span>
                  <span className="spec-val">18/8 pro-grade double wall</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Warranty</span>
                  <span className="spec-val">Lifetime replacement</span>
                </div>
              </div>

              <button
                type="button"
                disabled={!flagshipProduct.inStock}
                className="btn btn-primary btn-full disabled:opacity-50"
                onClick={() =>
                  onAddToBag(
                    flagshipProduct,
                    `${FINISH_META[finish].name} · ${currentSize.label}`,
                    currentSize.price
                  )
                }
              >
                {flagshipProduct.inStock
                  ? `Add to Bag — $${currentSize.price.toFixed(2)}`
                  : 'Currently Sold Out'}
              </button>
            </div>
          </div>

          {companionProducts.length > 0 && (
            <div className="container mt-24 pt-14 border-t border-[var(--border)]">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    Companion Gear
                  </h3>
                  <p className="text-sm opacity-75 mt-1">
                    Additional essentials from the {store.name} catalog.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {companionProducts.map((prod) => (
                  <article
                    key={prod.id}
                    className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-black/5">
                      <ResilientImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        fallbackTitle={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs opacity-70">
                          {prod.category} · {prod.inStock ? 'In Stock' : 'Sold Out'}
                        </p>
                        <h4 className="text-base font-semibold mt-1">{prod.name}</h4>
                        <p className="text-xs opacity-75 mt-1.5 line-clamp-2">
                          {prod.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="font-mono text-sm font-medium tabular-nums">
                          ${prod.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          disabled={!prod.inStock}
                          onClick={() =>
                            onAddToBag(prod, prod.variants[0] || 'Standard')
                          }
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium text-white cursor-pointer disabled:opacity-45"
                          style={{ backgroundColor: store.theme.accentColor }}
                        >
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-brand">{store.name}</span>
          <span>{store.tagline}</span>
          <span>© 2026 {store.name}</span>
        </div>
      </footer>
    </div>
  );
}
