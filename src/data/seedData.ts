import { Prompt } from '../types/index.ts';

// Import our 4 verified generated images
import heroPortraitImg from '../assets/images/hero_ai_portrait_1792731508078.jpg';
import cyberpunkCityImg from '../assets/images/prompt_cyberpunk_city_1792731509616.jpg';
import isometricTechImg from '../assets/images/prompt_isometric_tech_1792731508750.jpg';
import botanicalMacroImg from '../assets/images/prompt_botanical_macro_1792731509207.jpg';

export const SEED_PROMPTS: Prompt[] = [
  {
    id: 'seed-portrait-amber',
    title: 'High-Fashion Royal Portraiture in Chiaroscuro',
    description: 'Cinematic studio lighting with rich teal & golden amber volumetric rim light, micro skin pores, and brocade silk texture.',
    promptText: 'Cinematic high-contrast editorial portrait of an elegant woman bathed in volumetric golden-amber and twilight teal lighting, photorealistic skin texture, micro pores, woven emerald brocade silk dress, 85mm lens f/1.4 photography, high fashion aesthetic, award-winning studio lighting --ar 16:9 --style raw --v 6.1',
    negativePrompt: 'blurry, artificial plastic skin, cartoonish, 3d render, oversaturated airbrushed, lowres, distorted eyes',
    category: 'photography',
    model: 'Midjourney v6.1',
    tags: ['portrait', 'fashion', 'chiaroscuro', '85mm', 'editorial'],
    previewImageUrl: heroPortraitImg,
    authorId: 'creator-elena',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 342,
    bookmarksCount: 189,
    copiesCount: 820,
    viewsCount: 2450,
    isFeatured: true,
    parameters: {
      aspectRatio: '16:9',
      stylize: 250,
      seed: '7841920',
      cfgScale: 7.0,
      steps: 40
    },
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z'
  },
  {
    id: 'seed-cyberpunk-metropolis',
    title: 'Neo-Veridia Architectural Brutalism & Hanging Terraces',
    description: 'Futuristic vertical city with waterfalls, night traffic ribbons, wet asphalt reflections, and neon ambient glow.',
    promptText: 'Futuristic architectural metropolis bathed in rain reflections and warm dusk ambient glow, clean sci-fi brutalism mixed with lush vertical gardens, pedestrian sky-bridges, water cascades between towers, cinematic wide-angle, 8k hyperrealistic architecture photography, photorealistic --ar 4:3 --v 6.1',
    negativePrompt: 'low resolution, cartoon, disfigured architecture, fuzzy details, overblown highlights',
    category: 'image-generation',
    model: 'Midjourney v6.1',
    tags: ['cyberpunk', 'architecture', 'scifi', 'rain', 'metropolis'],
    previewImageUrl: cyberpunkCityImg,
    authorId: 'creator-arata',
    authorName: 'Arata Kenji',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 489,
    bookmarksCount: 312,
    copiesCount: 1205,
    viewsCount: 3890,
    isFeatured: true,
    parameters: {
      aspectRatio: '4:3',
      stylize: 150,
      seed: '441092',
      cfgScale: 6.5,
      steps: 35
    },
    createdAt: '2026-10-19T14:30:00Z',
    updatedAt: '2026-10-19T14:30:00Z'
  },
  {
    id: 'seed-isometric-workstation',
    title: 'Minimalist Quantum Computing Lab Workstation',
    description: 'Clean isometric 3D render with translucent purple holographic telemetry, matte ceramic surfaces, and subtle studio lighting.',
    promptText: 'Clean isometric 3D render of a futuristic quantum workstation with glowing holographic diagrams, matte ceramic materials, curved ergonomic surfaces, soft studio lighting, minimalist tech aesthetic, Octane render --ar 4:3',
    negativePrompt: 'cluttered, low-poly, pixelated, harsh shadows, messy composition',
    category: 'illustration',
    model: 'FLUX.1 Dev',
    tags: ['isometric', '3d-render', 'futuristic', 'octane', 'workspace'],
    previewImageUrl: isometricTechImg,
    authorId: 'creator-marcus',
    authorName: 'Marcus Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 278,
    bookmarksCount: 154,
    copiesCount: 640,
    viewsCount: 1980,
    isFeatured: true,
    parameters: {
      aspectRatio: '4:3',
      cfgScale: 8.0,
      steps: 30
    },
    createdAt: '2026-10-20T08:15:00Z',
    updatedAt: '2026-10-20T08:15:00Z'
  },
  {
    id: 'seed-botanical-bioluminescent',
    title: 'Bioluminescent Crystal Orchid Fine Art Macro',
    description: 'Blown-glass botanical petals with delicate water droplets, glowing internal veins, and soft pastel studio gradient.',
    promptText: 'Macro studio photograph of an exotic bioluminescent glass flower with delicate water droplets and crystal veins, translucent petals refracting light, soft pastel studio gradient backdrop, commercial fine art photography, hyper-detailed, 100mm macro lens f/2.8 --ar 4:3',
    negativePrompt: 'grainy, low quality, washed out, artificial noise, opaque plastic',
    category: 'wallpapers',
    model: 'FLUX.1 Dev',
    tags: ['botanical', 'macro', 'crystal', 'glass', 'fine-art'],
    previewImageUrl: botanicalMacroImg,
    authorId: 'creator-clara',
    authorName: 'Clara Dubois',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 563,
    bookmarksCount: 420,
    copiesCount: 1430,
    viewsCount: 4620,
    isFeatured: true,
    parameters: {
      aspectRatio: '4:3',
      cfgScale: 7.5,
      steps: 40
    },
    createdAt: '2026-10-21T11:45:00Z',
    updatedAt: '2026-10-21T11:45:00Z'
  },
  {
    id: 'seed-coding-refactor',
    title: 'Senior TypeScript Architect Refactoring System',
    description: 'System-prompt for Claude 3.5 Sonnet to transform spaghetti code into modular, production-ready TypeScript with strict typing.',
    promptText: `You are a Principal Software Architect specializing in TypeScript, distributed systems, and domain-driven design.
Analyze the provided code and refactor it into clean, idiomatic architecture following these non-negotiable rules:
1. Strict type-safety: Prohibit any/unknown without assertions; use discriminated unions for state.
2. Separation of concerns: Isolate pure business domain logic from I/O and network boundaries.
3. Ergonomic error handling: Return Result<T, E> patterns instead of throwing unhandled exceptions.
4. Concurrency guards: Prevent race conditions with atomic idempotent state transitions.
Provide the refactored code with concise architectural rationale.`,
    category: 'coding',
    model: 'Claude 3.5 Sonnet',
    tags: ['typescript', 'architecture', 'refactoring', 'clean-code', 'system-prompt'],
    previewImageUrl: isometricTechImg,
    authorId: 'creator-dev',
    authorName: 'Alex Thorne',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 610,
    bookmarksCount: 520,
    copiesCount: 2310,
    viewsCount: 5800,
    isFeatured: true,
    parameters: {
      aspectRatio: '1:1',
      cfgScale: 1.0
    },
    createdAt: '2026-10-21T16:00:00Z',
    updatedAt: '2026-10-21T16:00:00Z'
  },
  {
    id: 'seed-video-camera-orbit',
    title: 'Hyper-Dynamic Drone Orbit Shot for Sora & Runway',
    description: 'Precise cinematography prompt for AI video generators with steady camera motion, speed ramping, and golden hour lighting.',
    promptText: 'Continuous single-take cinematic drone camera flying fast through a narrow slot canyon in Arizona at golden hour, then banking smoothly upward to reveal a vast sunset desert mesa. Realistic dust motes dancing in sunbeams, motion blur, anamorphic lens flares, 4K 60fps cinematic fluidity.',
    category: 'video',
    model: 'Runway Gen-3',
    tags: ['video', 'drone-shot', 'cinematography', 'canyon', 'sora'],
    previewImageUrl: heroPortraitImg,
    authorId: 'creator-film',
    authorName: 'Soren Lind',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 395,
    bookmarksCount: 275,
    copiesCount: 910,
    viewsCount: 3100,
    isFeatured: false,
    parameters: {
      aspectRatio: '16:9',
      cfgScale: 7.0
    },
    createdAt: '2026-10-22T09:10:00Z',
    updatedAt: '2026-10-22T09:10:00Z'
  },
  {
    id: 'seed-minimal-vector-logo',
    title: 'Minimalist Monoline Geometric Brand Identity',
    description: 'Precision vector logo prompt optimized for DALL-E 3 and Midjourney with clean symmetry and vector linework.',
    promptText: 'Minimalist geometric logo of an origami falcon in flight, monoline vector graphic style, sharp golden ratio angles, pure black silhouette on pristine solid white background, vector logo, flat design, no gradients, trademark ready --ar 1:1',
    negativePrompt: 'photorealistic, shading, 3d, realistic feathers, gradient, text, watermark, colorful',
    category: 'logos',
    model: 'DALL-E 3',
    tags: ['logo', 'vector', 'minimalist', 'monoline', 'branding'],
    previewImageUrl: isometricTechImg,
    authorId: 'creator-marcus',
    authorName: 'Marcus Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 430,
    bookmarksCount: 380,
    copiesCount: 1540,
    viewsCount: 4200,
    isFeatured: false,
    parameters: {
      aspectRatio: '1:1',
      cfgScale: 7.0
    },
    createdAt: '2026-10-22T11:20:00Z',
    updatedAt: '2026-10-22T11:20:00Z'
  },
  {
    id: 'seed-executive-briefing-writing',
    title: 'C-Suite Executive Memo & Strategy Synthesizer',
    description: 'High-density business writing framework for GPT-4o that turns raw project updates into actionable executive briefings.',
    promptText: `Act as a Chief of Staff at a Fortune 500 tech company.
Transform the provided raw meeting notes and data metrics into a high-impact 1-page executive memorandum.
Use this structure:
1. Executive Decision Summary (3 bullet points max, bottom line up front)
2. Strategic Implications & Risk Assessment (Quantified trade-offs)
3. Resource Requirements & Timeline (Clear owners and milestones)
4. Recommended Recommendation & Next Immediate Action
Tone: Concise, objective, rigorous, eliminating all filler words.`,
    category: 'writing',
    model: 'GPT-4o',
    tags: ['writing', 'executive', 'business', 'strategy', 'memo'],
    previewImageUrl: botanicalMacroImg,
    authorId: 'creator-elena',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'approved',
    likesCount: 512,
    bookmarksCount: 480,
    copiesCount: 1980,
    viewsCount: 5100,
    isFeatured: false,
    parameters: {
      aspectRatio: '1:1'
    },
    createdAt: '2026-10-22T13:40:00Z',
    updatedAt: '2026-10-22T13:40:00Z'
  }
];

