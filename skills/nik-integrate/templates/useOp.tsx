/* Nik — React hooks for the operations registry.
 *
 * Use these instead of writing raw Supabase calls in screens. The lint
 * rule 'nik/no-raw-supabase' enforces this.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { OperationDef } from './operations';

/** Hook for query operations (reads). Keys cache by op name + input + userId. */
export function useOp<I, O>(
  op: OperationDef<I, O>,
  input: I,
  opts?: Omit<UseQueryOptions<O>, 'queryKey' | 'queryFn'>,
) {
  const { userId, ready } = useAuth();
  return useQuery<O>({
    queryKey: [op.name, userId, input],
    queryFn: () => op.handler({ sb: supabase, userId }, op.input.parse(input)),
    enabled: ready,
    ...opts,
  });
}

/** Hook for mutation operations (writes). Auto-invalidates affected queries. */
export function useOpMutation<I, O>(op: OperationDef<I, O>) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation<O, Error, I>({
    mutationFn: (input) => op.handler({ sb: supabase, userId }, op.input.parse(input)),
    onSuccess: () => {
      // Invalidate every query that shares the op's namespace prefix.
      const prefix = op.name.split('.')[0];
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith(prefix + '.') });
    },
  });
}
