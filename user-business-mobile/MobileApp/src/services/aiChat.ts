export enum Role {
  User = 'user',
  Bot = 'bot',
}

export type ModelChoice = 'qwen-amd' | 'gemma-fireworks';

export type AssistantMode = 'agent' | 'hitl';

export interface ProductCard {
  productId: string;
  productSlug: string;
  merchantSlug: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string | null;
  priceCents?: number;
  chunkId?: string;
  score?: number;
}

export type Message =
  | {
      role: Role.User;
      content: string;
      imageUrl?: string;
    }
  | {
      role: Role.Bot;
      type: 'text';
      content: string;
    }
  | {
      role: Role.Bot;
      type: 'approval';
      sessionId: string;
      preamble: string;
      candidates: ProductCard[];
    }
  | {
      role: Role.Bot;
      type: 'carousel';
      preamble: string;
      content: string;
      items: ProductCard[];
      chips: string[];
      followUps: string[];
    };

export interface SearchResult {
  sessionId: string;
  candidates: ProductCard[];
  chunkIds: string[];
  preamble: string;
}

export interface ChatResult {
  answer: string;
  productCards: ProductCard[];
  refinementChips: string[];
  followUps: string[];
  mode: 'agent';
}
