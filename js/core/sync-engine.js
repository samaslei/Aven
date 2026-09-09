/**
 * Aven — Cloud Sync Engine
 * Centralizes all Supabase sync status tracking, network state management,
 * and provides a structured wrapper for cloud operations.
 *
 * Replaces the ~200 lines of fire-and-forget sync infrastructure that was
 * scattered across the Store class with a single, observable sync pipeline.
 */

import { events } from './events.js';

/** @typedef {'idle'|'saving'|'synced'|'error'|'offline'} SyncStatus */

class SyncEngine {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastSyncedAt = null;
    this.activeOperations = 0;
    /** @type {{ status: SyncStatus, message: string, error: string|null, timestamp: number }} */
    this.statusState = { status: 'idle', message: '', error: null, timestamp: Date.now() };
    this._idleTimer = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._handleNetworkChange(true));
      window.addEventListener('offline', () => this._handleNetworkChange(false));
    }
  }

  // ---------------------------------------------------------------------------
  // Network
  // ---------------------------------------------------------------------------

  _handleNetworkChange(online) {
    this.isOnline = online;
    if (!online) {
      this.setStatus('offline', 'Network offline');
    } else {
      this.setStatus('synced', 'Connected to Supabase Cloud');
    }
    events.emit('sync:connection', this.getConnectionStatus());
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  /** Returns the raw sync status state object. */
  getStatus() {
    return { ...this.statusState };
  }

  /** Returns a normalized connection status object consumed by UI indicators. */
  getConnectionStatus() {
    let effectiveStatus = 'synced';

    if (!this.isOnline) {
      effectiveStatus = 'offline';
    } else if (this.activeOperations > 0 || this.statusState.status === 'saving') {
      effectiveStatus = 'saving';
    } else if (this.statusState.status === 'error') {
      effectiveStatus = 'error';
    } else if (this.statusState.status === 'offline') {
      effectiveStatus = 'offline';
    }

    return {
      isOnline: this.isOnline,
      status: effectiveStatus,
      message: this.statusState.message || '',
      error: this.statusState.error || null,
      lastSyncedAt: this.lastSyncedAt
    };
  }

  /**
   * Transitions the sync status and emits events.
   * When transitioning to 'synced', auto-reverts to 'idle' after 2.5s.
   * @param {SyncStatus} status
   * @param {string} [messageOrError]
   */
  setStatus(status, messageOrError = '') {
    if (status === 'synced') {
      this.lastSyncedAt = Date.now();
    }

    this.statusState = {
      status,
      message: status === 'error' ? '' : messageOrError,
      error: status === 'error' ? messageOrError : null,
      timestamp: Date.now()
    };

    events.emit('sync:status', this.statusState);
    events.emit('sync:connection', this.getConnectionStatus());

    // Auto-revert to idle after the UI has shown the "synced" indicator
    if (status === 'synced') {
      if (this._idleTimer) clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(() => {
        if (this.statusState.status === 'synced') {
          this.statusState = { status: 'idle', message: '', error: null, timestamp: Date.now() };
          events.emit('sync:status', this.statusState);
          events.emit('sync:connection', this.getConnectionStatus());
        }
      }, 2500);
    }
  }

  // ---------------------------------------------------------------------------
  // Cloud Operation Wrapper
  // ---------------------------------------------------------------------------

  /**
   * Wraps a Supabase operation promise with sync status tracking.
   * Unlike the old fire-and-forget pattern, this:
   * - Tracks active operation count
   * - Transitions status to 'saving' → 'synced' or 'error'
   * - Distinguishes network errors from server errors
   * - Returns the result (does NOT swallow errors)
   *
   * @param {Promise} operationPromise - The Supabase query promise
   * @param {string} [label] - Human-readable label for the UI status indicator
   * @returns {Promise<*>} The resolved result
   */
  async run(operationPromise, label = 'Syncing...') {
    if (!this.isOnline) {
      this.setStatus('offline', 'Cannot sync while offline');
      return operationPromise;
    }

    this.activeOperations++;
    this.setStatus('saving', label);

    try {
      const result = await operationPromise;
      this.activeOperations = Math.max(0, this.activeOperations - 1);
      if (this.activeOperations === 0) {
        this.setStatus('synced', 'Synced with cloud');
      }
      return result;
    } catch (err) {
      this.activeOperations = Math.max(0, this.activeOperations - 1);
      const isNetworkError = !this.isOnline ||
        (err?.message?.toLowerCase().includes('failed to fetch'));

      if (isNetworkError) {
        this.setStatus('offline', 'Network connection lost');
      } else {
        this.setStatus('error', err.message || 'Sync failed');
      }
      throw err;
    }
  }

  /**
   * Fire-and-forget variant of run() for non-critical cloud syncs.
   * Logs errors and updates status but does NOT throw.
   * Use this for optimistic writes where the in-memory state is already updated.
   *
   * @param {Function} operationFn - A function that returns a Supabase query promise
   * @param {string} [label]
   */
  queue(operationFn, label = 'Syncing...') {
    if (!this.isOnline) {
      this.setStatus('offline', 'Cannot sync while offline');
      return;
    }

    this.activeOperations++;
    this.setStatus('saving', label);

    Promise.resolve()
      .then(() => operationFn())
      .then(result => {
        // Check for Supabase-style { error } responses
        if (result?.error) {
          console.warn(`Sync warning (${label}):`, result.error.message || result.error);
          this.activeOperations = Math.max(0, this.activeOperations - 1);
          if (this.activeOperations === 0) {
            this.setStatus('error', result.error.message || 'Sync failed');
          }
          return;
        }

        this.activeOperations = Math.max(0, this.activeOperations - 1);
        if (this.activeOperations === 0) {
          this.setStatus('synced', 'Synced with cloud');
        }
      })
      .catch(err => {
        this.activeOperations = Math.max(0, this.activeOperations - 1);
        console.warn(`Sync error (${label}):`, err);
        const isNetworkError = !this.isOnline ||
          (err?.message?.toLowerCase().includes('failed to fetch'));

        if (isNetworkError) {
          this.setStatus('offline', 'Network connection lost');
        } else {
          this.setStatus('error', err.message || 'Sync failed');
        }
      });
  }
}

export const syncEngine = new SyncEngine();
