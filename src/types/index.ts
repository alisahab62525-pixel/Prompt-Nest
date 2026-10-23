export type PromptCategory =
  | 'image-generation'
  | 'video'
  | 'photography'
  | 'logos'
  | 'illustration'
  | 'writing'
  | 'coding'
  | 'social-media'
  | 'wallpapers'
  | 'productivity';

export type AIModel =
  | 'Midjourney v6.1'
  | 'FLUX.1 Dev'
  | 'FLUX.1 Schnell'
  | 'Stable Diffusion XL'
  | 'DALL-E 3'
  | 'Claude 3.5 Sonnet'
  | 'GPT-4o'
  | 'Runway Gen-3'
  | 'Luma Dream Machine'
  | 'Sora';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  promptText: string;
  negativePrompt?: string;
  category: PromptCategory;
  model: AIModel;
  tags: string[];
  previewImageUrl: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: 'approved' | 'pending' | 'rejected';
  likesCount: number;
  bookmarksCount: number;
  copiesCount: number;
  viewsCount: number;
  isFeatured?: boolean;
  parameters?: {
    aspectRatio?: string;
    stylize?: number;
    seed?: string;
    cfgScale?: number;
    steps?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'user' | 'creator' | 'admin';
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface Bookmark {
  promptId: string;
  userId: string;
  title: string;
  category: PromptCategory;
  model: AIModel;
  previewImageUrl: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  promptId: string;
  promptTitle?: string;
  reporterId: string;
  reporterEmail?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export type SortOption = 'trending' | 'newest' | 'likes' | 'copies';

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroBadge: string;
  heroHeadline: string;
  heroDescription: string;
  exploreBadgeText: string;
  supportEmail: string;
  contactEmail: string;
  contactPhone: string;
  addressText: string;
  copyrightText: string;
  announcementActive: boolean;
  announcementText: string;
  announcementLink: string;
  twitterUrl: string;
  discordUrl: string;
  githubUrl: string;
  updatedAt?: string;
}
