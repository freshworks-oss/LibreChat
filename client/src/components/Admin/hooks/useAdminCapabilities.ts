import { useQuery } from '@tanstack/react-query';
import { hasImpliedCapability } from '../capabilities';
import { ADMIN_QUERY_KEYS } from '../constants';
import { grantsApi } from '../api';

/**
 * Query hook for the current user's effective capabilities.
 * Returns `{ capabilities: string[] }`.
 */
export function useEffectiveCapabilities() {
  return useQuery(
    ADMIN_QUERY_KEYS.effectiveCapabilities,
    () => grantsApi.getEffectiveCapabilities(),
    { refetchOnWindowFocus: false },
  );
}

/**
 * Derived hook that checks whether the current user holds a given capability,
 * accounting for manage→read implications (e.g. `manage:users` implies `read:users`).
 */
export function useHasCapability(cap: string): boolean {
  const { data } = useEffectiveCapabilities();
  if (!data?.capabilities) {
    return false;
  }
  return hasImpliedCapability(data.capabilities, cap);
}
