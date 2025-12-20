/**
 * MVVM Architecture - ViewModel Layer
 *
 * Admin ViewModel - Manages admin console state and operations.
 */

'use client';

import { AdminApi } from '@/models/api';
import type { AdminCreator, LedgerEntry } from '@/models/types';
import { useCallback, useEffect, useState } from 'react';

// ============ State Interface ============

export interface AdminState {
  creators: AdminCreator[];
  ledgerEntries: LedgerEntry[];
  loading: boolean;
  error: string | null;
  message: string | null;
}

// ============ ViewModel Interface ============

export interface AdminViewModel extends AdminState {
  // Commands
  loadData: () => Promise<void>;
  approveCreator: (id: string) => Promise<void>;
  rejectCreator: (id: string) => Promise<void>;
  disableCreator: (id: string) => Promise<void>;
  clearMessage: () => void;
  clearError: () => void;

  // Computed
  pendingCreators: AdminCreator[];
  approvedCreators: AdminCreator[];
}

// ============ Hook ============

export function useAdmin(token: string | null): AdminViewModel {
  const [state, setState] = useState<AdminState>({
    creators: [],
    ledgerEntries: [],
    loading: true,
    error: null,
    message: null
  });

  // ============ Load Data ============

  const loadData = useCallback(async () => {
    if (!token) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [creatorsData, txData] = await Promise.all([
        AdminApi.getCreators(token),
        AdminApi.getTransactions(token)
      ]);

      setState(prev => ({
        ...prev,
        creators: creatorsData.creators,
        ledgerEntries: txData.entries.slice(0, 8),
        loading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load admin data'
      }));
    }
  }, [token]);

  // ============ Creator Actions ============

  const approveCreator = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await AdminApi.approveCreator(id, token);
      setState(prev => ({ ...prev, message: 'Creator approved.' }));
      await loadData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Approve failed'
      }));
    }
  }, [token, loadData]);

  const rejectCreator = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await AdminApi.rejectCreator(id, token);
      setState(prev => ({ ...prev, message: 'Creator rejected.' }));
      await loadData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Reject failed'
      }));
    }
  }, [token, loadData]);

  const disableCreator = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await AdminApi.disableCreator(id, token);
      setState(prev => ({ ...prev, message: 'Creator disabled.' }));
      await loadData();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Disable failed'
      }));
    }
  }, [token, loadData]);

  // ============ Helpers ============

  const clearMessage = useCallback(() => {
    setState(prev => ({ ...prev, message: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============ Initial Load ============

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============ Computed Properties ============

  const pendingCreators = state.creators.filter(c => c.status === 'PENDING');
  const approvedCreators = state.creators.filter(c => c.status === 'APPROVED');

  return {
    ...state,
    loadData,
    approveCreator,
    rejectCreator,
    disableCreator,
    clearMessage,
    clearError,
    pendingCreators,
    approvedCreators
  };
}
