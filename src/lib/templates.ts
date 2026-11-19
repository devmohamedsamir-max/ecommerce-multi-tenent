import editorialHeroImg from '../assets/images/editorial_hero_ceramics_1795076324797.jpg';
import editorialSerumImg from '../assets/images/editorial_serum_bottle_1795076323189.jpg';
import editorialLinenImg from '../assets/images/editorial_linen_throw_1795076322575.jpg';
import minimalHeroImg from '../assets/images/minimal_hero_audio_1795076357097.jpg';
import minimalLampImg from '../assets/images/minimal_desk_lamp_1795076324302.jpg';
import minimalWatchImg from '../assets/images/minimal_edc_watch_1795076323864.jpg';
import type {
  ProductRecord,
  StoreRecord,
  SurfacePreset,
  TemplateId,
} from '../types/commerce';

export const FLAGSHIP_ASSETS = {
  cutout:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-cutout.webp',
  orderCutout:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-order-cutout.webp',
  showcaseStudio:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-studio.webp',
  showcaseRiver:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-river.webp',
  showcaseTrail:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-trail.webp',
  showcaseLake:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-showcase-lake.webp',
  thermalHot:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-thermal-hot.webp',
  thermalCold:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-thermal-cold.webp',
  bentoLid:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-bento-lid.webp',
  bentoSunny:
    'https://www.gstatic.com/aistudio/starter-apps/flask-applet/flask-bento-sunny.webp',
};

