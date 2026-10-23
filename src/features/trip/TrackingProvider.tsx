import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type TrackingContextValue = {
  /** Whether the user has their route ("مسیر") switched on. */
  isTracking: boolean;
  enable: () => void;
  disable: () => void;
};

const TrackingContext = createContext<TrackingContextValue | null>(null);

/**
 * Session-scoped state of the route switch on the ride home screen.
 *
 * The route always starts OFF on entry (per product flow): nothing is stored,
 * so a fresh app session always begins with the switch off.
 */
export function TrackingProvider({ children }: { children: ReactNode }) {
  const [isTracking, setIsTracking] = useState(false);

  const enable = useCallback(() => setIsTracking(true), []);
  const disable = useCallback(() => setIsTracking(false), []);

  const value = useMemo(
    () => ({ isTracking, enable, disable }),
    [isTracking, enable, disable],
  );

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error('useTracking must be used inside a TrackingProvider.');
  }

  return context;
}
