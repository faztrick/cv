/**
 * MVVM Architecture - ViewModel Layer
 *
 * Creator ViewModel - Manages creator onboarding and post creation.
 */

'use client';

import { CreatorApi, PostsApi } from '@/models/api';
import type { PriceType } from '@/models/types';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';

// ============ State Interface ============

export interface CreatorFormState {
  displayName: string;
  bio: string;
}

export interface PostFormState {
  title: string;
  body: string;
  priceType: PriceType;
  priceCents: number;
  media: File | null;
}

export interface CreatorState {
  applyForm: CreatorFormState;
  postForm: PostFormState;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// ============ ViewModel Interface ============

export interface CreatorViewModel extends CreatorState {
  // Commands
  updateApplyForm: (updates: Partial<CreatorFormState>) => void;
  updatePostForm: (updates: Partial<PostFormState>) => void;
  submitApplication: () => Promise<void>;
  createPost: () => Promise<void>;
  resetPostForm: () => void;
  clearMessage: () => void;
  clearError: () => void;

  // Computed
  canApply: boolean;
  canPost: boolean;
  creatorStatus: string;
}

// ============ Default State ============

const defaultApplyForm: CreatorFormState = {
  displayName: '',
  bio: ''
};

const defaultPostForm: PostFormState = {
  title: '',
  body: '',
  priceType: 'SUBSCRIBER',
  priceCents: 500,
  media: null
};

// ============ Hook ============

export function useCreator(): CreatorViewModel {
  const { user, token, refresh, isApprovedCreator } = useAuth();

  const [state, setState] = useState<CreatorState>({
    applyForm: {
      displayName: user?.creator?.displayName ?? '',
      bio: ''
    },
    postForm: defaultPostForm,
    loading: false,
    error: null,
    message: null
  });

  // ============ Form Updates ============

  const updateApplyForm = useCallback((updates: Partial<CreatorFormState>) => {
    setState(prev => ({
      ...prev,
      applyForm: { ...prev.applyForm, ...updates }
    }));
  }, []);

  const updatePostForm = useCallback((updates: Partial<PostFormState>) => {
    setState(prev => ({
      ...prev,
      postForm: { ...prev.postForm, ...updates }
    }));
  }, []);

  // ============ Submit Application ============

  const submitApplication = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, message: 'Sign in to apply as a creator.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await CreatorApi.apply({
        displayName: state.applyForm.displayName,
        bio: state.applyForm.bio || undefined
      }, token);

      setState(prev => ({
        ...prev,
        loading: false,
        message: `Application submitted. Status: ${data.creator.status}`
      }));

      await refresh();
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Application failed'
      }));
    }
  }, [token, state.applyForm, refresh]);

  // ============ Create Post ============

  const createPost = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, message: 'Sign in to post.' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('title', state.postForm.title);
      formData.append('body', state.postForm.body);
      formData.append('priceType', state.postForm.priceType);
      formData.append('priceCents', String(state.postForm.priceCents));

      if (state.postForm.media) {
        formData.append('media', state.postForm.media);
      }

      await PostsApi.create(formData, token);

      setState(prev => ({
        ...prev,
        loading: false,
        message: 'Post created.',
        postForm: defaultPostForm
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to create post'
      }));
    }
  }, [token, state.postForm]);

  // ============ Helpers ============

  const resetPostForm = useCallback(() => {
    setState(prev => ({ ...prev, postForm: defaultPostForm }));
  }, []);

  const clearMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============ Computed Properties ============

  const canApply = !user?.creator && state.applyForm.displayName.length >= 2;
  const canPost = isApprovedCreator && state.postForm.title.length >= 2 && state.postForm.body.length >= 2;
  const creatorStatus = user?.creator?.status ?? 'NONE';

  return {
    ...state,
    updateApplyForm,
    updatePostForm,
    submitApplication,
    createPost,
    resetPostForm,
    clearMessage,
    clearError,
    canApply,
    canPost,
    creatorStatus
  };
}