export const CATEGORIES_LIST: { id: Prompt['category']; label: string; count: number; desc: string }[] = [
  { id: 'image-generation', label: 'Image Generation', count: 184, desc: 'Photorealistic concepts, Midjourney & FLUX prompts' },
  { id: 'video', label: 'Video & Animation', count: 92, desc: 'Camera motion, Sora, Runway Gen-3 & Luma directions' },
  { id: 'photography', label: 'Photography', count: 145, desc: 'Studio lighting, 85mm lenses, fashion & portraiture' },
  { id: 'logos', label: 'Logos & Marks', count: 78, desc: 'Vector marks, monoline icons & brand insignias' },
  { id: 'illustration', label: 'Illustration & 3D', count: 112, desc: 'Isometric renders, digital painting & character design' },
  { id: 'writing', label: 'Writing & Copy', count: 86, desc: 'Executive memos, marketing hooks & editorial frameworks' },
  { id: 'coding', label: 'Coding & Architecture', count: 130, desc: 'TypeScript refactoring, system designs & debugging prompts' },
  { id: 'social-media', label: 'Social Media', count: 64, desc: 'High-engagement viral post templates and carousels' },
  { id: 'wallpapers', label: 'Wallpapers', count: 98, desc: 'Ultra-wide 8K backdrops, OLED abstracts & landscapes' },
  { id: 'productivity', label: 'Productivity', count: 75, desc: 'Task prioritization, workflow automation & summarizers' }
];

export const AI_MODELS_LIST = [
  'Midjourney v6.1',
  'FLUX.1 Dev',
  'FLUX.1 Schnell',
  'Stable Diffusion XL',
  'DALL-E 3',
  'Claude 3.5 Sonnet',
  'GPT-4o',
  'Runway Gen-3',
  'Luma Dream Machine',
  'Sora'
];
