/**
 * MVVM Architecture - Models Layer
 *
 * Domain entities and data transfer objects.
 * These types represent the core business data structures.
 */

// ============ User & Auth ============

export type Role = 'FAN' | 'CREATOR' | 'ADMIN';

export type CreatorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreatorProfile {
  id: string;
  displayName: string;
  status: CreatorStatus;
  isDisabled?: boolean;
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt?: string;
  creator?: CreatorProfile | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============ Posts & Content ============

export type PriceType = 'FREE' | 'SUBSCRIBER' | 'PPV';

export interface MediaAsset {
  id: string;
  mimeType: string;
}

export interface PostCreator {
  id: string;
  displayName: string;
  status: CreatorStatus;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  priceType: PriceType;
  priceCents: number;
  createdAt: string;
  creator: PostCreator;
  entitled: boolean;
  media: MediaAsset[];
}

export interface PostsResponse {
  posts: Post[];
}

export interface PostResponse {
  post: Post;
}

// ============ Billing ============

export interface Subscription {
  id: string;
  fanId: string;
  creatorId: string;
  status: 'ACTIVE' | 'CANCELED';
  createdAt: string;
}

export interface PpvUnlock {
  id: string;
  fanId: string;
  postId: string;
  createdAt: string;
}

export interface SubscribeResponse {
  subscription: Subscription;
}

export interface UnlockResponse {
  unlock: PpvUnlock;
}

// ============ Notifications ============

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

// ============ Admin ============

export interface AdminCreator {
  id: string;
  displayName: string;
  status: CreatorStatus;
  isDisabled: boolean;
  user: { id: string; email: string };
}

export interface AdminCreatorsResponse {
  creators: AdminCreator[];
}

export interface LedgerEntry {
  id: string;
  type: 'SUBSCRIPTION' | 'PPV';
  amountCents: number;
  currency: string;
  createdAt: string;
  fanId?: string | null;
  creatorId?: string | null;
  postId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface LedgerResponse {
  entries: LedgerEntry[];
}

// ============ Creator ============

export interface CreatorApplyPayload {
  displayName: string;
  bio?: string;
}

export interface CreatorResponse {
  creator: CreatorProfile;
}

export interface CreatePostPayload {
  title: string;
  body: string;
  priceType: PriceType;
  priceCents: number;
  media?: File;
}

export interface CreatePostResponse {
  postId: string;
}
