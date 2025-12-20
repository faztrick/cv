/**
 * MVVM Architecture - ViewModel Layer
 *
 * Posts ViewModel - Manages feed state and content gating operations.
 */

'use client';

import { createAblyClient } from '@/lib/realtime';
import { API_URL, BillingApi, NotificationsApi, PostsApi } from '@/models/api';
import type { Notification, Post } from '@/models/types';
import { useCallback, useEffect, useState } from 'react';

// ============ State Interface ============

export interface PostsState {
  posts: Post[];
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

// ============ ViewModel Interface ============

export interface PostsViewModel extends PostsState {
  // Commands
  fetchPosts: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  subscribe: (creatorId: string) => Promise<void>;
  unlockPpv: (postId: string) => Promise<void>;
  clearMessage: () => void;
  clearError: () => void;

  // Helpers
  getMediaUrl: (assetId: string) => string;
}

// ============ Hook ============

export function usePosts(token: string | null): PostsViewModel {
  const [state, setState] = useState<PostsState>({
    posts: [],
    notifications: [],
    loading: true,
    error: null,
    message: null
  });

  // ============ Fetch Posts ============

  const fetchPosts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await PostsApi.getAll(token);
      setState(prev => ({ ...prev, posts: data.posts, loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unable to load posts'
      }));
    }
  }, [token]);

  // ============ Fetch Notifications ============

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, notifications: [] }));
      return;
    }

    try {
      const data = await NotificationsApi.getAll(token);
      setState(prev => ({ ...prev, notifications: data.notifications.slice(0, 5) }));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [token]);

  // ============ Subscribe ============

  const subscribe = useCallback(async (creatorId: string) => {
    if (!token) {
      setState(prev => ({ ...prev, message: 'Sign in to subscribe.' }));
      return;
    }

    try {
      await BillingApi.subscribe(creatorId, token);
      setState(prev => ({ ...prev, message: 'Subscription active.' }));
      await fetchPosts();
      await fetchNotifications();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Subscription failed'
      }));
    }
  }, [token, fetchPosts, fetchNotifications]);

  // ============ Unlock PPV ============

  const unlockPpv = useCallback(async (postId: string) => {
    if (!token) {
      setState(prev => ({ ...prev, message: 'Sign in to unlock PPV.' }));
      return;
    }

    try {
      await BillingApi.unlock(postId, token);
      setState(prev => ({ ...prev, message: 'PPV unlocked.' }));
      await fetchPosts();
      await fetchNotifications();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unlock failed'
      }));
    }
  }, [token, fetchPosts, fetchNotifications]);

  // ============ Helpers ============

  const getMediaUrl = useCallback((assetId: string) => {
    return `${API_URL}/media/${assetId}?token=${token ?? ''}`;
  }, [token]);

  const clearMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============ Initial Load ============

  useEffect(() => {
    fetchPosts();
    fetchNotifications();
  }, [fetchPosts, fetchNotifications]);

  // ============ Realtime Subscription ============

  useEffect(() => {
    const client = createAblyClient();
    if (!client) return;

    const channel = client.channels.get('posts');

    channel.subscribe('post.created', (msg) => {
      const title = typeof msg.data === 'object' && msg.data && 'title' in msg.data
        ? msg.data.title
        : 'New post';
      setState(prev => ({ ...prev, message: `Realtime: ${title}` }));
      fetchPosts();
    });

    channel.subscribe('ppv.unlocked', () => {
      setState(prev => ({ ...prev, message: 'Realtime: PPV unlocked' }));
      fetchPosts();
    });

    return () => {
      channel.unsubscribe();
      client.close();
    };
  }, [fetchPosts]);

  return {
    ...state,
    fetchPosts,
    fetchNotifications,
    subscribe,
    unlockPpv,
    clearMessage,
    clearError,
    getMediaUrl
  };
}
