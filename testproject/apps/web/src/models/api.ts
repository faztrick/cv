/**
 * MVVM Architecture - Models Layer (API Client)
 *
 * Data access layer responsible for all API communications.
 * Pure functions, no state management.
 */

import type {
    AdminCreatorsResponse,
    AuthResponse,
    CreatePostResponse,
    CreatorApplyPayload,
    CreatorResponse,
    LedgerResponse,
    NotificationsResponse,
    PostResponse,
    PostsResponse,
    SubscribeResponse,
    UnlockResponse,
    User
} from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ============ Base Fetch ============

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? 'Request failed');
  }

  return response.json();
}

// ============ Auth API ============

export const AuthApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (email: string, password: string, role?: 'FAN' | 'CREATOR') =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    }),

  getMe: (token: string) =>
    apiFetch<{ user: User }>('/auth/me', { method: 'GET' }, token)
};

// ============ Posts API ============

export const PostsApi = {
  getAll: (token?: string | null) =>
    apiFetch<PostsResponse>('/posts', { method: 'GET' }, token),

  getById: (id: string, token?: string | null) =>
    apiFetch<PostResponse>(`/posts/${id}`, { method: 'GET' }, token),

  create: async (data: FormData, token: string): Promise<CreatePostResponse> => {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: data
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error ?? 'Unable to create post');
    }

    return response.json();
  }
};

// ============ Billing API ============

export const BillingApi = {
  subscribe: (creatorId: string, token: string) =>
    apiFetch<SubscribeResponse>('/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ creatorId })
    }, token),

  unlock: (postId: string, token: string) =>
    apiFetch<UnlockResponse>('/billing/unlock', {
      method: 'POST',
      body: JSON.stringify({ postId })
    }, token)
};

// ============ Notifications API ============

export const NotificationsApi = {
  getAll: (token: string) =>
    apiFetch<NotificationsResponse>('/notifications', { method: 'GET' }, token),

  markRead: (id: string, token: string) =>
    apiFetch<void>(`/notifications/${id}/read`, { method: 'POST' }, token)
};

// ============ Admin API ============

export const AdminApi = {
  getCreators: (token: string) =>
    apiFetch<AdminCreatorsResponse>('/admin/creators', { method: 'GET' }, token),

  getTransactions: (token: string) =>
    apiFetch<LedgerResponse>('/admin/transactions', { method: 'GET' }, token),

  approveCreator: (id: string, token: string) =>
    apiFetch<CreatorResponse>(`/admin/creators/${id}/approve`, { method: 'POST' }, token),

  rejectCreator: (id: string, token: string) =>
    apiFetch<CreatorResponse>(`/admin/creators/${id}/reject`, { method: 'POST' }, token),

  disableCreator: (id: string, token: string) =>
    apiFetch<CreatorResponse>(`/admin/creators/${id}/disable`, { method: 'POST' }, token),

  disablePost: (id: string, token: string) =>
    apiFetch<{ post: { id: string } }>(`/admin/posts/${id}/disable`, { method: 'POST' }, token)
};

// ============ Creator API ============

export const CreatorApi = {
  apply: (data: CreatorApplyPayload, token: string) =>
    apiFetch<CreatorResponse>('/creator/apply', {
      method: 'POST',
      body: JSON.stringify(data)
    }, token),

  getMe: (token: string) =>
    apiFetch<CreatorResponse>('/creator/me', { method: 'GET' }, token)
};
