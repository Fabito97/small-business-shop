'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true only on the client after hydration.
 * Uses useSyncExternalStore to prevent cascading renders
 * and satisfy React 19 compiler/linter rules without useEffect.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
