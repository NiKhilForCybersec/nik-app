/* Nik — CommandBus.
 *
 * Lets the AI (and any UI button) dispatch UI mutations through one
 * channel. The handler in commands/ui-commands.ts is invoked with the
 * current state + setter.
 *
 * AppRoot mounts <CommandBusProvider state={state} setState={setState}/>
 * to make the bus globally available. The MCP server forwards AI tool
 * calls to this bus over a per-user realtime channel (next phase).
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { AppState } from '../App';
import type { CommandDef } from './commands';
import { commands } from '../contracts';

type Bus = (name: string, input: unknown) => void;

const CommandBusContext = createContext<Bus | null>(null);

export const CommandBusProvider = ({
  state,
  setState,
  children,
}: {
  state: AppState;
  setState: (updater: (s: AppState) => AppState) => void;
  children: ReactNode;
}) => {
  const dispatch = useCallback<Bus>((name, input) => {
    const cmd = (commands as Record<string, CommandDef<unknown>>)[
      name.replace(/^ui\./, '')
    ] ?? Object.values(commands).find((c) => (c as CommandDef<unknown>).name === name);
    if (!cmd) {
      console.warn(`[CommandBus] no command "${name}"`);
      return;
    }
    const parsed = (cmd as CommandDef<unknown>).input.parse(input);
    return (cmd as CommandDef<unknown>).handler({ state, setState }, parsed);
  }, [state, setState]);

  return (
    <CommandBusContext.Provider value={dispatch}>
      {children}
    </CommandBusContext.Provider>
  );
};

/** Returns a typed dispatcher. Use cmd directly for compile-time safety. */
export function useCommand() {
  const dispatch = useContext(CommandBusContext);
  if (!dispatch) throw new Error('useCommand outside CommandBusProvider');
  return dispatch;
}

/** Type-safe dispatcher for a known command. */
export function useDispatch<I>(cmd: CommandDef<I>) {
  const dispatch = useCommand();
  return useCallback((input: I) => dispatch(cmd.name, input), [dispatch, cmd.name]);
}
