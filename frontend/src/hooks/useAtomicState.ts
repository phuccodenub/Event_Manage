import { useCallback, useRef, useState } from 'react';

interface AtomicUpdateOptions<T> {
  onSuccess?: (newState: T) => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

/**
 * Hook để xử lý atomic state updates
 * Đảm bảo state updates không bị race conditions
 */
export function useAtomicState<T>(
  initialState: T
): [
  T,
  (updater: (prevState: T) => T, options?: AtomicUpdateOptions<T>) => Promise<void>
] {
  const [state, setState] = useState<T>(initialState);
  const updateQueueRef = useRef<Array<{
    updater: (prevState: T) => T;
    options?: AtomicUpdateOptions<T>;
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
  }>>([]);
  const isProcessingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      // Process all queued updates atomically
      const updates = [...updateQueueRef.current];
      updateQueueRef.current = [];

      let currentState = state;
      const results: Array<{ newState: T; options?: AtomicUpdateOptions<T> }> = [];

      // Apply all updates sequentially
      for (const update of updates) {
        try {
          const newState = update.updater(currentState);
          currentState = newState;
          results.push({ newState, options: update.options });
          update.resolve();
        } catch (error) {
          update.reject(error as Error);
          update.options?.onError?.(error as Error);
        }
      }

      // Update state once with final result
      if (results.length > 0) {
        setState(currentState);
        
        // Call success callbacks
        results.forEach(({ newState, options }) => {
          options?.onSuccess?.(newState);
        });
      }
    } catch (error) {
      console.error('Error processing atomic state updates:', error);
    } finally {
      isProcessingRef.current = false;
      
      // Process remaining queue if any
      if (updateQueueRef.current.length > 0) {
        setTimeout(processQueue, 0);
      }
    }
  }, [state]);

  const atomicUpdate = useCallback(
    async (updater: (prevState: T) => T, options?: AtomicUpdateOptions<T>) => {
      return new Promise<void>((resolve, reject) => {
        updateQueueRef.current.push({
          updater,
          options,
          resolve,
          reject
        });

        // Debounce processing if specified
        if (options?.debounceMs) {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          
          debounceTimeoutRef.current = setTimeout(() => {
            processQueue();
            debounceTimeoutRef.current = null;
          }, options.debounceMs);
        } else {
          // Process immediately for non-debounced updates
          setTimeout(processQueue, 0);
        }
      });
    },
    [processQueue]
  );

  return [state, atomicUpdate];
}

/**
 * Hook để batch multiple state updates
 */
export function useBatchedState<T>(
  initialState: T,
  batchDelayMs = 50
): [
  T,
  (updates: Array<(prevState: T) => T>) => Promise<void>,
  (updater: (prevState: T) => T) => Promise<void>
] {
  const [state, atomicUpdate] = useAtomicState(initialState);
  const batchRef = useRef<Array<(prevState: T) => T>>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    const updates = [...batchRef.current];
    batchRef.current = [];

    await atomicUpdate(
      (prevState) => {
        return updates.reduce((currentState, updater) => {
          return updater(currentState);
        }, prevState);
      },
      { debounceMs: 0 } // Don't debounce the final atomic update
    );
  }, [atomicUpdate]);

  const batchUpdate = useCallback(
    async (updates: Array<(prevState: T) => T>) => {
      batchRef.current.push(...updates);

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      return new Promise<void>((resolve) => {
        batchTimeoutRef.current = setTimeout(async () => {
          await processBatch();
          batchTimeoutRef.current = null;
          resolve();
        }, batchDelayMs);
      });
    },
    [processBatch, batchDelayMs]
  );

  const singleUpdate = useCallback(
    async (updater: (prevState: T) => T) => {
      return batchUpdate([updater]);
    },
    [batchUpdate]
  );

  return [state, batchUpdate, singleUpdate];
}

/**
 * Hook để handle optimistic updates với rollback capability
 */
export function useOptimisticState<T>(
  initialState: T
): [
  T,
  (optimisticUpdate: (prevState: T) => T, asyncOperation: () => Promise<T>) => Promise<void>
] {
  const [state, setState] = useState<T>(initialState);
  const snapshotRef = useRef<T | null>(null);

  const optimisticUpdate = useCallback(
    async (
      optimisticUpdate: (prevState: T) => T,
      asyncOperation: () => Promise<T>
    ) => {
      // Save current state for potential rollback
      snapshotRef.current = state;

      // Apply optimistic update immediately
      const optimisticState = optimisticUpdate(state);
      setState(optimisticState);

      try {
        // Perform async operation
        const actualState = await asyncOperation();
        setState(actualState);
        snapshotRef.current = null;
      } catch (error) {
        // Rollback on error
        if (snapshotRef.current !== null) {
          setState(snapshotRef.current);
          snapshotRef.current = null;
        }
        throw error;
      }
    },
    [state]
  );

  return [state, optimisticUpdate];
} 