export interface StudioPhotoOption {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const STUDIO_PHOTO_LIBRARY: StudioPhotoOption[] = [
  {
    id: 'editorial-hero',
    label: 'Travertine Vessel & Fragrance',
    category: 'Editorial',
    url: editorialHeroImg,
  },
  {
    id: 'editorial-serum',
    label: 'Botanical Amber Serum',
    category: 'Editorial',
    url: editorialSerumImg,
  },
  {
    id: 'editorial-linen',
    label: 'Belgian Linen & Ceramic Cup',
    category: 'Editorial',
    url: editorialLinenImg,
  },
  {
    id: 'minimal-audio',
    label: 'Aluminum Monitor & Rotary Dial',
    category: 'Minimal',
    url: minimalHeroImg,
  },
  {
    id: 'minimal-lamp',
    label: 'Cantilever Task Lamp',
    category: 'Minimal',
    url: minimalLampImg,
  },
  {
    id: 'minimal-watch',
    label: 'Titanium Field Watch',
    category: 'Minimal',
    url: minimalWatchImg,
  },
  {
    id: 'flagship-studio',
    label: 'Alpine Flask on Basalt Slate',
    category: 'Flagship',
    url: FLAGSHIP_ASSETS.showcaseStudio,
  },
  {
    id: 'flagship-trail',
    label: 'Alpine Flask on Granite Ridge',
    category: 'Flagship',
    url: FLAGSHIP_ASSETS.showcaseTrail,
  },
];

export interface TemplateBlueprint {
  id: TemplateId;
  name: string;
  category: string;
  summary: string;
  highlights: string[];
  previewImage: string;
  defaultStore: Omit<StoreRecord, 'ownerId' | 'createdAt' | 'updatedAt'>;
  starterProducts: Omit<
    ProductRecord,
    'id' | 'storeId' | 'ownerId' | 'storePublished' | 'createdAt' | 'updatedAt'
  >[];
}

export const ACCENT_SWATCHES = [
  { name: 'Pine Sage', hex: '#3D5740' },
  { name: 'Obsidian Ink', hex: '#1C1F1D' },
  { name: 'Espresso Umber', hex: '#6B442A' },
  { name: 'Cobalt Slate', hex: '#284B7A' },
  { name: 'Oxblood Clay', hex: '#7D2E2E' },
  { name: 'Deep Spruce', hex: '#1E4A47' },
];

export const SURFACE_PRESETS: Record<
  SurfacePreset,
  {
    label: string;
    light: { bg: string; surface: string; elevated: string; text: string; muted: string; border: string };
    dark: { bg: string; surface: string; elevated: string; text: string; muted: string; border: string };
  }
> = {
  mineral: {
    label: 'Alpine Mineral',
    light: {
      bg: '#F3F6F4',
      surface: '#E8EEEA',
      elevated: '#DDE5E0',
      text: '#111614',
      muted: '#48544E',
      border: 'rgba(17, 22, 20, 0.12)',
    },
    dark: {
      bg: '#0C100E',
      surface: '#141A17',
      elevated: '#1B221E',
      text: '#EFF3F1',
      muted: '#98A49E',
      border: 'rgba(239, 243, 241, 0.13)',
    },
  },
  paper: {
    label: 'Warm Travertine',
    light: {
      bg: '#F8F6F2',
      surface: '#EFECE5',
      elevated: '#E7E2D8',
      text: '#1C1917',
      muted: '#5D564E',
      border: 'rgba(28, 25, 23, 0.11)',
    },
    dark: {
      bg: '#141312',
      surface: '#1C1A18',
      elevated: '#25221F',
      text: '#F5F2EC',
      muted: '#A8A095',
      border: 'rgba(245, 242, 236, 0.13)',
    },
  },
  chalk: {
    label: 'Studio Chalk',
    light: {
      bg: '#FAFAFA',
      surface: '#F1F2F4',
      elevated: '#E6E8EC',
      text: '#111317',
      muted: '#555B66',
      border: 'rgba(17, 19, 23, 0.10)',
    },
    dark: {
      bg: '#0F1115',
      surface: '#161A20',
      elevated: '#1E232B',
      text: '#F3F5F8',
      muted: '#9AA2B0',
      border: 'rgba(243, 245, 248, 0.12)',
    },
  },
  obsidian: {
    label: 'Noir Slate',
    light: {
      bg: '#F4F4F5',
      surface: '#EAEAEB',
      elevated: '#DFDFE2',
      text: '#141416',
      muted: '#52525B',
      border: 'rgba(20, 20, 22, 0.12)',
    },
    dark: {
      bg: '#111214',
      surface: '#181A1E',
      elevated: '#21242A',
      text: '#F4F4F6',
      muted: '#A1A1AA',
      border: 'rgba(244, 244, 246, 0.13)',
    },
  },
};

export const TEMPLATE_BLUEPRINTS: Record<TemplateId, TemplateBlueprint> = {
  flagship: {
    id: 'flagship',
    name: 'Alpine Flagship',
    category: 'Single-Product Launch',
    summary:
      'Immersive hardware and outdoor launch template featuring WebGL topographic contours, 3D tilt staging, pinned 4-stage showcase, thermal comparison slider, and variant configurator.',
    highlights: [
      'WebGL Contour Hero',
      'Pinned 4-Angle Wipe',
      'Drag Comparison Slider',
      'Live Configurator',
    ],
    previewImage: FLAGSHIP_ASSETS.showcaseStudio,
    defaultStore: {
      slug: 'material-flask',
      name: 'Material',
      tagline: 'Built for altitude.',
      templateId: 'flagship',
      published: true,
      theme: {
        mode: 'light',
        accentColor: '#3D5740',
        surfacePreset: 'mineral',
        fontPairing: 'modern',
      },
      hero: {
        headline: 'Built for altitude.',
        subheadline:
          'A sturdy stainless steel bottle made for long trail days and everyday commutes, keeping drinks cold or steaming without ever sweating in your bag.',
        ctaLabel: 'Shop Flask',
        imageUrl: FLAGSHIP_ASSETS.cutout,
      },
      story: {
        title: 'Icy cold or piping hot.',
        body: 'Thick double-wall steel keeps water icy for 24 hours and morning coffee steaming for 12, while the outside stays completely dry.',
        metricOneValue: '4°C',
        metricOneLabel: 'Cold retention',
        metricTwoValue: '85°C',
        metricTwoLabel: 'Heat retention',
      },
    },
    starterProducts: [
      {
        name: 'Material Flask',
        category: 'Hydration',
        description:
          'Double-wall 18/8 stainless steel insulated flask with powder-coated matte grip and dual-threaded leakproof chug collar.',
        price: 48,
        imageUrl: FLAGSHIP_ASSETS.orderCutout,
        variants: ['750 ml', '950 ml', '1.2 L'],
        finishes: ['Alpine Sage', 'Basalt Black', 'Glacier Silver'],
        inStock: true,
        featured: true,
      },
      {
        name: 'Summit Chug Cap',
        category: 'Accessories',
        description:
          'Machined steel-rimmed replacement chug lid with integrated high-tensile carry loop and food-grade silicone gasket.',
        price: 16,
        imageUrl: FLAGSHIP_ASSETS.bentoLid,
        variants: ['Universal Fit'],
        finishes: ['Basalt Black'],
        inStock: true,
        featured: false,
      },
      {
        name: 'Trail Silicone Boot',
        category: 'Accessories',
        description:
          'Shock-absorbing molded base sleeve that shields powder-coated vessels on granite ledges and cabin tables.',
        price: 14,
        imageUrl: FLAGSHIP_ASSETS.bentoSunny,
        variants: ['750 ml', '950 ml', '1.2 L'],
        finishes: ['Alpine Sage', 'Basalt Black'],
        inStock: true,
        featured: false,
      },
    ],
  },

  editorial: {
    id: 'editorial',
    name: 'Atelier Editorial',
    category: 'Luxury Boutique & Home',
    summary:
      'Quiet-luxury storefront crafted for skincare, fragrance, ceramics, and textiles. High-contrast Cormorant serif typography, warm travertine surfaces, and contiguous detail drawer.',
    highlights: [
      'Editorial Split Campaign',
      'Serif Display Hierarchy',
      '3-Column Uniform Grid',
      'Product Detail Sheet',
    ],
    previewImage: editorialHeroImg,
    defaultStore: {
      slug: 'atelier-sol',
      name: 'Atelier Sol',
      tagline: 'Quiet objects for slower rituals.',
      templateId: 'editorial',
      published: true,
      theme: {
        mode: 'light',
        accentColor: '#6B442A',
        surfacePreset: 'paper',
        fontPairing: 'editorial',
      },
      hero: {
        headline: 'Tactile objects shaped by light and stone.',
        subheadline:
          'Small-batch botanical formulations, unbleached Belgian textiles, and hand-thrown stoneware vessels crafted for unhurried mornings.',
        ctaLabel: 'Explore Collection',
        imageUrl: editorialHeroImg,
      },
      story: {
        title: 'Crafted in numbered seasonal editions.',
        body: 'Every vessel and formulation is produced in partnership with independent ceramicists and botanical distillers using traceable raw materials and zero synthetic stabilizers.',
        metricOneValue: '100%',
        metricOneLabel: 'Cold-pressed botanicals',
        metricTwoValue: '240',
        metricTwoLabel: 'Numbered vessels per kiln',
      },
    },
    starterProducts: [
      {
        name: 'No. 04 Botanical Facial Serum',
        category: 'Apothecary',
        description:
          'Cold-pressed sea buckthorn, squalane, and wild neroli housed in UV-filtering amber glass for deep barrier nourishment.',
        price: 78,
        imageUrl: editorialSerumImg,
        variants: ['30 ml', '50 ml'],
        finishes: ['Amber Glass'],
        inStock: true,
        featured: true,
      },
      {
        name: 'Oatmeal Belgian Linen Throw',
        category: 'Textiles',
        description:
          'Heavyweight 260 GSM flax linen woven in Flanders and stone-washed for an effortless, draped texture.',
        price: 165,
        imageUrl: editorialLinenImg,
        variants: ['Standard 140×200 cm', 'Oversized 180×240 cm'],
        finishes: ['Raw Oatmeal', 'Warm Ash'],
        inStock: true,
        featured: true,
      },
      {
        name: 'Travertine & Stoneware Vessel',
        category: 'Ceramics',
        description:
          'Wheel-thrown speckled grog stoneware finished with an unglazed satin mineral rim and waterproof interior glaze.',
        price: 112,
        imageUrl: editorialHeroImg,
        variants: ['Medium 22 cm', 'Tall 30 cm'],
        finishes: ['Bone Speckle', 'Limestone'],
        inStock: true,
        featured: true,
      },
    ],
  },

  minimal: {
    id: 'minimal',
    name: 'Kinetik Minimal',
    category: 'Industrial Design & Tech',
    summary:
      'Precision catalog storefront tailored for audio equipment, lighting, watches, and hardware. Architectural chalk-slate grid with live search, category filters, and tabular specs.',
    highlights: [
      'Architectural Grid',
      'Live Search & Filter',
      'Tabular Spec Pricing',
      'Quick-Add Catalog',
    ],
    previewImage: minimalHeroImg,
    defaultStore: {
      slug: 'kinetik-lab',
      name: 'Kinetik Lab',
      tagline: 'Precision instruments for the desk and field.',
      templateId: 'minimal',
      published: true,
      theme: {
        mode: 'light',
        accentColor: '#1C1F1D',
        surfacePreset: 'chalk',
        fontPairing: 'technical',
      },
      hero: {
        headline: 'Form reduced to pure utility.',
        subheadline:
          'CNC-milled aluminum acoustics, calibrated studio lighting, and Grade 5 titanium instruments engineered for multi-decade service.',
        ctaLabel: 'Browse Catalog',
        imageUrl: minimalHeroImg,
      },
      story: {
        title: 'Serviceable by design.',
        body: 'Every enclosure is milled from recycled 6061 aluminum and assembled with standard Torx fasteners—no glue, no planned obsolescence, and full replacement parts availability.',
        metricOneValue: '0.02 mm',
        metricOneLabel: 'CNC machining tolerance',
        metricTwoValue: '10 yr',
        metricTwoLabel: 'Hardware service guarantee',
      },
    },
    starterProducts: [
      {
        name: 'Reference Monitor M1 + Dial',
        category: 'Audio',
        description:
          'Bi-amplified anodized aluminum desktop acoustic monitor paired with a weighted wireless rotary volume controller.',
        price: 490,
        imageUrl: minimalHeroImg,
        variants: ['Single Monitor', 'Stereo Pair'],
        finishes: ['Raw Anodized', 'Matte Slate'],
        inStock: true,
        featured: true,
      },
      {
        name: 'Cantilever Task Lamp L2',
        category: 'Lighting',
        description:
          'High-CRI 97+ architectural desk lamp with precision friction-hinge joints and stepless rotary dimming.',
        price: 265,
        imageUrl: minimalLampImg,
        variants: ['Desk Base', 'Table Clamp'],
        finishes: ['Anodized Charcoal', 'Bead-Blasted Silver'],
        inStock: true,
        featured: true,
      },
      {
        name: 'Field Instrument Watch T40',
        category: 'Horology',
        description:
          'Bead-blasted Grade 5 titanium 40 mm case, sapphire crystal with AR coating, 100 m water resistance, and woven nylon strap.',
        price: 385,
        imageUrl: minimalWatchImg,
        variants: ['38 mm', '40 mm'],
        finishes: ['Titanium Slate', 'Stealth Black'],
        inStock: true,
        featured: true,
      },
    ],
  },
};

export const TEMPLATE_LIST: TemplateBlueprint[] = [
  TEMPLATE_BLUEPRINTS.flagship,
  TEMPLATE_BLUEPRINTS.editorial,
  TEMPLATE_BLUEPRINTS.minimal,
];

export function getDemoStoreBundle(templateId: TemplateId): {
  store: StoreRecord;
  products: ProductRecord[];
} {
  const bp = TEMPLATE_BLUEPRINTS[templateId];
  const store: StoreRecord = {
    ...bp.defaultStore,
    ownerId: 'marque-demo',
  };
  const products: ProductRecord[] = bp.starterProducts.map((item, idx) => ({
    ...item,
    id: `demo_${templateId}_${idx + 1}`,
    storeId: store.slug,
    ownerId: 'marque-demo',
    storePublished: true,
  }));
  return { store, products };
}
